#!/bin/bash

# Script para copiar cambios rápidamente al contenedor en ejecución
# Uso: ./copy-changes.sh [ruta_opcional]

CONTAINER_NAME="ssh-manager-container"

# Verificar si el contenedor está corriendo
if ! docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Container '$CONTAINER_NAME' is not running"
    echo "Run './dev.sh' first to start the development environment"
    exit 1
fi

# Determinar qué copiar
if [ "$1" ]; then
    # Copiar ruta específica
    echo "📁 Copying $1 to container..."
    docker cp "$1" $CONTAINER_NAME:/app/ssh-manager/
    echo "✅ $1 copied successfully"
else
    # Copiar todo el proyecto
    echo "📁 Copying entire project to container..."
    docker cp . $CONTAINER_NAME:/app/ssh-manager/
    echo "✅ All files copied successfully"
fi

# Reiniciar el servidor de desarrollo automáticamente
echo "🔄 Restarting dev server..."
docker exec $CONTAINER_NAME bash -c "
    cd /app/ssh-manager && 
    pkill -f 'next dev' 2>/dev/null || true &&
    sleep 1 &&
    pnpm dev > /dev/null 2>&1 &
    echo '✅ Dev server restarted'
"

echo "🌐 App should be updated at: http://localhost:3000"