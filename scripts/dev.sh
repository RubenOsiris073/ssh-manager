#!/bin/bash

# Script automatizado para desarrollo con Docker
# Uso: ./scripts/dev.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker/docker-compose.yml"

echo "🚀 SSH Manager - Docker Development Setup"
echo "========================================"

# Verificar que existan los archivos necesarios
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    echo "❌ Error: No se encontró $DOCKER_COMPOSE_FILE"
    exit 1
fi

# Ir al directorio raíz del proyecto
cd "$PROJECT_ROOT"

echo "📂 Working directory: $(pwd)"

# Verificar si los servicios están corriendo
if docker compose -f docker/docker-compose.yml ps --services --filter "status=running" | grep -q .; then
    echo "✅ Servicios ya están corriendo"
    echo "🌐 Aplicación disponible en: http://localhost:3000"
    echo "🗄️ Base de datos PostgreSQL: localhost:5432"
    echo "� Redis: localhost:6379"
    
    # Mostrar logs en tiempo real
    echo ""
    echo "📋 Mostrando logs (Ctrl+C para salir)..."
    docker compose -f docker/docker-compose.yml logs -f
else
    echo "🆕 Iniciando servicios Docker..."
    
    # Construir e iniciar servicios
    docker compose -f docker/docker-compose.yml up -d --build
    
    echo ""
    echo "✅ Servicios iniciados correctamente"
    echo "🌐 Aplicación disponible en: http://localhost:3000"
    echo "�️ Base de datos PostgreSQL: localhost:5432"
    echo "📝 Redis: localhost:6379"
    
    # Esperar a que los servicios estén listos
    echo "⏳ Esperando a que los servicios estén listos..."
    sleep 10
    
    # Mostrar estado de los servicios
    echo ""
    echo "� Estado de los servicios:"
    docker compose -f docker/docker-compose.yml ps
    
    # Mostrar logs en tiempo real
    echo ""
    echo "� Mostrando logs (Ctrl+C para salir)..."
    docker compose -f docker/docker-compose.yml logs -f
fi