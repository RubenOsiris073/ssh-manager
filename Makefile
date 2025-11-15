# SSH Manager - Makefile
# Comandos útiles para el desarrollo

.PHONY: help install dev build start docker-up docker-down docker-build docker-logs setup clean test lint

# Ayuda por defecto
help:
	@echo "🚀 SSH Manager - Comandos disponibles:"
	@echo ""
	@echo "📦 Instalación y configuración:"
	@echo "  make install     - Instalar dependencias"
	@echo "  make setup       - Configurar entorno y permisos"
	@echo ""
	@echo "🔧 Desarrollo:"
	@echo "  make dev         - Ejecutar en modo desarrollo"
	@echo "  make build       - Construir aplicación"
	@echo "  make start       - Ejecutar en producción"
	@echo "  make lint        - Ejecutar linter"
	@echo "  make type-check  - Verificar tipos TypeScript"
	@echo ""
	@echo "🐳 Docker:"
	@echo "  make docker-up   - Iniciar servicios Docker"
	@echo "  make docker-down - Detener servicios Docker"
	@echo "  make docker-build- Construir imágenes Docker"
	@echo "  make docker-logs - Ver logs de Docker"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test        - Ejecutar tests"
	@echo "  make test-api    - Probar APIs"
	@echo "  make test-integration - Pruebas de integración"
	@echo ""
	@echo "🧹 Limpieza:"
	@echo "  make clean       - Limpiar archivos temporales"

# Instalación
install:
	@echo "📦 Instalando dependencias..."
	pnpm install

# Configuración inicial
setup:
	@echo "🔧 Configurando entorno..."
	chmod +x scripts/*.sh
	@if [ ! -f .env.local ]; then \
		cp config/.env.example .env.local; \
		echo "📋 Archivo .env.local creado desde template"; \
	fi
	scripts/setup-test-ssh.sh

# Desarrollo
dev:
	@echo "🚀 Iniciando modo desarrollo..."
	pnpm dev

build:
	@echo "🏗️ Construyendo aplicación..."
	pnpm build

start:
	@echo "▶️ Iniciando aplicación..."
	pnpm start

lint:
	@echo "🔍 Ejecutando linter..."
	pnpm lint

type-check:
	@echo "📝 Verificando tipos TypeScript..."
	pnpm type-check

# Docker
docker-up:
	@echo "🐳 Iniciando servicios Docker..."
	docker compose -f docker/docker-compose.yml up -d

docker-down:
	@echo "🛑 Deteniendo servicios Docker..."
	docker compose -f docker/docker-compose.yml down

docker-build:
	@echo "🔨 Construyendo imágenes Docker..."
	docker compose -f docker/docker-compose.yml build

docker-logs:
	@echo "📋 Mostrando logs Docker..."
	docker compose -f docker/docker-compose.yml logs -f

# Testing
test:
	@echo "🧪 Ejecutando tests..."
	scripts/test-integration.sh

test-api:
	@echo "🌐 Probando APIs..."
	scripts/test-api.sh

test-integration:
	@echo "🔗 Ejecutando pruebas de integración..."
	scripts/test-integration.sh

# Limpieza
clean:
	@echo "🧹 Limpiando archivos temporales..."
	rm -rf .next/
	rm -rf node_modules/.cache/
	rm -rf dist/
	rm -f *.log