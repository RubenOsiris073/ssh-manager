# SSH Manager - Aplicación Web de Gestión SSH

Una aplicación web moderna para gestionar conexiones SSH con terminal interactivo en tiempo real.

## 🎯 Características Principales

- **🖥️ Terminal SSH Real**: Conexiones SSH interactivas usando xterm.js con comunicación WebSocket
- **🔐 Autenticación Completa**: Sistema JWT con registro, login y gestión de sesiones
- **📊 Base de Datos PostgreSQL**: Almacenamiento seguro con encriptación de credenciales
- **🌐 Tiempo Real**: Comunicación bidireccional WebSocket para terminales interactivos
- **🎨 UI Moderna**: Next.js 14 con TypeScript, Tailwind CSS y componentes Radix UI
- **📱 Responsive**: Interfaz adaptable optimizada para desktop y móvil

## 🏗️ Arquitectura del Sistema

### Frontend Components
- **ssh-manager.tsx**: Componente principal que maneja el estado global y la navegación
- **home-screen.tsx**: Pantalla de inicio con Quick Connect y lista de conexiones
- **connection-sidebar.tsx**: Barra lateral con listado de conexiones SSH organizadas por grupos
- **terminal-area.tsx**: Área principal que maneja múltiples pestañas de terminales
- **terminal-tabs.tsx**: Sistema de pestañas para gestionar múltiples sesiones SSH
- **connection-dialog.tsx**: Modal para crear/editar conexiones SSH
- **settings-modal.tsx**: Configuraciones de la aplicación y preferencias de usuario

### Backend Services  
- **WebSocket Server**: Maneja conexiones SSH en tiempo real usando ssh2 library
- **API Routes**: Endpoints REST para autenticación y CRUD de conexiones
- **Authentication**: Sistema JWT con middleware de verificación y refresh tokens
- **Database Service**: Gestión de PostgreSQL con encriptación de credenciales SSH

### Core Logic Flow
1. **Autenticación**: Usuario hace login → JWT token → Acceso a funcionalidades
2. **Gestión de Conexiones**: CRUD de conexiones SSH → Almacenamiento encriptado en PostgreSQL
3. **Terminal SSH**: Click en conexión → WebSocket connection → SSH real via ssh2 → xterm.js
4. **Tiempo Real**: Input del usuario → WebSocket → SSH command → Response → Terminal output

## 🛠️ Stack Tecnológico

**Frontend**: Next.js 14, TypeScript, Tailwind CSS, Radix UI, xterm.js  
**Backend**: Node.js, WebSocket Server, ssh2, JWT, bcrypt  
**Database**: PostgreSQL 16 con UUID, triggers y encriptación  
**Containerización**: Docker Compose con servicios multi-container

## 🔐 Credenciales y Configuración

### Credenciales de Base de Datos
```
Host: localhost:5432
Database: sshmanager_db  
Usuario: sshmanager
Password: sshmanager123
```

### Usuario Demo de la Aplicación
```
Username: demo
Password: demo12345
```

### Servidor SSH de Prueba (Docker)
```
Host: 172.18.0.3 (IP del contenedor)
Port: 22
Username: testuser  
Password: testpass123
```

### Variables de Entorno Clave
```
DATABASE_URL=postgresql://sshmanager:sshmanager123@localhost:5432/sshmanager_db
JWT_SECRET=your-super-secret-jwt-key-here
ENCRYPTION_SECRET=your-encryption-key-for-ssh-credentials
WEBSOCKET_PORT=3001
```

## 🚀 Instalación y Ejecución

### Con Docker (Recomendado)

#### Opción 1: Docker Compose - Producción
```bash
git clone <repositorio>
cd ssh-manager

# Construir y ejecutar la aplicación
docker compose up --build

# Ejecutar en segundo plano
docker compose up -d --build

# Parar la aplicación
docker compose down
```

#### Opción 2: Docker - Desarrollo
```bash
# 1. Construir la imagen base
docker build -t ssh-manager-dev .

# 2. Ejecutar el contenedor
docker run -d -p 3000:3000 -p 2222:22 --name ssh-manager-container ssh-manager-dev

# 3. Copiar el proyecto al contenedor
docker cp . ssh-manager-container:/app/ssh-manager/

# 4. Entrar al contenedor e instalar dependencias
docker exec -it ssh-manager-container bash
cd /app/ssh-manager
pnpm install
pnpm dev
```

#### Comandos Útiles de Docker
```bash
# Ver logs del contenedor
docker compose logs -f ssh-manager

# Entrar al contenedor para debugging
docker compose exec ssh-manager sh

# Copiar cambios rápidamente en desarrollo
docker cp ./components ssh-manager-container:/app/ssh-manager/
docker cp ./app ssh-manager-container:/app/ssh-manager/

# Reiniciar la aplicación en el contenedor
docker exec -it ssh-manager-container bash -c "cd /app/ssh-manager && pkill -f 'next dev' && pnpm dev"

# Limpiar todo (contenedores, imágenes, volúmenes)
docker compose down -v --rmi all
```

### Manual
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar PostgreSQL y crear base de datos
createdb sshmanager_db

# 3. Configurar .env.local con las credenciales

# 4. Ejecutar migraciones de base de datos  
npm run db:setup

# 5. Iniciar aplicación
npm run dev
```

**Acceder a la aplicación**: Una vez que esté ejecutándose, accede a `http://localhost:3000`

