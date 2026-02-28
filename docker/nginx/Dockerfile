FROM nginx:alpine

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

COPY frontend /var/www/frontend
COPY admin /var/www/admin
COPY organizer /var/www/organizer

EXPOSE 80
