# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json ./
COPY apps/client/package.json ./apps/client/

# Install dependencies (including root ones)
RUN npm install

# Copy client source
COPY apps/client ./apps/client

# Build for production
WORKDIR /app/apps/client
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copy built artifacts from builder stage
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

# Expose Nginx port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
