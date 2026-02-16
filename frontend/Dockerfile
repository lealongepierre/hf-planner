# Multi-stage Dockerfile for Hellfest Planner Frontend
# Stage 1: Builder - Build the React application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy application source
COPY . .

# Build the application
# Note: VITE_API_URL will be injected at runtime via nginx config
RUN npm run build

# Stage 2: Runtime - Serve with nginx
FROM nginx:alpine

# Install gettext for envsubst (environment variable substitution)
RUN apk add --no-cache gettext

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx configuration TEMPLATE with environment variable placeholders
# Only ${BACKEND_URL} and ${PORT} are substituted at runtime
# Nginx variables ($host, $remote_addr, etc.) are left untouched
RUN cat > /etc/nginx/conf.d/default.conf.template <<'EOF'
server {
    listen ${PORT};
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # API proxy - forward /api requests to backend service
    location /api {
        proxy_pass ${BACKEND_URL};
        proxy_http_version 1.1;
        proxy_ssl_server_name on;
        proxy_set_header Host ${BACKEND_HOST};
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA routing - all requests go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Default values: compatible with docker-compose (backend-service:8000, port 80)
ENV BACKEND_URL=http://backend-service:8000
ENV PORT=80

# Adjust permissions for nginx user (already exists in nginx:alpine)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port (overridden by PORT env var at runtime)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/health || exit 1

# At startup: substitute env vars in template, then start nginx
CMD export BACKEND_HOST=$(echo ${BACKEND_URL} | sed 's|https\?://||' | sed 's|/.*||') && \
    envsubst '${BACKEND_URL} ${BACKEND_HOST} ${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && \
    nginx -g 'daemon off;'
