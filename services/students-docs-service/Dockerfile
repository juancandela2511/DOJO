# ==============================================================================
# DOCKERFILE - MICROSERVICIO: students-docs-service (:3002)
# Responsabilidad: CRUD Estudiantes, Cinturones, Subida de Fotos/CC/EPS y OCR
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

# Crear directorio de almacenamiento seguro para Fotos, Cédulas y certificados EPS
RUN mkdir -p /app/storage/uploads

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3002

CMD ["node", "dist/index.js"]
