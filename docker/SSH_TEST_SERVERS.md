# Servidores SSH de Prueba

Esta configuración incluye múltiples servidores SSH de prueba para probar la funcionalidad del SSH Manager.

## 🌐 CONFIGURACIÓN PARA SSH MANAGER WEB APP

**⚠️ IMPORTANTE: Para conectarte desde la aplicación web SSH Manager, usa estas IPs internas:**

| Servidor | IP Interna | Puerto | Usuario | Password |
|----------|------------|---------|---------|----------|
| **Ubuntu** | `172.19.0.7` | `22` | ubuntu | ubuntu123 |
| **CentOS** | `172.19.0.3` | `22` | centos | centos123 |
| **Alpine** | `172.19.0.8` | `22` | alpine | alpine123 |
| **Debian** | `172.19.0.4` | `22` | debian | debian123 |
| **DevBox** | `172.19.0.10` | `22` | developer | dev123 |
| **Custom** | `172.19.0.11` | `22` | tester | test123 |
| **Principal** | `172.19.0.5` | `22` | sshuser | sshpass123 |

## Lista de Servidores Disponibles

### 1. Ubuntu Server (ssh-test-ubuntu)
- **Puerto**: 2201
- **Host**: localhost:2201 o IP del contenedor
- **Usuarios**:
  - `ubuntu` / `ubuntu123` (usuario normal con sudo)
  - `root` / `root123` (administrador)
- **Herramientas**: curl, wget, vim, nano, htop

### 2. CentOS/RHEL Server (ssh-test-centos)
- **Puerto**: 2202
- **Host**: localhost:2202 o IP del contenedor
- **Usuarios**:
  - `centos` / `centos123` (usuario normal con sudo)
  - `root` / `root123` (administrador)
- **Herramientas**: curl, wget, vim, nano, htop

### 3. Alpine Linux (ssh-test-alpine)
- **Puerto**: 2203
- **Host**: localhost:2203 o IP del contenedor
- **Usuarios**:
  - `alpine` / `alpine123` (usuario normal con sudo)
  - `root` / `root123` (administrador)
- **Herramientas**: curl, wget, vim, nano, htop, bash
- **Nota**: Servidor muy ligero, ideal para pruebas rápidas

### 4. Debian Server (ssh-test-debian)
- **Puerto**: 2204
- **Host**: localhost:2204 o IP del contenedor
- **Usuarios**:
  - `debian` / `debian123` (usuario normal con sudo)
  - `root` / `root123` (administrador)
- **Herramientas**: curl, wget, vim, nano, htop

### 5. Development Box (ssh-test-devbox)
- **Puerto**: 2205
- **Host**: localhost:2205 o IP del contenedor
- **Usuarios**:
  - `developer` / `dev123` (usuario normal con sudo)
  - `root` / `root123` (administrador)
- **Herramientas**: git, python3, nodejs, npm, docker, vim, nano, htop
- **Uso**: Ideal para simular un entorno de desarrollo

### 6. Custom Test Server (ssh-test-custom)
- **Puerto**: 2206
- **Host**: localhost:2206 o IP del contenedor
- **Usuarios**:
  - `tester` / `test123` (usuario normal con sudo)
  - `root` / `root123` (administrador)
- **Herramientas**: net-tools, ping, curl, wget, vim, nano, htop
- **Uso**: Servidor personalizado para testing específico

## Comandos para Gestión

### Iniciar todos los servidores SSH:
```bash
cd docker
docker-compose up -d ssh-test-ubuntu ssh-test-centos ssh-test-alpine ssh-test-debian ssh-test-devbox ssh-test-custom
```

### Iniciar solo algunos servidores:
```bash
cd docker
docker-compose up -d ssh-test-ubuntu ssh-test-devbox
```

### Verificar el estado de los servidores:
```bash
docker-compose ps
```

### Ver logs de un servidor específico:
```bash
docker-compose logs ssh-test-ubuntu
```

### Conectar directamente por terminal (para verificar):
```bash
# Ubuntu server
ssh ubuntu@localhost -p 2201

# CentOS server  
ssh centos@localhost -p 2202

# Alpine server
ssh alpine@localhost -p 2203

# Debian server
ssh debian@localhost -p 2204

# DevBox
ssh developer@localhost -p 2205

# Custom server
ssh tester@localhost -p 2206
```

### Parar todos los servidores SSH:
```bash
docker-compose stop ssh-test-ubuntu ssh-test-centos ssh-test-alpine ssh-test-debian ssh-test-devbox ssh-test-custom
```

### Eliminar todos los servidores SSH:
```bash
docker-compose down ssh-test-ubuntu ssh-test-centos ssh-test-alpine ssh-test-debian ssh-test-devbox ssh-test-custom
```

## Uso en SSH Manager

En la aplicación SSH Manager, puedes crear conexiones usando:

### Conexiones por localhost (desde el host):
- Host: `localhost`
- Port: `2201, 2202, 2203, 2204, 2205, 2206`

### Conexiones por IP interna (desde otros contenedores):
Para obtener las IPs internas de los contenedores:
```bash
docker inspect ssh-test-ubuntu | grep IPAddress
docker inspect ssh-test-centos | grep IPAddress
# etc...
```

## Consejos de Uso

1. **Orden de inicio**: Es recomendable iniciar primero los servicios principales (`postgres`, `redis`, `ssh-manager`) y luego los servidores de prueba.

2. **Recursos**: Cada servidor consume memoria. Para desarrollo, puedes iniciar solo los que necesites.

3. **Persistencia**: Los contenedores no persisten datos entre reinicios. Son ideales para pruebas temporales.

4. **Personalización**: Puedes modificar los comandos de inicio en `docker-compose.yml` para agregar más herramientas o configuraciones específicas.

## Ejemplo de Conexiones para Guardar en SSH Manager

```
Nombre: Ubuntu Test Server
Host: localhost
Puerto: 2201
Usuario: ubuntu
Contraseña: ubuntu123

Nombre: Development Environment
Host: localhost  
Puerto: 2205
Usuario: developer
Contraseña: dev123

Nombre: Alpine Light Server
Host: localhost
Puerto: 2203
Usuario: alpine
Contraseña: alpine123
```