FROM node:20-alpine AS build

WORKDIR /app

# Enable legacy OpenSSL for compatibility with some Vite/Node versions if needed, 
# but Node 20 usually handles this.
COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL=/api
ARG VITE_ADMIN_API_URL=/api/admin
ARG VITE_ADMIN_API_KEY
ARG VITE_RAZORPAY_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ADMIN_API_URL=$VITE_ADMIN_API_URL
ENV VITE_ADMIN_API_KEY=$VITE_ADMIN_API_KEY
ENV VITE_RAZORPAY_KEY=$VITE_RAZORPAY_KEY
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
