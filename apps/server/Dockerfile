# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json ./
COPY apps/server/package.json ./apps/server/

# Install dependencies (including root ones)
RUN npm install

# Copy server source
COPY apps/server ./apps/server

# Build TypeScript
WORKDIR /app/apps/server
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Copy only production dependencies and build artifacts
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./package.json
COPY --from=builder /app/apps/server/node_modules ./node_modules

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
