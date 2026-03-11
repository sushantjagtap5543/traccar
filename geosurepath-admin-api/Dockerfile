FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

RUN npm prune --production

VOLUME ["/app/logs"]

EXPOSE 8083

CMD ["node", "server.js"]
