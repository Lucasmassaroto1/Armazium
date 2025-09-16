#!/usr/bin/env bash
set -e

cd /var/www

# Composer (instala se vendor estiver vazio)
if [ ! -d "vendor/autoload" ] && [ ! -f "vendor/autoload.php" ]; then
  echo ">> composer install"
  composer install --no-interaction
fi

# Node (instala se node_modules estiver vazio)
if [ ! -d "node_modules" ]; then
  echo ">> npm ci (ou npm install se preferir)"
  if command -v npm >/dev/null 2>&1; then
    if [ -f package-lock.json ]; then
      npm ci
    else
      npm install
    fi
  fi
fi

# Limpa caches (evita confusão de env)
php artisan optimize:clear || true

# Sobe Vite DEV (cria public/hot)
echo ">> iniciando Vite (HMR)"
npm run dev &

# Espera o Vite criar o public/hot (timeout simples)
echo ">> aguardando Vite criar public/hot..."
for i in {1..30}; do
  if [ -f "public/hot" ]; then
    break
  fi
  sleep 1
done

# Sobe Laravel
echo ">> iniciando Laravel"
php artisan serve --host=0.0.0.0 --port=8000
