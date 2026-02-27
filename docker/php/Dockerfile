FROM php:8.2-fpm

RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /var/www/backend

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY backend /var/www/backend

RUN composer install --no-dev --optimize-autoloader || true

RUN chown -R www-data:www-data /var/www/backend
