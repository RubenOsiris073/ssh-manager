FROM node:20-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache \
    openssh-server \
    openssh-client \
    bash \
    curl \
    git

# Configurar SSH para poder copiar archivos remotamente (opcional)
RUN ssh-keygen -A
RUN echo "root:docker123" | chpasswd
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# Instalar pnpm globalmente
RUN npm install -g pnpm@latest

# Crear directorio de trabajo
WORKDIR /app

# Crear directorio para el proyecto
RUN mkdir -p /app/ssh-manager

# Exponer puertos
EXPOSE 3000 22

# Script de inicio que mantiene el contenedor corriendo
RUN echo '#!/bin/bash' > /start.sh && \
    echo '/usr/sbin/sshd -D &' >> /start.sh && \
    echo 'echo "=== SSH Manager Docker Container ==="' >> /start.sh && \
    echo 'echo "SSH enabled on port 22 (user: root, pass: docker123)"' >> /start.sh && \
    echo 'echo "Waiting for project files..."' >> /start.sh && \
    echo 'echo "Copy your project with:"' >> /start.sh && \
    echo 'echo "  docker cp . CONTAINER_ID:/app/ssh-manager/"' >> /start.sh && \
    echo 'echo "Then connect and run:"' >> /start.sh && \
    echo 'echo "  docker exec -it CONTAINER_ID bash"' >> /start.sh && \
    echo 'echo "  cd /app/ssh-manager && pnpm install && pnpm dev"' >> /start.sh && \
    echo 'echo "=================================="' >> /start.sh && \
    echo 'tail -f /dev/null' >> /start.sh && \
    chmod +x /start.sh

CMD ["/start.sh"]