## 📱 Funcionalidades Principales

### Gestión de Conexiones SSH
- **Quick Connect**: Conexión rápida ingresando host, usuario y password
- **Conexiones Guardadas**: CRUD completo con nombres personalizados y agrupación
- **Grupos de Conexiones**: Organización jerárquica de servidores
- **Importar/Exportar**: Backup y restore de configuraciones SSH

### Terminal Interactivo
- **xterm.js**: Emulador de terminal completo con soporte para colores y escape sequences  
- **Múltiples Sesiones**: Pestañas para manejar varias conexiones SSH simultáneas
- **Redimensionado**: Ajuste automático del terminal al tamaño de ventana
- **Búsqueda**: Funcionalidad de búsqueda en historial de terminal
- **Copy/Paste**: Soporte completo para clipboard

### Autenticación y Seguridad
- **JWT Tokens**: Autenticación stateless con refresh tokens
- **Password Hashing**: bcrypt con salt rounds configurables  
- **Credenciales Encriptadas**: Passwords SSH encriptados en base de datos
- **Session Management**: Control de sesiones activas por usuario

## 🔧 Componentes Clave Explicados

### ssh-manager.tsx - Componente Raíz
Maneja el estado global de la aplicación incluyendo:
- Lista de conexiones SSH del usuario autenticado
- Estado de conexión de terminales activos  
- Navegación entre pantalla de inicio y vista de terminales
- Gestión de modales (configuraciones, conexiones, etc.)

### terminal-area.tsx - Gestor de Terminales
Lógica principal para:
- Crear nuevas instancias de terminal cuando se conecta SSH
- Gestionar el estado de múltiples sesiones simultáneas
- Comunicación WebSocket con el backend para datos de terminal
- Cleanup de recursos cuando se cierran sesiones

### connection-sidebar.tsx - Barra de Navegación  
Funcionalidades:
- Listado jerárquico de conexiones por grupos
- Indicadores de estado (conectado/desconectado/conectando)
- Menús contextuales para editar/eliminar conexiones
- Filtrado y búsqueda de conexiones

### WebSocket Server - Comunicación Tiempo Real
Maneja:
- Autenticación de WebSocket via JWT token
- Establecimiento de conexiones SSH usando ssh2
- Forwarding bidireccional de datos entre terminal y SSH
- Gestión del ciclo de vida de sesiones (connect/disconnect/error)

## 🗄️ Esquema de Base de Datos

### Tablas Principales
- **users**: Autenticación de usuarios con hash de passwords
- **ssh_connections**: Conexiones SSH con credenciales encriptadas
- **connection_groups**: Agrupación organizativa de conexiones  
- **ssh_sessions**: Sesiones activas para auditoría
- **activity_logs**: Logs de acciones para seguridad y debugging

### Características de Seguridad BD
- Encriptación AES-256 para passwords SSH
- UUIDs como primary keys para mejor seguridad
- Índices optimizados para consultas frecuentes
- Triggers automáticos para updated_at timestamps

## 🌐 APIs y Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de nuevo usuario
- `POST /api/auth/login` - Login con credenciales  
- `POST /api/auth/refresh` - Renovar JWT token
- `GET /api/auth/me` - Perfil de usuario actual

### Conexiones SSH
- `GET /api/ssh/connections` - Listar conexiones del usuario
- `POST /api/ssh/connections` - Crear nueva conexión
- `PUT /api/ssh/connections/[id]` - Actualizar conexión
- `DELETE /api/ssh/connections/[id]` - Eliminar conexión
- `POST /api/ssh/test` - Probar conectividad SSH

## 🐛 Debugging y Logs

### Logs de Aplicación
Los logs se escriben en consola con diferentes niveles:
- **INFO**: Conexiones exitosas, autenticación
- **WARN**: Intentos de conexión fallidos, timeouts  
- **ERROR**: Errores de SSH, problemas de base de datos

### Debugging WebSocket
Para debuggear conexiones WebSocket, usar DevTools de Chrome:
1. Network tab → WS filter para ver mensajes WebSocket
2. Console para logs de conexión/desconexión SSH
3. Application → Storage para verificar JWT tokens

## 📈 Monitoreo y Performance

### Métricas Clave
- Conexiones SSH activas simultáneas
- Tiempo de establecimiento de conexión SSH
- Uso de memoria por sesión de terminal
- Errores de autenticación y rate limiting

### Optimizaciones Aplicadas
- Connection pooling para PostgreSQL 
- Compresión gzip para respuestas HTTP
- Lazy loading de componentes React pesados
- Debouncing en inputs de búsqueda y filtros

## 🚨 Consideraciones de Producción

### Seguridad
- Cambiar todos los secrets por defecto en producción
- Implementar rate limiting en APIs de autenticación
- Configurar HTTPS/WSS para comunicaciones encriptadas
- Auditoría regular de activity_logs para detectar anomalías

### Escalabilidad  
- Redis para session storage en entornos distribuidos
- Load balancer para múltiples instancias de WebSocket
- Connection pooling y readonly replicas para PostgreSQL
- CDN para assets estáticos de Next.js

### Backup y Recuperación
- Backup automático diario de base de datos PostgreSQL
- Versionado de esquema de BD con migraciones
- Backup de configuración de Docker Compose
- Documentación de procedimientos de disaster recovery