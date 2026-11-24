/**
 * @file students.routes.ts
 * @description Rutas HTTP del microservicio `students-docs-service` (:3002),
 *              incluyendo configuración de Multer para carga segura de Foto, CC y EPS.
 */

import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { studentsController } from '../controllers/students.controller';

const uploadsDir = process.env.UPLOADS_STORAGE_PATH || path.join(process.cwd(), 'storage', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  },
});

const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_FILE_UPLOAD_SIZE_MB || 10) * 1024 * 1024,
  },
});

export const studentsRouter: Router = Router();

// Catálogo de cinturones
studentsRouter.get('/students/belts', (req, res) => studentsController.getBelts(req, res));

// Módulo OCR de Autocompletado de Cédula (CC) y Certificado EPS
studentsRouter.post(
  '/students/ocr/extract',
  uploadMiddleware.single('documentFile'),
  (req, res) => studentsController.extractOcrFromDocument(req, res)
);

// CRUD de Estudiantes y Ascensos de Cinturón
studentsRouter.get('/students', (req, res) => studentsController.listStudents(req, res));
studentsRouter.get('/students/:id', (req, res) => studentsController.getStudentDetail(req, res));
studentsRouter.post('/students', (req, res) => studentsController.createStudent(req, res));
studentsRouter.put('/students/:id', (req, res) => studentsController.updateStudent(req, res));
studentsRouter.post('/students/:id/promotions', (req, res) =>
  studentsController.promoteBelt(req, res)
);
