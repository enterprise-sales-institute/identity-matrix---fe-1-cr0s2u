# Stage 1: Build environment
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies with exact versions
RUN npm ci

# Copy source code and config files
COPY . .

# Set build environment variables
ENV NODE_ENV=production
ENV VITE_API_URL=${API_URL}

# Type check and build
RUN npm run typecheck && \
    npm run build && \
    npm cache clean --force

# Stage 2: Production environment
FROM nginx:alpine

# Create non-root user
RUN adduser -D -H -u 101 -s /sbin/nologin nginx

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx.security-headers.conf /etc/nginx/security-headers.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Set correct permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Configure gzip compression
RUN echo 'gzip on;' > /etc/nginx/conf.d/gzip.conf && \
    echo 'gzip_vary on;' >> /etc/nginx/conf.d/gzip.conf && \
    echo 'gzip_min_length 1000;' >> /etc/nginx/conf.d/gzip.conf && \
    echo 'gzip_proxied expired no-cache no-store private auth;' >> /etc/nginx/conf.d/gzip.conf && \
    echo 'gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;' >> /etc/nginx/conf.d/gzip.conf

# Configure cache control
RUN echo 'location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {' > /etc/nginx/conf.d/cache-control.conf && \
    echo '    expires 1y;' >> /etc/nginx/conf.d/cache-control.conf && \
    echo '    add_header Cache-Control "public, no-transform";' >> /etc/nginx/conf.d/cache-control.conf && \
    echo '}' >> /etc/nginx/conf.d/cache-control.conf

# Set environment variables
ENV NGINX_WORKER_PROCESSES=auto

# Expose port
EXPOSE 80

# Switch to non-root user
USER nginx

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl --fail http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]