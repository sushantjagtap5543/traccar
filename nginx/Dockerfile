FROM nginx:alpine
RUN apk add --no-cache openssl
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -subj "/C=IN/ST=MH/L=Pune/O=GeoSurePath/CN=localhost"

COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
EXPOSE 443
