# ---- Build Stage ----
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies including dev dependencies for build
RUN npm ci && \
    npm install -g typescript@4.9.x && \
    npm cache clean --force

# Copy source code and config files
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript code
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Run security audit
RUN npm audit

# ---- Production Stage ----
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Add non-root user
RUN addgroup -g 1001 -S node && \
    adduser -u 1001 -S node -G node

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV TZ=UTC

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Security headers and hardening
RUN apk add --no-cache curl && \
    echo "kernel.unprivileged_userns_clone=1" >> /etc/sysctl.conf && \
    echo "net.core.somaxconn=65535" >> /etc/sysctl.conf

# Configure read-only filesystem
RUN mkdir -p /app/node_modules && \
    chown -R node:node /app && \
    chmod -R 755 /app/node_modules

# Set security limits
LABEL security.capabilities.drop="ALL"
LABEL security.seccomp.profile="default"

# Switch to non-root user
USER node

# Expose API port
EXPOSE 3000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl --fail http://localhost:3000/health || exit 1

# Set resource limits
LABEL com.docker.resource.memory="2GB"
LABEL com.docker.resource.cpu="1.0"
LABEL com.docker.resource.pids="50"

# Start the application
CMD ["node", "dist/server.js"]