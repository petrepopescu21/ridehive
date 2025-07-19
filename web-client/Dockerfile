# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Add non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S ridehive -u 1001 -G nginx

# Set proper permissions
RUN chown -R ridehive:nginx /usr/share/nginx/html && \
    chown -R ridehive:nginx /var/cache/nginx && \
    chown -R ridehive:nginx /var/log/nginx && \
    chown -R ridehive:nginx /etc/nginx/conf.d

# Create nginx pid directory with proper permissions
RUN mkdir -p /var/run/nginx && \
    chown -R ridehive:nginx /var/run/nginx

USER ridehive

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["nginx", "-g", "daemon off;"]