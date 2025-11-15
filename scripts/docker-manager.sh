#!/bin/bash

# SSH Manager Docker Management Script
# Este script facilita la gestión del contenedor Docker de SSH Manager

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sin color

# Variables
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.local"
CONTAINER_NAME="ssh-manager-app"
DB_CONTAINER="ssh-manager-postgres"

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}SSH Manager Docker Management${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo -e "  ${GREEN}build${NC}        Construir las imágenes Docker"
    echo -e "  ${GREEN}start${NC}        Iniciar todos los servicios"
    echo -e "  ${GREEN}stop${NC}         Detener todos los servicios"
    echo -e "  ${GREEN}restart${NC}      Reiniciar todos los servicios"
    echo -e "  ${GREEN}status${NC}       Mostrar estado de los contenedores"
    echo -e "  ${GREEN}logs${NC}         Mostrar logs del contenedor principal"
    echo -e "  ${GREEN}logs-db${NC}      Mostrar logs de la base de datos"
    echo -e "  ${GREEN}shell${NC}        Abrir shell en el contenedor principal"
    echo -e "  ${GREEN}db-shell${NC}     Abrir shell de PostgreSQL"
    echo -e "  ${GREEN}reset${NC}        Resetear todo (elimina volúmenes)"
    echo -e "  ${GREEN}clean${NC}        Limpiar imágenes y contenedores no utilizados"
    echo -e "  ${GREEN}dev${NC}          Iniciar con perfil de desarrollo (incluye pgAdmin)"
    echo -e "  ${GREEN}health${NC}       Verificar el estado de salud de la aplicación"
    echo -e "  ${GREEN}setup${NC}        Configuración inicial del proyecto"
    echo ""
}

# Verificar si existe docker-compose
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker no está instalado${NC}"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose no está instalado${NC}"
        exit 1
    fi
    
    # Usar docker compose si docker-compose no está disponible
    if ! command -v docker-compose &> /dev/null; then
        alias docker-compose="docker compose"
    fi
}

# Función para construir las imágenes
build() {
    echo -e "${BLUE}🔨 Construyendo imágenes Docker...${NC}"
    docker-compose -f $COMPOSE_FILE build --no-cache
    echo -e "${GREEN}✅ Imágenes construidas exitosamente${NC}"
}

# Función para iniciar los servicios
start() {
    echo -e "${BLUE}🚀 Iniciando servicios...${NC}"
    docker-compose -f $COMPOSE_FILE up -d
    
    echo -e "${YELLOW}⏳ Esperando que los servicios estén listos...${NC}"
    sleep 10
    
    if docker ps | grep -q $CONTAINER_NAME; then
        echo -e "${GREEN}✅ SSH Manager iniciado exitosamente${NC}"
        echo -e "${BLUE}📱 Aplicación disponible en: http://localhost:3000${NC}"
        echo -e "${BLUE}🔧 pgAdmin disponible en: http://localhost:5050${NC}"
        echo -e "${BLUE}📊 Base de datos disponible en: localhost:5432${NC}"
    else
        echo -e "${RED}❌ Error al iniciar SSH Manager${NC}"
        docker-compose -f $COMPOSE_FILE logs $CONTAINER_NAME
    fi
}

# Función para detener los servicios
stop() {
    echo -e "${YELLOW}⏹️  Deteniendo servicios...${NC}"
    docker-compose -f $COMPOSE_FILE down
    echo -e "${GREEN}✅ Servicios detenidos${NC}"
}

# Función para reiniciar los servicios
restart() {
    echo -e "${BLUE}🔄 Reiniciando servicios...${NC}"
    stop
    sleep 2
    start
}

# Función para mostrar el estado
status() {
    echo -e "${BLUE}📊 Estado de los contenedores:${NC}"
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    echo -e "${BLUE}🔍 Uso de recursos:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" $(docker-compose -f $COMPOSE_FILE ps -q) 2>/dev/null || echo "No hay contenedores ejecutándose"
}

# Función para mostrar logs
logs() {
    echo -e "${BLUE}📋 Logs del SSH Manager:${NC}"
    docker-compose -f $COMPOSE_FILE logs -f --tail=100 ssh-manager
}

# Función para mostrar logs de la DB
logs_db() {
    echo -e "${BLUE}📋 Logs de PostgreSQL:${NC}"
    docker-compose -f $COMPOSE_FILE logs -f --tail=100 postgres
}

