FROM php:8.2-fpm

RUN docker-php-ext-install pdo pdo_mysql

# PHP Upload-Limits erhöhen
RUN echo "upload_max_filesize = 10M" > /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size = 10M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/uploads.ini

WORKDIR /var/www/backend

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY backend /var/www/backend

RUN composer install --no-dev --optimize-autoloader || true

RUN chown -R www-data:www-data /var/www/backend
