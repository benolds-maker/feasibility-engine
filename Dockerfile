FROM node:20-slim AS build

WORKDIR /app

# Install root dependencies (includes Vite + React)
COPY package.json package-lock.json ./
RUN npm ci

# Install backend dependencies
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy source and build frontend
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:20-slim

WORKDIR /app

# Copy built frontend
COPY --from=build /app/dist ./dist

# Copy shared engine source (backend imports from src/engines/)
COPY --from=build /app/src ./src

# Copy backend with production deps
COPY --from=build /app/backend ./backend

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "backend/src/server.js"]
