# Imagem base com PHP e Node (para Laravel + Vite + React)
FROM php:8.2-cli

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    unzip git curl libpng-dev libonig-dev libxml2-dev zip \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Instalar Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Instalar Node.js (necessário para Vite/React)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Criar diretório de trabalho
WORKDIR /var/www

# Copiar arquivos do projeto
COPY . .

# Instalar dependências do Laravel e do Node
RUN composer install --no-interaction --prefer-dist --optimize-autoloader
RUN npm install && npm run build && npm install react-icons

# Ajustar permissões de storage e cache
RUN chmod -R 777 storage bootstrap/cache

# Expor a porta do PHP e do Vite (caso queira rodar em dev)
EXPOSE 8000 5173

# Comando padrão: sobe o servidor Laravel + Vite em paralelo
CMD php artisan serve --host=0.0.0.0 --port=8000 & npm run dev
