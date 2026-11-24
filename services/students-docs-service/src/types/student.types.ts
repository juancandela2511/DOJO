/**
 * @file student.types.ts
 * @description Tipos e interfaces estrictas para Estudiantes, Cinturones,
 *              Documentos Escaneados (Foto, CC, EPS) y Resultados de OCR.
 */

import { QueryResultRow } from 'pg';

export type UserRole = 'ADMIN' | 'AYUDANTE' | 'ESTUDIANTE';
export type DocumentType = 'CC' | 'TI' | 'CE' | 'PASAPORTE';
export type BloodType = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';
export type DocumentCategory = 'FOTO_PERFIL' | 'CEDULA_CIUDADANIA' | 'CERTIFICADO_EPS' | 'OTRO';

/**
 * Identidad del usuario autenticado que realiza la petición.
 */
export interface ActorContext {
  userId: string;
  fullName: string;
  role: UserRole;
}

/**
 * Fila del catálogo de cinturones (`belts`).
 */
export interface BeltRow extends QueryResultRow {
  id: number;
  name: string;
  color_hex: string;
  secondary_color_hex: string | null;
  rank_order: number;
  description: string | null;
}

/**
 * Fila completa del estudiante en PostgreSQL (`students`).
 */
export interface StudentRow extends QueryResultRow {
  id: string;
  user_id: string | null;
  document_type: DocumentType;
  document_number: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  blood_type: BloodType;
  eps_entity: string;
  phone: string | null;
  address: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string | null;
  current_belt_id: number;
  belt_name?: string;
  belt_color_hex?: string;
  profile_photo_url: string | null;
  id_card_doc_url: string | null;
  eps_certificate_url: string | null;
  medical_notes: string | null;
  is_active: boolean;
  enrolled_at: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * DTO para crear o actualizar la ficha de un estudiante (Exclusivo ADMIN).
 */
export interface UpsertStudentDto {
  documentType?: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  bloodType: BloodType;
  epsEntity: string;
  phone?: string | null;
  address?: string | null;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship?: string | null;
  currentBeltId: number;
  medicalNotes?: string | null;
  profilePhotoUrl?: string | null;
  idCardDocUrl?: string | null;
  epsCertificateUrl?: string | null;
  isActive?: boolean;
}

/**
 * DTO para registrar un ascenso de cinturón.
 */
export interface PromoteBeltDto {
  newBeltId: number;
  examScore?: number | null;
  senseiNotes?: string | null;
}

/**
 * Estructura de datos autocompletada automáticamente por el motor OCR
 * al escanear una Cédula de Ciudadanía (CC) y/o un Certificado de EPS.
 */
export interface OcrExtractedFields {
  documentNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  bloodType: BloodType | null;
  epsEntity: string | null;
  birthDate: string | null;
  rawText: string;
  confidence: number;
}
