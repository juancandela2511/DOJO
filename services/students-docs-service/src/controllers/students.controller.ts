/**
 * @file students.controller.ts
 * @description Controlador HTTP para gestión de estudiantes, cinturones, ascensos,
 *              carga de documentos (Foto, CC, EPS) y autocompletado por OCR.
 */

import { Request, Response } from 'express';
import { ocrService } from '../services/ocr.service';
import { studentsService } from '../services/students.service';
import { emitAuditLog } from '../db/pool';
import {
  ActorContext,
  DocumentCategory,
  PromoteBeltDto,
  UpsertStudentDto,
  UserRole,
} from '../types/student.types';

/**
 * Extrae el contexto del usuario autenticado desde las cabeceras inyectadas por el API Gateway.
 */
function getActor(req: Request): ActorContext {
  return {
    userId: (req.headers['x-user-id'] as string) || '11111111-1111-4111-8111-111111111111',
    fullName: (req.headers['x-user-fullname'] as string) || 'Sensei Administrador Principal',
    role: ((req.headers['x-user-role'] as UserRole) || 'ADMIN') as UserRole,
  };
}

/**
 * Controlador del microservicio `students-docs-service`.
 */
export class StudentsController {
  /**
   * GET /api/students/belts
   * Devuelve el catálogo jerárquico de cinturones del Dojo.
   */
  public async getBelts(_req: Request, res: Response): Promise<void> {
    try {
      const belts = await studentsService.listBelts();
      res.status(200).json({ success: true, data: belts });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al listar cinturones.';
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * GET /api/students
   * Lista todos los estudiantes con su cinturón actual.
   */
  public async listStudents(req: Request, res: Response): Promise<void> {
    try {
      const onlyActive = req.query.active === 'true';
      const students = await studentsService.listStudents(onlyActive);
      res.status(200).json({ success: true, count: students.length, data: students });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al listar estudiantes.';
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * GET /api/students/:id
   * Obtiene el expediente completo de un estudiante y su historial de ascensos de cinturón.
   */
  public async getStudentDetail(req: Request, res: Response): Promise<void> {
    try {
      const student = await studentsService.getStudentById(req.params.id);
      if (!student) {
        res.status(404).json({ success: false, message: 'Estudiante no encontrado.' });
        return;
      }

      const promotions = await studentsService.getBeltPromotionHistory(student.id);
      res.status(200).json({
        success: true,
        data: {
          ...student,
          beltPromotions: promotions,
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al consultar estudiante.';
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/students
   * Crea un nuevo estudiante con su cuenta Android y su mensualidad inicial (Exclusivo ADMIN).
   */
  public async createStudent(req: Request, res: Response): Promise<void> {
    try {
      const actor = getActor(req);
      const dto = req.body as UpsertStudentDto;
      const created = await studentsService.createStudent(dto, actor);
      res.status(201).json({ success: true, data: created });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al crear estudiante.';
      res.status(400).json({ success: false, message: msg });
    }
  }

  /**
   * PUT /api/students/:id
   * Edita los datos de un estudiante (Exclusivo ADMIN) registrando old_data y new_data.
   */
  public async updateStudent(req: Request, res: Response): Promise<void> {
    try {
      const actor = getActor(req);
      const dto = req.body as Partial<UpsertStudentDto>;
      const updated = await studentsService.updateStudent(req.params.id, dto, actor);
      res.status(200).json({ success: true, data: updated });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al actualizar estudiante.';
      res.status(400).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/students/:id/promotions
   * Registra un ascenso de cinturón para el estudiante (Exclusivo ADMIN).
   */
  public async promoteBelt(req: Request, res: Response): Promise<void> {
    try {
      const actor = getActor(req);
      const dto = req.body as PromoteBeltDto;
      const result = await studentsService.promoteStudentBelt(req.params.id, dto, actor);
      res.status(201).json({ success: true, data: result });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al registrar ascenso.';
      res.status(400).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/students/ocr/extract
   * Módulo OCR de Autocompletado: Recibe una imagen de Cédula (CC) o Certificado de EPS
   * (o texto escaneado por cámara) y devuelve número de documento, nombres, apellidos,
   * grupo sanguíneo (RH) y entidad EPS listos para rellenar el formulario del ADMIN.
   */
  public async extractOcrFromDocument(req: Request, res: Response): Promise<void> {
    try {
      const actor = getActor(req);
      const uploadedFile = req.file;
      const { simulatedOcrText, studentId, category } = req.body as {
        simulatedOcrText?: string;
        studentId?: string;
        category?: DocumentCategory;
      };

      const imagePath = uploadedFile?.path;
      const extracted = await ocrService.extractStudentDataFromDocument(
        imagePath,
        simulatedOcrText
      );

      if (studentId && uploadedFile) {
        await studentsService.attachDocumentRecord({
          studentId,
          category: category || 'CEDULA_CIUDADANIA',
          fileName: uploadedFile.originalname,
          filePath: uploadedFile.path,
          mimeType: uploadedFile.mimetype,
          fileSizeBytes: uploadedFile.size,
          ocrData: extracted,
          actor,
        });
      }

      await emitAuditLog({
        actorUserId: actor.userId,
        actorFullName: actor.fullName,
        actorRole: actor.role,
        action: 'OCR_SCAN',
        targetTable: 'student_documents',
        targetRecordId: studentId || extracted.documentNumber || 'PRE_FORM_OCR',
        description: `Escaneo OCR de documento (CC/EPS) completado con confianza ${extracted.confidence}%.`,
        oldData: null,
        newData: extracted as unknown as Record<string, unknown>,
      });

      res.status(200).json({
        success: true,
        message: 'Datos extraídos automáticamente por OCR para autocompletar formulario.',
        data: extracted,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al procesar OCR del documento.';
      res.status(500).json({ success: false, message: msg });
    }
  }
}

export const studentsController = new StudentsController();
