/**
 * @file students.service.ts
 * @description Lógica de negocio para el CRUD de Estudiantes, catálogo e historial de
 *              Cinturones, registro de documentos (Foto, CC, EPS) y notificaciones de ascenso.
 */

import bcrypt from 'bcryptjs';
import { QueryResultRow } from 'pg';
import { emitAuditLog, executeQuery } from '../db/pool';
import {
  ActorContext,
  BeltRow,
  DocumentCategory,
  OcrExtractedFields,
  PromoteBeltDto,
  StudentRow,
  UpsertStudentDto,
} from '../types/student.types';

interface PromotionHistoryRow extends QueryResultRow {
  id: string;
  student_id: string;
  previous_belt_name: string | null;
  new_belt_name: string;
  new_belt_color_hex: string;
  promotion_date: string;
  exam_score: number | null;
  sensei_notes: string | null;
  promoted_by_name: string;
}

/**
 * Servicio de gestión integral de estudiantes, grados marciales y documentos.
 */
export class StudentsService {
  /**
   * Obtiene el catálogo completo de cinturones ordenados por jerarquía.
   */
  public async listBelts(): Promise<BeltRow[]> {
    const result = await executeQuery<BeltRow>(
      `SELECT * FROM belts ORDER BY rank_order ASC`
    );
    return result.rows;
  }

  /**
   * Lista todos los estudiantes con su cinturón actual y estado general.
   */
  public async listStudents(onlyActive: boolean = false): Promise<StudentRow[]> {
    const whereClause = onlyActive ? 'WHERE s.is_active = TRUE' : '';
    const sql = `
      SELECT s.*, b.name AS belt_name, b.color_hex AS belt_color_hex
      FROM students s
      JOIN belts b ON b.id = s.current_belt_id
      ${whereClause}
      ORDER BY s.first_name ASC, s.last_name ASC
    `;
    const result = await executeQuery<StudentRow>(sql);
    return result.rows;
  }

  /**
   * Obtiene la ficha completa de un estudiante por su UUID o número de documento.
   */
  public async getStudentById(studentId: string): Promise<StudentRow | null> {
    const sql = `
      SELECT s.*, b.name AS belt_name, b.color_hex AS belt_color_hex
      FROM students s
      JOIN belts b ON b.id = s.current_belt_id
      WHERE s.id::text = $1 OR s.document_number = $1
      LIMIT 1
    `;
    const result = await executeQuery<StudentRow>(sql, [studentId]);
    return result.rows[0] ?? null;
  }

