FROM node:20-alpine AS build

WORKDIR /app

# Enable legacy OpenSSL for compatibility with some Vite/Node versions if needed, 
# but Node 20 usually handles this.
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:stable-alpine
# Vite outputs to 'build' in this project's package.json configuration
COPY --from=build /app/build /usr/share/nginx/html
# Minimal nginx config to handle SPA routing if necessary
RUN echo 'server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
