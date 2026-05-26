// backend/src/controllers/tendenciaController.js
/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CATÁLOGO alineado con keywords.js (NLP del sistema).
 * Mismas 8 categorías que usa el clasificador de perfiles.
 * Los keywords coinciden con los LABELS de TECNOLOGIAS[] y con
 * las palabras clave de CATEGORIAS{} de keywords.js, para que
 * la comparación con Proyecto.tecnologias[] funcione correctamente.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const TendenciaSemanal = require('../models/TendenciaSemanal');

const CATALOGO = [
    {
        categoria:   'Desarrollo Web',
        color:       '#2563eb',
        descripcion: 'Aplicaciones web modernas, frameworks JS y arquitecturas fullstack.',
        keywords: [
            // Labels exactos de TECNOLOGIAS en keywords.js
            'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Next.js',
            'Svelte', 'HTML', 'CSS', 'Tailwind', 'Bootstrap',
            'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Laravel',
            'Spring Boot', 'NestJS', 'PHP', 'GraphQL', 'REST API',
            // Variantes que un graduado puede escribir libremente
            'frontend', 'backend', 'fullstack', 'full-stack', 'full stack',
            'web', 'nodejs', 'reactjs', 'nextjs', 'vuejs', 'sitio web',
            'aplicación web', 'sistema web', 'plataforma web', 'e-commerce',
        ],
    },
    {
        categoria:   'Inteligencia Artificial',
        color:       '#7c3aed',
        descripcion: 'Machine learning, deep learning, visión computacional y NLP.',
        keywords: [
            'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'OpenCV',
            'Machine Learning', 'Deep Learning', 'Python', 'R',
            'tensorflow', 'pytorch', 'scikit', 'sklearn', 'pandas', 'numpy',
            'opencv', 'machine learning', 'deep learning', 'ia', 'ai', 'nlp',
            'visión computacional', 'computer vision', 'inteligencia artificial',
            'redes neuronales', 'neural network', 'chatbot', 'transformers',
            'llm', 'openai', 'modelo predictivo', 'clasificación', 'clustering',
            'reconocimiento', 'detección', 'aprendizaje automático',
        ],
    },
    {
        categoria:   'Desarrollo Móvil',
        color:       '#059669',
        descripcion: 'Apps nativas y multiplataforma para Android e iOS.',
        keywords: [
            'React Native', 'Flutter', 'Android', 'iOS', 'Ionic',
            'Kotlin', 'Swift', 'Dart',
            'react native', 'flutter', 'android', 'ios', 'kotlin', 'swift',
            'dart', 'ionic', 'móvil', 'mobile', 'apk', 'multiplataforma',
            'cross-platform', 'app móvil', 'aplicación móvil',
            'play store', 'app store',
        ],
    },
    {
        categoria:   'Bases de Datos',
        color:       '#0891b2',
        descripcion: 'Diseño, optimización y administración de bases de datos SQL y NoSQL.',
        keywords: [
            'MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'Oracle',
            'SQL Server', 'Redis', 'Firebase', 'Supabase',
            'Power BI', 'Tableau',
            'mysql', 'postgresql', 'mongodb', 'sqlite', 'oracle',
            'sql server', 'redis', 'firebase', 'supabase',
            'sql', 'nosql', 'base de datos', 'database', 'firestore',
            'data warehouse', 'etl', 'power bi', 'tableau', 'reportes',
            'stored procedure', 'normalización', 'modelo entidad',
        ],
    },
    {
        categoria:   'DevOps',
        color:       '#d97706',
        descripcion: 'Infraestructura cloud, contenedores y automatización de pipelines.',
        keywords: [
            'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Git', 'Linux',
            'docker', 'kubernetes', 'k8s', 'aws', 'azure', 'gcp',
            'ci/cd', 'cicd', 'linux', 'ubuntu', 'debian', 'centos',
            'devops', 'terraform', 'ansible', 'jenkins', 'github actions',
            'cloud', 'nube', 'contenedor', 'microservicio', 'deploy',
            'despliegue', 'servidor', 'infraestructura', 'automatización',
            'pipeline', 'monitoreo', 'prometheus', 'grafana', 'nginx',
        ],
    },
    {
        categoria:   'Ciberseguridad',
        color:       '#dc2626',
        descripcion: 'Seguridad informática, hacking ético y protección de sistemas.',
        keywords: [
            'Ethical Hacking', 'Kali Linux', 'Criptografía',
            'ethical hacking', 'hacking ético', 'kali', 'pentest',
            'penetration test', 'ciberseguridad', 'seguridad informática',
            'criptografía', 'encriptación', 'owasp', 'metasploit',
            'wireshark', 'burpsuite', 'firewall', 'jwt', 'oauth',
            'vulnerabilidad', 'exploit', 'malware', 'ctf', 'forense',
            'análisis forense', 'siem', 'soc', 'vpn', 'ssl', 'tls',
        ],
    },
    {
        categoria:   'Desarrollo de Escritorio',
        color:       '#4f46e5',
        descripcion: 'Aplicaciones de escritorio multiplataforma y sistemas empresariales.',
        keywords: [
            'Java', 'C#', 'C++', 'Go', 'Rust',
            'java', 'c#', 'csharp', 'c sharp', 'c++', 'cpp',
            'go', 'golang', 'rust',
            'wpf', 'winforms', 'javafx', 'swing', 'electron', 'tauri',
            'tkinter', 'pyqt', 'qt', 'escritorio', 'desktop',
            'punto de venta', 'pos', 'facturación', 'sistema de gestión',
            'sistema administrativo', 'xamarin',
        ],
    },
    {
        categoria:   'Consultoría',
        color:       '#b45309',
        descripcion: 'Gestión de proyectos, análisis de requerimientos y metodologías ágiles.',
        keywords: [
            'Scrum', 'Jira', 'Figma',
            'scrum', 'jira', 'figma', 'kanban', 'agile', 'ágil',
            'consultoría', 'asesoría', 'requerimientos', 'stakeholder',
            'levantamiento', 'documentación', 'capacitación', 'entrenamiento',
            'planificación', 'cronograma', 'gestión de proyectos',
            'propuesta', 'implementación', 'soporte técnico',
        ],
    },
];