  /**
   * Crea un nuevo estudiante, genera automáticamente su cuenta `ESTUDIANTE` para login
   * rápido en Android (usuario = número de cédula), inicializa su mensualidad y audita.
   */
  public async createStudent(
    dto: UpsertStudentDto,
    actor: ActorContext
  ): Promise<StudentRow> {
    const fullName = `${dto.firstName.trim()} ${dto.lastName.trim()}`;
    const defaultPassHash = await bcrypt.hash(dto.documentNumber.trim(), 10);

    // 1. Crear cuenta de usuario vinculada con rol ESTUDIANTE si no existe
    const userInsert = await executeQuery<{ id: string }>(
      `INSERT INTO users (username, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'ESTUDIANTE')
       ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [dto.documentNumber.trim(), defaultPassHash, fullName]
    );
    const userId = userInsert.rows[0].id;

    // 2. Insertar ficha del estudiante
    const sql = `
      INSERT INTO students (
        user_id, document_type, document_number, first_name, last_name,
        birth_date, blood_type, eps_entity, phone, address,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        current_belt_id, profile_photo_url, id_card_doc_url, eps_certificate_url,
        medical_notes, created_by
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13,
        $14, $15, $16, $17,
        $18, $19
      )
      RETURNING *
    `;

    const result = await executeQuery<StudentRow>(sql, [
      userId,
      dto.documentType || 'CC',
      dto.documentNumber.trim(),
      dto.firstName.trim(),
      dto.lastName.trim(),
      dto.birthDate || null,
      dto.bloodType,
      dto.epsEntity.trim(),
      dto.phone || null,
      dto.address || null,
      dto.emergencyContactName.trim(),
      dto.emergencyContactPhone.trim(),
      dto.emergencyContactRelationship || null,
      dto.currentBeltId,
      dto.profilePhotoUrl || null,
      dto.idCardDocUrl || null,
      dto.epsCertificateUrl || null,
      dto.medicalNotes || null,
      actor.userId,
    ]);

    const created = result.rows[0];

    // 3. Crear registro inicial de mensualidad (30 días)
    await executeQuery(
      `INSERT INTO memberships (
         student_id, start_date, end_date, cycle_days, status,
         last_payment_confirmed_at, last_confirmed_by_admin_id
       ) VALUES ($1, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 30, 'ACTIVA', NOW(), $2)
       ON CONFLICT (student_id) DO NOTHING`,
      [created.id, actor.userId]
    );

    // 4. Registrar en la bitácora de auditoría inmutable
    await emitAuditLog({
      actorUserId: actor.userId,
      actorFullName: actor.fullName,
      actorRole: actor.role,
      action: 'CREATE',
      targetTable: 'students',
      targetRecordId: created.id,
      description: `Registro de nuevo estudiante ${fullName} (CC ${created.document_number}, RH ${created.blood_type}, EPS ${created.eps_entity}).`,
      oldData: null,
      newData: created as unknown as Record<string, unknown>,
    });

    return created;
  }

  /**
   * Actualiza los datos de un estudiante (Exclusivo ADMIN) y guarda old_data vs new_data.
   */
  public async updateStudent(
    studentId: string,
    dto: Partial<UpsertStudentDto>,
    actor: ActorContext
  ): Promise<StudentRow> {
    const existing = await this.getStudentById(studentId);
    if (!existing) {
      throw new Error('NOT_FOUND: El estudiante solicitado no existe.');
    }

    const sql = `
      UPDATE students SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        blood_type = COALESCE($3, blood_type),
        eps_entity = COALESCE($4, eps_entity),
        phone = COALESCE($5, phone),
        address = COALESCE($6, address),
        emergency_contact_name = COALESCE($7, emergency_contact_name),
        emergency_contact_phone = COALESCE($8, emergency_contact_phone),
        emergency_contact_relationship = COALESCE($9, emergency_contact_relationship),
        current_belt_id = COALESCE($10, current_belt_id),
        medical_notes = COALESCE($11, medical_notes),
        is_active = COALESCE($12, is_active),
        updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `;

    const updatedResult = await executeQuery<StudentRow>(sql, [
      dto.firstName ?? null,
      dto.lastName ?? null,
      dto.bloodType ?? null,
      dto.epsEntity ?? null,
      dto.phone ?? null,
      dto.address ?? null,
      dto.emergencyContactName ?? null,
      dto.emergencyContactPhone ?? null,
      dto.emergencyContactRelationship ?? null,
      dto.currentBeltId ?? null,
      dto.medicalNotes ?? null,
      dto.isActive ?? null,
      existing.id,
    ]);

    const updated = updatedResult.rows[0];

    await emitAuditLog({
      actorUserId: actor.userId,
      actorFullName: actor.fullName,
      actorRole: actor.role,
      action: 'UPDATE',
      targetTable: 'students',
      targetRecordId: existing.id,
      description: `Actualización de ficha del estudiante ${updated.first_name} ${updated.last_name}.`,
      oldData: existing as unknown as Record<string, unknown>,
      newData: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  /**
   * Registra un ascenso oficial de cinturón, actualiza la ficha, audita y crea notificación.
   */
  public async promoteStudentBelt(
    studentId: string,
    dto: PromoteBeltDto,
    actor: ActorContext
  ): Promise<{ student: StudentRow; promotionId: string }> {
    const existing = await this.getStudentById(studentId);
    if (!existing) {
      throw new Error('NOT_FOUND: Estudiante no encontrado para ascenso de grado.');
    }

    const promoInsert = await executeQuery<{ id: string }>(
      `INSERT INTO belt_promotions (
         student_id, previous_belt_id, new_belt_id, promoted_by_user_id, exam_score, sensei_notes
       ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        existing.id,
        existing.current_belt_id,
        dto.newBeltId,
        actor.userId,
        dto.examScore ?? null,
        dto.senseiNotes ?? null,
      ]
    );

    const updatedStudent = await this.updateStudent(
      existing.id,
      { currentBeltId: dto.newBeltId },
      actor
    );

    await emitAuditLog({
      actorUserId: actor.userId,
      actorFullName: actor.fullName,
      actorRole: actor.role,
      action: 'BELT_PROMOTION',
      targetTable: 'belt_promotions',
      targetRecordId: promoInsert.rows[0].id,
      description: `Ascenso de cinturón otorgado a ${existing.first_name} ${existing.last_name} (Grado ID ${existing.current_belt_id} -> ${dto.newBeltId}).`,
      oldData: { previousBeltId: existing.current_belt_id },
      newData: { newBeltId: dto.newBeltId, examScore: dto.examScore },
    });

    // Disparar notificación para la App Android del estudiante si tiene usuario asociado
    if (existing.user_id) {
      await executeQuery(
        `INSERT INTO notifications (user_id, student_id, notification_type, title, message)
         VALUES ($1, $2, 'BELT_PROMOTION', '¡Felicitaciones por tu Ascenso de Cinturón!', $3)`,
        [
          existing.user_id,
          existing.id,
          `El Sensei ${actor.fullName} ha registrado tu nuevo ascenso de grado en el Dojo. ¡Sigue entrenando con honor!`,
        ]
      );
    }

    return { student: updatedStudent, promotionId: promoInsert.rows[0].id };
  }

