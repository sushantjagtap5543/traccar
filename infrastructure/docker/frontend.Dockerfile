# Production Dockerfile for Next.js Frontend
FROM node:20 AS builder

WORKDIR /app

# Disable Turbopack and Telemetry
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_VERSION=0
ENV NEXT_PRIVATE_LOCAL_SKIP_TURBOPACK=1

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
