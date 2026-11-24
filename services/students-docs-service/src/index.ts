/**
 * @file index.ts
 * @description Punto de entrada del microservicio `students-docs-service` (:3002).
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { studentsRouter } from './routes/students.routes';
import { dbPool } from './db/pool';

dotenv.config();

const app: Application = express();
const PORT: number = Number(process.env.PORT || process.env.STUDENTS_DOCS_SERVICE_PORT || 3002);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    await dbPool.query('SELECT 1');
    res.status(200).json({
      service: 'students-docs-service',
      status: 'OK',
      ocrEngine: 'Tesseract.js + Colombian CC/EPS Heuristics',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'DB error';
    res.status(503).json({ service: 'students-docs-service', status: 'ERROR', message: msg });
  }
});

app.use('/api', studentsRouter);

app.listen(PORT, () => {
  console.log(`[students-docs-service] Microservicio de Estudiantes y OCR escuchando en puerto ${PORT}`);
});
