# Backend Dockerfile - node:22-alpine, non-root user
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:22-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Ensure storage directories exist at image build time (chown handled by mounted volume)
RUN mkdir -p /app/storage/avatars /app/storage/mountain-photos

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "server.js"]
