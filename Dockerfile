# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
WORKDIR /app/backend
RUN npm ci

WORKDIR /app/frontend
RUN npm ci

# Copy source code
COPY backend /app/backend
COPY frontend /app/frontend

# Build frontend
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy backend
COPY --from=builder /app/backend ./backend

# Copy frontend build
COPY --from=builder /app/frontend/build ./frontend/build

WORKDIR /app/backend

# Install production dependencies only
RUN npm ci --only=production

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
