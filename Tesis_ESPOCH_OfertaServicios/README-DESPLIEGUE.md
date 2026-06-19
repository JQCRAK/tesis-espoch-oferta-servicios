# Portal de Graduados ESPOCH — Guía de Despliegue con Docker

## Requisitos en el servidor
- Docker >= 24.0
- Docker Compose >= 2.0
- Puerto 80 y 4000 disponibles

## Pasos para desplegar

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/tesis-espoch.git
cd tesis-espoch
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
nano .env
```
Editar los valores según el servidor de la ESPOCH.
El campo más importante a cambiar es la IP del servidor:
- FRONTEND_URL=http://IP_DEL_SERVIDOR
- VITE_API_URL=http://IP_DEL_SERVIDOR:4000/api
- VITE_BASE_URL=http://IP_DEL_SERVIDOR:4000

### 3. Construir y levantar los contenedores
```bash
docker compose up -d --build
```

### 4. Verificar que está corriendo
```bash
docker compose ps
docker compose logs backend
```

### 5. Acceder al sistema
- Frontend: http://IP_DEL_SERVIDOR
- Backend API: http://IP_DEL_SERVIDOR:4000/api

## Comandos útiles

```bash
# Ver logs en tiempo real
docker compose logs -f

# Detener el sistema
docker compose down

# Reiniciar un servicio
docker compose restart backend

# Actualizar después de cambios
docker compose up -d --build
```

## Nota sobre MongoDB
El sistema usa MongoDB Atlas (nube). La ESPOCH no necesita
instalar MongoDB localmente. Solo necesita acceso a internet
para conectarse al cluster.

## Arquitectura del despliegue
- Backend: Node.js/Express en puerto 4000
- Frontend: React servido por Nginx en puerto 80
- Base de datos: MongoDB Atlas (externa, en la nube)
- Imágenes: Cloudinary (externa, en la nube)