# Función para abrir shell
shell() {
    echo -e "${BLUE}🐚 Abriendo shell en el contenedor...${NC}"
    docker-compose -f $COMPOSE_FILE exec ssh-manager bash || \
    docker-compose -f $COMPOSE_FILE exec ssh-manager sh
}

# Función para abrir shell de DB
db_shell() {
    echo -e "${BLUE}🗄️  Abriendo shell de PostgreSQL...${NC}"
    docker-compose -f $COMPOSE_FILE exec postgres psql -U sshmanager -d sshmanager
}

# Función para reset completo
reset() {
    echo -e "${YELLOW}⚠️  Esto eliminará todos los datos. ¿Continuar? (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${RED}🗑️  Eliminando todos los contenedores y volúmenes...${NC}"
        docker-compose -f $COMPOSE_FILE down -v --remove-orphans
        docker system prune -f
        echo -e "${GREEN}✅ Reset completado${NC}"
    else
        echo -e "${BLUE}ℹ️  Operación cancelada${NC}"
    fi
}

# Función para limpiar Docker
clean() {
    echo -e "${YELLOW}🧹 Limpiando contenedores y imágenes no utilizados...${NC}"
    docker system prune -f
    docker volume prune -f
    echo -e "${GREEN}✅ Limpieza completada${NC}"
}

# Función para desarrollo con pgAdmin
dev() {
    echo -e "${BLUE}🔧 Iniciando en modo desarrollo...${NC}"
    docker-compose -f $COMPOSE_FILE --profile dev up -d
    
    echo -e "${YELLOW}⏳ Esperando que los servicios estén listos...${NC}"
    sleep 15
    
    echo -e "${GREEN}✅ Entorno de desarrollo iniciado${NC}"
    echo -e "${BLUE}📱 Aplicación: http://localhost:3000${NC}"
    echo -e "${BLUE}🔧 pgAdmin: http://localhost:5050 (admin@sshmanager.local / admin123)${NC}"
    echo -e "${BLUE}📊 PostgreSQL: localhost:5432 (sshmanager / sshmanager123)${NC}"
}

# Función para verificar salud
health() {
    echo -e "${BLUE}🏥 Verificando estado de salud...${NC}"
    
    if curl -f http://localhost:3000/api/health &>/dev/null; then
        echo -e "${GREEN}✅ Aplicación saludable${NC}"
        curl -s http://localhost:3000/api/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/api/health
    else
        echo -e "${RED}❌ Aplicación no responde${NC}"
        echo -e "${YELLOW}📋 Últimos logs:${NC}"
        docker-compose -f $COMPOSE_FILE logs --tail=20 ssh-manager
    fi
}

# Función para configuración inicial
setup() {
    echo -e "${BLUE}⚙️  Configuración inicial de SSH Manager${NC}"
    
    # Verificar archivos necesarios
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}📋 Creando archivo de configuración...${NC}"
        if [ -f ".env.example" ]; then
            cp .env.example $ENV_FILE
            echo -e "${GREEN}✅ Archivo .env.local creado desde .env.example${NC}"
        else
            echo -e "${RED}❌ No se encontró .env.example${NC}"
            exit 1
        fi
    fi
    
    echo -e "${BLUE}🔨 Construyendo y iniciando servicios...${NC}"
    build
    start
    
    echo -e "${BLUE}⏳ Esperando inicialización completa...${NC}"
    sleep 20
    
    health
    
    echo -e "${GREEN}🎉 Configuración completada${NC}"
    echo -e "${BLUE}📖 Próximos pasos:${NC}"
    echo -e "   1. Accede a http://localhost:3000"
    echo -e "   2. Usa las credenciales: admin / admin123"
    echo -e "   3. Configura tus conexiones SSH"
}

# Función principal
main() {
    check_docker
    
    case "${1:-help}" in
        build)
            build
            ;;
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        status)
            status
            ;;
        logs)
            logs
            ;;
        logs-db)
            logs_db
            ;;
        shell)
            shell
            ;;
        db-shell)
            db_shell
            ;;
        reset)
            reset
            ;;
        clean)
            clean
            ;;
        dev)
            dev
            ;;
        health)
            health
            ;;
        setup)
            setup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}❌ Comando desconocido: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función principal con todos los argumentos
main "$@"