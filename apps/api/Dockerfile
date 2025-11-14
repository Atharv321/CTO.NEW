# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/api ./apps/api
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm --filter @app/api run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/api ./apps/api
COPY packages ./packages

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Set environment
ENV NODE_ENV=production
ENV API_PORT=3000

EXPOSE 3000

CMD ["node", "apps/api/dist/index.js"]
