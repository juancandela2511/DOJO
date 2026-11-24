# ==============================================================================
# DOCKERFILE - MICROSERVICIO: auth-audit-service (:3001)
# Responsabilidad: Login persistente, Refresh Tokens, Roles RBAC y audit_logs
# Regla de Ingeniería: < 300 líneas, comentado en español
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos de dependencias e instalar paquetes incluyendo devDependencies
COPY package*.json ./
RUN npm install

# Copiar el código fuente TypeScript estricto y compilar a JavaScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ------------------------------------------------------------------------------
# Etapa de Producción ligera
# ------------------------------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

# Copiar artefactos compilados desde la etapa builder
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.js"]
