// frontend/src/pages/docs/docsTecnicoData.js
// Contenido del Manual Técnico — arquitectura, base de datos, API, seguridad y
// despliegue del Portal de Graduados ESPOCH. Dirigido al equipo técnico.

export const categoriasTecnico = [
    {
        id: 'arquitectura',
        icono: '🏗️',
        titulo: 'Arquitectura',
        articulos: ['t-vision-general', 't-tecnologias', 't-estructura'],
    },
    {
        id: 'basedatos',
        icono: '🗄️',
        titulo: 'Base de datos',
        articulos: ['t-colecciones'],
    },
    {
        id: 'api',
        icono: '🔌',
        titulo: 'API REST',
        articulos: ['t-endpoints'],
    },
    {
        id: 'despliegue',
        icono: '⚙️',
        titulo: 'Despliegue y mantenimiento',
        articulos: ['t-instalacion', 't-variables-entorno', 't-cron', 't-comandos', 't-problemas'],
    },
    {
        id: 'seguridad',
        icono: '🔐',
        titulo: 'Seguridad',
        articulos: ['t-autenticacion', 't-protecciones'],
    },
];

export const articulosTecnico = {

    // ═══════════════ ARQUITECTURA ═══════════════
    't-vision-general': {
        titulo: 'Visión general de la arquitectura',
        resumen: 'Cómo están organizados los contenedores y cómo se comunican entre sí.',
        bloques: [
            { t: 'p', c: 'El sistema sigue una arquitectura cliente-servidor contenerizada íntegramente con <strong>Docker Compose</strong>, sin depender de servicios de nube externos para su funcionamiento base. Todo corre en el mismo host: la base de datos, la API y el frontend.' },
            { t: 'table', head: ['Contenedor', 'Tecnología', 'Puerto interno', 'Puerto publicado'], rows: [
                ['portal_graduados_frontend', 'React 19 + Vite + Nginx', '80', '8350'],
                ['portal_graduados_backend', 'Node.js 18 + Express 5', '8351', '8351'],
                ['portal_graduados_mongo', 'MongoDB 7', '27017', '— (solo red interna)'],
            ] },
            { t: 'p', c: 'El contenedor de MongoDB <strong>no publica puerto al host</strong> por seguridad: solo es accesible desde el contenedor del backend a través de la red interna <code>portal_net</code> de Docker, usando el nombre de servicio <code>mongo</code> como host.' },
            { t: 'h3', c: 'Persistencia' },
            { t: 'list', items: [
                '<strong>mongo_data:</strong> volumen con los datos de MongoDB.',
                '<strong>backend_uploads:</strong> volumen con fotos de perfil, imágenes de proyectos/certificados, noticias y eventos (almacenamiento local en disco, no Cloudinary ni otro CDN).',
                '<strong>backend_backups:</strong> volumen con los respaldos automáticos generados por el cron de backup.',
            ] },
            { t: 'p', c: 'Estos tres volúmenes sobreviven a <code>docker compose down</code> y a la reconstrucción de imágenes — solo se pierden si se eliminan explícitamente con <code>docker compose down -v</code>.' },
        ],
    },

    't-tecnologias': {
        titulo: 'Tecnologías utilizadas',
        resumen: 'Librerías y frameworks reales del backend y el frontend, con su propósito.',
        bloques: [
            { t: 'h3', c: 'Backend (Node.js 18 en el contenedor, Express 5)' },
            { t: 'table', head: ['Tecnología', 'Propósito'], rows: [
                ['Express 5', 'Framework HTTP para la API REST.'],
                ['Mongoose 9', 'ODM para MongoDB.'],
                ['jsonwebtoken', 'Autenticación por JWT (sesiones de 30 días).'],
                ['bcryptjs', 'Hasheo de contraseñas.'],
                ['multer', 'Manejo de subida de archivos (almacenamiento en disco local).'],
                ['pdfkit', 'Generación de la Hoja de Vida en PDF.'],
                ['docx', 'Generación de la Hoja de Vida en Word.'],
                ['tesseract.js', 'OCR de la cédula en el registro Flujo B.'],
                ['resend', 'Envío de correos transaccionales.'],
                ['node-cron', 'Tareas programadas (4 cron jobs internos).'],
                ['chartjs-node-canvas + chart.js', 'Gráficos renderizados en el servidor para reportes.'],
                ['csv-parse / exceljs', 'Importación y exportación de graduados/empleadores en CSV y Excel.'],
                ['Módulo propio en utils/nlp/', 'Clasificación de tecnologías, cálculo de especialidades con TF-IDF y detección de habilidades blandas, implementado a medida (sin librerías NLP de terceros).'],
            ] },
            { t: 'h3', c: 'Frontend (React 19 + Vite 7)' },
            { t: 'table', head: ['Tecnología', 'Propósito'], rows: [
                ['React 19 + React Router 7', 'Interfaz y enrutamiento de la SPA.'],
                ['Axios', 'Cliente HTTP hacia la API.'],
                ['Recharts', 'Gráficos interactivos en los paneles de estadísticas.'],
                ['Leaflet + react-leaflet', 'Mapa interactivo de provincias del Ecuador.'],
                ['react-icons', 'Íconos de toda la interfaz.'],
                ['crypto-js', 'Cifrado AES del token de sesión guardado en localStorage.'],
                ['jsPDF + jspdf-autotable', 'Generación de reportes (Anexo 25, Anexo 19) directamente en el navegador.'],
                ['xlsx', 'Exportación de reportes e importación de graduados/empleadores en Excel.'],
            ] },
            { t: 'p', c: 'Los estilos de toda la interfaz están escritos como objetos de estilo en línea de React (no se usa ningún framework de CSS como TailwindCSS o Bootstrap), con una paleta y tipografía institucional (Rotis, rojo ESPOCH <code>#BC0613</code>) compartida entre archivos.' },
        ],
    },

    't-estructura': {
        titulo: 'Estructura del repositorio',
        resumen: 'Organización de carpetas del backend y el frontend.',
        bloques: [
            { t: 'code', c: `.
├── backend/
│   └── src/
│       ├── controllers/   # Lógica de cada dominio (auth, perfil, admin, encuesta...)
│       ├── models/        # Esquemas Mongoose
│       ├── routes/        # Definición de endpoints
│       ├── services/      # Correo, generación de Hoja de Vida, reportes
│       ├── middleware/     # auth.js (JWT), upload.js (multer)
│       ├── utils/nlp/     # Clasificación de tecnologías / especialidades / soft skills
│       ├── scripts/       # crearAdmin.js
│       ├── assets/        # Logos institucionales (Hoja de Vida)
│       └── app.js         # Punto de entrada + cron jobs
├── frontend/
│   └── src/
│       ├── pages/         # Público, graduado/, admin/, docs/
│       ├── components/    # Componentes reutilizables
│       └── utils/         # storageSeguro.js, useInactivityTimeout.js
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
├── nginx.conf
└── .env` },
            { t: 'p', c: 'Dentro de <code>pages/</code>, el frontend separa claramente las tres audiencias: páginas públicas sueltas, <code>pages/graduado/</code> para el panel autenticado del graduado y <code>pages/admin/</code> para el panel de administración. La carpeta <code>pages/docs/</code> contiene esta misma Guía de Usuario que estás leyendo.' },
        ],
    },

    // ═══════════════ BASE DE DATOS ═══════════════
    't-colecciones': {
        titulo: 'Colecciones de la base de datos',
        resumen: 'Modelos Mongoose reales y su propósito.',
        bloques: [
            { t: 'p', c: 'La base de datos es MongoDB 7, corriendo en un contenedor local propio (no en MongoDB Atlas). A continuación, las colecciones principales tal como están definidas en <code>backend/src/models/</code>.' },
            { t: 'table', head: ['Colección', 'Modelo', 'Contenido'], rows: [
                ['graduados', 'Graduado.js', 'Datos personales, contacto, perfil profesional, proyectos, certificados, experiencia laboral, educación formal, tecnologías/especialidades detectadas, estado de verificación de tesis.'],
                ['admins', 'Admin.js', 'Cuentas de administrador (creadas solo por script).'],
                ['empleadors', 'Empleador.js', 'Empresas registradas para encuestas de seguimiento.'],
                ['encuestas', 'Encuesta.js', 'Metadatos de cada encuesta: tipo (graduados/empleadores), fechas, estado, años de graduación dirigidos.'],
                ['preguntas', 'Pregunta.js', 'Preguntas de cada encuesta: tipo, opciones, modo matriz, lógica condicional.'],
                ['respuestaencuestas / respuestaempleadors', 'RespuestaEncuesta.js / RespuestaEmpleador.js', 'Respuestas enviadas, una por graduado/empleador y encuesta.'],
                ['proyectos / certificados', 'Proyecto.js / Certificado.js', 'Portafolio del graduado (máx. 5 cada uno).'],
                ['tesis', 'Tesis.js', 'Registro de la verificación de tesis en el repositorio DSpace de la ESPOCH.'],
                ['eventos / noticias', 'Evento.js / Noticia.js', 'Contenido publicado por el administrador para graduados y visitantes.'],
                ['notificaciones / notificacionadmins', 'Notificacion.js / NotificacionAdmin.js', 'Notificaciones del graduado (contacto de empresas) y del administrador (alertas del sistema, backups).'],
                ['tendenciasemanals', 'TendenciaSemanal.js', 'Tendencia tecnológica rotada cada semana para el panel principal.'],
                ['auditorialogs', 'Auditoria.js', 'Bitácora de acciones sensibles (creadas también por los cron jobs del sistema).'],
                ['verificacionpendientes', 'VerificacionPendiente.js', 'Estado intermedio del registro Flujo A mientras se confirma el código enviado por correo.'],
            ] },
            { t: 'h3', c: 'Campos sensibles cifrados' },
            { t: 'p', c: 'Los campos <code>cedula</code> y <code>telefono</code> de la colección <code>graduados</code> se almacenan cifrados con AES-256-CBC (ver <a href="/documentacion/tecnico/t-protecciones" style="color:#BC0613;font-weight:700;">Protecciones implementadas</a>), no en texto plano.' },
        ],
    },

    // ═══════════════ API REST ═══════════════
    't-endpoints': {
        titulo: 'Referencia de endpoints',
        resumen: 'Rutas reales montadas en backend/src/app.js, agrupadas por dominio.',
        bloques: [
            { t: 'p', c: 'Todas las rutas cuelgan de la base <code>/api</code> y devuelven JSON. Las rutas protegidas requieren la cabecera <code>Authorization: Bearer &lt;token&gt;</code>.' },
            { t: 'table', head: ['Base', 'Archivo de rutas', 'Para qué sirve'], rows: [
                ['/api/auth', 'authRoutes.js', 'Login de graduado y admin, registro Flujo A/B, recuperación de contraseña.'],
                ['/api/perfil', 'perfilRoutes.js', 'Perfil del graduado autenticado: datos, foto, hoja de vida.'],
                ['/api/proyectos', 'proyectoRoutes.js', 'CRUD de proyectos del graduado.'],
                ['/api/certificados', 'certificadoRoutes.js', 'CRUD de certificados del graduado.'],
                ['/api/tesis', 'tesisRoutes.js', 'Verificación de tesis contra el DSpace de la ESPOCH.'],
                ['/api/publico', 'publicoRoutes.js', 'Directorio público de graduados, perfiles, noticias, eventos, contadores de portada.'],
                ['/api/admin', 'adminRoutes.js', 'CRUD de graduados y empleadores, importación CSV, estadísticas.'],
                ['/api (encuestas)', 'encuestaRoutes.js', 'CRUD de encuestas y preguntas, respuestas de graduados y empleadores.'],
                ['/api (eventos/noticias)', 'eventoNoticiaRoutes.js', 'CRUD de eventos y noticias.'],
                ['/api (tendencia)', 'tendenciaRoutes.js', 'Tendencia tecnológica semanal.'],
                ['/api/admin/notificaciones', 'notificacionAdminRoutes.js', 'Notificaciones internas del panel de administración.'],
                ['/api/admin/reportes', 'reporteRoutes.js', 'Datos fuente para los reportes Anexo 19 y Anexo 25.'],
                ['/api/empleador', 'empleadorPublicoRoutes.js', 'Acceso del empleador a su encuesta mediante enlace único, sin cuenta.'],
                ['/api/health', 'app.js', 'Health check usado por Docker para verificar que el contenedor está sano.'],
            ] },
        ],
    },

    // ═══════════════ DESPLIEGUE ═══════════════
    't-instalacion': {
        titulo: 'Instalación con Docker Compose',
        resumen: 'Pasos para levantar el sistema desde cero en un servidor nuevo.',
        bloques: [
            { t: 'code', c: `# 1. Clonar el repositorio
git clone <url-del-repositorio> portal-graduados
cd portal-graduados

# 2. Configurar variables de entorno
cp .env.example .env
nano .env   # completar MONGO_URI interno, JWT_SECRET, CRYPTO_SECRET, RESEND_API_KEY...

# 3. Construir y levantar los 3 contenedores
docker compose up -d --build

# 4. Crear el primer administrador
docker compose exec backend node src/scripts/crearAdmin.js` },
            { t: 'p', c: 'A diferencia de un despliegue en la nube, <code>MONGO_URI</code> apunta al servicio interno de Docker (<code>mongodb://mongo:27017/...</code>), no a un clúster externo — Mongo corre en su propio contenedor dentro del mismo <code>docker-compose.yml</code>.' },
            { t: 'h3', c: 'Verificación' },
            { t: 'list', items: [
                '<code>docker compose ps</code> — los 3 contenedores deben figurar como "healthy" o "running".',
                '<code>docker compose logs backend --tail 20</code> — debe mostrarse "Servidor corriendo... en el puerto 8351" y la lista de crons activos.',
                'Frontend: <code>http://&lt;IP-servidor&gt;:8350</code>',
                'Health de la API: <code>http://&lt;IP-servidor&gt;:8351/api/health</code>',
            ] },
        ],
    },

    't-variables-entorno': {
        titulo: 'Variables de entorno',
        resumen: 'Variables obligatorias del archivo .env, cargadas en ambos contenedores con env_file.',
        bloques: [
            { t: 'table', head: ['Variable', 'Descripción'], rows: [
                ['MONGO_URI', 'Cadena de conexión al contenedor interno de MongoDB.'],
                ['JWT_SECRET', 'Clave para firmar los tokens de sesión (JWT válido por 30 días).'],
                ['CRYPTO_SECRET', 'Clave hexadecimal de exactamente 32 caracteres para cifrar cédula y teléfono con AES-256-CBC.'],
                ['RESEND_API_KEY', 'API Key del servicio Resend para el envío de correos transaccionales.'],
                ['VITE_API_URL, VITE_BASE_URL', 'URLs públicas del backend, usadas en tiempo de build del frontend (Vite las incrusta en el bundle).'],
            ] },
            { t: 'p', c: 'El <code>docker-compose.yml</code> usa la directiva <code>env_file: - .env</code> en los servicios <code>backend</code> y <code>frontend</code>, por lo que cualquier variable nueva agregada al <code>.env</code> llega automáticamente al contenedor sin tener que editar el <code>docker-compose.yml</code>.' },
            { t: 'p', c: 'El archivo <code>.env</code> está en <code>.gitignore</code> y nunca se sube al repositorio; solo queda versionado un <code>.env.example</code> con los nombres de las variables sin valores reales.' },
        ],
    },

    't-cron': {
        titulo: 'Tareas automáticas (cron jobs)',
        resumen: 'Las 4 tareas programadas que corren dentro del propio contenedor backend con node-cron.',
        bloques: [
            { t: 'table', head: ['Tarea', 'Horario', 'Qué hace'], rows: [
                ['Eventos y Encuestas', 'Cada hora en punto', 'Actualiza automáticamente el estado de eventos (programado → en curso → finalizado) y cierra encuestas cuya fecha de cierre ya pasó.'],
                ['Rotación de tendencia', 'Lunes 00:05', 'Rota la tendencia tecnológica que se muestra en el panel principal.'],
                ['Limpieza sin tesis', 'Diario 01:00', 'A los 548 días (~18 meses) sin verificar tesis envía un correo de advertencia; 30 días después de la advertencia, elimina la cuenta y sus archivos (foto, proyectos, certificados) en cascada.'],
                ['Backup de base de datos', '1 de enero y 1 de julio, 03:00', 'Exporta las colecciones principales a un archivo JSON comprimido (<code>.gz</code>) dentro del volumen <code>backend_backups</code>, con retención de 6 años, y notifica al panel de administración si el backup resulta sospechosamente más pequeño que el anterior (posible pérdida de datos).'],
            ] },
            { t: 'p', c: 'Los 4 crons usan la zona horaria <code>America/Guayaquil</code> y están definidos directamente en <code>backend/src/app.js</code> con la librería <code>node-cron</code> — no requieren configuración externa (como cron del sistema operativo) porque corren dentro del propio proceso Node.' },
        ],
    },

    't-comandos': {
        titulo: 'Comandos operativos',
        resumen: 'Comandos de uso frecuente para operar el sistema en producción.',
        bloques: [
            { t: 'code', c: `# Ver estado de los contenedores
docker compose ps

# Ver logs en vivo de un servicio
docker compose logs -f backend

# Reiniciar solo un servicio
docker compose restart backend

# Detener todo (conserva los volúmenes/datos)
docker compose down

# Reconstruir tras cambios en el código
docker compose up -d --build

# Backup manual (fuera del horario automático)
docker compose exec backend node -e "require('./src/app.js')"  # dispara el cron manualmente si se expone como script` },
            { t: 'p', c: 'Para actualizar el sistema a una nueva versión del código:' },
            { t: 'code', c: `cd /ruta/al/proyecto
git pull origin main
docker compose up -d --build` },
            { t: 'p', c: 'Docker reconstruye únicamente las capas afectadas por los cambios, por lo que las actualizaciones posteriores a la primera instalación son considerablemente más rápidas.' },
        ],
    },

    't-problemas': {
        titulo: 'Solución de problemas comunes',
        resumen: 'Síntomas frecuentes, su causa probable y cómo resolverlos.',
        bloques: [
            { t: 'table', head: ['Síntoma', 'Causa probable', 'Solución'], rows: [
                ['El backend no conecta a MongoDB', 'El contenedor <code>mongo</code> no terminó su healthcheck antes de que arrancara el backend.', 'Docker Compose ya define <code>depends_on: mongo: condition: service_healthy</code> — revisar <code>docker compose logs mongo</code> si el problema persiste.'],
                ['PDFs con cuadros vacíos en lugar de tildes', 'Faltan las fuentes DejaVu en la imagen del backend.', 'Reconstruir la imagen: <code>docker compose up -d --build backend</code>.'],
                ['Las fotos/imágenes no se ven tras reiniciar el contenedor', 'El volumen <code>backend_uploads</code> no está montado o se eliminó por error.', 'Verificar en <code>docker-compose.yml</code> que el volumen siga declarado y no se haya ejecutado <code>docker compose down -v</code>.'],
                ['Correos no llegan', 'API Key de Resend inválida o dominio remitente no verificado.', 'Revisar <code>RESEND_API_KEY</code> en el <code>.env</code> y el estado del dominio en el panel de Resend.'],
                ['Login falla con 401 tras una actualización', 'Cambió <code>JWT_SECRET</code> entre despliegues.', 'Comportamiento esperado — todos los usuarios deben volver a iniciar sesión.'],
                ['Una cuenta de graduado quedó bloqueada', 'Alcanzó 5 intentos fallidos de contraseña.', 'El bloqueo se levanta solo a los 30 minutos; no requiere intervención del administrador.'],
            ] },
        ],
    },

    // ═══════════════ SEGURIDAD ═══════════════
    't-autenticacion': {
        titulo: 'Autenticación y sesiones',
        resumen: 'Cómo funcionan los tres tipos de sesión del sistema.',
        bloques: [
            { t: 'p', c: 'El sistema distingue tres tipos de acceso, todos basados en <strong>JSON Web Tokens (JWT)</strong> firmados con <code>JWT_SECRET</code>:' },
            { t: 'list', items: [
                '<strong>Administrador:</strong> cuenta creada únicamente mediante el script <code>crearAdmin.js</code> — no existe registro público de administradores.',
                '<strong>Graduado:</strong> se registra por dos flujos — correo institucional con código de verificación, u OCR de cédula + verificación de tesis en el DSpace de la ESPOCH.',
                '<strong>Empleador:</strong> no requiere cuenta ni contraseña. Accede a su encuesta mediante un enlace único con token, enviado por correo cuando el administrador la notifica.',
            ] },
            { t: 'p', c: 'El token emitido al iniciar sesión tiene una vigencia de <strong>30 días</strong>. El middleware <code>protegerRuta</code> (en <code>backend/src/middleware/auth.js</code>) valida la firma del token en cada petición protegida; el helper <code>soloRol</code> adicionalmente exige que el rol del token coincida con el requerido por el endpoint.' },
            { t: 'h3', c: 'En el navegador' },
            { t: 'p', c: 'El frontend nunca guarda el JWT en texto plano. Lo cifra con AES (librería <code>crypto-js</code>) antes de guardarlo en <code>localStorage</code>, y lo descifra al leerlo (ver <code>frontend/src/utils/storageSeguro.js</code>). Además, tanto el panel del graduado como el del administrador cierran la sesión automáticamente tras <strong>15 minutos de inactividad</strong> (con una advertencia emergente 30 segundos antes).' },
        ],
    },

    't-protecciones': {
        titulo: 'Protecciones implementadas',
        resumen: 'Cifrado de datos, cabeceras de seguridad y defensa contra fuerza bruta.',
        bloques: [
            { t: 'h3', c: 'Cifrado de datos sensibles' },
            { t: 'p', c: 'Los campos <code>cedula</code> y <code>telefono</code> del graduado se cifran con <strong>AES-256-CBC</strong> usando la clave <code>CRYPTO_SECRET</code> (exactamente 32 caracteres), mediante el helper <code>backend/src/utils/cryptoHelper.js</code>. Para buscar duplicados sin desencriptar toda la colección, el sistema guarda además un hash SHA-256 de cada valor (<code>cedulaHash</code>, <code>telefonoHash</code>).' },
            { t: 'p', c: 'Las contraseñas se hashean con <strong>bcrypt</strong> antes de guardarse — nunca se almacenan ni se pueden recuperar en texto plano.' },
            { t: 'h3', c: 'Cabeceras HTTP' },
            { t: 'p', c: 'El backend agrega manualmente las cabeceras <code>X-Content-Type-Options: nosniff</code>, <code>X-Frame-Options: DENY</code> y una protección XSS básica a toda respuesta, mediante un middleware propio en <code>app.js</code> (sin depender de la librería <code>helmet</code>).' },
            { t: 'h3', c: 'Defensa contra fuerza bruta' },
            { t: 'p', c: 'El login de graduado implementa bloqueo <strong>por cuenta</strong> (no por IP): tras <strong>5 intentos fallidos</strong>, la cuenta queda bloqueada durante <strong>30 minutos</strong>. El contador y la hora de desbloqueo se guardan directamente en el documento del graduado (campo <code>intentosFallidos</code>) y se reinician automáticamente al iniciar sesión con éxito.' },
            { t: 'h3', c: 'Registro de auditoría' },
            { t: 'p', c: 'Las acciones automáticas sensibles del sistema (advertencias y eliminaciones por falta de tesis, resultados de los backups) quedan registradas en la colección <code>auditorialogs</code> (modelo <code>Auditoria.js</code>), con usuario, acción, módulo y descripción de cada evento.' },
        ],
    },
};
