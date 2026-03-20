### Multi-stage Dockerfile for Next.js production
FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production

# Allow passing sensitive values at build time (do not commit them)
ARG MONGODB_URI
ENV MONGODB_URI=${MONGODB_URI}

# Fail early during build if MONGODB_URI isn't supplied so the error is explicit
# Provide a helpful message and stop the build to avoid confusing runtime errors.
RUN if [ -z "$MONGODB_URI" ]; then \
	echo "ERROR: build ARG MONGODB_URI is not set. Provide it with --build-arg MONGODB_URI=..."; \
	exit 1; \
fi

# Install deps
COPY package*.json ./
RUN npm ci --production=false

# Copy sources and build
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy necessary artifacts from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000
# Use shell form so PORT env is respected by next start
CMD ["sh", "-c", "npm run start -- -p ${PORT:-3000}"]
