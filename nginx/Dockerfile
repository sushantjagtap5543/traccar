FROM nginx:alpine
RUN apk add --no-cache openssl

# Standard nginx:alpine supports env var substitution if files are in /etc/nginx/templates/
# and end with .template
COPY nginx.conf /etc/nginx/templates/nginx.conf.template

EXPOSE 80
EXPOSE 443
