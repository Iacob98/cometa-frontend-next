# COMETA Frontend Dockerfile
# Multi-stage build for production optimization

# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci --only=production --ignore-scripts

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_AUTH_SERVICE_URL
ARG NEXT_PUBLIC_PROJECT_SERVICE_URL
ARG NEXT_PUBLIC_WORK_SERVICE_URL
ARG NEXT_PUBLIC_TEAM_SERVICE_URL
ARG NEXT_PUBLIC_MATERIAL_SERVICE_URL
ARG NEXT_PUBLIC_EQUIPMENT_SERVICE_URL
ARG NEXT_PUBLIC_ACTIVITY_SERVICE_URL

# Set environment variables
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_AUTH_SERVICE_URL=$NEXT_PUBLIC_AUTH_SERVICE_URL
ENV NEXT_PUBLIC_PROJECT_SERVICE_URL=$NEXT_PUBLIC_PROJECT_SERVICE_URL
ENV NEXT_PUBLIC_WORK_SERVICE_URL=$NEXT_PUBLIC_WORK_SERVICE_URL
ENV NEXT_PUBLIC_TEAM_SERVICE_URL=$NEXT_PUBLIC_TEAM_SERVICE_URL
ENV NEXT_PUBLIC_MATERIAL_SERVICE_URL=$NEXT_PUBLIC_MATERIAL_SERVICE_URL
ENV NEXT_PUBLIC_EQUIPMENT_SERVICE_URL=$NEXT_PUBLIC_EQUIPMENT_SERVICE_URL
ENV NEXT_PUBLIC_ACTIVITY_SERVICE_URL=$NEXT_PUBLIC_ACTIVITY_SERVICE_URL

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build application
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["node", "server.js"]