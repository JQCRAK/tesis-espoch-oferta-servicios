# Portal de Graduados — Carrera de Software, ESPOCH

Plataforma web para el **seguimiento y la vinculación de los graduados** de la Carrera
de Software de la Escuela Superior Politécnica de Chimborazo (ESPOCH). Permite a los
graduados construir un perfil profesional verificable, y a la carrera y a los
empleadores conocer su trayectoria, especialidades y disponibilidad.

Proyecto de titulación de **Jhostin Quispe**.

---

## ✨ Funcionalidades

**Graduados**
- Registro con verificación de correo por código y validación de datos.
- Verificación de la tesis en el repositorio institucional de la ESPOCH, requisito
  para publicar el perfil.
- Perfil profesional: descripción, ubicación, disponibilidad laboral, redes,
  proyectos, certificados, experiencia laboral y educación formal.
- Detección automática de **especialidades, tecnologías y habilidades blandas** a
  partir de los proyectos y certificados.
- Hoja de vida generada en **PDF y Word**.
- Encuestas, noticias y eventos de la carrera.

**Administración**
- Gestión de graduados y empleadores, con carga masiva desde CSV.
- Gestión de encuestas, eventos y noticias, con notificaciones por correo.
- Estadísticas e indicadores (incluye mapas), reportes e informes institucionales
  (Anexo 19).
- Tendencia tecnológica semanal y notificaciones al administrador.

**Público y empleadores**
- Directorio de perfiles profesionales, proyectos y noticias.
- Contacto de empleadores con graduados.

**Automatizaciones:** actualización de eventos y encuestas, tendencias semanales,
limpieza de cuentas sin tesis verificada y respaldos semestrales de la base de datos.

---

## 🧰 Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite, servido con Nginx |
| Backend | Node.js + Express |
| Base de datos | MongoDB (local, en contenedor) |
| Correo | Resend (único servicio externo) |
| Despliegue | Docker y Docker Compose |

Todo corre **de forma local** en el servidor. Las imágenes subidas y la base de datos
se guardan en volúmenes de Docker.

---

## 🚀 Despliegue rápido

Requiere Docker y Docker Compose. Desde la carpeta `Tesis_ESPOCH_OfertaServicios`:

```bash
cp .env.example .env        # completar JWT_SECRET, CRYPTO_SECRET, RESEND_API_KEY, URLs
docker compose up -d --build
docker compose exec backend node src/scripts/crearAdmin.js   # solo la primera vez
```

| Servicio | Puerto |
|---|---|
| Portal (frontend) | `8350` |
| API (backend) | `8351` |

📖 **Guía completa** (configuración, respaldos, actualización y solución de
problemas): [`Tesis_ESPOCH_OfertaServicios/README-DESPLIEGUE.md`](Tesis_ESPOCH_OfertaServicios/README-DESPLIEGUE.md)

> Las credenciales reales (`.env`) no están en el repositorio; se entregan por canal privado.

---

## 📁 Organización del repositorio

```
.
└── Tesis_ESPOCH_OfertaServicios/
    ├── backend/                 # API Node.js/Express
    ├── frontend/                # Aplicación React
    ├── docker-compose.yml       # frontend + backend + mongo
    ├── .env.example             # Plantilla de variables de entorno
    └── README-DESPLIEGUE.md     # Guía de despliegue
```

---

## 📞 Contacto

**Autor:** Jhostin Quispe — jhostin.quispe@espoch.edu.ec
**Director de tesis:** Ing. Cristian García — BI-Data, ESPOCH