  /**
   * Consulta el historial de ascensos de cinturón de un estudiante.
   */
  public async getBeltPromotionHistory(studentId: string): Promise<PromotionHistoryRow[]> {
    const sql = `
      SELECT bp.id, bp.student_id,
             b_prev.name AS previous_belt_name,
             b_new.name AS new_belt_name,
             b_new.color_hex AS new_belt_color_hex,
             bp.promotion_date, bp.exam_score, bp.sensei_notes,
             u.full_name AS promoted_by_name
      FROM belt_promotions bp
      LEFT JOIN belts b_prev ON b_prev.id = bp.previous_belt_id
      JOIN belts b_new ON b_new.id = bp.new_belt_id
      JOIN users u ON u.id = bp.promoted_by_user_id
      WHERE bp.student_id = $1
      ORDER BY bp.promotion_date DESC, bp.created_at DESC
    `;
    const result = await executeQuery<PromotionHistoryRow>(sql, [studentId]);
    return result.rows;
  }

  /**
   * Registra un archivo subido (Foto, Cédula o EPS) y su resultado de OCR en base de datos.
   */
  public async attachDocumentRecord(params: {
    studentId: string;
    category: DocumentCategory;
    fileName: string;
    filePath: string;
    mimeType: string;
    fileSizeBytes: number;
    ocrData: OcrExtractedFields | null;
    actor: ActorContext;
  }): Promise<void> {
    await executeQuery(
      `INSERT INTO student_documents (
         student_id, category, file_name, file_path, mime_type,
         file_size_bytes, ocr_extracted_json, ocr_confidence, uploaded_by_user_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        params.studentId,
        params.category,
        params.fileName,
        params.filePath,
        params.mimeType,
        params.fileSizeBytes,
        params.ocrData ? JSON.stringify(params.ocrData) : null,
        params.ocrData?.confidence ?? null,
        params.actor.userId,
      ]
    );
  }
}

export const studentsService = new StudentsService();
