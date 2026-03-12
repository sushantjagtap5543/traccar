FROM node:20-alpine

RUN apk add --no-cache postgresql-client gettext

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN npm prune --production

# Bug #6: Run as non-privileged user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001 -G nodejs
RUN chown -R nodeuser:nodejs /app
USER nodeuser

VOLUME ["/app/logs"]

EXPOSE 8083

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8083/api/health || exit 1

CMD ["node", "server.js"]
