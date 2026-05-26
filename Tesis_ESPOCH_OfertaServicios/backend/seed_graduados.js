/**
 * ═══════════════════════════════════════════════════════════
 * SEED SCRIPT — 50 Graduados de prueba para dashboard
 * Carrera de Software · ESPOCH
 *
 * INSTRUCCIONES:
 *   1. Copia este archivo en la raíz de tu backend (junto a package.json)
 *   2. Asegúrate de tener en .env:  MONGO_URI=...  y  CRYPTO_KEY=...
 *   3. Ejecuta:  node seed_graduados_50.js
 *   4. Verás en consola cuántos registros se crearon
 *
 * LIMPIEZA (opcional):
 *   Si quieres borrar todos los seeds antes de volver a correrlo,
 *   cambia LIMPIAR_ANTES = true
 *
 * CONTRASEÑA DE TODOS LOS GRADUADOS: Juan123.
 * ═══════════════════════════════════════════════════════════
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Modelos ────────────────────────────────────────────────
const Graduado    = require('./src/models/Graduado');
const Proyecto    = require('./src/models/Proyecto');
const Certificado = require('./src/models/Certificado');
const Tesis       = require('./src/models/Tesis');

// ── Config ─────────────────────────────────────────────────
const LIMPIAR_ANTES = false;
const PASSWORD_SEED = 'Juan123.';

// ── Crypto helper ──────────────────────────────────────────
let encriptar, hashParaBusqueda;
try {
    const crypto = require('./src/utils/cryptoHelper');
    encriptar        = crypto.encriptar;
    hashParaBusqueda = crypto.hashParaBusqueda;
} catch {
    const CryptoJS = require('crypto-js');
    const KEY      = process.env.CRYPTO_KEY || 'clave_temporal_32_caracteres_ok!';
    encriptar        = (val) => CryptoJS.AES.encrypt(val, KEY).toString();
    hashParaBusqueda = (val) => require('crypto').createHash('sha256').update(val.toLowerCase()).digest('hex');
}

// ══════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════

const elegirAleatorio = (arr) => arr[Math.floor(Math.random() * arr.length)];

const calcularAfinidades = (proyectos) => {
    const conteo = {};
    proyectos.forEach(p => { if (p.categoria) conteo[p.categoria] = (conteo[p.categoria] || 0) + 1; });
    const total = Object.values(conteo).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    return Object.entries(conteo)
        .map(([categoria, puntos]) => ({ categoria, puntos, porcentaje: Math.round((puntos / total) * 100) }))
        .sort((a, b) => b.puntos - a.puntos);
};

const extraerTecnologias = (proyectos) => {
    const set = new Set();
    proyectos.forEach(p => p.tecnologias.forEach(t => set.add(t)));
    return [...set].slice(0, 15);
};

const HABILIDADES_BLANDAS_POOL = [
    'Trabajo en equipo', 'Comunicación efectiva', 'Resolución de problemas',
    'Liderazgo', 'Adaptabilidad', 'Pensamiento crítico', 'Gestión del tiempo',
    'Creatividad', 'Orientación a resultados', 'Aprendizaje continuo',
    'Inteligencia emocional', 'Proactividad', 'Empatía', 'Negociación',
];

const asignarHabilidades = () => {
    const cantidad  = 3 + Math.floor(Math.random() * 4);
    const shuffled  = [...HABILIDADES_BLANDAS_POOL].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, cantidad);
};

// ══════════════════════════════════════════════════════════
// DATOS — 50 GRADUADOS
// Especialidades distribuidas:
//   Desarrollo Web         (12 graduados)
//   Bases de Datos         ( 8 graduados)
//   Redes / Infraestructura( 8 graduados)
//   Aplicaciones Móviles   ( 8 graduados)
//   Inteligencia Artificial( 7 graduados)
//   Ciberseguridad         ( 4 graduados)
//   DevOps / Cloud         ( 3 graduados)
// ══════════════════════════════════════════════════════════

const GRADUADOS_DATA = [

    // ─────────────────────────────────────────────────────
    // BLOQUE 1 — DESARROLLO WEB (12)
    // ─────────────────────────────────────────────────────
    {
        nombres: 'Carlos Andrés', apellidos: 'Romero Vásquez',
        cedula: '0601234567', telefono: '0987654321',
        genero: 'Masculino', fechaNacimiento: new Date('1998-03-15'),
        emailInstitucional: 'caromero@espoch.edu.ec',
        emailPersonal: 'carlos.romero.dev@gmail.com',
        bio: 'Desarrollador fullstack con experiencia en aplicaciones web escalables. Apasionado por las arquitecturas limpias y las buenas prácticas de código. Busco oportunidades para crecer en equipos ágiles.',
        disponibilidad: 'disponible', anioGraduacion: 2022,
        provincia: 'Chimborazo', canton: 'Riobamba',
        github: 'https://github.com/caromero-dev', linkedin: 'https://linkedin.com/in/carlos-romero-dev',
        proyectos: [
            { titulo: 'Sistema de gestión académica ESPOCH', descripcion: 'Desarrollé en equipo de 3 personas un sistema web para gestión de notas y asistencia usando React y Node.js con MongoDB. Resolvimos el problema de reportes tardíos reduciendo el tiempo de generación en un 70%. El sistema está en producción con 500 usuarios activos.', tecnologias: ['React', 'Node.js', 'MongoDB', 'Express', 'JWT'], categoria: 'Desarrollo Web', anio: 2022, urlRepo: 'https://github.com/caromero-dev/gestion-academica' },
            { titulo: 'API REST para tienda de artesanías', descripcion: 'Backend completo para e-commerce de artesanías ecuatorianas con autenticación JWT y pasarela de pagos PayPhone. La tienda procesa alrededor de 200 pedidos mensuales.', tecnologias: ['Node.js', 'Express', 'PostgreSQL', 'JWT', 'PayPhone API'], categoria: 'Desarrollo Web', anio: 2023, urlRepo: '' },
            { titulo: 'Portal de noticias universitarias', descripcion: 'Portal web dinámico con CMS propio para la facultad de informática. Permite publicar noticias, eventos y convocatorias. Reducción del 80% en tiempo de publicación comparado con el sistema anterior.', tecnologias: ['React', 'Node.js', 'MongoDB', 'Cloudinary', 'TailwindCSS'], categoria: 'Desarrollo Web', anio: 2021, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'React Developer Certificado por Meta', institucion: 'Coursera', anio: 2022, descripcion: 'Completé 6 cursos sobre React, hooks, context API y testing. Obtuve el certificado profesional de Meta con calificación de 95%.' },
            { titulo: 'Node.js API Design Masterclass', institucion: 'Udemy', anio: 2021, descripcion: 'Curso de 40 horas sobre diseño de APIs REST con Node.js, Express y MongoDB.' },
        ],
        tituloTesis: 'Sistema web para la gestión de prácticas preprofesionales de la Facultad de Informática y Electrónica de la ESPOCH',
    },
    {
        nombres: 'Paola Estefanía', apellidos: 'Villacís Medina',
        cedula: '0608901234', telefono: '0910987654',
        genero: 'Femenino', fechaNacimiento: new Date('2000-08-11'),
        emailInstitucional: 'pevillacis@espoch.edu.ec',
        emailPersonal: 'paola.villacis.ux@gmail.com',
        bio: 'Desarrolladora frontend con especialización en experiencia de usuario. Creo interfaces accesibles y atractivas con React y Vue. Busco un equipo donde pueda combinar mi pasión por el diseño y la programación.',
        disponibilidad: 'disponible', anioGraduacion: 2024,
        provincia: 'Imbabura', canton: 'Ibarra',
        github: 'https://github.com/pvillacis-frontend', linkedin: 'https://linkedin.com/in/paola-villacis-ux',
        proyectos: [
            { titulo: 'Rediseño de portal web del GAD municipal de Ibarra', descripcion: 'Redesigné y desarrollé el portal web del municipio de Ibarra mejorando la accesibilidad. El nuevo portal redujo el tiempo que los ciudadanos tardaban en encontrar trámites en un 65%.', tecnologias: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Figma'], categoria: 'Desarrollo Web', anio: 2024, urlRepo: 'https://github.com/pvillacis-frontend/gad-ibarra' },
            { titulo: 'E-commerce para artesanos otavaleños', descripcion: 'E-commerce responsive con carrito, pasarela Stripe y panel de vendedor. Más de 150 artesanos venden sus productos actualmente.', tecnologias: ['Vue.js', 'Nuxt.js', 'Stripe', 'Tailwind CSS', 'Pinia'], categoria: 'Desarrollo Web', anio: 2023, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Google UX Design Professional Certificate', institucion: 'Google', anio: 2023, descripcion: 'Certificación de 7 cursos de Google sobre diseño UX, desde investigación hasta prototipado en Figma.' },
            { titulo: 'React y TypeScript avanzado', institucion: 'Udemy', anio: 2023, descripcion: 'Curso de 45 horas sobre React con TypeScript, hooks avanzados y Redux Toolkit.' },
        ],
        tituloTesis: 'Desarrollo de un sistema web accesible para la gestión de trámites ciudadanos del Gobierno Autónomo Descentralizado Municipal de Ibarra',
    },
    {
        nombres: 'Gabriela Mishell', apellidos: 'Tapia Núñez',
        cedula: '0610123456', telefono: '0898765432',
        genero: 'Femenino', fechaNacimiento: new Date('1999-01-07'),
        emailInstitucional: 'gmtapia@espoch.edu.ec',
        emailPersonal: 'gabi.tapia.dev@yahoo.com',
        bio: 'Desarrolladora web fullstack con pasión por el código limpio y las pruebas automatizadas. Creo aplicaciones robustas y mantenibles. Actualmente trabajando en startup de educación en línea.',
        disponibilidad: 'no_disponible', anioGraduacion: 2022,
        provincia: 'Cotopaxi', canton: 'Latacunga',
        github: 'https://github.com/gtapia-dev', linkedin: 'https://linkedin.com/in/gabriela-tapia-dev',
        proyectos: [
            { titulo: 'Plataforma LMS para PYMES ecuatorianas', descripcion: 'Sistema de gestión de aprendizaje con video streaming, quizzes y certificados digitales. 2000 estudiantes activos.', tecnologias: ['React', 'Node.js', 'PostgreSQL', 'AWS S3', 'Stripe', 'Redis'], categoria: 'Desarrollo Web', anio: 2022, urlRepo: 'https://github.com/gtapia-dev/lms-pymes' },
            { titulo: 'Testing automatizado para API bancaria', descripcion: 'Suite completa de pruebas automatizadas con 95% de cobertura de código. Detecté y resolví 23 bugs críticos antes del lanzamiento.', tecnologias: ['Jest', 'Postman', 'k6', 'Node.js', 'GitHub Actions', 'Docker'], categoria: 'Desarrollo Web', anio: 2023, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Full Stack MERN Completo', institucion: 'Udemy', anio: 2021, descripcion: 'Curso de 60 horas sobre MongoDB, Express, React y Node.js. Construí 5 proyectos completos.' },
            { titulo: 'Testing con Jest y Testing Library', institucion: 'Platzi', anio: 2022, descripcion: 'Pruebas unitarias, de integración y E2E para aplicaciones React con TDD.' },
        ],
        tituloTesis: 'Implementación de una plataforma de aprendizaje adaptativo basada en machine learning para personalización del contenido educativo',
    },
    {
        nombres: 'Daniela Sofía', apellidos: 'Vega Montesdeoca',
        cedula: '0614567890', telefono: '0854321098',
        genero: 'Femenino', fechaNacimiento: new Date('1999-11-20'),
        emailInstitucional: 'dsvega@espoch.edu.ec',
        emailPersonal: 'daniela.vega.web@gmail.com',
        bio: 'Desarrolladora web con experiencia en gestión de proyectos ágiles. Creo aplicaciones que combinan buen código con buenas prácticas de gestión. Certificada en Scrum.',
        disponibilidad: 'no_disponible', anioGraduacion: 2022,
        provincia: 'Guayas', canton: 'Guayaquil',
        github: 'https://github.com/dvega-web', linkedin: 'https://linkedin.com/in/daniela-vega-web',
        proyectos: [
            { titulo: 'Sistema de gestión de proyectos para constructoras', descripcion: 'App web de gestión de proyectos de construcción con seguimiento de avance, presupuesto y cronograma. Integración con catálogo de precios CAMICON. Usada por 3 constructoras en Guayaquil.', tecnologias: ['React', 'Node.js', 'PostgreSQL', 'Chart.js', 'Docker'], categoria: 'Desarrollo Web', anio: 2023, urlRepo: 'https://github.com/dvega-web/construccion-pm' },
            { titulo: 'Dashboard de métricas ágiles para equipos', descripcion: 'Herramienta de visualización de métricas de equipos ágiles con integración automática a Jira y GitHub. Usada por más de 20 equipos en Ecuador.', tecnologias: ['React', 'Python', 'FastAPI', 'Jira API', 'GitHub API', 'PostgreSQL'], categoria: 'Desarrollo Web', anio: 2023, urlRepo: 'https://github.com/dvega-web/agile-metrics' },
        ],
        certificados: [
            { titulo: 'Professional Scrum Master PSM I', institucion: 'LinkedIn Learning', anio: 2021, descripcion: 'Certificación PSM I de Scrum.org. Aprobé con 96% de calificación.' },
            { titulo: 'Full Stack con React y Node.js', institucion: 'Platzi', anio: 2022, descripcion: 'Ruta completa de desarrollo web con React, hooks, context y Node.js con Express.' },
        ],
        tituloTesis: 'Metodología para la implementación de marcos de trabajo ágiles en empresas de desarrollo de software de tamaño mediano en Ecuador',
    },
    {
        nombres: 'Camila Alejandra', apellidos: 'Ramos Suárez',
        cedula: '0612345678', telefono: '0876543210',
        genero: 'Femenino', fechaNacimiento: new Date('2001-06-28'),
        emailInstitucional: 'caramos@espoch.edu.ec',
        emailPersonal: 'camila.ramos.junior@gmail.com',
        bio: 'Recién graduada con proyectos sólidos en desarrollo web. Apasionada por el aprendizaje continuo y las nuevas tecnologías. Busco mi primera oportunidad como desarrolladora frontend o fullstack.',
        disponibilidad: 'disponible', anioGraduacion: 2024,
        provincia: 'El Oro', canton: 'Machala',
        github: 'https://github.com/cramos-dev', linkedin: 'https://linkedin.com/in/camila-ramos-dev',
        proyectos: [
            { titulo: 'Portal web para organización de eventos sociales', descripcion: 'App web para empresa organizadora de eventos en Machala. Desarrollé sola en 3 meses usando React y Firebase. Primera aplicación en producción independiente.', tecnologias: ['React', 'Firebase', 'Tailwind CSS', 'JavaScript', 'Figma'], categoria: 'Desarrollo Web', anio: 2023, urlRepo: 'https://github.com/cramos-dev/eventos-portal' },
            { titulo: 'Sistema de gestión de biblioteca universitaria', descripcion: 'Sistema de préstamos y catálogo para biblioteca de universidad privada en Machala. Implementado y en uso con 3000 estudiantes.', tecnologias: ['React', 'Node.js', 'MySQL', 'Express', 'Bootstrap', 'JWT'], categoria: 'Desarrollo Web', anio: 2024, urlRepo: 'https://github.com/cramos-dev/biblioteca-app' },
        ],
        certificados: [
            { titulo: 'Responsive Web Design freeCodeCamp', institucion: 'freeCodeCamp', anio: 2022, descripcion: 'Certificación sobre diseño web responsivo, HTML semántico, CSS flexbox, grid y animaciones.' },
            { titulo: 'JavaScript Algorithms and Data Structures', institucion: 'freeCodeCamp', anio: 2023, descripcion: 'Certificación sobre algoritmos y estructuras de datos en JavaScript con ES6.' },
        ],
        tituloTesis: 'Desarrollo de un sistema web para la gestión del proceso de préstamo y catalogación de recursos bibliográficos en instituciones de educación superior',
    },
    {
        nombres: 'Andrés Felipe', apellidos: 'Naranjo Chiriboga',
        cedula: '0615678901', telefono: '0843210987',
        genero: 'Masculino', fechaNacimiento: new Date('1996-07-04'),
        emailInstitucional: 'afnaranjo@espoch.edu.ec',
        emailPersonal: 'andres.naranjo.web@gmail.com',
        bio: 'Desarrollador fullstack con especialización en aplicaciones Web3 y React. Conferencista en temas de nuevas tecnologías web en universidades ecuatorianas.',
        disponibilidad: 'disponible', anioGraduacion: 2020,
        provincia: 'Manabí', canton: 'Portoviejo',
        github: 'https://github.com/anaranjo-dev', linkedin: 'https://linkedin.com/in/andres-naranjo-web',
        proyectos: [
            { titulo: 'Sistema de trazabilidad de cadena de suministro web', descripcion: 'Plataforma web para trazabilidad de productos agrícolas de exportación. Piloto con empresa bananera de Guayas que exporta a Europa. Cumple requisitos de trazabilidad de la UE.', tecnologias: ['React', 'Node.js', 'PostgreSQL', 'REST API', 'JWT', 'Docker'], categoria: 'Desarrollo Web', anio: 2021, urlRepo: 'https://github.com/anaranjo-dev/supply-chain' },
            { titulo: 'Marketplace de servicios freelance local', descripcion: 'Plataforma para conectar freelancers ecuatorianos con clientes. Sistema de calificaciones, portafolios y pagos. Más de 300 freelancers registrados en el primer mes de lanzamiento.', tecnologias: ['React', 'Node.js', 'MongoDB', 'Stripe', 'AWS S3', 'JWT'], categoria: 'Desarrollo Web', anio: 2022, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Full Stack JavaScript Developer', institucion: 'Coursera', anio: 2020, descripcion: 'Especialización completa en JavaScript fullstack, desde ES6 hasta Node.js y React.' },
            { titulo: 'AWS Cloud Practitioner', institucion: 'AWS', anio: 2021, descripcion: 'Certificación de fundamentos de servicios cloud de Amazon Web Services.' },
        ],
        tituloTesis: 'Desarrollo de una plataforma web para la certificación y verificación de títulos académicos en instituciones de educación superior del Ecuador',
    },
    {
        nombres: 'Héctor Iván', apellidos: 'Ponce Salazar',
        cedula: '0616789012', telefono: '0832109876',
        genero: 'Masculino', fechaNacimiento: new Date('1997-09-18'),
        emailInstitucional: 'hiponce@espoch.edu.ec',
        emailPersonal: 'hector.ponce.web@hotmail.com',
        bio: 'Desarrollador backend especializado en APIs de alto rendimiento y arquitectura REST. Apasionado por la optimización de código y bases de datos relacionales.',
        disponibilidad: 'disponible', anioGraduacion: 2021,
        provincia: 'Tungurahua', canton: 'Ambato',
        github: 'https://github.com/hiponce-backend', linkedin: 'https://linkedin.com/in/hector-ponce-dev',
        proyectos: [
            { titulo: 'API de pagos en línea para PYMES', descripcion: 'Backend robusto para gestión de cobros en línea, integrado con Datafast y PayPhone. Maneja más de 500 transacciones diarias con registro de auditoría completo.', tecnologias: ['Node.js', 'Express', 'PostgreSQL', 'JWT', 'PayPhone API', 'Datafast'], categoria: 'Desarrollo Web', anio: 2021, urlRepo: '' },
            { titulo: 'Sistema de reservas para hotel boutique', descripcion: 'Plataforma web completa de reservas con calendario de disponibilidad en tiempo real, sistema de pagos y panel de administración para el personal del hotel.', tecnologias: ['Vue.js', 'Laravel', 'MySQL', 'Stripe', 'Pusher', 'Redis'], categoria: 'Desarrollo Web', anio: 2022, urlRepo: 'https://github.com/hiponce-backend/hotel-reservas' },
        ],
        certificados: [
            { titulo: 'Laravel PHP Framework Avanzado', institucion: 'Udemy', anio: 2020, descripcion: 'Curso de 50 horas sobre Laravel 9, Eloquent ORM, autenticación, testing y despliegue.' },
            { titulo: 'Vue.js 3 Developer Certificado', institucion: 'Platzi', anio: 2021, descripcion: 'Ruta de aprendizaje de Vue.js 3 con Composition API, Vuex y Vue Router.' },
        ],
        tituloTesis: 'Desarrollo de un sistema web para la gestión de reservas y facturación electrónica en establecimientos de alojamiento turístico del cantón Ambato',
    },
    {
        nombres: 'Lorena Patricia', apellidos: 'Aguirre Calderón',
        cedula: '0617890123', telefono: '0821098765',
        genero: 'Femenino', fechaNacimiento: new Date('1999-04-02'),
        emailInstitucional: 'lpaguirre@espoch.edu.ec',
        emailPersonal: 'lorena.aguirre.fronted@gmail.com',
        bio: 'Frontend developer con enfoque en animaciones y experiencias web inmersivas. Me especializo en crear interfaces que combinan funcionalidad y estética.',
        disponibilidad: 'disponible', anioGraduacion: 2023,
        provincia: 'Pichincha', canton: 'Quito',
        github: 'https://github.com/lpaguirre-ui', linkedin: 'https://linkedin.com/in/lorena-aguirre-frontend',
        proyectos: [
            { titulo: 'Landing page animada para startup de tecnología', descripcion: 'Sitio web de alta conversión para startup fintech con animaciones GSAP y Three.js. Aumentó la tasa de registro en un 45% respecto a la versión anterior.', tecnologias: ['React', 'GSAP', 'Three.js', 'Tailwind CSS', 'Next.js', 'Framer Motion'], categoria: 'Desarrollo Web', anio: 2023, urlRepo: 'https://github.com/lpaguirre-ui/fintech-landing' },
            { titulo: 'Portal de empleo para profesionales tech', descripcion: 'Plataforma de empleo especializada en perfiles de tecnología en Ecuador. Matching automático entre candidatos y empresas. Más de 500 usuarios registrados en el primer mes.', tecnologias: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Algolia'], categoria: 'Desarrollo Web', anio: 2024, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Advanced CSS and SASS Animations', institucion: 'Udemy', anio: 2022, descripcion: 'Curso avanzado de CSS, SASS, animaciones, Flexbox y Grid. Técnicas de diseño responsivo moderno.' },
            { titulo: 'Next.js para aplicaciones React en producción', institucion: 'Platzi', anio: 2023, descripcion: 'Certificación sobre Next.js 13, App Router, Server Components y optimización de rendimiento.' },
        ],
        tituloTesis: 'Diseño e implementación de una plataforma web de bolsa de empleo especializada en perfiles tecnológicos para el mercado laboral ecuatoriano',
    },
    {
        nombres: 'Fernando José', apellidos: 'Yépez Borja',
        cedula: '0618901234', telefono: '0810987654',
        genero: 'Masculino', fechaNacimiento: new Date('1998-12-25'),
        emailInstitucional: 'fjyepez@espoch.edu.ec',
        emailPersonal: 'fernando.yepez.ecommerce@gmail.com',
        bio: 'Especialista en comercio electrónico y marketing digital. Desarrollo tiendas online de alto rendimiento y me especializo en optimización de conversión y SEO técnico.',
        disponibilidad: 'no_disponible', anioGraduacion: 2023,
        provincia: 'Pichincha', canton: 'Quito',
        github: 'https://github.com/fjyepez-ecom', linkedin: 'https://linkedin.com/in/fernando-yepez-ecommerce',
        proyectos: [
            { titulo: 'Marketplace multivendedor para artesanos ecuatorianos', descripcion: 'Plataforma e-commerce con múltiples vendedores, sistema de comisiones automáticas, pagos internacionales y envíos. Más de 200 vendedores y 5000 productos activos.', tecnologias: ['Next.js', 'Node.js', 'PostgreSQL', 'Stripe Connect', 'Redis', 'AWS S3'], categoria: 'Desarrollo Web', anio: 2023, urlRepo: '' },
            { titulo: 'Sistema de inventario omnicanal', descripcion: 'Software de gestión de inventario sincronizado entre tienda física, web y WhatsApp. Control en tiempo real de stock, alertas de quiebre y reportes automáticos.', tecnologias: ['React', 'Node.js', 'MongoDB', 'WhatsApp API', 'WebSockets', 'Chart.js'], categoria: 'Desarrollo Web', anio: 2022, urlRepo: 'https://github.com/fjyepez-ecom/inventario-omnicanal' },
        ],
        certificados: [
            { titulo: 'E-commerce con Shopify y Next.js', institucion: 'Udemy', anio: 2022, descripcion: 'Desarrollo de tiendas e-commerce de alto rendimiento con Next.js y Shopify Storefront API.' },
            { titulo: 'SEO Técnico para desarrolladores', institucion: 'LinkedIn Learning', anio: 2023, descripcion: 'Optimización técnica de sitios web para motores de búsqueda, Core Web Vitals y rendimiento.' },
        ],
        tituloTesis: 'Desarrollo de un sistema de comercio electrónico multivendedor para la comercialización de productos artesanales ecuatorianos en mercados internacionales',
    },
    {
        nombres: 'Mariana Isabel', apellidos: 'Calderón Pazos',
        cedula: '0619012345', telefono: '0809876543',
        genero: 'Femenino', fechaNacimiento: new Date('2000-10-15'),
        emailInstitucional: 'micalder@espoch.edu.ec',
        emailPersonal: 'mariana.calderon.web@gmail.com',
        bio: 'Desarrolladora web con enfoque en aplicaciones educativas y accesibilidad. Combino pedagogía y tecnología para crear herramientas de aprendizaje efectivas.',
        disponibilidad: 'disponible', anioGraduacion: 2025,
        provincia: 'Chimborazo', canton: 'Riobamba',
        github: 'https://github.com/mcalderon-edu', linkedin: 'https://linkedin.com/in/mariana-calderon-web',
        proyectos: [
            { titulo: 'Plataforma de tutorías universitarias en línea', descripcion: 'Aplicación web que conecta estudiantes con tutores de la ESPOCH. Sesiones en video con pizarra colaborativa, grabación automática y sistema de pagos. Más de 200 sesiones realizadas.', tecnologias: ['React', 'Node.js', 'WebRTC', 'Socket.io', 'MongoDB', 'Stripe'], categoria: 'Desarrollo Web', anio: 2025, urlRepo: 'https://github.com/mcalderon-edu/tutorias-espoch' },
            { titulo: 'App de gamificación para aprendizaje de programación', descripcion: 'Plataforma tipo Duolingo para aprender Python y JavaScript con desafíos, puntos, badges y ranking. Pilotada con 80 estudiantes de bachillerato con resultados positivos.', tecnologias: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Tailwind CSS'], categoria: 'Desarrollo Web', anio: 2024, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'WebRTC y aplicaciones en tiempo real', institucion: 'Udemy', anio: 2024, descripcion: 'Desarrollo de aplicaciones de videollamadas y colaboración en tiempo real con WebRTC y Socket.io.' },
            { titulo: 'UX Writing para interfaces educativas', institucion: 'Coursera', anio: 2024, descripcion: 'Principios de redacción de interfaz de usuario orientados a plataformas educativas y e-learning.' },
        ],
        tituloTesis: 'Desarrollo de una plataforma web de aprendizaje gamificado para la enseñanza de fundamentos de programación en estudiantes de bachillerato',
    },
    {
        nombres: 'Bryan Alexis', apellidos: 'Gavilánez Torres',
        cedula: '0620123456', telefono: '0899865432',
        genero: 'Masculino', fechaNacimiento: new Date('2001-02-08'),
        emailInstitucional: 'bagavilanez@espoch.edu.ec',
        emailPersonal: 'bryan.gavilanez.dev@gmail.com',
        bio: 'Desarrollador web junior con fuerte base en tecnologías modernas de frontend. Recién graduado con varios proyectos personales y freelance. Apasionado por el diseño y la experiencia de usuario.',
        disponibilidad: 'disponible', anioGraduacion: 2025,
        provincia: 'Chimborazo', canton: 'Riobamba',
        github: 'https://github.com/bgavilanez-dev', linkedin: 'https://linkedin.com/in/bryan-gavilanez',
        proyectos: [
            { titulo: 'Portafolio digital interactivo con Three.js', descripcion: 'Sitio web portafolio con experiencia 3D inmersiva usando Three.js. Efectos de partículas, transiciones fluidas y presentación de proyectos en formato galería 3D.', tecnologias: ['React', 'Three.js', 'GSAP', 'Tailwind CSS', 'Vite'], categoria: 'Desarrollo Web', anio: 2025, urlRepo: 'https://github.com/bgavilanez-dev/portfolio-3d' },
            { titulo: 'App de gestión de gastos personales', descripcion: 'Aplicación PWA para control de finanzas personales con categorización automática de gastos, gráficas y reportes. Funciona offline con Service Workers.', tecnologias: ['React', 'TypeScript', 'IndexedDB', 'Chart.js', 'Tailwind CSS', 'PWA'], categoria: 'Desarrollo Web', anio: 2024, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'JavaScript moderno ES6 al ES2023', institucion: 'Udemy', anio: 2024, descripcion: 'Curso completo de JavaScript moderno cubriendo todas las nuevas características del lenguaje hasta 2023.' },
            { titulo: 'CSS avanzado con animaciones y efectos', institucion: 'freeCodeCamp', anio: 2024, descripcion: 'Técnicas avanzadas de CSS incluyendo custom properties, scroll animations y container queries.' },
        ],
        tituloTesis: 'Implementación de una aplicación web progresiva para la gestión de finanzas personales dirigida a jóvenes universitarios ecuatorianos',
    },
    {
        nombres: 'Sofía Valentina', apellidos: 'Morales Enríquez',
        cedula: '0621234567', telefono: '0888754321',
        genero: 'Femenino', fechaNacimiento: new Date('1998-07-30'),
        emailInstitucional: 'svmorales@espoch.edu.ec',
        emailPersonal: 'sofia.morales.web@gmail.com',
        bio: 'Desarrolladora web fullstack con experiencia en sistemas gubernamentales y portales institucionales. Experta en accesibilidad web y estándares W3C.',
        disponibilidad: 'no_disponible', anioGraduacion: 2021,
        provincia: 'Tungurahua', canton: 'Ambato',
        github: 'https://github.com/svmorales-web', linkedin: 'https://linkedin.com/in/sofia-morales-web',
        proyectos: [
            { titulo: 'Portal de trámites digitales para GAD provincial', descripcion: 'Sistema web para digitalizar más de 50 trámites del Gobierno Provincial de Tungurahua. Reducción del 70% en tiempo de atención al ciudadano. Más de 10.000 trámites procesados.', tecnologias: ['Angular', 'Spring Boot', 'PostgreSQL', 'Keycloak', 'Docker', 'Nginx'], categoria: 'Desarrollo Web', anio: 2021, urlRepo: '' },
            { titulo: 'Sistema de inventario de bienes públicos', descripcion: 'Aplicación web para gestión de activos fijos del Estado en instituciones públicas. Codificación QR, geolocalización de bienes y reportes SENPLADES-compatibles.', tecnologias: ['Angular', 'Node.js', 'PostgreSQL', 'QR Code API', 'Google Maps', 'iTextPDF'], categoria: 'Desarrollo Web', anio: 2022, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Angular Developer Certification Google', institucion: 'Google', anio: 2021, descripcion: 'Certificación de Angular sobre arquitectura de componentes, RxJS, HttpClient y módulos lazy loading.' },
            { titulo: 'Java Spring Boot Microservicios', institucion: 'Udemy', anio: 2021, descripcion: 'Desarrollo de microservicios con Spring Boot, Spring Security, JPA y despliegue en Docker.' },
        ],
        tituloTesis: 'Desarrollo de un portal web de gobierno electrónico para la gestión de trámites ciudadanos en el Gobierno Autónomo Descentralizado de la Provincia de Tungurahua',
    },

    // ─────────────────────────────────────────────────────
    // BLOQUE 2 — BASES DE DATOS (8)
    // ─────────────────────────────────────────────────────
    {
        nombres: 'Nicolás Andrés', apellidos: 'Peñafiel Cando',
        cedula: '0613456789', telefono: '0865432109',
        genero: 'Masculino', fechaNacimiento: new Date('1997-03-12'),
        emailInstitucional: 'napenafiel@espoch.edu.ec',
        emailPersonal: 'nicolas.penafiel.db@gmail.com',
        bio: 'DBA y arquitecto de datos con experiencia en bases de datos relacionales y NoSQL. Optimizo sistemas de alto rendimiento y diseño estrategias de migración y respaldo de datos.',
        disponibilidad: 'no_disponible', anioGraduacion: 2020,
        provincia: 'Loja', canton: 'Loja',
        github: 'https://github.com/npenafiel-dba', linkedin: 'https://linkedin.com/in/nicolas-penafiel-dba',
        proyectos: [
            { titulo: 'Migración de Oracle a PostgreSQL sin downtime', descripcion: 'Migré base de datos crítica de 500GB de Oracle 12c a PostgreSQL para empresa de telecomunicaciones. Redujimos costos de licenciamiento en 120.000 USD anuales.', tecnologias: ['PostgreSQL', 'Oracle', 'Python', 'pglogical', 'Linux', 'Bash'], categoria: 'Bases de Datos', anio: 2020, urlRepo: '' },
            { titulo: 'Sistema de monitoreo para bases de datos', descripcion: 'Herramienta open source de monitoreo proactivo para PostgreSQL y MySQL. Detecta queries lentas, bloqueos y anomalías. Más de 500 descargas en GitHub.', tecnologias: ['Python', 'PostgreSQL', 'MySQL', 'Prometheus', 'Grafana', 'Docker'], categoria: 'Bases de Datos', anio: 2022, urlRepo: 'https://github.com/npenafiel-dba/db-monitor' },
        ],
        certificados: [
            { titulo: 'PostgreSQL DBA Certificado PGCES', institucion: 'edX', anio: 2020, descripcion: 'Certificación PGCES para administradores de BD PostgreSQL. Administración avanzada, replicación y recovery.' },
            { titulo: 'Oracle DBA Certified Associate OCA', institucion: 'Oracle', anio: 2019, descripcion: 'Certificación Oracle Certified Associate para administradores de base de datos Oracle.' },
        ],
        tituloTesis: 'Diseño e implementación de una estrategia de migración de datos para la transición de sistemas de gestión de bases de datos propietarios a soluciones open source',
    },
    {
        nombres: 'Ana Lucía', apellidos: 'Guerrero Ríos',
        cedula: '0606789012', telefono: '0932109876',
        genero: 'Femenino', fechaNacimiento: new Date('1998-05-19'),
        emailInstitucional: 'alguerrero@espoch.edu.ec',
        emailPersonal: 'ana.guerrero.data@gmail.com',
        bio: 'Analista e ingeniera de datos. Transformo datos complejos en insights accionables. Experiencia con pipelines ETL y visualización de datos para toma de decisiones empresariales.',
        disponibilidad: 'disponible', anioGraduacion: 2021,
        provincia: 'Azuay', canton: 'Cuenca',
        github: 'https://github.com/aguerrero-data', linkedin: 'https://linkedin.com/in/ana-guerrero-datos',
        proyectos: [
            { titulo: 'Pipeline ETL para análisis de ventas retail', descripcion: 'Diseñé pipeline de datos para cadena de tiendas con 15 sucursales. Procesé más de 2 millones de transacciones históricas. Reduje el tiempo de análisis en un 85%.', tecnologias: ['Python', 'Apache Airflow', 'PostgreSQL', 'Pandas', 'Power BI', 'AWS S3'], categoria: 'Bases de Datos', anio: 2021, urlRepo: '' },
            { titulo: 'Sistema de detección de anomalías en consumo eléctrico', descripcion: 'Modelo de ML para detectar fraude en red eléctrica de CENTROSUR. Procesé 3 años de datos de 50.000 medidores. El modelo detectó el 94% de anomalías.', tecnologias: ['Python', 'Scikit-learn', 'PostgreSQL', 'Docker', 'Grafana', 'Kafka'], categoria: 'Bases de Datos', anio: 2023, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'IBM Data Science Professional Certificate', institucion: 'Coursera', anio: 2021, descripcion: 'Certificación de IBM en ciencia de datos: Python, SQL, visualización y machine learning.' },
            { titulo: 'Power BI Data Analyst Associate Microsoft', institucion: 'Microsoft', anio: 2022, descripcion: 'Certificación oficial de Microsoft para analistas con Power BI. Modelado DAX y visualizaciones avanzadas.' },
        ],
        tituloTesis: 'Diseño e implementación de un data warehouse para el análisis de indicadores de gestión del Municipio del cantón Cuenca',
    },
    {
        nombres: 'Roberto Carlos', apellidos: 'Quispe Alvarado',
        cedula: '0607890123', telefono: '0921098765',
        genero: 'Masculino', fechaNacimiento: new Date('1997-12-03'),
        emailInstitucional: 'rcquispe@espoch.edu.ec',
        emailPersonal: 'roberto.quispe.db@outlook.com',
        bio: 'DBA con experiencia en sistemas empresariales y migración de datos. Especialista en SQL Server y Oracle. Actualmente administro bases de datos críticas para empresa de manufactura.',
        disponibilidad: 'no_disponible', anioGraduacion: 2020,
        provincia: 'Chimborazo', canton: 'Riobamba',
        github: '', linkedin: 'https://linkedin.com/in/roberto-quispe-dba',
        proyectos: [
            { titulo: 'ERP con base de datos optimizada para manufactura', descripcion: 'Diseño y optimización de BD relacional para ERP de empresa metalmecánica. Reducción del 90% en tiempo de consultas complejas mediante indexación y particionamiento.', tecnologias: ['SQL Server', 'C#', '.NET', 'SSRS', 'SSIS', 'Crystal Reports'], categoria: 'Bases de Datos', anio: 2021, urlRepo: '' },
            { titulo: 'Sistema de replicación y alta disponibilidad', descripcion: 'Implementé solución de alta disponibilidad para BD crítica de cooperativa financiera. Replicación sincrónica con failover automático. SLA de 99.99% de disponibilidad.', tecnologias: ['SQL Server', 'Always On AG', 'PowerShell', 'Windows Server', 'SSMS'], categoria: 'Bases de Datos', anio: 2022, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Microsoft SQL Server Database Administration', institucion: 'Microsoft', anio: 2021, descripcion: 'Certificación Microsoft para administración de SQL Server. Backup, restore, replicación y performance tuning.' },
            { titulo: 'Oracle Database 12c Administration OCA', institucion: 'Oracle', anio: 2020, descripcion: 'Certificación Oracle para administración de base de datos Oracle 12c en producción.' },
        ],
        tituloTesis: 'Desarrollo de un sistema de información para la gestión administrativa y financiera de las cooperativas de ahorro y crédito de la zona 3',
    },
    {
        nombres: 'Xiomara Belén', apellidos: 'Chimbo Andrade',
        cedula: '0622345678', telefono: '0877643210',
        genero: 'Femenino', fechaNacimiento: new Date('1999-08-22'),
        emailInstitucional: 'xbchimbo@espoch.edu.ec',
        emailPersonal: 'xiomara.chimbo.data@gmail.com',
        bio: 'Ingeniera de datos con especialización en Big Data y arquitecturas de datos modernas. Manejo grandes volúmenes de datos con herramientas del ecosistema Hadoop y Spark.',
        disponibilidad: 'disponible', anioGraduacion: 2023,
        provincia: 'Chimborazo', canton: 'Riobamba',
        github: 'https://github.com/xchimbo-bigdata', linkedin: 'https://linkedin.com/in/xiomara-chimbo-data',
        proyectos: [
            { titulo: 'Plataforma Big Data para análisis de redes sociales', descripcion: 'Infraestructura de procesamiento de datos para análisis de sentimientos en redes sociales ecuatorianas. Procesamiento en batch y streaming de 500.000 tweets por día.', tecnologias: ['Apache Spark', 'Kafka', 'Hadoop', 'Python', 'Hive', 'Elasticsearch'], categoria: 'Bases de Datos', anio: 2023, urlRepo: 'https://github.com/xchimbo-bigdata/social-analytics' },
            { titulo: 'Data Lake para empresa minorista nacional', descripcion: 'Diseñé e implementé Data Lake en AWS para centralizar datos de 8 sistemas heterogéneos. Normalización automática y catalogación de datos con Glue. Reducción del 60% en costos de almacenamiento.', tecnologias: ['AWS S3', 'AWS Glue', 'Apache Spark', 'Python', 'Athena', 'Redshift'], categoria: 'Bases de Datos', anio: 2022, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Databricks Apache Spark Developer Certification', institucion: 'Coursera', anio: 2022, descripcion: 'Certificación oficial de Databricks para desarrollo con Apache Spark y PySpark en producción.' },
            { titulo: 'AWS Data Analytics Specialty', institucion: 'AWS', anio: 2023, descripcion: 'Certificación de especialidad de AWS para arquitecturas de analytics: Redshift, Glue, Kinesis y QuickSight.' },
        ],
        tituloTesis: 'Implementación de una arquitectura de Data Lake en la nube para el análisis de datos de comercio electrónico en empresas del sector retail ecuatoriano',
    },
    {
        nombres: 'Mateo Sebastián', apellidos: 'Cepeda Villón',
        cedula: '0623456789', telefono: '0866532109',
        genero: 'Masculino', fechaNacimiento: new Date('1998-01-14'),
        emailInstitucional: 'mscepeda@espoch.edu.ec',
        emailPersonal: 'mateo.cepeda.nosql@gmail.com',
        bio: 'Especialista en bases de datos NoSQL y microservicios. Diseño esquemas de datos para sistemas distribuidos de alta escala. Fan de MongoDB, Redis y Cassandra.',
        disponibilidad: 'disponible', anioGraduacion: 2022,
        provincia: 'Guayas', canton: 'Guayaquil',
        github: 'https://github.com/mcepeda-nosql', linkedin: 'https://linkedin.com/in/mateo-cepeda-nosql',
        proyectos: [
            { titulo: 'Sistema de caché distribuido para plataforma bancaria', descripcion: 'Implementé estrategia de caché con Redis Cluster para banco digital. Redujo latencia en un 80% y soporta 10.000 operaciones por segundo sin degradación.', tecnologias: ['Redis', 'Node.js', 'Docker', 'Kubernetes', 'Lua scripting', 'Grafana'], categoria: 'Bases de Datos', anio: 2022, urlRepo: '' },
            { titulo: 'Base de datos de grafos para red de contactos', descripcion: 'Modelé y desarrollé red social universitaria usando Neo4j. Consultas de amigos de amigos y recomendaciones en milisegundos vs minutos con SQL relacional.', tecnologias: ['Neo4j', 'Cypher', 'Python', 'Node.js', 'React', 'Docker'], categoria: 'Bases de Datos', anio: 2023, urlRepo: 'https://github.com/mcepeda-nosql/grafo-red-social' },
        ],
        certificados: [
            { titulo: 'MongoDB Developer Path Certified', institucion: 'MongoDB', anio: 2022, descripcion: 'Certificación oficial de MongoDB University. Modelado de datos, aggregation pipeline e indexación.' },
            { titulo: 'Redis Certified Developer', institucion: 'LinkedIn Learning', anio: 2022, descripcion: 'Certificación de Redis Labs sobre estructuras de datos, pub/sub, streams y clustering.' },
        ],
        tituloTesis: 'Diseño de un esquema de persistencia poliglota para aplicaciones de microservicios financieros de alta disponibilidad',
    },
    {
        nombres: 'Alejandra Cristina', apellidos: 'Saltos Barriga',
        cedula: '0624567890', telefono: '0855421098',
        genero: 'Femenino', fechaNacimiento: new Date('2000-05-05'),
        emailInstitucional: 'acsaltos@espoch.edu.ec',
        emailPersonal: 'alejandra.saltos.bi@gmail.com',
        bio: 'Analista de Business Intelligence con experiencia en diseño de dashboards ejecutivos y KPIs. Convierto datos en decisiones. Especializada en Power BI y Tableau.',
        disponibilidad: 'disponible', anioGraduacion: 2024,
        provincia: 'Pichincha', canton: 'Quito',
        github: 'https://github.com/asaltos-bi', linkedin: 'https://linkedin.com/in/alejandra-saltos-bi',
        proyectos: [
            { titulo: 'Dashboard ejecutivo para cadena de restaurantes', descripcion: 'Sistema de BI completo para cadena de 12 restaurantes en Ecuador. KPIs en tiempo real de ventas, costos, rotación de inventario y satisfacción del cliente. Presentado al directorio semanalmente.', tecnologias: ['Power BI', 'SQL Server', 'Python', 'Pandas', 'Azure Analysis Services', 'DAX'], categoria: 'Bases de Datos', anio: 2024, urlRepo: '' },
            { titulo: 'Análisis predictivo de demanda para supermercado', descripcion: 'Modelo predictivo de demanda de productos usando datos históricos de ventas y variables externas como clima y festividades. Redujo el desperdicio de perecibles en un 22%.', tecnologias: ['Python', 'Prophet', 'PostgreSQL', 'Tableau', 'scikit-learn', 'Pandas'], categoria: 'Bases de Datos', anio: 2024, urlRepo: 'https://github.com/asaltos-bi/demanda-prediccion' },
        ],
        certificados: [
            { titulo: 'Power BI Data Analyst Microsoft Certified', institucion: 'Microsoft', anio: 2023, descripcion: 'Certificación PL-300 de Microsoft para analistas de datos con Power BI.' },
            { titulo: 'Tableau Desktop Specialist Certification', institucion: 'LinkedIn Learning', anio: 2024, descripcion: 'Certificación oficial de Tableau Software para creación de visualizaciones analíticas avanzadas.' },
        ],
        tituloTesis: 'Diseño e implementación de un sistema de inteligencia de negocios para el análisis de indicadores de rentabilidad en empresas del sector gastronómico',
    },
    {
        nombres: 'Gabriel Enrique', apellidos: 'Bonilla Cárdenas',
        cedula: '0625678901', telefono: '0844310987',
        genero: 'Masculino', fechaNacimiento: new Date('1997-06-11'),
        emailInstitucional: 'gebonilla@espoch.edu.ec',
        emailPersonal: 'gabriel.bonilla.dba@gmail.com',
        bio: 'DBA senior con más de 5 años de experiencia en entornos de alta disponibilidad. Especialista en tuning de consultas, particionamiento y planes de recuperación ante desastres.',
        disponibilidad: 'no_disponible', anioGraduacion: 2020,
        provincia: 'Azuay', canton: 'Cuenca',
        github: 'https://github.com/gbonilla-dba', linkedin: 'https://linkedin.com/in/gabriel-bonilla-dba',
        proyectos: [
            { titulo: 'Optimización de base de datos para empresa de seguros', descripcion: 'Proyecto de tuning de base de datos PostgreSQL con 200GB. Reduje tiempo de consultas críticas de 45 segundos a menos de 2 segundos. Análisis de planes de ejecución y reestructuración de índices.', tecnologias: ['PostgreSQL', 'pgBadger', 'pg_stat_statements', 'Python', 'Bash', 'Linux'], categoria: 'Bases de Datos', anio: 2021, urlRepo: '' },
            { titulo: 'Plan de recuperación ante desastres para banco local', descripcion: 'Diseñé e implementé estrategia completa de DR para banco ecuatoriano con RPO de 15 minutos y RTO de 1 hora. Replicación streaming entre datacenter principal y alterno.', tecnologias: ['PostgreSQL', 'Barman', 'repmgr', 'pgBouncer', 'Linux', 'Ansible'], categoria: 'Bases de Datos', anio: 2022, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'EDB PostgreSQL Certified DBA Professional', institucion: 'edX', anio: 2021, descripcion: 'Certificación avanzada de EnterpriseDB para administración profesional de PostgreSQL.' },
            { titulo: 'Linux System Administration RHCSA', institucion: 'Coursera', anio: 2020, descripcion: 'Certificación Red Hat RHCSA para administración de sistemas Linux en producción.' },
        ],
        tituloTesis: 'Implementación de una estrategia de continuidad del negocio y recuperación ante desastres para sistemas de gestión de bases de datos en instituciones financieras',
    },
    {
        nombres: 'Karina Elizabeth', apellidos: 'Naula Morocho',
        cedula: '0626789012', telefono: '0833209876',
        genero: 'Femenino', fechaNacimiento: new Date('1999-12-18'),
        emailInstitucional: 'kenaula@espoch.edu.ec',
        emailPersonal: 'karina.naula.etl@gmail.com',
        bio: 'Ingeniería de datos con especialización en ETL y calidad de datos. Construyo pipelines robustos que garantizan la integridad y disponibilidad de datos para análisis.',
        disponibilidad: 'disponible', anioGraduacion: 2023,
        provincia: 'Chimborazo', canton: 'Riobamba',
        github: 'https://github.com/knaula-data', linkedin: 'https://linkedin.com/in/karina-naula-data',
        proyectos: [
            { titulo: 'Pipeline de calidad de datos para ministerio', descripcion: 'Sistema automático de validación y limpieza de datos del MINEDUC. Detecta inconsistencias, duplicados y valores faltantes en más de 5 millones de registros estudiantiles. Reduce errores en reportes estadísticos en un 92%.', tecnologias: ['Python', 'Great Expectations', 'Apache Airflow', 'PostgreSQL', 'pandas', 'SQLAlchemy'], categoria: 'Bases de Datos', anio: 2023, urlRepo: 'https://github.com/knaula-data/calidad-datos-mineduc' },
            { titulo: 'Integración de datos multi-fuente para ONG', descripcion: 'ETL que consolida datos de 6 sistemas distintos (ERP, CRM, hojas de cálculo) para ONG de salud. Automatización total con notificaciones de alertas por correo. Ahorra 20 horas de trabajo manual semanales.', tecnologias: ['Python', 'Pentaho PDI', 'MySQL', 'MongoDB', 'Apache NiFi', 'REST API'], categoria: 'Bases de Datos', anio: 2022, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Apache Airflow Fundamentals Astronomer', institucion: 'LinkedIn Learning', anio: 2022, descripcion: 'Certificación sobre orquestación de pipelines de datos con Apache Airflow.' },
            { titulo: 'Data Engineering with Python Certificado', institucion: 'Coursera', anio: 2023, descripcion: 'Curso avanzado de ingeniería de datos con Python: APIs, automatización y procesamiento de datos.' },
        ],
        tituloTesis: 'Diseño e implementación de un framework de calidad de datos para sistemas de información educativa del Ministerio de Educación del Ecuador',
    },

    // ─────────────────────────────────────────────────────
    // BLOQUE 3 — REDES / INFRAESTRUCTURA (8)
    // ─────────────────────────────────────────────────────
    {
        nombres: 'Javier Esteban', apellidos: 'Mora Castillo',
        cedula: '0603456789', telefono: '0965432109',
        genero: 'Masculino', fechaNacimiento: new Date('1997-11-08'),
        emailInstitucional: 'jemora@espoch.edu.ec',
        emailPersonal: 'javier.mora.redes@hotmail.com',
        bio: 'Administrador de redes y sistemas con 4 años de experiencia en infraestructura empresarial. Especialista en redes Cisco, VPNs y gestión de servicios de red en entornos híbridos.',
        disponibilidad: 'no_disponible', anioGraduacion: 2020,
        provincia: 'Guayas', canton: 'Guayaquil',
        github: 'https://github.com/jmora-netadmin', linkedin: 'https://linkedin.com/in/javier-mora-redes',
        proyectos: [
            { titulo: 'Diseño de red corporativa para empresa financiera', descripcion: 'Diseñé e implementé red corporativa para empresa fintech de 150 empleados. Segmentación con VLANs, redundancia con HSRP y gestión centralizada con Cisco DNA Center. Disponibilidad de red del 99.95%.', tecnologias: ['Cisco IOS', 'VLAN', 'HSRP', 'BGP', 'OSPF', 'Wireshark', 'Cisco DNA Center'], categoria: 'Redes', anio: 2020, urlRepo: '' },
            { titulo: 'Implementación de SD-WAN para cadena de tiendas', descripcion: 'Migración de MPLS a SD-WAN para 25 sucursales en Ecuador. Reducción de costos de conectividad en un 55% con mejora en el rendimiento de aplicaciones críticas.', tecnologias: ['Cisco SD-WAN', 'Viptela', 'BGP', 'DMVPN', 'QoS', 'Python scripting'], categoria: 'Redes', anio: 2022, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Cisco CCNP Enterprise Certificado', institucion: 'Coursera', anio: 2021, descripcion: 'Certificación profesional de Cisco en redes empresariales. Routing avanzado, switching y SD-WAN.' },
            { titulo: 'Cisco CCNA 200-301 Certificado', institucion: 'Udemy', anio: 2020, descripcion: 'Certificación Cisco CCNA sobre fundamentos de redes, routing, switching y seguridad básica.' },
        ],
        tituloTesis: 'Diseño e implementación de una arquitectura de red SD-WAN para la optimización de la conectividad en empresas con múltiples sucursales en Ecuador',
    },
    {
        nombres: 'Luis Miguel', apellidos: 'Cárdenas Espín',
        cedula: '0609012345', telefono: '0909876543',
        genero: 'Masculino', fechaNacimiento: new Date('1995-04-25'),
        emailInstitucional: 'lmcardenas@espoch.edu.ec',
        emailPersonal: 'luis.cardenas.cloud@gmail.com',
        bio: 'Arquitecto de soluciones cloud con 6 años de experiencia. Diseño infraestructuras escalables en AWS y Azure. Mentor de comunidades de desarrolladores en Ecuador.',
        disponibilidad: 'no_disponible', anioGraduacion: 2020,
        provincia: 'Pichincha', canton: 'Quito',
        github: 'https://github.com/lcardenas-cloud', linkedin: 'https://linkedin.com/in/luis-cardenas-cloud',
        proyectos: [
            { titulo: 'Migración de infraestructura on-premise a AWS', descripcion: 'Lideré la migración de 40 servidores de empresa de seguros a AWS. Redujimos costos operativos en un 40% y mejoramos disponibilidad al 99.95%.', tecnologias: ['AWS', 'Terraform', 'Docker', 'Linux', 'Python', 'CloudFormation'], categoria: 'Redes', anio: 2020, urlRepo: '' },
            { titulo: 'Sistema de observabilidad para microservicios', descripcion: 'Stack de observabilidad con métricas, logs y trazas para empresa de 50 microservicios. Redujimos el tiempo de resolución de incidentes de 4 horas a 20 minutos.', tecnologias: ['Prometheus', 'Grafana', 'Loki', 'Jaeger', 'Docker', 'Kubernetes'], categoria: 'Redes', anio: 2021, urlRepo: 'https://github.com/lcardenas-cloud/observability-stack' },
        ],
        certificados: [
            { titulo: 'AWS Solutions Architect Professional', institucion: 'AWS', anio: 2020, descripcion: 'Certificación profesional de AWS para arquitectos de soluciones empresariales.' },
            { titulo: 'Terraform Associate HashiCorp', institucion: 'LinkedIn Learning', anio: 2021, descripcion: 'Certificación oficial de HashiCorp para infraestructura como código con Terraform.' },
        ],
        tituloTesis: 'Implementación de una plataforma de infraestructura como código para la automatización del despliegue de aplicaciones web en entornos cloud',
    },
    {
        nombres: 'Rodrigo Fabián', apellidos: 'Espinoza Merino',
        cedula: '0627890123', telefono: '0822098765',
        genero: 'Masculino', fechaNacimiento: new Date('1998-04-17'),
        emailInstitucional: 'rfespinoza@espoch.edu.ec',
        emailPersonal: 'rodrigo.espinoza.redes@gmail.com',
        bio: 'Ingeniero de redes especializado en redes inalámbricas y tecnologías de acceso. Experto en Wi-Fi 6, LTE y diseño de cobertura para campus universitarios y empresas.',
        disponibilidad: 'disponible', anioGraduacion: 2023,
        provincia: 'Tungurahua', canton: 'Ambato',
        github: 'https://github.com/rfespinoza-wireless', linkedin: 'https://linkedin.com/in/rodrigo-espinoza-redes',
        proyectos: [
            { titulo: 'Diseño de red Wi-Fi 6 para campus universitario', descripcion: 'Diseñé e implementé infraestructura de red inalámbrica Wi-Fi 6 para campus de 5000 estudiantes. Survey de radio frecuencia, posicionamiento de APs y configuración de controladora centralizada Cisco Catalyst.', tecnologias: ['Wi-Fi 6', 'Cisco Catalyst Center', 'Ekahau', 'RADIUS', '802.1X', 'VLAN'], categoria: 'Redes', anio: 2023, urlRepo: '' },
            { titulo: 'Sistema de monitoreo de red con alertas inteligentes', descripcion: 'Plataforma de monitoreo de infraestructura de red con detección automática de topología, alertas proactivas y gestión de inventario de dispositivos. Cubre 500 nodos de red.', tecnologias: ['Zabbix', 'Python', 'SNMP', 'Grafana', 'PostgreSQL', 'Ansible'], categoria: 'Redes', anio: 2022, urlRepo: 'https://github.com/rfespinoza-wireless/network-monitor' },
        ],
        certificados: [
            { titulo: 'Cisco CCNA Wireless Certificado', institucion: 'Udemy', anio: 2022, descripcion: 'Certificación Cisco sobre redes inalámbricas, controllers, seguridad WLAN y troubleshooting.' },
            { titulo: 'CompTIA Network Plus Certification', institucion: 'Coursera', anio: 2023, descripcion: 'Certificación CompTIA Network+ sobre infraestructura, protocolos, seguridad y troubleshooting de redes.' },
        ],
        tituloTesis: 'Diseño e implementación de una infraestructura de red inalámbrica Wi-Fi 6 para entornos universitarios de alta densidad de usuarios',
    },
    {
        nombres: 'Patricia Verónica', apellidos: 'Oviedo Sánchez',
        cedula: '0628901234', telefono: '0811987654',
        genero: 'Femenino', fechaNacimiento: new Date('1999-09-09'),
        emailInstitucional: 'pvoviedo@espoch.edu.ec',
        emailPersonal: 'patricia.oviedo.voip@gmail.com',
        bio: 'Especialista en telefonía IP y comunicaciones unificadas. Diseño e implemento soluciones VoIP para empresas. Certificada en Asterisk y Cisco CUCM.',
        disponibilidad: 'disponible', anioGraduacion: 2022,
        provincia: 'Loja', canton: 'Loja',
        github: 'https://github.com/pvoviedo-voip', linkedin: 'https://linkedin.com/in/patricia-oviedo-voip',
        proyectos: [
            { titulo: 'Central telefónica IP para municipio de Loja', descripcion: 'Diseñé e implementé central Asterisk con más de 300 extensiones para el Municipio de Loja. Integración con operadora SIP y funcionalidades de IVR, grabación y estadísticas de llamadas.', tecnologias: ['Asterisk', 'FreePBX', 'SIP', 'Linux', 'Python', 'AGI scripting'], categoria: 'Redes', anio: 2022, urlRepo: '' },
            { titulo: 'Plataforma de Contact Center para empresa de servicios', descripcion: 'Sistema de contact center omnicanal integrando voz, chat y correo. Enrutamiento inteligente de llamadas, métricas en tiempo real y gestión de agentes. 50 agentes simultáneos.', tecnologias: ['Asterisk', 'Kamailio', 'WebRTC', 'Node.js', 'React', 'PostgreSQL'], categoria: 'Redes', anio: 2023, urlRepo: 'https://github.com/pvoviedo-voip/contact-center' },
        ],
        certificados: [
            { titulo: 'Asterisk Administration and Configuration', institucion: 'LinkedIn Learning', anio: 2021, descripcion: 'Certificado sobre administración de Asterisk, configuración de extensiones, troncales SIP e IVR.' },
            { titulo: 'Cisco CCNA Collaboration Certificado', institucion: 'Udemy', anio: 2022, descripcion: 'Certificación Cisco en colaboración y comunicaciones unificadas con CUCM y Unity.' },
        ],
        tituloTesis: 'Implementación de un sistema de comunicaciones unificadas basado en software libre para instituciones públicas del cantón Loja',
    },
    {
        nombres: 'Marco Antonio', apellidos: 'Sánchez Dávila',
        cedula: '0629012345', telefono: '0800876543',
        genero: 'Masculino', fechaNacimiento: new Date('1997-01-23'),
        emailInstitucional: 'masanchez@espoch.edu.ec',
        emailPersonal: 'marco.sanchez.noc@gmail.com',
        bio: 'Ingeniero de NOC con experiencia en gestión de incidentes de red a escala nacional. Especialista en protocolos de enrutamiento dinámico y gestión de ISPs.',
        disponibilidad: 'no_disponible', anioGraduacion: 2020,
        provincia: 'Guayas', canton: 'Guayaquil',
        github: 'https://github.com/masanchez-noc', linkedin: 'https://linkedin.com/in/marco-sanchez-noc',
        proyectos: [
            { titulo: 'Automatización de configuración de routers con Ansible', descripcion: 'Framework de automatización de red para ISP con más de 200 routers Cisco y MikroTik. Reducción del 90% en tiempo de configuración y eliminación de errores humanos en cambios de red.', tecnologias: ['Ansible', 'Python', 'Cisco IOS', 'MikroTik RouterOS', 'NETCONF', 'YANG'], categoria: 'Redes', anio: 2021, urlRepo: 'https://github.com/masanchez-noc/network-automation' },
            { titulo: 'Sistema de gestión de ancho de banda para ISP', descripcion: 'Plataforma para gestión y control de ancho de banda de clientes de ISP regional. Limitación dinámica por perfil, reportes de consumo y portal de autogestión para clientes.', tecnologias: ['MikroTik', 'RADIUS', 'Python', 'PostgreSQL', 'React', 'SNMP'], categoria: 'Redes', anio: 2020, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'MikroTik Certified Network Associate MTCNA', institucion: 'LinkedIn Learning', anio: 2020, descripcion: 'Certificación oficial de MikroTik sobre administración de RouterOS y configuración de redes.' },
            { titulo: 'Cisco CCNP Routing and Switching', institucion: 'Coursera', anio: 2021, descripcion: 'Certificación profesional de Cisco en routing avanzado con BGP, OSPF, EIGRP y redistribución.' },
        ],
        tituloTesis: 'Diseño de un sistema de automatización de red basado en infraestructura como código para proveedores de servicios de internet de tamaño mediano',
    },
    {
        nombres: 'Natalia Fernanda', apellidos: 'Cepeda Alarcón',
        cedula: '0630123456', telefono: '0898754321',
        genero: 'Femenino', fechaNacimiento: new Date('2000-11-30'),
        emailInstitucional: 'nfcepeda@espoch.edu.ec',
        emailPersonal: 'natalia.cepeda.redes@gmail.com',
        bio: 'Especialista en redes de datacenter y virtualización de funciones de red. Apasionada por las tecnologías SDN y NFV que están transformando las redes modernas.',
        disponibilidad: 'disponible', anioGraduacion: 2024,
        provincia: 'Pichincha', canton: 'Quito',
        github: 'https://github.com/nfcepeda-sdn', linkedin: 'https://linkedin.com/in/natalia-cepeda-sdn',
        proyectos: [
            { titulo: 'Implementación de SDN con OpenFlow para laboratorio', descripcion: 'Implementé red definida por software en laboratorio universitario con controladora OpenDaylight. Programación de flujos, QoS dinámico y virtualización de funciones de red para 50 nodos.', tecnologias: ['OpenFlow', 'OpenDaylight', 'Mininet', 'Python', 'REST API', 'Linux'], categoria: 'Redes', anio: 2024, urlRepo: 'https://github.com/nfcepeda-sdn/sdn-lab' },
            { titulo: 'Red de datacenter con VXLAN para empresa tecnológica', descripcion: 'Diseño de fabric de datacenter con VXLAN y EVPN para separación de tenants en nube privada. Gestión centralizada y microsegmentación para 300 máquinas virtuales.', tecnologias: ['VXLAN', 'EVPN', 'BGP', 'Arista EOS', 'Ansible', 'Python'], categoria: 'Redes', anio: 2024, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Cisco DevNet Associate Certificado', institucion: 'Cisco', anio: 2023, descripcion: 'Certificación de Cisco sobre programabilidad de redes, APIs REST, Python para NetOps y Ansible.' },
            { titulo: 'Juniper Networks Certified Associate Routing', institucion: 'edX', anio: 2024, descripcion: 'Certificación JNCIA de Juniper Networks sobre routing fundamentals con Junos OS.' },
        ],
        tituloTesis: 'Implementación de una red definida por software para la optimización dinámica del enrutamiento en redes de datacenter universitario',
    },
    {
        nombres: 'Oswaldo Renán', apellidos: 'Tacuri Pillajo',
        cedula: '0631234567', telefono: '0887643210',
        genero: 'Masculino', fechaNacimiento: new Date('1996-08-14'),
        emailInstitucional: 'ortacuri@espoch.edu.ec',
        emailPersonal: 'oswaldo.tacuri.infraestructura@gmail.com',
        bio: 'Administrador de sistemas Linux con experiencia en alta disponibilidad y automatización. Especialista en virtualización con VMware y Proxmox para entornos empresariales.',
        disponibilidad: 'no_disponible', anioGraduacion: 2020,
        provincia: 'Chimborazo', canton: 'Riobamba',
        github: 'https://github.com/otacuri-sysadmin', linkedin: 'https://linkedin.com/in/oswaldo-tacuri-linux',
        proyectos: [
            { titulo: 'Infraestructura de virtualización para hospital público', descripcion: 'Diseñé e implementé infraestructura VMware vSphere para Hospital General de Riobamba. 30 VMs consolidadas desde servidores físicos. Ahorro de 65% en consumo energético y mejora en disponibilidad.', tecnologias: ['VMware vSphere', 'vCenter', 'vSAN', 'Linux', 'PowerCLI', 'Backup Exec'], categoria: 'Redes', anio: 2021, urlRepo: '' },
            { titulo: 'Automatización de despliegue de servidores con PXE', descripcion: 'Sistema de aprovisionamiento automático de servidores Linux usando PXE boot, Kickstart y Ansible. Reduce el tiempo de despliegue de un servidor de 4 horas a 20 minutos.', tecnologias: ['Linux', 'Ansible', 'PXE', 'Kickstart', 'DHCP', 'TFTP', 'Python'], categoria: 'Redes', anio: 2020, urlRepo: 'https://github.com/otacuri-sysadmin/pxe-automation' },
        ],
        certificados: [
            { titulo: 'VMware vSphere 7 Professional VCP', institucion: 'Coursera', anio: 2021, descripcion: 'Certificación VMware Certified Professional para administración de infraestructura vSphere 7.' },
            { titulo: 'Red Hat System Administrator RHCSA', institucion: 'edX', anio: 2020, descripcion: 'Certificación RHCSA de Red Hat para administración de sistemas Linux Enterprise.' },
        ],
        tituloTesis: 'Implementación de una infraestructura de virtualización de servidores para la consolidación y optimización de recursos tecnológicos en instituciones de salud pública',
    },
    {
        nombres: 'Viviana Soledad', apellidos: 'Bayas Guevara',
        cedula: '0632345678', telefono: '0876532109',
        genero: 'Femenino', fechaNacimiento: new Date('2000-03-27'),
        emailInstitucional: 'vsbayas@espoch.edu.ec',
        emailPersonal: 'viviana.bayas.redes@gmail.com',
        bio: 'Ingeniera de redes con enfoque en monitoreo y gestión proactiva de infraestructura. Apasionada por la observabilidad y las herramientas open source de gestión de red.',
        disponibilidad: 'disponible', anioGraduacion: 2025,
        provincia: 'Chimborazo', canton: 'Riobamba',
        github: 'https://github.com/vsbayas-monitor', linkedin: 'https://linkedin.com/in/viviana-bayas-redes',
        proyectos: [
            { titulo: 'Plataforma de monitoreo unificado con Zabbix y Grafana', descripcion: 'Sistema de monitoreo centralizado para infraestructura de ISP con 1500 dispositivos. Dashboards ejecutivos, alertas inteligentes y correlación de eventos. Tiempo de detección de fallas reducido de 30 a 3 minutos.', tecnologias: ['Zabbix', 'Grafana', 'Python', 'InfluxDB', 'SNMP', 'Ansible'], categoria: 'Redes', anio: 2025, urlRepo: 'https://github.com/vsbayas-monitor/unified-monitoring' },
            { titulo: 'Sistema de inventario automático de red', descripcion: 'Herramienta de descubrimiento y documentación automática de topología de red. Genera diagramas actualizados de red y mantiene CMDB sincronizada con el estado real de la infraestructura.', tecnologias: ['Python', 'Nmap', 'LLDP', 'CDP', 'Neo4j', 'React', 'D3.js'], categoria: 'Redes', anio: 2024, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Zabbix Certified Specialist', institucion: 'LinkedIn Learning', anio: 2024, descripcion: 'Certificación oficial de Zabbix Inc. para administración y configuración avanzada de la plataforma.' },
            { titulo: 'Grafana Fundamentals Certificado', institucion: 'edX', anio: 2024, descripcion: 'Certificación de Grafana Labs sobre creación de dashboards, alertas y gestión de fuentes de datos.' },
        ],
        tituloTesis: 'Diseño e implementación de una plataforma de monitoreo de infraestructura de red basada en herramientas open source para proveedores de servicios de internet',
    },

    // ─────────────────────────────────────────────────────
    // BLOQUE 4 — APLICACIONES MÓVILES (8)
    // ─────────────────────────────────────────────────────
    {
        nombres: 'Valeria Cristina', apellidos: 'Herrera Salinas',
        cedula: '0604567890', telefono: '0954321098',
        genero: 'Femenino', fechaNacimiento: new Date('2000-02-14'),
        emailInstitucional: 'vcherrera@espoch.edu.ec',
        emailPersonal: 'valeria.herrera.mobile@gmail.com',
        bio: 'Desarrolladora móvil con enfoque en UX/UI. Creo aplicaciones intuitivas para iOS y Android. Varios proyectos freelance exitosos en Flutter y React Native.',
        disponibilidad: 'disponible', anioGraduacion: 2024,
        provincia: 'Tungurahua', canton: 'Ambato',
        github: 'https://github.com/vherrera-mobile', linkedin: '',
        proyectos: [
            { titulo: 'App de mercado local para productores de Tungurahua', descripcion: 'Aplicación Flutter para conectar productores agrícolas con compradores finales. Más de 200 productores registrados y 1500 descargas en Play Store.', tecnologias: ['Flutter', 'Dart', 'Firebase', 'Google Maps API', 'Stripe'], categoria: 'Desarrollo Móvil', anio: 2024, urlRepo: 'https://github.com/vherrera-mobile/mercado-tungurahua' },
            { titulo: 'App de taxis para cooperativa de Ambato', descripcion: 'Sistema completo de taxis con app para pasajero y conductor. Geolocalización en tiempo real y notificaciones push. 80 conductores activos.', tecnologias: ['React Native', 'Node.js', 'Socket.io', 'MongoDB', 'Expo', 'Google Maps'], categoria: 'Desarrollo Móvil', anio: 2023, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Flutter y Dart Bootcamp Completo', institucion: 'Udemy', anio: 2023, descripcion: 'Curso de 55 horas sobre desarrollo de apps con Flutter. State management con Bloc y Provider.' },
            { titulo: 'UI UX Design Fundamentals Google', institucion: 'Google', anio: 2023, descripcion: 'Fundamentos de diseño UX: investigación de usuarios, wireframing y pruebas de usabilidad.' },
        ],
        tituloTesis: 'Desarrollo de una aplicación móvil multiplataforma para la gestión de inventarios en pequeñas y medianas empresas del cantón Ambato',
    },
    {
        nombres: 'Sebastián Ignacio', apellidos: 'Flores Benítez',
        cedula: '0611234567', telefono: '0887654321',
        genero: 'Masculino', fechaNacimiento: new Date('1998-10-16'),
        emailInstitucional: 'siflores@espoch.edu.ec',
        emailPersonal: 'sebastian.flores.mobile@gmail.com',
        bio: 'Desarrollador móvil con foco en IoT y apps conectadas a hardware. Combino Flutter con sensores y microcontroladores para crear soluciones innovadoras.',
        disponibilidad: 'disponible', anioGraduacion: 2021,
        provincia: 'Chimborazo', canton: 'Riobamba',
        github: 'https://github.com/sflores-mobile', linkedin: 'https://linkedin.com/in/sebastian-flores-mobile',
        proyectos: [
            { titulo: 'App móvil para monitoreo de invernaderos IoT', descripcion: 'Aplicación Flutter que se conecta a red de sensores IoT para monitoreo de invernaderos. Alertas push, gráficas históricas y control remoto de actuadores.', tecnologias: ['Flutter', 'MQTT', 'Firebase', 'BLE', 'Arduino', 'Dart'], categoria: 'Desarrollo Móvil', anio: 2021, urlRepo: 'https://github.com/sflores-mobile/invernadero-app' },
            { titulo: 'App de delivery para restaurantes locales', descripcion: 'Plataforma de delivery tipo Uber Eats para restaurantes de Riobamba. App de cliente, repartidor y panel web de restaurante. 30 restaurantes y 500 pedidos diarios en el primer mes.', tecnologias: ['React Native', 'Node.js', 'MongoDB', 'Socket.io', 'Expo', 'PayPhone API'], categoria: 'Desarrollo Móvil', anio: 2022, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'React Native con Expo Curso Avanzado', institucion: 'Udemy', anio: 2021, descripcion: 'Desarrollo de apps multiplataforma con React Native y Expo, incluyendo push notifications y mapas.' },
            { titulo: 'Firebase para apps móviles Platzi', institucion: 'Platzi', anio: 2020, descripcion: 'Integración de Firebase en apps móviles: Firestore, Auth, Storage y Cloud Functions.' },
        ],
        tituloTesis: 'Desarrollo de un sistema de monitoreo y control de parámetros ambientales para invernaderos agrícolas mediante tecnología IoT y aplicación móvil',
    },
    {
        nombres: 'Andrea Mishell', apellidos: 'Barros Granizo',
        cedula: '0633456789', telefono: '0865421098',
        genero: 'Femenino', fechaNacimiento: new Date('2001-04-20'),
        emailInstitucional: 'ambarros@espoch.edu.ec',
        emailPersonal: 'andrea.barros.mobile@gmail.com',
        bio: 'Desarrolladora iOS nativa con Swift. Creo apps que aprovechan al máximo las capacidades del ecosistema Apple: ARKit, HealthKit y Core ML.',
        disponibilidad: 'disponible', anioGraduacion: 2025,
        provincia: 'Pichincha', canton: 'Quito',
        github: 'https://github.com/ambarros-ios', linkedin: 'https://linkedin.com/in/andrea-barros-ios',
        proyectos: [
            { titulo: 'App de salud y bienestar con HealthKit', descripcion: 'Aplicación iOS para seguimiento de salud integrada con Apple Health. Monitorea actividad física, sueño, hidratación y ofrece recomendaciones personalizadas basadas en los datos del usuario.', tecnologias: ['Swift', 'SwiftUI', 'HealthKit', 'Core Data', 'CloudKit', 'Combine'], categoria: 'Desarrollo Móvil', anio: 2025, urlRepo: 'https://github.com/ambarros-ios/health-tracker' },
            { titulo: 'App de realidad aumentada para turismo en Quito', descripcion: 'Aplicación de turismo con AR que muestra información histórica sobre monumentos de Quito al enfocar la cámara. Ganó el primer lugar en hackathon de innovación turística del Ministerio de Turismo.', tecnologias: ['Swift', 'ARKit', 'SceneKit', 'Core Location', 'MapKit', 'Vision'], categoria: 'Desarrollo Móvil', anio: 2024, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'iOS App Development with Swift Apple', institucion: 'Coursera', anio: 2024, descripcion: 'Certificación de Apple para desarrollo de apps iOS con Swift y SwiftUI. Proyecto de app completa.' },
            { titulo: 'ARKit and Reality Composer Course', institucion: 'Udemy', anio: 2024, descripcion: 'Curso de realidad aumentada en iOS con ARKit, Reality Composer y SceneKit.' },
        ],
        tituloTesis: 'Desarrollo de una aplicación móvil de realidad aumentada para la interpretación del patrimonio histórico y cultural del Centro Histórico de Quito',
    },
    {
        nombres: 'Emilio Andrés', apellidos: 'Solano Abad',
        cedula: '0634567890', telefono: '0854310987',
        genero: 'Masculino', fechaNacimiento: new Date('1999-07-07'),
        emailInstitucional: 'easolano@espoch.edu.ec',
        emailPersonal: 'emilio.solano.android@gmail.com',
        bio: 'Desarrollador Android nativo con Kotlin. 4 años creando apps para el ecosistema Google. Especialista en Jetpack Compose y arquitectura MVVM.',
        disponibilidad: 'no_disponible', anioGraduacion: 2022,
        provincia: 'Azuay', canton: 'Cuenca',
        github: 'https://github.com/easolano-android', linkedin: 'https://linkedin.com/in/emilio-solano-android',
        proyectos: [
            { titulo: 'App Android de pagos QR para comercios', descripcion: 'Aplicación Android de cobros con código QR para pequeños comerciantes. No requiere POS ni internet constante. Sincronización diferida de transacciones. Más de 500 comercios en Cuenca.', tecnologias: ['Kotlin', 'Jetpack Compose', 'Room', 'WorkManager', 'Camera2', 'ZXing'], categoria: 'Desarrollo Móvil', anio: 2022, urlRepo: '' },
            { titulo: 'App educativa de lenguaje de señas con ML', descripcion: 'Aplicación Android que usa la cámara para enseñar lenguaje de señas ecuatoriano. Reconocimiento de gestos en tiempo real con TensorFlow Lite. Herramienta educativa para inclusión.', tecnologias: ['Kotlin', 'TensorFlow Lite', 'CameraX', 'Jetpack Compose', 'ML Kit', 'Hilt'], categoria: 'Desarrollo Móvil', anio: 2023, urlRepo: 'https://github.com/easolano-android/lengua-senas' },
        ],
        certificados: [
            { titulo: 'Associate Android Developer Google Certified', institucion: 'Google', anio: 2022, descripcion: 'Certificación oficial de Google para desarrolladores Android. Kotlin, Jetpack y arquitectura de apps.' },
            { titulo: 'Jetpack Compose for Android Developers', institucion: 'Coursera', anio: 2023, descripcion: 'Curso oficial de Google sobre desarrollo de UI con Jetpack Compose en Android.' },
        ],
        tituloTesis: 'Desarrollo de una aplicación Android para el aprendizaje del lenguaje de señas ecuatoriano mediante reconocimiento gestual en tiempo real con inteligencia artificial',
    },
    {
        nombres: 'Estefanía Carolina', apellidos: 'Oliva Recalde',
        cedula: '0635678901', telefono: '0843209876',
        genero: 'Femenino', fechaNacimiento: new Date('2000-01-12'),
        emailInstitucional: 'ecoliva@espoch.edu.ec',
        emailPersonal: 'estefania.oliva.flutter@gmail.com',
        bio: 'Desarrolladora Flutter con experiencia en apps de salud y bienestar. Me especializo en UI/UX para móvil y en la integración de wearables y dispositivos médicos.',
        disponibilidad: 'disponible', anioGraduacion: 2024,
        provincia: 'Manabí', canton: 'Portoviejo',
        github: 'https://github.com/ecoliva-flutter', linkedin: 'https://linkedin.com/in/estefania-oliva-flutter',
        proyectos: [
            { titulo: 'App de telemedicina para zonas rurales', descripcion: 'Aplicación de consultas médicas a distancia para comunidades rurales de Manabí. Videollamadas, gestión de recetas digitales y seguimiento de pacientes. Pilotada con Ministerio de Salud en 10 comunidades.', tecnologias: ['Flutter', 'Firebase', 'WebRTC', 'Dart', 'Agora.io', 'Firestore'], categoria: 'Desarrollo Móvil', anio: 2024, urlRepo: 'https://github.com/ecoliva-flutter/telemedicina-rural' },
            { titulo: 'App de control de diabetes con Bluetooth', descripcion: 'Aplicación Flutter que se conecta por Bluetooth a glucómetros para registrar automáticamente lecturas. Análisis de tendencias, alertas y compartir datos con médico. Más de 300 usuarios activos.', tecnologias: ['Flutter', 'Bluetooth LE', 'Firebase', 'Dart', 'Charts Flutter', 'Provider'], categoria: 'Desarrollo Móvil', anio: 2023, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Flutter Advanced State Management', institucion: 'Udemy', anio: 2023, descripcion: 'Curso avanzado de gestión de estado en Flutter: BLoC, Riverpod, Provider y GetX.' },
            { titulo: 'Mobile UX Design for Healthcare Apps', institucion: 'Coursera', anio: 2023, descripcion: 'Diseño UX especializado para aplicaciones de salud digital considerando regulaciones y accesibilidad.' },
        ],
        tituloTesis: 'Desarrollo de una aplicación móvil de telemedicina para la atención médica primaria en comunidades rurales con conectividad limitada',
    },
    {
        nombres: 'Jonathan Xavier', apellidos: 'Lema Alvarado',
        cedula: '0636789012', telefono: '0832098765',
        genero: 'Masculino', fechaNacimiento: new Date('1998-05-29'),
        emailInstitucional: 'jxlema@espoch.edu.ec',
        emailPersonal: 'jonathan.lema.crossplatform@gmail.com',
        bio: 'Desarrollador multiplataforma con React Native. Experto en optimización de rendimiento para apps móviles. Publiqué 6 apps en Play Store y App Store.',
        disponibilidad: 'no_disponible', anioGraduacion: 2021,
        provincia: 'Chimborazo', canton: 'Riobamba',
        github: 'https://github.com/jxlema-rn', linkedin: 'https://linkedin.com/in/jonathan-lema-mobile',
        proyectos: [
            { titulo: 'Fintech app para micropréstamos comunitarios', descripcion: 'Aplicación de micropréstamos entre vecinos y comunidades. Sistema de scoring crediticio alternativo, gestión de pagos y comunidades. 1500 usuarios activos con más de 50.000 USD en préstamos procesados.', tecnologias: ['React Native', 'Node.js', 'MongoDB', 'PayPhone', 'Expo', 'Redux Toolkit'], categoria: 'Desarrollo Móvil', anio: 2022, urlRepo: '' },
            { titulo: 'App de gestión de flotas para empresa de transporte', descripcion: 'Sistema móvil y web para gestión de flota de 100 vehículos. Tracking GPS, control de combustible, mantenimientos y reportes de conductor. Reducción del 20% en costos operativos.', tecnologias: ['React Native', 'Node.js', 'PostgreSQL', 'Google Maps', 'Socket.io', 'JWT'], categoria: 'Desarrollo Móvil', anio: 2021, urlRepo: 'https://github.com/jxlema-rn/fleet-manager' },
        ],
        certificados: [
            { titulo: 'React Native Avanzado Bootcamp', institucion: 'Udemy', anio: 2020, descripcion: 'Bootcamp de 60 horas sobre React Native con navegación, estado global, animaciones y publicación.' },
            { titulo: 'Mobile App Performance Optimization', institucion: 'LinkedIn Learning', anio: 2021, descripcion: 'Técnicas avanzadas de optimización de rendimiento para apps React Native: profiling y mejoras.' },
        ],
        tituloTesis: 'Desarrollo de una aplicación móvil para la gestión de microcréditos comunitarios basada en indicadores alternativos de riesgo crediticio',
    },
    {
        nombres: 'Daniela Priscila', apellidos: 'Alarcón Vega',
        cedula: '0637890123', telefono: '0821987654',
        genero: 'Femenino', fechaNacimiento: new Date('1999-10-05'),
        emailInstitucional: 'dpalarcon@espoch.edu.ec',
        emailPersonal: 'daniela.alarcon.game@gmail.com',
        bio: 'Desarrolladora de juegos móviles con Unity y Flutter. Combino lógica de programación con creatividad artística. Creé juegos educativos para niños con más de 10.000 descargas.',
        disponibilidad: 'disponible', anioGraduacion: 2023,
        provincia: 'Tungurahua', canton: 'Baños',
        github: 'https://github.com/dpalarcon-games', linkedin: 'https://linkedin.com/in/daniela-alarcon-gamedev',
        proyectos: [
            { titulo: 'Juego educativo de matemáticas para niños', descripcion: 'Juego móvil con Unity para aprender matemáticas de forma divertida, dirigido a niños de 6-10 años. Mecánicas de juego adaptativas, recompensas y control parental. Más de 10.000 descargas en Play Store.', tecnologias: ['Unity', 'C#', 'Firebase', 'Google Play API', 'Spine Animation', 'Addressables'], categoria: 'Desarrollo Móvil', anio: 2023, urlRepo: '' },
            { titulo: 'App de turismo de aventura para Baños', descripcion: 'Guía turística interactiva de Baños de Agua Santa con realidad aumentada, rutas de aventura y reservas de actividades. Ganadora de premio de innovación turística provincial.', tecnologias: ['Flutter', 'ARCore', 'Google Maps', 'Firebase', 'Stripe', 'Dart'], categoria: 'Desarrollo Móvil', anio: 2022, urlRepo: 'https://github.com/dpalarcon-games/banos-ar-tourism' },
        ],
        certificados: [
            { titulo: 'Unity Certified Associate Game Developer', institucion: 'Coursera', anio: 2022, descripcion: 'Certificación oficial de Unity Technologies para desarrollo de juegos 2D y 3D con C#.' },
            { titulo: 'Flutter Game Development Certificado', institucion: 'Udemy', anio: 2023, descripcion: 'Desarrollo de juegos con Flutter usando Flame engine: físicas, sprites y animaciones.' },
        ],
        tituloTesis: 'Desarrollo de un videojuego educativo móvil para el aprendizaje de las operaciones matemáticas básicas en niños de educación primaria',
    },
    {
        nombres: 'Kevin Mauricio', apellidos: 'Salazar Chávez',
        cedula: '0638901234', telefono: '0810876543',
        genero: 'Masculino', fechaNacimiento: new Date('2001-08-18'),
        emailInstitucional: 'kmsalazar@espoch.edu.ec',
        emailPersonal: 'kevin.salazar.pwa@gmail.com',
        bio: 'Desarrollador de Progressive Web Apps y aplicaciones móviles híbridas. Me especializo en crear experiencias que funcionan perfectamente en web y móvil con el mismo código.',
        disponibilidad: 'disponible', anioGraduacion: 2025,
        provincia: 'Guayas', canton: 'Guayaquil',
        github: 'https://github.com/kmsalazar-pwa', linkedin: 'https://linkedin.com/in/kevin-salazar-pwa',
        proyectos: [
            { titulo: 'PWA para gestión de ventas offline-first', descripcion: 'Aplicación web progresiva para vendedores de campo que funciona sin conexión. Sincronización automática de pedidos cuando recupera internet. Service workers, IndexedDB y notificaciones push.', tecnologias: ['React', 'TypeScript', 'Service Workers', 'IndexedDB', 'PWA', 'Node.js'], categoria: 'Desarrollo Móvil', anio: 2025, urlRepo: 'https://github.com/kmsalazar-pwa/field-sales-pwa' },
            { titulo: 'App móvil de voluntariado universitario', descripcion: 'Plataforma para coordinar voluntarios universitarios de la ESPOCH. Registro de horas, insignias digitales, publicación de oportunidades y seguimiento de impacto social.', tecnologias: ['Flutter', 'Firebase', 'Dart', 'Google Maps', 'Lottie', 'Provider'], categoria: 'Desarrollo Móvil', anio: 2024, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Progressive Web Apps Developer Google', institucion: 'Google', anio: 2024, descripcion: 'Certificación de Google sobre desarrollo de PWAs: Service Workers, Manifest, Push API y Web Assembly.' },
            { titulo: 'Flutter Beginners to Advanced', institucion: 'Udemy', anio: 2024, descripcion: 'Ruta completa de Flutter desde fundamentos hasta publicación en stores.' },
        ],
        tituloTesis: 'Desarrollo de una aplicación web progresiva para la coordinación y seguimiento de actividades de voluntariado universitario',
    },

    // ─────────────────────────────────────────────────────
    // BLOQUE 5 — INTELIGENCIA ARTIFICIAL (7)
    // ─────────────────────────────────────────────────────
    {
        nombres: 'María Fernanda', apellidos: 'Lozano Torres',
        cedula: '0602345678', telefono: '0976543210',
        genero: 'Femenino', fechaNacimiento: new Date('1999-07-22'),
        emailInstitucional: 'mflozano@espoch.edu.ec',
        emailPersonal: 'mafe.lozano.ai@gmail.com',
        bio: 'Especialista en inteligencia artificial y machine learning. Graduada con distinción. Enfoco en visión computacional y NLP aplicados a problemas reales del Ecuador.',
        disponibilidad: 'no_disponible', anioGraduacion: 2023,
        provincia: 'Pichincha', canton: 'Quito',
        github: 'https://github.com/mflozano-ai', linkedin: 'https://linkedin.com/in/mariafernanda-lozano',
        proyectos: [
            { titulo: 'Modelo de detección de plagas en cultivos andinos', descripcion: 'Modelo de visión computacional con YOLOv8 para detectar plagas en papa y quinua. Dataset de 3000 imágenes con INIAP. Precisión del 92%. Presentado en congreso de agroinformática 2023.', tecnologias: ['Python', 'YOLOv8', 'OpenCV', 'TensorFlow', 'Pandas', 'NumPy'], categoria: 'Inteligencia Artificial', anio: 2023, urlRepo: 'https://github.com/mflozano-ai/plagas-detector' },
            { titulo: 'Sistema de recomendación para plataforma educativa', descripcion: 'Motor de recomendación colaborativo para cursos online. Aumenté el engagement en un 28% según pruebas A/B.', tecnologias: ['Python', 'Scikit-learn', 'Flask', 'Redis', 'PostgreSQL'], categoria: 'Inteligencia Artificial', anio: 2023, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Machine Learning Specialization Stanford', institucion: 'Coursera', anio: 2022, descripcion: 'Especialización de 3 cursos de Andrew Ng sobre regresión, redes neuronales y sistemas de recomendación.' },
            { titulo: 'TensorFlow Developer Certificate Google', institucion: 'Google', anio: 2023, descripcion: 'Certificación oficial de Google para desarrollo con TensorFlow en clasificación, detección y NLP.' },
        ],
        tituloTesis: 'Implementación de un modelo de deep learning para la clasificación automática de enfermedades dermatológicas en imágenes médicas',
    },
    {
        nombres: 'Wilson Rodrigo', apellidos: 'Escobar Jiménez',
        cedula: '0639012345', telefono: '0809765432',
        genero: 'Masculino', fechaNacimiento: new Date('1997-02-28'),
        emailInstitucional: 'wrestcobar@espoch.edu.ec',
        emailPersonal: 'wilson.escobar.nlp@gmail.com',
        bio: 'Investigador en procesamiento de lenguaje natural con foco en el español latinoamericano. Construyo modelos NLP adaptados a las particularidades del español ecuatoriano.',
        disponibilidad: 'disponible', anioGraduacion: 2021,
        provincia: 'Pichincha', canton: 'Quito',
        github: 'https://github.com/wrestcobar-nlp', linkedin: 'https://linkedin.com/in/wilson-escobar-nlp',
        proyectos: [
            { titulo: 'Chatbot de atención ciudadana para municipio', descripcion: 'Sistema de chatbot con NLP para atención ciudadana del Municipio de Quito. Entrenado con 10.000 consultas reales. Resuelve el 70% de consultas sin intervención humana. Atiende 500 ciudadanos diarios.', tecnologias: ['Python', 'Rasa', 'spaCy', 'FastAPI', 'PostgreSQL', 'Docker'], categoria: 'Inteligencia Artificial', anio: 2021, urlRepo: '' },
            { titulo: 'Análisis de sentimientos en redes sociales ecuatorianas', descripcion: 'Modelo BERT fine-tuneado para análisis de sentimientos en Spanish de Ecuador. Dataset propio de 50.000 tweets etiquetados. F1-score de 0.89 superando modelos genéricos en un 15%.', tecnologias: ['Python', 'HuggingFace', 'PyTorch', 'BERT', 'Pandas', 'scikit-learn'], categoria: 'Inteligencia Artificial', anio: 2022, urlRepo: 'https://github.com/wrestcobar-nlp/ec-sentiment' },
        ],
        certificados: [
            { titulo: 'Natural Language Processing Specialization DeepLearning.AI', institucion: 'Coursera', anio: 2021, descripcion: 'Especialización de 4 cursos sobre NLP, RNNs, transformers, y aplicaciones de lenguaje natural.' },
            { titulo: 'HuggingFace NLP Course Certificate', institucion: 'edX', anio: 2022, descripcion: 'Curso oficial de HuggingFace sobre transformers, fine-tuning y despliegue de modelos NLP.' },
        ],
        tituloTesis: 'Desarrollo de un modelo de procesamiento de lenguaje natural para la clasificación automática de quejas ciudadanas en municipios ecuatorianos',
    },
    {
        nombres: 'Priscila Stefanía', apellidos: 'Molina Fonseca',
        cedula: '0640123456', telefono: '0898643210',
        genero: 'Femenino', fechaNacimiento: new Date('2000-09-14'),
        emailInstitucional: 'psmolina@espoch.edu.ec',
        emailPersonal: 'priscila.molina.cv@gmail.com',
        bio: 'Especialista en visión computacional y análisis de imágenes médicas. Mi trabajo une tecnología y salud para mejorar diagnósticos en Ecuador.',
        disponibilidad: 'disponible', anioGraduacion: 2024,
        provincia: 'Chimborazo', canton: 'Riobamba',
        github: 'https://github.com/psmolina-cv', linkedin: 'https://linkedin.com/in/priscila-molina-cv',
        proyectos: [
            { titulo: 'Sistema de detección de retinopatía diabética', descripcion: 'Modelo de deep learning para screening de retinopatía diabética en imágenes de fondo de ojo. Sensibilidad del 94% y especificidad del 91%. Validado con oftalmólogos del IESS Riobamba.', tecnologias: ['Python', 'TensorFlow', 'OpenCV', 'NumPy', 'Flask', 'Docker'], categoria: 'Inteligencia Artificial', anio: 2024, urlRepo: 'https://github.com/psmolina-cv/retinopatia-detector' },
            { titulo: 'Clasificación automática de radiografías de tórax', descripcion: 'CNN para detección de neumonía, tuberculosis y COVID en radiografías. Entrenado con dataset de 15.000 imágenes. Acierto del 93%. Herramienta de apoyo diagnóstico para centros de salud rurales.', tecnologias: ['Python', 'PyTorch', 'torchvision', 'OpenCV', 'Gradio', 'NumPy'], categoria: 'Inteligencia Artificial', anio: 2023, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Deep Learning Specialization DeepLearning.AI', institucion: 'Coursera', anio: 2023, descripcion: 'Cinco cursos sobre redes neuronales profundas, CNNs, RNNs y transformers.' },
            { titulo: 'Medical Image Analysis with Deep Learning', institucion: 'edX', anio: 2024, descripcion: 'Curso especializado en análisis de imágenes médicas con redes neuronales convolucionales.' },
        ],
        tituloTesis: 'Desarrollo de un sistema de inteligencia artificial para el diagnóstico asistido de retinopatía diabética mediante análisis de imágenes oftalmológicas',
    },
    {
        nombres: 'Diego Paúl', apellidos: 'Castillo Heredia',
        cedula: '0641234567', telefono: '0887532109',
        genero: 'Masculino', fechaNacimiento: new Date('1998-11-01'),
        emailInstitucional: 'dpcastillo@espoch.edu.ec',
        emailPersonal: 'diego.castillo.rl@gmail.com',
        bio: 'Ingeniero de machine learning con especialización en aprendizaje por refuerzo y optimización. Construyo agentes inteligentes para problemas de optimización en logística y finanzas.',
        disponibilidad: 'no_disponible', anioGraduacion: 2022,
        provincia: 'Guayas', canton: 'Guayaquil',
        github: 'https://github.com/dpcastillo-ml', linkedin: 'https://linkedin.com/in/diego-castillo-ml',
        proyectos: [
            { titulo: 'Optimización de rutas de entrega con RL', descripcion: 'Agente de aprendizaje por refuerzo para optimizar rutas de reparto de empresa logística. Reducción del 18% en kilómetros recorridos y 25% menos de combustible frente al algoritmo anterior.', tecnologias: ['Python', 'Stable-Baselines3', 'OR-Tools', 'NumPy', 'Pandas', 'FastAPI'], categoria: 'Inteligencia Artificial', anio: 2022, urlRepo: 'https://github.com/dpcastillo-ml/rl-delivery' },
            { titulo: 'Modelo predictivo de morosidad bancaria', descripcion: 'Modelo de clasificación para predecir morosidad en cartera de crédito. Uso de XGBoost con SHAP para explicabilidad. AUC-ROC de 0.92. Implementado en producción con monitoreo de drift.', tecnologias: ['Python', 'XGBoost', 'SHAP', 'MLflow', 'scikit-learn', 'PostgreSQL'], categoria: 'Inteligencia Artificial', anio: 2023, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'MLOps Specialization DeepLearning.AI', institucion: 'Coursera', anio: 2022, descripcion: 'Especialización de 4 cursos sobre productivización de modelos ML: MLflow, monitoreo y CI/CD.' },
            { titulo: 'Reinforcement Learning Course University of Alberta', institucion: 'Coursera', anio: 2022, descripcion: 'Fundamentos teóricos y prácticos del aprendizaje por refuerzo: Q-learning, policy gradients.' },
        ],
        tituloTesis: 'Implementación de un sistema de aprendizaje por refuerzo para la optimización de rutas de distribución en empresas de logística ecuatorianas',
    },
    {
        nombres: 'Catalina Alejandra', apellidos: 'Freire Montoya',
        cedula: '0642345678', telefono: '0876420987',
        genero: 'Femenino', fechaNacimiento: new Date('2001-03-11'),
        emailInstitucional: 'cafreire@espoch.edu.ec',
        emailPersonal: 'catalina.freire.genai@gmail.com',
        bio: 'Desarrolladora de aplicaciones con IA generativa. Integro LLMs en sistemas empresariales usando LangChain y APIs. Apasionada por la democratización de la IA en Ecuador.',
        disponibilidad: 'disponible', anioGraduacion: 2025,
        provincia: 'Chimborazo', canton: 'Riobamba',
        github: 'https://github.com/cafreire-genai', linkedin: 'https://linkedin.com/in/catalina-freire-genai',
        proyectos: [
            { titulo: 'Asistente legal con IA para PYMES', descripcion: 'Chatbot legal basado en RAG con la legislación ecuatoriana actualizada. Responde consultas sobre contratos, laboral y comercial. Validado con abogados. Ahorra en promedio 2 horas de consulta jurídica por empresa.', tecnologias: ['Python', 'LangChain', 'OpenAI API', 'ChromaDB', 'FastAPI', 'React'], categoria: 'Inteligencia Artificial', anio: 2025, urlRepo: 'https://github.com/cafreire-genai/legal-assistant' },
            { titulo: 'Generador automático de informes ejecutivos', descripcion: 'Sistema que analiza datos de negocio y genera reportes narrativos con gráficas automáticas usando LLMs. Integrado con Google Sheets y Power BI. Reduce la preparación de informes de 3 horas a 10 minutos.', tecnologias: ['Python', 'LangChain', 'GPT-4 API', 'Pandas', 'Plotly', 'FastAPI'], categoria: 'Inteligencia Artificial', anio: 2025, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'LangChain for LLM Application Development', institucion: 'Coursera', anio: 2024, descripcion: 'Curso de DeepLearning.AI sobre construcción de apps con LangChain, RAG, chains y agentes.' },
            { titulo: 'Prompt Engineering for Developers OpenAI', institucion: 'edX', anio: 2024, descripcion: 'Certificación de OpenAI sobre técnicas avanzadas de prompt engineering y uso de APIs de IA.' },
        ],
        tituloTesis: 'Desarrollo de un asistente virtual jurídico basado en modelos de lenguaje de gran escala para la asesoría legal de pequeñas y medianas empresas ecuatorianas',
    },
    {
        nombres: 'Mauricio Alfredo', apellidos: 'Montoya Arévalo',
        cedula: '0643456789', telefono: '0865309876',
        genero: 'Masculino', fechaNacimiento: new Date('1997-06-20'),
        emailInstitucional: 'mamontoya@espoch.edu.ec',
        emailPersonal: 'mauricio.montoya.robotica@gmail.com',
        bio: 'Investigador en robótica e IA aplicada. Combino ROS, visión computacional y aprendizaje por refuerzo para desarrollar robots con comportamiento inteligente.',
        disponibilidad: 'no_disponible', anioGraduacion: 2021,
        provincia: 'Pichincha', canton: 'Quito',
        github: 'https://github.com/mamontoya-robotics', linkedin: 'https://linkedin.com/in/mauricio-montoya-robotica',
        proyectos: [
            { titulo: 'Robot de inspección de infraestructura con visión', descripcion: 'Robot autónomo con ROS 2 y cámara de profundidad para inspección de instalaciones industriales. Detecta grietas, corrosión y objetos fuera de lugar. Pilotado en planta CELEC en Riobamba.', tecnologias: ['Python', 'ROS 2', 'OpenCV', 'YOLOv8', 'PyTorch', 'Raspberry Pi'], categoria: 'Inteligencia Artificial', anio: 2022, urlRepo: 'https://github.com/mamontoya-robotics/inspection-robot' },
            { titulo: 'Simulador de vehículo autónomo para ciudad ecuatoriana', descripcion: 'Entorno de simulación en CARLA con modelos de tráfico ecuatoriano para entrenamiento de agentes de conducción autónoma. Dataset de señalización ecuatoriana de 5000 imágenes anotadas.', tecnologias: ['Python', 'CARLA Simulator', 'ROS', 'PyTorch', 'OpenCV', 'NumPy'], categoria: 'Inteligencia Artificial', anio: 2023, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Self-Driving Cars Specialization Toronto', institucion: 'Coursera', anio: 2021, descripcion: 'Especialización de 4 cursos sobre vehículos autónomos: percepción, planeación y control.' },
            { titulo: 'ROS2 for Beginners to Advanced Robotics', institucion: 'Udemy', anio: 2022, descripcion: 'Curso completo de ROS2: nodos, tópicos, servicios, actions y simulación con Gazebo.' },
        ],
        tituloTesis: 'Desarrollo de un sistema de navegación autónoma para robots móviles en entornos industriales usando visión computacional y aprendizaje por refuerzo',
    },
    {
        nombres: 'Erika Pamela', apellidos: 'Chávez Ushca',
        cedula: '0644567890', telefono: '0854198765',
        genero: 'Femenino', fechaNacimiento: new Date('2000-07-16'),
        emailInstitucional: 'epchavez@espoch.edu.ec',
        emailPersonal: 'erika.chavez.analytics@gmail.com',
        bio: 'Data scientist con especialización en análisis predictivo y ML interpretable. Construyo modelos que no solo son precisos sino explicables para tomadores de decisión no técnicos.',
        disponibilidad: 'disponible', anioGraduacion: 2024,
        provincia: 'Tungurahua', canton: 'Ambato',
        github: 'https://github.com/epchavez-ds', linkedin: 'https://linkedin.com/in/erika-chavez-datascience',
        proyectos: [
            { titulo: 'Modelo predictivo de deserción estudiantil', descripcion: 'Sistema de alerta temprana de riesgo de abandono universitario para la ESPOCH. Identifica estudiantes en riesgo con 85% de exactitud. Modelo explicable con SHAP para que los tutores puedan actuar.', tecnologias: ['Python', 'scikit-learn', 'SHAP', 'Pandas', 'Streamlit', 'PostgreSQL'], categoria: 'Inteligencia Artificial', anio: 2024, urlRepo: 'https://github.com/epchavez-ds/desercion-universitaria' },
            { titulo: 'Análisis de demanda de servicios de salud pública', descripcion: 'Modelo de series de tiempo para predicción de demanda en centros de salud del MSP Zona 3. MAPE del 8%. Ayuda a planificación de personal médico y medicamentos con 6 semanas de anticipación.', tecnologias: ['Python', 'Prophet', 'statsmodels', 'Pandas', 'Power BI', 'FastAPI'], categoria: 'Inteligencia Artificial', anio: 2023, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Data Science Professional IBM Certificate', institucion: 'Coursera', anio: 2023, descripcion: 'Certificación de IBM en ciencia de datos cubriendo Python, SQL, ML y visualización de datos.' },
            { titulo: 'Interpretable Machine Learning Course', institucion: 'edX', anio: 2024, descripcion: 'Técnicas de IA explicable: SHAP, LIME, Partial Dependence Plots y modelos transparentes.' },
        ],
        tituloTesis: 'Implementación de un sistema de alerta temprana para la predicción y prevención de la deserción estudiantil en universidades ecuatorianas',
    },

    // ─────────────────────────────────────────────────────
    // BLOQUE 6 — CIBERSEGURIDAD (4)
    // ─────────────────────────────────────────────────────
    {
        nombres: 'Diego Alejandro', apellidos: 'Paredes Ortega',
        cedula: '0605678901', telefono: '0943210987',
        genero: 'Masculino', fechaNacimiento: new Date('1996-09-30'),
        emailInstitucional: 'daparedes@espoch.edu.ec',
        emailPersonal: 'diego.paredes.security@gmail.com',
        bio: 'Especialista en ciberseguridad con enfoque en pentesting y análisis forense. Certificado CEH. Trabajo en empresa de auditoría de seguridad en Quito.',
        disponibilidad: 'no_disponible', anioGraduacion: 2020,
        provincia: 'Pichincha', canton: 'Quito',
        github: 'https://github.com/dparedes-sec', linkedin: 'https://linkedin.com/in/diego-paredes-ciberseguridad',
        proyectos: [
            { titulo: 'Herramienta automatizada de auditoría OWASP Top 10', descripcion: 'Herramienta Python que automatiza pruebas de penetración web según OWASP. Detecta XSS, SQLi, CSRF y misconfigurations. Usada en más de 30 auditorías a empresas ecuatorianas. 200 estrellas en GitHub.', tecnologias: ['Python', 'Bash', 'OWASP', 'Burp Suite', 'Nmap', 'Metasploit'], categoria: 'Ciberseguridad', anio: 2020, urlRepo: 'https://github.com/dparedes-sec/web-audit-tool' },
            { titulo: 'Sistema IDS para PYMES ecuatorianas', descripcion: 'Sistema de detección de intrusiones accesible para pequeñas empresas. Panel de alertas en tiempo real. Implementado en 5 empresas. Detectó y previno 3 ataques reales en el primer mes.', tecnologias: ['Python', 'Snort', 'Linux', 'ELK Stack', 'Docker', 'React'], categoria: 'Ciberseguridad', anio: 2021, urlRepo: 'https://github.com/dparedes-sec/ids-pyme' },
        ],
        certificados: [
            { titulo: 'Certified Ethical Hacker CEH EC-Council', institucion: 'EC-Council', anio: 2020, descripcion: 'Certificación CEH v11. Metodologías de hacking ético, footprinting, scanning y exploitation. 85%.' },
            { titulo: 'CompTIA Security Plus Certificado', institucion: 'CompTIA', anio: 2019, descripcion: 'Certificación CompTIA Security+ en seguridad de redes, amenazas, criptografía y cumplimiento.' },
        ],
        tituloTesis: 'Implementación de un sistema de detección y prevención de intrusiones basado en machine learning para redes empresariales pequeñas y medianas',
    },
    {
        nombres: 'Margarita Elena', apellidos: 'Cueva Valdez',
        cedula: '0645678901', telefono: '0843087654',
        genero: 'Femenino', fechaNacimiento: new Date('1999-01-30'),
        emailInstitucional: 'mecueva@espoch.edu.ec',
        emailPersonal: 'margarita.cueva.soc@gmail.com',
        bio: 'Analista de seguridad en SOC con experiencia en respuesta a incidentes y threat hunting. Especialista en SIEM y análisis de logs para detección de amenazas avanzadas.',
        disponibilidad: 'no_disponible', anioGraduacion: 2022,
        provincia: 'Azuay', canton: 'Cuenca',
        github: 'https://github.com/mecueva-soc', linkedin: 'https://linkedin.com/in/margarita-cueva-soc',
        proyectos: [
            { titulo: 'Implementación de SIEM con Elastic Stack para banco', descripcion: 'Desplegué solución SIEM basada en Elastic Stack para banco local. Centralización de logs de 80 dispositivos, correlación de eventos y detección de amenazas. Redujo tiempo de detección de incidentes de días a minutos.', tecnologias: ['Elasticsearch', 'Logstash', 'Kibana', 'Wazuh', 'Python', 'Linux'], categoria: 'Ciberseguridad', anio: 2022, urlRepo: '' },
            { titulo: 'Framework de respuesta a incidentes automatizado', descripcion: 'Playbooks automatizados de respuesta a incidentes integrados con Jira y Slack. Orquestación con TheHive y Cortex. Redujo el tiempo de respuesta inicial en un 60%.', tecnologias: ['Python', 'TheHive', 'Cortex', 'MISP', 'Jira API', 'Slack API'], categoria: 'Ciberseguridad', anio: 2023, urlRepo: 'https://github.com/mecueva-soc/ir-automation' },
        ],
        certificados: [
            { titulo: 'Certified SOC Analyst CSA EC-Council', institucion: 'EC-Council', anio: 2022, descripcion: 'Certificación de analista de Centro de Operaciones de Seguridad. Monitoreo, detección y respuesta a incidentes.' },
            { titulo: 'Blue Team Junior Analyst Certification', institucion: 'LinkedIn Learning', anio: 2021, descripcion: 'Certificación de analista de equipo defensor: análisis forense, threat hunting y SIEM.' },
        ],
        tituloTesis: 'Diseño e implementación de un centro de operaciones de seguridad para medianas empresas del sector financiero ecuatoriano',
    },
    {
        nombres: 'Alexander Wladimir', apellidos: 'Zuñiga Pancho',
        cedula: '0646789012', telefono: '0832076543',
        genero: 'Masculino', fechaNacimiento: new Date('1998-06-04'),
        emailInstitucional: 'awzuniga@espoch.edu.ec',
        emailPersonal: 'alexander.zuniga.appsec@gmail.com',
        bio: 'Especialista en seguridad de aplicaciones (AppSec). Integro seguridad en el ciclo de vida del desarrollo. Experto en análisis de código estático y revisión de arquitecturas seguras.',
        disponibilidad: 'disponible', anioGraduacion: 2022,
        provincia: 'Chimborazo', canton: 'Riobamba',
        github: 'https://github.com/awzuniga-appsec', linkedin: 'https://linkedin.com/in/alexander-zuniga-appsec',
        proyectos: [
            { titulo: 'Pipeline de análisis de seguridad en CI/CD', descripcion: 'Integré herramientas de SAST, DAST y SCA en pipeline de CI/CD de empresa de software. Detección automática de vulnerabilidades en cada commit. Reducción del 75% en vulnerabilidades que llegaban a producción.', tecnologias: ['SonarQube', 'OWASP ZAP', 'Snyk', 'GitHub Actions', 'Docker', 'Python'], categoria: 'Ciberseguridad', anio: 2022, urlRepo: 'https://github.com/awzuniga-appsec/devsecops-pipeline' },
            { titulo: 'Auditoría de seguridad de apps móviles', descripcion: 'Framework de pruebas de seguridad para aplicaciones móviles Android e iOS basado en OWASP MASVS. Audité 15 apps de instituciones financieras ecuatorianas y detecté vulnerabilidades críticas en 11 de ellas.', tecnologias: ['MobSF', 'Frida', 'Burp Suite', 'Python', 'ADB', 'iOS Jailbreak tools'], categoria: 'Ciberseguridad', anio: 2023, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'OWASP Web Security Testing Certificado', institucion: 'edX', anio: 2022, descripcion: 'Certificación sobre pruebas de seguridad web según metodología OWASP WSTG.' },
            { titulo: 'Certified Application Security Engineer CASE', institucion: 'EC-Council', anio: 2023, descripcion: 'Certificación de ingeniería de seguridad de aplicaciones con prácticas de DevSecOps.' },
        ],
        tituloTesis: 'Implementación de un proceso de integración de seguridad en el ciclo de vida del desarrollo de software para empresas de tecnología ecuatorianas',
    },
    {
        nombres: 'Sabrina Lissette', apellidos: 'Araujo Merino',
        cedula: '0647890123', telefono: '0821965432',
        genero: 'Femenino', fechaNacimiento: new Date('2001-11-22'),
        emailInstitucional: 'slaraujo@espoch.edu.ec',
        emailPersonal: 'sabrina.araujo.forense@gmail.com',
        bio: 'Especialista en análisis forense digital y ciberdelitos. Trabajo con instituciones legales y policiales para investigación de evidencia digital. Perito informático certificado.',
        disponibilidad: 'disponible', anioGraduacion: 2025,
        provincia: 'Pichincha', canton: 'Quito',
        github: 'https://github.com/slaraujo-forensics', linkedin: 'https://linkedin.com/in/sabrina-araujo-forense',
        proyectos: [
            { titulo: 'Plataforma de cadena de custodia digital', descripcion: 'Sistema web para gestión de evidencia digital en investigaciones forenses. Registro inmutable en blockchain, hashes de integridad y trazabilidad completa. Adoptado por firma de abogados penalistas en Quito.', tecnologias: ['Python', 'Django', 'Ethereum', 'Solidity', 'PostgreSQL', 'React'], categoria: 'Ciberseguridad', anio: 2025, urlRepo: 'https://github.com/slaraujo-forensics/cadena-custodia' },
            { titulo: 'Herramienta de análisis forense de dispositivos móviles', descripcion: 'Software de extracción y análisis de datos de dispositivos Android para uso forense. Recupera mensajes, fotos, ubicaciones y aplicaciones borradas. Cumple con estándares de evidencia digital.', tecnologias: ['Python', 'ADB', 'SQLite', 'Autopsy', 'Linux', 'Volatility'], categoria: 'Ciberseguridad', anio: 2024, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Certified Digital Forensics Examiner CDFE', institucion: 'Coursera', anio: 2024, descripcion: 'Certificación sobre investigación forense digital, análisis de evidencia y metodología de peritaje.' },
            { titulo: 'Mobile Forensics and Investigation', institucion: 'LinkedIn Learning', anio: 2025, descripcion: 'Especialización en forense móvil para Android e iOS: extracción, análisis y presentación de evidencia.' },
        ],
        tituloTesis: 'Desarrollo de un sistema de gestión de evidencia digital con garantías de integridad basado en blockchain para procesos de investigación forense',
    },

    // ─────────────────────────────────────────────────────
    // BLOQUE 7 — DEVOPS / CLOUD (3)
    // ─────────────────────────────────────────────────────
    {
        nombres: 'Cristian Marcelo', apellidos: 'Ayala Guerrero',
        cedula: '0648901234', telefono: '0810854321',
        genero: 'Masculino', fechaNacimiento: new Date('1997-04-06'),
        emailInstitucional: 'cmayala@espoch.edu.ec',
        emailPersonal: 'cristian.ayala.devops@gmail.com',
        bio: 'Ingeniero DevOps con experiencia en CI/CD y automatización de infraestructura. Apasionado por la cultura de colaboración entre desarrollo y operaciones. Certificado AWS y Kubernetes.',
        disponibilidad: 'no_disponible', anioGraduacion: 2021,
        provincia: 'Pichincha', canton: 'Quito',
        github: 'https://github.com/cmayala-devops', linkedin: 'https://linkedin.com/in/cristian-ayala-devops',
        proyectos: [
            { titulo: 'Plataforma de CI/CD para empresa de 50 devs', descripcion: 'Implementé pipeline de CI/CD completo con GitOps para empresa de desarrollo. Despliegues automáticos en Kubernetes con ArgoCD. Reducción del tiempo de entrega de features de 2 semanas a 2 días.', tecnologias: ['GitHub Actions', 'ArgoCD', 'Kubernetes', 'Docker', 'Helm', 'AWS EKS'], categoria: 'DevOps', anio: 2022, urlRepo: 'https://github.com/cmayala-devops/gitops-platform' },
            { titulo: 'Sistema de gestión de secretos y configuración', descripcion: 'Centralización de gestión de secretos con HashiCorp Vault y configuración con Consul para microservicios de empresa fintech. Eliminación de secretos hardcodeados en código. Auditoría completa de accesos.', tecnologias: ['HashiCorp Vault', 'Consul', 'Terraform', 'Docker', 'Kubernetes', 'Python'], categoria: 'DevOps', anio: 2023, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Certified Kubernetes Administrator CKA CNCF', institucion: 'edX', anio: 2022, descripcion: 'Certificación oficial de CNCF para administración de clústers Kubernetes en producción.' },
            { titulo: 'AWS DevOps Engineer Professional', institucion: 'AWS', anio: 2022, descripcion: 'Certificación de AWS para ingenieros DevOps. CI/CD, monitoreo, IaC y automatización.' },
        ],
        tituloTesis: 'Implementación de una estrategia GitOps para la automatización del despliegue de aplicaciones en contenedores en entornos de producción',
    },
    {
        nombres: 'Jéssica Paola', apellidos: 'Romero Gómez',
        cedula: '0649012345', telefono: '0899743210',
        genero: 'Femenino', fechaNacimiento: new Date('1998-09-23'),
        emailInstitucional: 'jpromero@espoch.edu.ec',
        emailPersonal: 'jessica.romero.sre@gmail.com',
        bio: 'Site Reliability Engineer con experiencia en sistemas de alta disponibilidad. Me especializo en reducir la carga operativa con automatización y diseño de sistemas que se autocuran.',
        disponibilidad: 'disponible', anioGraduacion: 2022,
        provincia: 'Guayas', canton: 'Guayaquil',
        github: 'https://github.com/jpromero-sre', linkedin: 'https://linkedin.com/in/jessica-romero-sre',
        proyectos: [
            { titulo: 'Sistema de auto-healing para infraestructura cloud', descripcion: 'Implementé mecanismos de autocorrección para infraestructura de e-commerce. Detección automática de servicios caídos y restauración sin intervención humana. SLA mejorado al 99.98%.',  tecnologias: ['Kubernetes', 'Prometheus', 'Python', 'AWS Lambda', 'PagerDuty', 'Terraform'], categoria: 'DevOps', anio: 2023, urlRepo: 'https://github.com/jpromero-sre/auto-healing' },
            { titulo: 'Optimización de costos cloud con FinOps', descripcion: 'Análisis y optimización de costos AWS para empresa de 20 microservicios. Rightsizing, reservas y spot instances. Reducción de factura mensual de AWS en un 42% sin degradar rendimiento.', tecnologias: ['AWS Cost Explorer', 'Terraform', 'Python', 'Grafana', 'CloudHealth', 'Boto3'], categoria: 'DevOps', anio: 2022, urlRepo: '' },
        ],
        certificados: [
            { titulo: 'Google Cloud Professional DevOps Engineer', institucion: 'Google', anio: 2022, descripcion: 'Certificación profesional de GCP para ingenieros SRE y DevOps.' },
            { titulo: 'Site Reliability Engineering Fundamentals Google', institucion: 'Coursera', anio: 2022, descripcion: 'Curso de Google sobre principios y prácticas de Site Reliability Engineering.' },
        ],
        tituloTesis: 'Implementación de prácticas de Site Reliability Engineering para la mejora de la disponibilidad y rendimiento de aplicaciones críticas en la nube',
    },
    {
        nombres: 'Tomás Eduardo', apellidos: 'Puga Estrella',
        cedula: '0650123456', telefono: '0888632109',
        genero: 'Masculino', fechaNacimiento: new Date('1996-12-10'),
        emailInstitucional: 'tepuga@espoch.edu.ec',
        emailPersonal: 'tomas.puga.multicloud@gmail.com',
        bio: 'Arquitecto multicloud con experiencia en AWS, Azure y GCP. Diseño estrategias de nube que equilibran costo, rendimiento y cumplimiento regulatorio para empresas ecuatorianas.',
        disponibilidad: 'no_disponible', anioGraduacion: 2020,
        provincia: 'Chimborazo', canton: 'Riobamba',
        github: 'https://github.com/tepuga-cloud', linkedin: 'https://linkedin.com/in/tomas-puga-multicloud',
        proyectos: [
            { titulo: 'Arquitectura multicloud para empresa de medios', descripcion: 'Diseñé arquitectura distribuida en AWS y Azure para empresa de medios de comunicación. Distribución de contenido en CDN global con latencia menor a 100ms en toda Latinoamérica. Cero downtime en eventos de alto tráfico.', tecnologias: ['AWS', 'Azure', 'Terraform', 'Cloudflare', 'Docker', 'Kubernetes', 'Ansible'], categoria: 'DevOps', anio: 2021, urlRepo: '' },
            { titulo: 'Plataforma PaaS privada con Kubernetes para universidad', descripcion: 'Plataforma de plataforma como servicio privada para que estudiantes y docentes de ESPOCH desplieguen aplicaciones sin conocer Kubernetes. Portal web de autoservicio con límites de recursos por usuario.', tecnologias: ['Kubernetes', 'Helm', 'KubeApps', 'Istio', 'Keycloak', 'React', 'Node.js'], categoria: 'DevOps', anio: 2022, urlRepo: 'https://github.com/tepuga-cloud/espoch-paas' },
        ],
        certificados: [
            { titulo: 'AWS Solutions Architect Associate', institucion: 'AWS', anio: 2020, descripcion: 'Certificación de arquitecto de soluciones en AWS. Diseño de sistemas escalables y seguros.' },
            { titulo: 'Microsoft Azure Administrator AZ-104', institucion: 'Microsoft', anio: 2021, descripcion: 'Certificación de administración de Azure: redes, almacenamiento, máquinas virtuales e identidad.' },
        ],
        tituloTesis: 'Diseño de una arquitectura multicloud para la distribución y alta disponibilidad de sistemas de información universitarios en Ecuador',
    },

]; // fin GRADUADOS_DATA

// ══════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL
// ══════════════════════════════════════════════════════════

const seed = async () => {
    try {
        console.log('🔗 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        if (LIMPIAR_ANTES) {
            console.log('🧹 Limpiando datos previos de seeds...');
            const emails = GRADUADOS_DATA.map(g => g.emailInstitucional);
            const graduadosPrevios = await Graduado.find({ emailInstitucional: { $in: emails } });
            const ids = graduadosPrevios.map(g => g._id);
            await Promise.all([
                Graduado.deleteMany({ emailInstitucional: { $in: emails } }),
                Proyecto.deleteMany({ graduado: { $in: ids } }),
                Certificado.deleteMany({ graduado: { $in: ids } }),
                Tesis.deleteMany({ graduado: { $in: ids } }),
            ]);
            console.log(`🗑️  Eliminados ${graduadosPrevios.length} graduados previos`);
        }

        const passwordHash = await bcrypt.hash(PASSWORD_SEED, 10);
        let creados  = 0;
        let omitidos = 0;

        for (const data of GRADUADOS_DATA) {
            try {
                const existe = await Graduado.findOne({ emailInstitucional: data.emailInstitucional });
                if (existe) {
                    console.log(`⏭️  Ya existe: ${data.nombres} ${data.apellidos}`);
                    omitidos++;
                    continue;
                }

                const afinidades      = calcularAfinidades(data.proyectos);
                const tecnologias     = extraerTecnologias(data.proyectos);
                const habilidadesBlandas = asignarHabilidades();

                const graduado = await Graduado.create({
                    nombres:            data.nombres,
                    apellidos:          data.apellidos,
                    cedula:             encriptar(data.cedula),
                    cedulaHash:         hashParaBusqueda(data.cedula),
                    telefono:           encriptar(data.telefono),
                    telefonoHash:       hashParaBusqueda(data.telefono),
                    genero:             data.genero,
                    fechaNacimiento:    data.fechaNacimiento,
                    tieneDiscapacidad:  'No',
                    ciudadania:         'Nacional',
                    emailInstitucional: data.emailInstitucional,
                    emailPersonal:      data.emailPersonal,
                    emailPersonalHash:  hashParaBusqueda(data.emailPersonal),
                    password:           passwordHash,
                    verificado:         true,
                    bio:                data.bio,
                    fotoPerfil:         '',
                    disponibilidad:     data.disponibilidad,
                    github:             data.github,
                    linkedin:           data.linkedin,
                    provinciaActual:    data.provincia,
                    cantonActual:       data.canton,
                    anioGraduacion:     data.anioGraduacion,
                    tesisVerificada:    true,
                    perfilPublico:      true,
                    terminosAceptados:  true,
                    fechaAceptacion:    new Date(),
                    tecnologias,
                    afinidades,
                    habilidadesBlandas,
                    perfilCompletado:   80,
                });

                for (const proy of data.proyectos) {
                    await Proyecto.create({
                        graduado:         graduado._id,
                        titulo:           proy.titulo,
                        descripcion:      proy.descripcion,
                        tecnologias:      proy.tecnologias,
                        urlRepositorio:   proy.urlRepo || '',
                        imagen:           'uploads/seed/proyecto_placeholder.jpg',
                        fechaRealizacion: new Date(`${proy.anio}-06-15`),
                        categoria:        proy.categoria,
                        activo:           true,
                    });
                }

                for (const cert of data.certificados) {
                    await Certificado.create({
                        graduado:          graduado._id,
                        titulo:            cert.titulo,
                        institucion:       cert.institucion,
                        fechaFinalizacion: new Date(`${cert.anio}-09-01`),
                        url:               `https://verify.seed.example.com/${Math.random().toString(36).slice(2, 10)}`,
                        descripcion:       cert.descripcion,
                        archivo:           'uploads/seed/certificado_placeholder.jpg',
                        tipoArchivo:       'imagen',
                    });
                }

                const metodologias = ['Scrum', 'XP', 'Kanban', 'Cascada'];
                const metodo       = metodologias[Math.floor(Math.random() * metodologias.length)];
                const fechaTesis   = new Date(`${data.anioGraduacion}-11-20`);

                await Tesis.create({
                    graduado:               graduado._id,
                    titulo:                 data.tituloTesis,
                    resumen:                `Esta investigación presenta el desarrollo e implementación de ${data.tituloTesis.toLowerCase()}. Se utilizó metodología ${metodo} y se aplicaron las mejores prácticas de ingeniería de software. Los resultados demuestran que la solución desarrollada mejora significativamente los procesos involucrados, con un incremento en la eficiencia del 35% y una reducción de errores del 60%. El sistema fue validado con usuarios reales y obtuvo una calificación de satisfacción de 4.5 sobre 5.`,
                    urlDspace:              `https://dspace.espoch.edu.ec/handle/123456789/${Math.floor(Math.random() * 9000) + 1000}`,
                    tituloEncontrado:       data.tituloTesis,
                    autoresEncontrados:     [`${data.apellidos} ${data.nombres}`],
                    fechaPublicacion:       fechaTesis,
                    verificada:             true,
                    fechaVerificacion:      fechaTesis,
                    consentimientoAceptado: true,
                    fechaConsentimiento:    fechaTesis,
                    ipConsentimiento:       '127.0.0.1',
                });

                creados++;
                console.log(`✅ ${creados.toString().padStart(2)}. ${data.nombres} ${data.apellidos} — ${data.provincia} (${data.anioGraduacion})`);

            } catch (err) {
                console.error(`❌ Error con ${data.nombres} ${data.apellidos}:`, err.message);
            }
        }

        console.log('\n══════════════════════════════════════════════════════');
        console.log(`🎉 SEED COMPLETADO`);
        console.log(`   ✅ Creados:    ${creados} graduados`);
        console.log(`   ⏭️  Omitidos:  ${omitidos} (ya existían)`);
        console.log(`   🔑 Contraseña: ${PASSWORD_SEED}`);
        console.log(`   📊 Total en BD:   ${await Graduado.countDocuments()} graduados`);
        console.log(`   📁 Proyectos:     ${await Proyecto.countDocuments()}`);
        console.log(`   🎓 Certificados:  ${await Certificado.countDocuments()}`);
        console.log(`   📄 Tesis:         ${await Tesis.countDocuments()}`);
        console.log('══════════════════════════════════════════════════════\n');

    } catch (err) {
        console.error('❌ Error fatal en el seed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
        process.exit(0);
    }
};

seed();