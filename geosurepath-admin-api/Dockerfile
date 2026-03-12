FROM node:20-alpine

RUN apk add --no-cache postgresql-client gettext

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN npm prune --production

VOLUME ["/app/logs"]

EXPOSE 8083

CMD ["node", "server.js"]
