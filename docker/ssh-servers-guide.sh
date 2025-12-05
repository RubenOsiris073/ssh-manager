#!/bin/bash

echo "🚀 GUÍA RÁPIDA - Servidores SSH de Prueba para SSH Manager"
echo "=========================================================="
echo ""

# Verificar qué servidores están funcionando
echo "✅ SERVIDORES SSH FUNCIONANDO:"
echo ""

# Alpine (debería estar listo)
if timeout 3 sshpass -p 'alpine123' ssh -o StrictHostKeyChecking=no -p 2203 alpine@localhost 'exit' 2>/dev/null; then
    echo "🐧 Alpine Linux Server:"
    echo "   Host: localhost"
    echo "   Puerto: 2203"  
    echo "   Usuario: alpine"
    echo "   Contraseña: alpine123"
    echo "   Estado: ✅ LISTO"
    echo ""
fi

# Ubuntu (debería estar listo)
if timeout 3 sshpass -p 'ubuntu123' ssh -o StrictHostKeyChecking=no -p 2201 ubuntu@localhost 'exit' 2>/dev/null; then
    echo "🐧 Ubuntu Server:"
    echo "   Host: localhost"
    echo "   Puerto: 2201"
    echo "   Usuario: ubuntu" 
    echo "   Contraseña: ubuntu123"
    echo "   Estado: ✅ LISTO"
    echo ""
fi

# Root en Alpine
if timeout 3 sshpass -p 'root123' ssh -o StrictHostKeyChecking=no -p 2203 root@localhost 'exit' 2>/dev/null; then
    echo "🔐 Alpine Root Access:"
    echo "   Host: localhost"
    echo "   Puerto: 2203"
    echo "   Usuario: root"
    echo "   Contraseña: root123"
    echo "   Estado: ✅ LISTO"
    echo ""
fi

# Root en Ubuntu  
if timeout 3 sshpass -p 'root123' ssh -o StrictHostKeyChecking=no -p 2201 root@localhost 'exit' 2>/dev/null; then
    echo "🔐 Ubuntu Root Access:"
    echo "   Host: localhost" 
    echo "   Puerto: 2201"
    echo "   Usuario: root"
    echo "   Contraseña: root123"
    echo "   Estado: ✅ LISTO"
    echo ""
fi

echo "📱 CÓMO USAR EN SSH MANAGER:"
echo "1. Abre http://localhost:3000 en tu navegador"
echo "2. Inicia sesión con usuario: admin, contraseña: admin123"
echo "3. Usa el botón 'Quick Connect' o 'Add Connection'"
echo "4. Ingresa los datos de cualquiera de los servidores de arriba"
echo "5. ¡Prueba la conexión SSH!"
echo ""

echo "🔧 COMANDOS ÚTILES:"
echo "Ver estado de todos los contenedores:"
echo "  cd docker && docker-compose ps"
echo ""
echo "Ver logs de un servidor:"  
echo "  docker-compose logs ssh-test-alpine"
echo ""
echo "Parar servidores de prueba:"
echo "  docker-compose stop ssh-test-ubuntu ssh-test-alpine"
echo ""
echo "Reiniciar un servidor:"
echo "  docker-compose restart ssh-test-alpine"
echo ""

echo "🌐 IPs INTERNAS (para conexiones entre contenedores):"
for container in ssh-test-alpine ssh-test-ubuntu ssh-test-devbox ssh-test-debian ssh-test-custom; do
    if docker ps --format "table {{.Names}}" | grep -q "^$container$"; then
        ip=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$container" 2>/dev/null)
        if [ ! -z "$ip" ]; then
            echo "  $container: $ip"
        fi
    fi
done

echo ""
echo "¡Disfruta probando SSH Manager con múltiples servidores! 🎉"