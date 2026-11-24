/**
 * @file index.ts
 * @description Punto de entrada del microservicio `notifications-service` (:3005).
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { notificationsRouter } from './routes/notifications.routes';
import { dbPool } from './db/pool';

dotenv.config();

const app: Application = express();
const PORT: number = Number(process.env.PORT || process.env.NOTIFICATIONS_SERVICE_PORT || 3005);

app.use(cors());
app.use(express.json());

app.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    await dbPool.query('SELECT 1');
    res.status(200).json({
      service: 'notifications-service',
      status: 'OK',
      channels: ['Capacitor LocalNotifications', 'Android Push Queue'],
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'DB error';
    res.status(503).json({ service: 'notifications-service', status: 'ERROR', message: msg });
  }
});

app.use('/api', notificationsRouter);

app.listen(PORT, () => {
  console.log(`[notifications-service] Microservicio de Notificaciones escuchando en puerto ${PORT}`);
});
