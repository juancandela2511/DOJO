/**
 * @file index.ts
 * @description Punto de entrada del microservicio `auth-audit-service` (:3001).
 *              Proporciona autenticación persistente, RBAC y bitácora inmutable `audit_logs`.
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authAuditRouter } from './routes/auth.routes';
import { dbPool } from './db/pool';

dotenv.config();

const app: Application = express();
const PORT: number = Number(process.env.PORT || process.env.AUTH_AUDIT_SERVICE_PORT || 3001);

app.use(cors());
app.use(express.json({ limit: '5mb' }));

/**
 * Endpoint de verificación de salud del microservicio y su conexión a PostgreSQL.
 */
app.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    await dbPool.query('SELECT 1');
    res.status(200).json({
      service: 'auth-audit-service',
      status: 'OK',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database connection error';
    res.status(503).json({
      service: 'auth-audit-service',
      status: 'ERROR',
      message,
    });
  }
});

// Montar rutas bajo /api
app.use('/api', authAuditRouter);

app.listen(PORT, () => {
  console.log(`[auth-audit-service] Microservicio de Autenticación y Auditoría escuchando en puerto ${PORT}`);
});
