# Multi-Stage Production Dockerfile for WeatherGPT
# Stage 1: Build React Frontend with Vite
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production Python FastAPI Microservice + Static Frontend Assets
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Source & Frontend Dist
COPY backend/ ./backend/
COPY --from=frontend-builder /app/dist ./dist

EXPOSE 8000

ENV PORT=8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
