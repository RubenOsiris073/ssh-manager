# SSH Manager - Desarrollo con Docker

## Configuración Rápida para Desarrollo

### 1. Construir la imagen base (solo una vez)
```bash
docker build -t ssh-manager-dev .
```

### 2. Ejecutar el contenedor
```bash
docker run -d -p 3000:3000 -p 2222:22 --name ssh-manager-container ssh-manager-dev
```

### 3. Copiar el proyecto al contenedor
```bash
# Opción A: Con docker cp (más rápido)
docker cp . ssh-manager-container:/app/ssh-manager/

# Opción B: Con SSH (si prefieres)
# scp -P 2222 -r . root@localhost:/app/ssh-manager/
# (password: docker123)
```

### 4. Entrar al contenedor e instalar dependencias
```bash
docker exec -it ssh-manager-container bash
cd /app/ssh-manager
pnpm install
pnpm dev
```

### 5. Acceder a la aplicación
```
http://localhost:3000
```

## Comandos Útiles para Desarrollo

### Copiar cambios rápidamente
```bash
# Solo copiar archivos modificados
docker cp ./components ssh-manager-container:/app/ssh-manager/
docker cp ./app ssh-manager-container:/app/ssh-manager/

# O copiar todo el proyecto nuevamente
docker cp . ssh-manager-container:/app/ssh-manager/
```

### Reiniciar la aplicación en el contenedor
```bash
docker exec -it ssh-manager-container bash -c "cd /app/ssh-manager && pkill -f 'next dev' && pnpm dev"
```

### Ver logs de la aplicación
```bash
docker exec -it ssh-manager-container bash -c "cd /app/ssh-manager && tail -f .next/trace"
```

### Limpiar y recrear contenedor
```bash
docker stop ssh-manager-container
docker rm ssh-manager-container
docker run -d -p 3000:3000 -p 2222:22 --name ssh-manager-container ssh-manager-dev
```

## Ventajas de este enfoque

- ✅ No necesitas instalar Node.js, pnpm ni dependencias localmente
- ✅ Copia rápida con `docker cp` sin volúmenes
- ✅ SSH habilitado por si prefieres esa opción
- ✅ Contenedor reutilizable, solo copias código cuando cambias algo
- ✅ Desarrollo rápido sin overhead de docker-compose

## Script automatizado

Crea un archivo `dev.sh` para automatizar el proceso:

```bash
#!/bin/bash

# Construir imagen si no existe
if ! docker image inspect ssh-manager-dev >/dev/null 2>&1; then
    echo "Building Docker image..."
    docker build -t ssh-manager-dev .
fi

# Crear y ejecutar contenedor si no está corriendo
if ! docker ps | grep -q ssh-manager-container; then
    echo "Starting container..."
    docker run -d -p 3000:3000 -p 2222:22 --name ssh-manager-container ssh-manager-dev 2>/dev/null || {
        docker start ssh-manager-container
    }
fi

# Copiar proyecto
echo "Copying project files..."
docker cp . ssh-manager-container:/app/ssh-manager/

# Instalar dependencias y ejecutar
echo "Installing dependencies and starting dev server..."
docker exec -it ssh-manager-container bash -c "cd /app/ssh-manager && pnpm install && pnpm dev"
```

Luego solo ejecuta: `chmod +x dev.sh && ./dev.sh`