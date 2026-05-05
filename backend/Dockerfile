FROM php:8.4-cli

WORKDIR /var/www

# Install system dependencies + PHP extensions
RUN apt-get update && apt-get install -y \
    git unzip curl libzip-dev \
    && docker-php-ext-install pdo pdo_mysql zip bcmath pcntl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy composer binary FIRST (before running composer install)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy dependency manifests and install (cached layer if unchanged)
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --no-interaction --prefer-dist

# Copy the rest of the application
COPY . .

# Generate optimized autoloader
RUN composer dump-autoload --optimize

EXPOSE 8000

CMD php artisan serve --host=0.0.0.0 --port=8000