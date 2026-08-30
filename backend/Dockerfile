FROM php:8.2-apache

RUN a2enmod rewrite headers

RUN docker-php-ext-install pdo pdo_mysql mysqli

COPY . /var/www/html/

WORKDIR /var/www/html

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN if [ -f composer.json ]; then composer install --no-dev --optimize-autoloader; fi

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

CMD ["/entrypoint.sh"]