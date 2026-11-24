/**
 * @file index.ts
 * @description Punto de entrada del microservicio `attendance-classes-service` (:3004).
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { attendanceRouter } from './routes/attendance.routes';
import { dbPool } from './db/pool';
import { getDojoGeofenceParameters } from './utils/geofence.util';

dotenv.config();

const app: Application = express();
const PORT: number = Number(process.env.PORT || process.env.ATTENDANCE_CLASSES_SERVICE_PORT || 3004);

app.use(cors());
app.use(express.json());

app.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    await dbPool.query('SELECT 1');
    res.status(200).json({
      service: 'attendance-classes-service',
      status: 'OK',
      geofenceConfig: getDojoGeofenceParameters(),
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'DB error';
    res.status(503).json({ service: 'attendance-classes-service', status: 'ERROR', message: msg });
  }
});

app.use('/api', attendanceRouter);

app.listen(PORT, () => {
  console.log(`[attendance-classes-service] Microservicio de Asistencia y Geofencing escuchando en puerto ${PORT}`);
});
