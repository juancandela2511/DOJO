# ==============================================================================
# DOCKERFILE - MICROSERVICIO: memberships-service (:3003)
# Responsabilidad: Mensualidades, Semáforo Progresivo y Bloqueo de Auto-Renovación
# Regla de Ingeniería: < 300 líneas, comentado en español
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3003

CMD ["node", "dist/index.js"]
