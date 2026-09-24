# Portal de Graduados ESPOCH — Guía de Despliegue con Docker

Guía para desplegar el **Portal de Graduados de la Carrera de Software (ESPOCH)**
completamente contenerizado con Docker. Todo el sistema (aplicación, base de datos
e imágenes subidas) corre **de forma local en el servidor**; el único servicio
externo es **Resend**, usado solo para enviar correos.

---

## 📦 Arquitectura

3 contenedores orquestados con Docker Compose:

| Contenedor | Descripción | Puerto |
|---|---|---|
| `portal_graduados_frontend` | React (Vite) compilado y servido por Nginx | `8350` |
| `portal_graduados_backend` | API Node.js/Express (+ generación de PDF/Word y gráficos) | `8351` |
| `portal_graduados_mongo` | MongoDB 7, base de datos local | interno (no se expone) |

Datos persistentes (volúmenes de Docker, sobreviven a reinicios y reconstrucciones):

| Volumen | Contenido |
|---|---|
| `mongo_data` | Base de datos |
| `backend_uploads` | Imágenes subidas (fotos de perfil, proyectos, certificados, eventos, noticias) |
| `backend_backups` | Respaldos automáticos semestrales de la base de datos |

---

## ✅ Requisitos del servidor

- **Docker** ≥ 24.0 y **Docker Compose** ≥ 2.0
- **Puertos libres:** `8350` (web) y `8351` (API). Ambos deben ser accesibles desde
  los equipos de los usuarios, porque el navegador llama a la API directamente.
- **Recursos recomendados:** 4 GB de RAM o más, 5 GB de disco
- **Salida a internet:** para Resend (correos) y para los mapas base de las
  estadísticas del panel admin (`basemaps.cartocdn.com`). Sin internet el sistema
  funciona, pero no se envían correos y los mapas se ven en blanco.

---

## 🚀 Despliegue paso a paso

Todos los comandos se ejecutan desde la carpeta `Tesis_ESPOCH_OfertaServicios`
(donde están `docker-compose.yml` y `.env.example`).

### 1. Obtener el proyecto

Con `git`:

```bash
git clone https://github.com/JQCRAK/tesis-espoch-oferta-servicios.git portal-graduados
cd portal-graduados/Tesis_ESPOCH_OfertaServicios
```

O descomprimiendo el ZIP entregado y entrando a la carpeta `Tesis_ESPOCH_OfertaServicios`.

### 2. Crear el archivo `.env`

```bash
cp .env.example .env
nano .env
```

| Variable | Qué poner |
|---|---|
| `MONGO_URI` | Ya viene lista para el Mongo del docker-compose. **No cambiar.** |
| `JWT_SECRET` | Clave larga aleatoria (32+ caracteres) |
| `CRYPTO_SECRET` | Exactamente **32 caracteres** (cifra cédula y teléfono) |
| `FRONTEND_URL` | URL pública del sistema, ej. `http://10.20.30.40:8350` |
| `EMAIL_FROM` | Remitente, con dominio verificado en Resend |
| `RESEND_API_KEY` | API Key de Resend |
| `VITE_API_URL` | URL de la API **vista desde el navegador**, ej. `http://10.20.30.40:8351/api` |
| `VITE_BASE_URL` | Igual sin `/api`, ej. `http://10.20.30.40:8351` |

> ⚠️ Las claves reales se entregan por **canal privado**; no están en el repositorio.
>
> ⚠️ `VITE_API_URL` y `VITE_BASE_URL` se incorporan al construir el frontend. Si
> cambian (por ejemplo, otra IP), hay que reconstruir con `docker compose up -d --build`.
> No sirve poner `localhost` si se accede desde otros equipos.

### 3. Construir y levantar

```bash
docker compose up -d --build
```

La primera vez tarda varios minutos (compila el frontend e instala las
dependencias). MongoDB debe quedar en estado `healthy` antes de que arranque el backend.

### 4. Crear los administradores iniciales (solo la primera vez)

```bash
docker compose exec backend node src/scripts/crearAdmin.js
```

Crea los 2 administradores predefinidos (Cristian Guerra y Julio Guallo) y la
tendencia tecnológica semanal. Las contraseñas iniciales están definidas en
`backend/src/scripts/crearAdmin.js`: **cámbienlas tras el primer ingreso**.

### 5. Verificar

```bash
docker compose ps
docker compose logs backend --tail 20
```

Los logs deben mostrar:

```
✅ MongoDB Conectado: mongo
🚀 Servidor corriendo en modo production en el puerto 8351
```

Acceso:
- **Portal:** `http://<IP-servidor>:8350/`
- **Estado de la API:** `http://<IP-servidor>:8351/api/health`

---

## 🔄 Actualizar a una versión nueva

```bash
git pull                      # o reemplazar los archivos del proyecto (sin tocar .env)
docker compose up -d --build
```

Los datos (base de datos, imágenes y respaldos) **se conservan**. Tras actualizar,
recargar el navegador con `Ctrl + Shift + R`.

---

## 💾 Respaldos de la base de datos