// ─────────────────────────────────────────────────────────
function getSemanaISO(date = new Date()) {
    const d      = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return {
        semana: Math.ceil((((d - yearStart) / 86400000) + 1) / 7),
        anio:   d.getUTCFullYear(),
    };
}

function elegirCategoriaPorSemana(semana) {
    return CATALOGO[semana % CATALOGO.length];
}

// ═══════════════════════════════════════════════════════════
// rotarTendencia() — llamado por el cron semanal en app.js
// ═══════════════════════════════════════════════════════════
exports.rotarTendencia = async () => {
    try {
        const { semana, anio } = getSemanaISO();
        const existente = await TendenciaSemanal.findOne({ semana, anio });

        if (existente?.modoManual) {
            console.log(`[Tendencia] Semana ${semana}/${anio} — manual activo, sin cambios.`);
            return existente;
        }

        const cat = elegirCategoriaPorSemana(semana);
        const tendencia = await TendenciaSemanal.findOneAndUpdate(
            { semana, anio },
            {
                semana, anio,
                categoria:    cat.categoria,
                keywords:     cat.keywords,
                descripcion:  cat.descripcion,
                color:        cat.color,
                modoManual:   false,
                fijadoHasta:  null,
                modificadoPor: 'sistema',
            },
            { upsert: true, new: true, runValidators: false }
        );
        console.log(`[Tendencia] ✅ S${semana}/${anio} → "${cat.categoria}"`);
        return tendencia;
    } catch (err) {
        console.error('[Tendencia] Error rotarTendencia:', err.message);
    }
};

// ═══════════════════════════════════════════════════════════
// GET /api/tendencia  — pública
// ═══════════════════════════════════════════════════════════
exports.getTendenciaActual = async (req, res) => {
    try {
        const { semana, anio } = getSemanaISO();
        let tendencia = await TendenciaSemanal.findOne({ semana, anio });

        if (!tendencia) {
            const cat = elegirCategoriaPorSemana(semana);
            tendencia = await TendenciaSemanal.create({
                semana, anio,
                categoria:    cat.categoria,
                keywords:     cat.keywords,
                descripcion:  cat.descripcion,
                color:        cat.color,
                modoManual:   false,
                modificadoPor: 'sistema',
            });
        }

        res.json({
            categoria:   tendencia.categoria,
            descripcion: tendencia.descripcion,
            color:       tendencia.color,
            keywords:    tendencia.keywords,
            semana:      tendencia.semana,
            anio:        tendencia.anio,
            modoManual:  tendencia.modoManual,
            catalogo:    CATALOGO.map(c => ({
                categoria:   c.categoria,
                color:       c.color,
                descripcion: c.descripcion,
            })),
        });
    } catch (err) {
        console.error('[Tendencia] Error getTendenciaActual:', err.message);
        res.status(500).json({ msg: 'Error al obtener la tendencia.' });
    }
};

// ═══════════════════════════════════════════════════════════
// PUT /api/admin/tendencia  — admin fija manualmente
// ═══════════════════════════════════════════════════════════
exports.setTendenciaManual = async (req, res) => {
    try {
        const { categoria } = req.body;
        if (!categoria) return res.status(400).json({ msg: 'La categoría es obligatoria.' });

        const cat = CATALOGO.find(c => c.categoria === categoria);
        if (!cat)  return res.status(400).json({ msg: 'Categoría no válida.' });

        const { semana, anio } = getSemanaISO();
        const tendencia = await TendenciaSemanal.findOneAndUpdate(
            { semana, anio },
            {
                semana, anio,
                categoria:    cat.categoria,
                keywords:     cat.keywords,
                descripcion:  cat.descripcion,
                color:        cat.color,
                modoManual:   true,
                fijadoHasta:  null,
                modificadoPor: req.usuario?.id || 'admin',
            },
            { upsert: true, new: true, runValidators: false }
        );

        console.log(`[Tendencia] 🔧 Manual S${semana}/${anio} → "${cat.categoria}"`);
        res.json({ msg: 'Tendencia actualizada correctamente.', tendencia });
    } catch (err) {
        console.error('[Tendencia] Error setTendenciaManual:', err.message);
        res.status(500).json({ msg: 'Error al actualizar la tendencia.' });
    }
};

// ═══════════════════════════════════════════════════════════
// DELETE /api/admin/tendencia/reset  — vuelve a automático
// ═══════════════════════════════════════════════════════════
exports.resetTendencia = async (req, res) => {
    try {
        const { semana, anio } = getSemanaISO();
        const cat = elegirCategoriaPorSemana(semana);

        const tendencia = await TendenciaSemanal.findOneAndUpdate(
            { semana, anio },
            {
                categoria:    cat.categoria,
                keywords:     cat.keywords,
                descripcion:  cat.descripcion,
                color:        cat.color,
                modoManual:   false,
                fijadoHasta:  null,
                modificadoPor: 'sistema',
            },
            { upsert: true, new: true }
        );

        res.json({ msg: 'Restablecido al modo automático.', tendencia });
    } catch (err) {
        console.error('[Tendencia] Error resetTendencia:', err.message);
        res.status(500).json({ msg: 'Error al resetear.' });
    }
};

exports.CATALOGO = CATALOGO;