/**
 * @file attendance.routes.ts
 * @description Rutas HTTP del microservicio `attendance-classes-service` (:3004).
 */

import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller';

export const attendanceRouter: Router = Router();

attendanceRouter.post('/attendance/geofence-ping', (req, res) =>
  attendanceController.handleGeofencePing(req, res)
);
attendanceRouter.get('/attendance/live', (req, res) =>
  attendanceController.getLiveInClass(req, res)
);
attendanceRouter.post('/attendance/class-log', (req, res) =>
  attendanceController.recordClassLog(req, res)
);
attendanceRouter.get('/attendance/student/:studentId', (req, res) =>
  attendanceController.getStudentHistory(req, res)
);
