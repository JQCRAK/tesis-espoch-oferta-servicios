# Portal de Graduados ESPOCH — Guía de Despliegue con Docker

Sistema web para la gestión y seguimiento de graduados de la Carrera de Software
de la ESPOCH. Este documento describe cómo desplegar el proyecto **completamente
contenerizado con Docker** en el servidor institucional de la FIE.

---

## 📦 Arquitectura

El sistema corre en **2 contenedores** orquestados con Docker Compose:

| Contenedor | Descripción | Puerto |
|---|---|---|
| `portal_graduados_backend` | API Node.js/Express + `chartjs-node-canvas` + `pdfkit` | `4000` |
| `portal_graduados_frontend` | React (Vite) compilado y servido por Nginx | `80` |

Los contenedores usan servicios en la nube:

| Servicio | Uso |
|---|---|
| **MongoDB Atlas** | Base de datos NoSQL |
| **Cloudinary** | Almacenamiento y CDN de imágenes |
| **Resend** | Envío de correos transaccionales |

---

## ✅ Requisitos del servidor

- **Docker** ≥ 24.0
- **Docker Compose** ≥ 2.0
- **Puertos disponibles:** 80 (HTTP público) y 4000 (API)
- **Recursos mínimos:** 2 GB RAM, 5 GB disco
- **Salida a internet** (para conectar a Atlas, Cloudinary y Resend)

---

## 🚀 Despliegue paso a paso

### 1. Copiar el proyecto al servidor

Vía `git clone` o descomprimiendo el ZIP entregado:

```bash
cd /opt   # o el directorio de despliegue elegido
git clone https://github.com/JQCRAK/tesis-espoch-oferta-servicios.git portal-graduados
cd portal-graduados
```

### 2. Configurar las variables de entorno

```bash
cp .env.example .env
nano .env
```

**Variables críticas a completar:**

| Variable | Descripción |
|---|---|
| `MONGO_URI` | Connection string del cluster Atlas |
| `JWT_SECRET` | Clave larga aleatoria (32+ caracteres) |
| `CRYPTO_SECRET` | Clave hex de EXACTAMENTE 32 caracteres |
| `FRONTEND_URL` | URL pública del sistema (ej. `http://<IP-servidor>`) |
| `EMAIL_FROM` | Remitente (dominio verificado en Resend) |
| `RESEND_API_KEY` | API Key de Resend |
| `CLOUDINARY_CLOUD_NAME`, `_API_KEY`, `_API_SECRET` | Credenciales Cloudinary |
| `VITE_API_URL` / `VITE_BASE_URL` | URL pública del backend (ej. `http://<IP-servidor>:4000/api`) |

> ⚠️ Las claves reales se entregan por **canal privado**, NO están en el repositorio.

### 3. Construir y levantar los contenedores

```bash
docker compose up -d --build
```

Docker Compose construirá ambas imágenes (backend con dependencias nativas de
`canvas`, fuentes DejaVu para gráficos, y frontend con Vite+Nginx) y las
iniciará en segundo plano.

### 4. Inicializar administradores y tendencia semanal

Solo la **primera vez**, ejecuta el script de inicialización:

```bash
docker compose exec backend node src/scripts/crearAdmin.js
```

Esto crea:
- 2 administradores predefinidos (Cristian Guerra y Julio Guallo)
- La tendencia semanal actual (rotará automáticamente cada lunes vía cron)

### 5. Verificar

```bash
docker compose ps
docker compose logs backend --tail 20
```

Debe aparecer en los logs:
```
✅ MongoDB Conectado: cluster-shard-XX.mongodb.net
🚀 Servidor corriendo en modo production en el puerto 4000
```

Accede al sistema:
- **Frontend:** `http://<IP-servidor>/`
- **API health:** `http://<IP-servidor>:4000/api/health`

---

## 🛠️ Comandos operativos

```bash
# Ver estado de los contenedores
docker compose ps

# Ver logs en vivo
docker compose logs -f backend

# Reiniciar solo un servicio
docker compose restart backend

# Detener todo
docker compose down

# Reconstruir tras cambios en el código
docker compose up -d --build

# Backup manual de MongoDB (si aplica)
docker compose exec backend node src/scripts/backup.js
```

---

## 🕐 Tareas programadas (cron internos)

El backend ejecuta 4 crons automáticos:

| Cron | Frecuencia | Función |
|---|---|---|
| Eventos/Encuestas | Cada hora | Actualiza estados de eventos programados |
| Tendencias | Lunes 00:05 | Rota la tendencia tecnológica semanal |
| Limpieza sin tesis | Diario 01:00 | Envía advertencias / elimina cuentas sin tesis verificada |
| Backup BD | 1 ene y 1 jul, 03:00 | Respaldo semestral de las colecciones |

---

## 🔐 Seguridad

- **Todas las credenciales** están en `.env` (nunca en el código).
- **`.env` está en `.gitignore`** — NO se sube al repositorio.
- **Cédula y teléfono** de graduados se encriptan en base de datos (`CRYPTO_SECRET`).
- **Contraseñas de admin/graduado** se hashean con bcrypt.
- **JWT** para autenticación de sesiones.

---

## 📁 Estructura del proyecto

```
.
├── backend/                    # API Node.js/Express
│   ├── src/
│   │   ├── controllers/        # Lógica de rutas
│   │   ├── models/             # Modelos Mongoose
│   │   ├── routes/             # Definición de endpoints
│   │   ├── services/           # Servicios (email, PDF, reportes)
│   │   ├── scripts/            # Scripts de inicialización
│   │   ├── assets/             # Logos institucionales
│   │   └── app.js              # Punto de entrada
│   └── package.json
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── pages/              # Páginas
│   │   ├── components/         # Componentes reutilizables
│   │   └── utils/              # Utilidades
│   └── package.json
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
├── nginx.conf
├── .env.example                # Plantilla de variables
└── README-DESPLIEGUE.md        # Este documento
```

---

## 📞 Contacto

**Autor:** Jhostin Quispe
**Correo:** jhostin.quispe@espoch.edu.ec
**Director de tesis:** Ing. Cristian García — BI-Data, ESPOCH
**Repositorio:** https://github.com/JQCRAK/tesis-espoch-oferta-servicios
