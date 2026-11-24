/**
 * @file index.ts
 * @description Punto de entrada principal del `api-gateway` (:8080).
 *              Implementa Rate Limiting, CORS, Healthcheck global y enrutamiento RBAC.
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { gatewayConfig } from './config/env.config';
import { gatewayRouter } from './routes/gateway.routes';

const app: Application = express();

// Configuración de CORS para permitir la Web Angular y el WebView nativo de Capacitor Android
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate Limiter para proteger el ecosistema de microservicios contra abuso o fuerza bruta
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: 600, // Hasta 600 peticiones por IP (incluyendo pings de Geofencing Android)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, por favor intente nuevamente en unos minutos.',
  },
});

app.use(apiLimiter);

/**
 * Endpoint público de estado del API Gateway y topología de microservicios.
 */
app.get('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    service: 'dojo-api-gateway',
    status: 'OK',
    architecture: 'Microservices + RBAC + Immutable Audit',
    upstreamServices: gatewayConfig.services,
    timestamp: new Date().toISOString(),
  });
});

// Montar las rutas del proxy inverso hacia los microservicios
app.use('/', gatewayRouter);

app.listen(gatewayConfig.port, () => {
  console.log(`[api-gateway] API Gateway del Dojo escuchando en el puerto ${gatewayConfig.port}`);
});
