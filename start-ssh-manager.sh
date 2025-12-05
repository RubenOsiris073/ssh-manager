#!/bin/bash
# Script para iniciar SSH Manager con IPs fijas

echo "🚀 Iniciando SSH Manager..."

# 1. Levantar servidores SSH con IPs fijas
echo "📡 Levantando servidores SSH de prueba..."
cd "$(dirname "$0")"
docker-compose -f docker-compose-static-ips.yml up -d

# 2. Levantar aplicación SSH Manager
echo "🖥️  Levantando aplicación SSH Manager..."
docker-compose -f docker-compose-simple.yml up -d

# 3. Conectar SSH Manager a la red de los servidores SSH
echo "🔗 Conectando SSH Manager a la red de servidores..."
docker network connect docker_ssh-manager-network ssh-manager-app 2>/dev/null || echo "   Ya está conectado"

echo ""
echo "✅ SSH Manager iniciado correctamente!"
echo ""
echo "📋 Servidores SSH con IPs fijas:"
for container in ssh-test-ubuntu ssh-test-centos ssh-test-alpine ssh-test-debian ssh-test-devbox ssh-test-custom; do
  ip=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $container 2>/dev/null | head -1)
  if [ -n "$ip" ]; then
    echo "   - $container: $ip"
  fi
done

echo ""
echo "🌐 Aplicación disponible en: http://localhost:3000"
echo "📝 Credenciales en: ssh-credentials.txt"
