/**
 * @file index.ts
 * @description Punto de entrada del microservicio `memberships-service` (:3003).
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { membershipsRouter } from './routes/memberships.routes';
import { dbPool } from './db/pool';

dotenv.config();

const app: Application = express();
const PORT: number = Number(process.env.PORT || process.env.MEMBERSHIPS_SERVICE_PORT || 3003);

app.use(cors());
app.use(express.json());

app.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    await dbPool.query('SELECT 1');
    res.status(200).json({
      service: 'memberships-service',
      status: 'OK',
      autoRenewalPolicy: 'STRICTLY_DISABLED_MANUAL_ADMIN_ONLY',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'DB error';
    res.status(503).json({ service: 'memberships-service', status: 'ERROR', message: msg });
  }
});

app.use('/api', membershipsRouter);

app.listen(PORT, () => {
  console.log(`[memberships-service] Microservicio de Mensualidades y Semáforo escuchando en puerto ${PORT}`);
});
