FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar el código fuente y compilar
COPY . .
RUN npm run build

# Etapa de producción
FROM node:20-alpine
WORKDIR /app

# Copiar archivos compilados y dependencias
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Configurar variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Exponer el puerto
EXPOSE 3000

# Iniciar el servidor
CMD ["npm", "start"]
