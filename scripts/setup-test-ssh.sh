#!/bin/bash

# Script para configurar un servidor SSH de prueba local
# Esto creará un servidor SSH dentro del contenedor para testing

echo "🐳 Configurando servidor SSH de prueba local..."

# Configurar SSH dentro del contenedor
docker exec -it ssh-manager-container bash -c "
    # Instalar openssh-server si no está instalado
    apk add --no-cache openssh-server openssh-client

    # Generar claves SSH si no existen
    ssh-keygen -A

    # Configurar sshd_config
    echo 'Port 2222' > /etc/ssh/sshd_config
    echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config
    echo 'PubkeyAuthentication yes' >> /etc/ssh/sshd_config
    echo 'PermitEmptyPasswords no' >> /etc/ssh/sshd_config

    # Crear usuario de prueba
    adduser -D -s /bin/bash testuser
    echo 'testuser:testpass123' | chpasswd

    # Cambiar password de root
    echo 'root:rootpass123' | chpasswd

    # Iniciar sshd
    /usr/sbin/sshd -D &

    echo '✅ SSH Server configurado:'
    echo '  - Puerto: 2222'
    echo '  - Usuario: testuser / testpass123'
    echo '  - Root: root / rootpass123'
    echo '  - Host: localhost (desde el contenedor)'
    
    # Mantener el proceso corriendo
    sleep infinity
" &

echo "✅ Servidor SSH local configurado"
echo "📝 Credenciales de prueba:"
echo "   Host: localhost"
echo "   Puerto: 2222"
echo "   Usuario: testuser"
echo "   Password: testpass123"
echo ""
echo "🔗 Puedes probar con:"
echo "   ssh testuser@localhost -p 2222"