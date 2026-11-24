/**
 * @file env.config.ts
 * @description Configuración centralizada y tipada de URLs de microservicios y secretos JWT
 *              para el `api-gateway`.
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Estructura de configuración inmutable del API Gateway.
 */
export interface GatewayConfig {
  readonly port: number;
  readonly jwtAccessSecret: string;
  readonly internalApiKey: string;
  readonly services: {
    readonly authAuditUrl: string;
    readonly studentsDocsUrl: string;
    readonly membershipsUrl: string;
    readonly attendanceClassesUrl: string;
    readonly notificationsUrl: string;
  };
}

export const gatewayConfig: GatewayConfig = {
  port: Number(process.env.PORT || process.env.API_GATEWAY_PORT || 8080),
  jwtAccessSecret:
    process.env.JWT_ACCESS_SECRET || 'dojo_jwt_access_secret_key_ultra_segura_2026_x99',
  internalApiKey:
    process.env.INTERNAL_SERVICE_API_KEY || 'internal_dojo_microservices_shared_key_2026',
  services: {
    authAuditUrl: process.env.AUTH_AUDIT_SERVICE_URL || 'http://auth-audit-service:3001',
    studentsDocsUrl: process.env.STUDENTS_DOCS_SERVICE_URL || 'http://students-docs-service:3002',
    membershipsUrl: process.env.MEMBERSHIPS_SERVICE_URL || 'http://memberships-service:3003',
    attendanceClassesUrl:
      process.env.ATTENDANCE_CLASSES_SERVICE_URL || 'http://attendance-classes-service:3004',
    notificationsUrl:
      process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:3005',
  },
};
