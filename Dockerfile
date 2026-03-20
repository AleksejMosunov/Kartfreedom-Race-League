# Stage 1: сборка фронта
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

# Копируем .env для build
COPY .env .env

RUN npm run build
