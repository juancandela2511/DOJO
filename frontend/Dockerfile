# ==============================================================================
# DOCKERFILE - FRONTEND HÍBRIDO (Angular Standalone + Tailwind CSS + Nginx)
# Regla de Ingeniería: < 300 líneas, comentado en español
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine AS production

# Copiar configuración de Nginx para SPA y proxy de activos
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar artefactos compilados de Angular 18
COPY --from=builder /app/dist/dojo-app/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
