# SSH Manager - Docker Setup

Este proyecto ha sido configurado para ejecutarse en Docker, evitando la necesidad de instalar dependencias localmente.

## Requisitos

- Docker
- Docker Compose (opcional, pero recomendado)

## Ejecutar con Docker Compose (Recomendado)

```bash
# Construir y ejecutar la aplicación
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up -d --build

# Parar la aplicación
docker-compose down
```

## Ejecutar con Docker directamente

```bash
# Construir la imagen
docker build -t ssh-manager .

# Ejecutar el contenedor
docker run -p 3000:3000 ssh-manager
```

## Acceder a la aplicación

Una vez que el contenedor esté ejecutándose, puedes acceder a la aplicación en:

```
http://localhost:3000
```

## Comandos útiles

```bash
# Ver logs del contenedor
docker-compose logs -f ssh-manager

# Entrar al contenedor para debugging
docker-compose exec ssh-manager sh

# Limpiar todo (contenedores, imágenes, volúmenes)
docker-compose down -v --rmi all

# Reconstruir después de cambios en el código
docker-compose up --build
```

## Estructura de archivos Docker

- `Dockerfile`: Configuración para construir la imagen
- `docker-compose.yml`: Configuración para ejecutar con Docker Compose
- `.dockerignore`: Archivos ignorados durante la construcción
- `next.config.mjs`: Actualizado con `output: 'standalone'` para Docker

## Notas

- La aplicación se ejecuta en modo producción dentro del contenedor
- El puerto 3000 está expuesto y mapeado al puerto 3000 del host
- Los archivos estáticos se sirven desde la imagen Docker optimizada
