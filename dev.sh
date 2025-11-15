#!/bin/bash

# Script automatizado para desarrollo con Docker
# Uso: ./dev.sh

set -e

CONTAINER_NAME="ssh-manager-container"
IMAGE_NAME="ssh-manager-dev"

echo "🚀 SSH Manager - Docker Development Setup"
echo "========================================"

# Función para verificar si el contenedor está corriendo
container_running() {
    docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"
}

# Función para verificar si el contenedor existe
container_exists() {
    docker ps -a --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"
}

# Construir imagen si no existe
if ! docker image inspect $IMAGE_NAME >/dev/null 2>&1; then
    echo "📦 Building Docker image..."
    docker build -t $IMAGE_NAME .
    echo "✅ Image built successfully"
else
    echo "✅ Docker image already exists"
fi

# Manejar contenedor
if container_running; then
    echo "✅ Container is already running"
elif container_exists; then
    echo "🔄 Starting existing container..."
    docker start $CONTAINER_NAME
    sleep 2
else
    echo "🆕 Creating and starting new container..."
    docker run -d -p 3000:3000 -p 2222:22 --name $CONTAINER_NAME $IMAGE_NAME
    sleep 3
fi

# Verificar que el contenedor esté corriendo
if ! container_running; then
    echo "❌ Failed to start container"
    exit 1
fi

# Copiar archivos del proyecto
echo "📁 Copying project files..."
docker cp . $CONTAINER_NAME:/app/ssh-manager/
echo "✅ Files copied successfully"

# Instalar dependencias y ejecutar
echo "📥 Installing dependencies and starting dev server..."
echo "🌐 The app will be available at: http://localhost:3000"
echo "🔧 SSH access available at: localhost:2222 (user: root, pass: docker123)"
echo ""

# Ejecutar en modo interactivo
docker exec -it $CONTAINER_NAME bash -c "
    cd /app/ssh-manager && 
    echo '📦 Installing dependencies...' && 
    pnpm install --silent && 
    echo '✅ Dependencies installed' && 
    echo '🚀 Starting development server...' && 
    echo '' &&
    pnpm dev
"