**Automático:** el backend genera un respaldo cada 1 de enero y 1 de julio (03:00)
y conserva 6 años. Se guarda en el volumen `backend_backups`. Para copiarlo:

```bash
docker compose cp backend:/app/uploads/backups ./backups
```

**Manual:**

```bash
docker compose exec -T mongo mongodump --db portal_graduados_espoch --archive=/tmp/backup.gz --gzip
docker compose cp mongo:/tmp/backup.gz ./backup.gz
```

**Restaurar** (reemplaza el contenido actual):

```bash
docker compose cp ./backup.gz mongo:/tmp/backup.gz
docker compose exec -T mongo mongorestore --archive=/tmp/backup.gz --gzip --drop
```

Conviene guardar también el contenido de las imágenes subidas (volumen `backend_uploads`).

---

## 🛠️ Comandos operativos

```bash
docker compose ps                    # estado de los contenedores
docker compose logs -f backend       # logs en vivo
docker compose restart backend       # reiniciar un servicio
docker compose down                  # detener todo (los datos se conservan)
docker compose up -d                 # volver a iniciar
```

> ⛔ **No usar** `docker compose down -v`: el parámetro `-v` **borra los volúmenes**
> y con ellos la base de datos, las imágenes y los respaldos.

---

## 🕐 Tareas programadas (cron internos del backend)

| Tarea | Frecuencia | Función |
|---|---|---|
| Eventos y encuestas | Cada hora | Actualiza estados de eventos y encuestas |
| Tendencias | Lunes 00:05 | Rota la tendencia tecnológica semanal |
| Limpieza sin tesis | Diario 01:00 | Avisa y elimina cuentas sin tesis verificada |
| Respaldo de la BD | 1 ene y 1 jul, 03:00 | Respaldo semestral con alerta si el tamaño baja más de 15 % |

---

## 🩺 Solución de problemas

| Síntoma | Causa probable y solución |
|---|---|
| `dependency mongo failed to start / unhealthy` | En equipos lentos Mongo tarda en iniciar. Esperar un minuto y repetir `docker compose up -d`. Ver `docker compose logs mongo`. |
| El build se detiene o el equipo se congela | Falta de RAM. Cerrar otras aplicaciones; en Docker Desktop asignar más memoria. |
| La web carga pero no inicia sesión ni muestra datos | `VITE_API_URL` apunta a una dirección que el navegador no alcanza. Corregir `.env` y reconstruir. |
| No llegan los correos | Revisar `RESEND_API_KEY`, que el dominio de `EMAIL_FROM` esté verificado en Resend, y la salida a internet. Ver `docker compose logs backend`. |
| Mapas en blanco en Estadísticas | El servidor no tiene salida a `basemaps.cartocdn.com`. |
| Se ve una imagen o estilo viejo tras actualizar | Recargar con `Ctrl + Shift + R`. |
| Puerto en uso | Otro programa usa 8350 u 8351. Liberarlo o cambiar el puerto izquierdo en `docker-compose.yml` (y actualizar `.env`). |

---

## 🔐 Seguridad

- Las credenciales viven en `.env`, que **no se sube al repositorio** (`.gitignore`).
- MongoDB **no expone ningún puerto** al exterior: solo es accesible desde la red
  interna de Docker.
- Cédula y teléfono de graduados se **cifran** en la base de datos (`CRYPTO_SECRET`).
- Las contraseñas se guardan con **bcrypt**; las sesiones usan **JWT**.
- La API acepta peticiones desde cualquier origen (CORS abierto). Si el servidor
  está expuesto a internet, conviene restringirlo o ponerlo tras un proxy inverso.

---

## 📁 Estructura del proyecto

```
Tesis_ESPOCH_OfertaServicios/
├── backend/                    # API Node.js/Express
│   └── src/
│       ├── controllers/        # Lógica de cada endpoint
│       ├── models/             # Modelos Mongoose
│       ├── routes/             # Definición de rutas
│       ├── services/           # Correo, hoja de vida (PDF/Word), reportes
│       ├── middleware/         # Autenticación y subida de archivos
│       ├── scripts/            # crearAdmin.js (inicialización)
│       ├── assets/             # Logos y plantilla del Anexo 19
│       ├── uploads/            # Imágenes subidas (volumen Docker)
│       └── app.js              # Punto de entrada
├── frontend/                   # React + Vite
│   ├── public/
│   │   ├── img/                # Logos e imágenes institucionales
│   │   └── fonts/              # Tipografía institucional Rotis
│   └── src/
│       ├── pages/              # Páginas (público, graduado, admin)
│       ├── components/         # Componentes reutilizables
│       └── utils/              # Utilidades
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml          # frontend + backend + mongo
├── nginx.conf
├── .env.example                # Plantilla de variables de entorno
└── README-DESPLIEGUE.md        # Este documento
```

---

## 📞 Contacto

**Autor:** Jhostin Quispe — jhostin.quispe@espoch.edu.ec
**Director de tesis:** Ing. Cristian García — BI-Data, ESPOCH
**Repositorio:** https://github.com/JQCRAK/tesis-espoch-oferta-servicios
