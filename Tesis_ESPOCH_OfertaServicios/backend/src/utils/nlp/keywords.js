/**
 * keywords.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Diccionario de clasificación NLP para perfiles de Ingeniería de Software
 * ESPOCH. Sirve como base léxica para tres propósitos:
 *   1. Detectar tecnologías específicas presentes en texto libre
 *   2. Mapear términos técnicos a categorías/especialidades
 *   3. Identificar habilidades blandas mediante frases contextuales
 *
 * Marco teórico: Sección 2.3.1 – Clasificación por palabras clave técnicas
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * TECNOLOGÍAS DETECTABLES
 * Cada entrada es el nombre exacto que se mostrará en el perfil del graduado.
 * Se buscan como expresiones regulares (case-insensitive) en el texto.
 *
 * Formato: { label: 'Nombre visible', patterns: ['regex1', 'regex2', ...] }
 */
const TECNOLOGIAS = [
    // ── Lenguajes de programación ──────────────────────────────────────────
    { label: 'JavaScript',  patterns: ['javascript', 'js\\b'] },
    { label: 'TypeScript',  patterns: ['typescript', 'ts\\b'] },
    { label: 'Python',      patterns: ['python'] },
    { label: 'Java',        patterns: ['\\bjava\\b'] },
    { label: 'PHP',         patterns: ['\\bphp\\b'] },
    { label: 'C#',          patterns: ['\\bc#\\b', 'csharp', 'c sharp'] },
    { label: 'C++',         patterns: ['c\\+\\+', 'cpp'] },
    { label: 'Kotlin',      patterns: ['kotlin'] },
    { label: 'Swift',       patterns: ['\\bswift\\b'] },
    { label: 'Go',          patterns: ['\\bgolang\\b', '\\bgo\\b'] },
    { label: 'Dart',        patterns: ['\\bdart\\b'] },
    { label: 'R',           patterns: ['\\blanguage r\\b', '\\blenguaje r\\b', '\\bprogramaci[oó]n en r\\b'] },
    { label: 'Rust',        patterns: ['\\brust\\b'] },

    // ── Frontend ───────────────────────────────────────────────────────────
    { label: 'React',       patterns: ['\\breact\\b', 'react\\.js', 'reactjs'] },
    { label: 'Angular',     patterns: ['angular'] },
    { label: 'Vue.js',      patterns: ['vue\\.js', '\\bvue\\b', 'vuejs'] },
    { label: 'HTML',        patterns: ['\\bhtml\\b', 'html5'] },
    { label: 'CSS',         patterns: ['\\bcss\\b', 'css3'] },
    { label: 'Tailwind',    patterns: ['tailwind'] },
    { label: 'Bootstrap',   patterns: ['bootstrap'] },
    { label: 'Next.js',     patterns: ['next\\.js', 'nextjs'] },
    { label: 'Svelte',      patterns: ['svelte'] },

    // ── Backend / Frameworks ───────────────────────────────────────────────
    { label: 'Node.js',     patterns: ['node\\.js', 'nodejs', '\\bnode\\b'] },
    { label: 'Express',     patterns: ['express\\.js', 'expressjs', '\\bexpress\\b'] },
    { label: 'Django',      patterns: ['django'] },
    { label: 'Flask',       patterns: ['\\bflask\\b'] },
    { label: 'FastAPI',     patterns: ['fastapi'] },
    { label: 'Laravel',     patterns: ['laravel'] },
    { label: 'Spring Boot', patterns: ['spring boot', 'springboot'] },
    { label: 'NestJS',      patterns: ['nestjs', 'nest\\.js'] },

    // ── Mobile ────────────────────────────────────────────────────────────
    { label: 'React Native',  patterns: ['react native'] },
    { label: 'Flutter',       patterns: ['flutter'] },
    { label: 'Android',       patterns: ['android'] },
    { label: 'iOS',           patterns: ['\\bios\\b', 'iphone', 'xcode'] },
    { label: 'Ionic',         patterns: ['ionic'] },

    // ── Bases de datos ────────────────────────────────────────────────────
    { label: 'MySQL',         patterns: ['mysql'] },
    { label: 'PostgreSQL',    patterns: ['postgresql', 'postgres'] },
    { label: 'MongoDB',       patterns: ['mongodb', 'mongo'] },
    { label: 'SQLite',        patterns: ['sqlite'] },
    { label: 'Oracle',        patterns: ['\\boracle\\b'] },
    { label: 'SQL Server',    patterns: ['sql server', 'mssql', 'sqlserver'] },
    { label: 'Redis',         patterns: ['redis'] },
    { label: 'Firebase',      patterns: ['firebase', 'firestore'] },
    { label: 'Supabase',      patterns: ['supabase'] },

    // ── Inteligencia Artificial / ML ───────────────────────────────────────
    { label: 'TensorFlow',    patterns: ['tensorflow'] },
    { label: 'PyTorch',       patterns: ['pytorch'] },
    { label: 'Scikit-learn',  patterns: ['scikit.learn', 'sklearn'] },
    { label: 'Pandas',        patterns: ['pandas'] },
    { label: 'NumPy',         patterns: ['numpy'] },
    { label: 'OpenCV',        patterns: ['opencv'] },
    { label: 'Machine Learning', patterns: ['machine learning', 'aprendizaje autom[aá]tico'] },
    { label: 'Deep Learning',    patterns: ['deep learning', 'aprendizaje profundo'] },

    // ── DevOps / Cloud ────────────────────────────────────────────────────
    { label: 'Docker',        patterns: ['docker'] },
    { label: 'Kubernetes',    patterns: ['kubernetes', '\\bk8s\\b'] },
    { label: 'AWS',           patterns: ['\\baws\\b', 'amazon web services'] },
    { label: 'Azure',         patterns: ['\\bazure\\b', 'microsoft azure'] },
    { label: 'GCP',           patterns: ['\\bgcp\\b', 'google cloud'] },
    { label: 'CI/CD',         patterns: ['ci\\/cd', '\\bcicd\\b', 'continuous integration', 'integraci[oó]n continua'] },
    { label: 'Git',           patterns: ['\\bgit\\b', 'github', 'gitlab', 'bitbucket'] },
    { label: 'Linux',         patterns: ['linux', 'ubuntu', 'debian', 'centos'] },

    // ── Ciberseguridad ────────────────────────────────────────────────────
    { label: 'Ethical Hacking', patterns: ['ethical hack', 'hacking [eé]tico', 'pentest', 'penetration test'] },
    { label: 'Kali Linux',      patterns: ['kali linux', 'kali'] },
    { label: 'Criptografía',    patterns: ['criptograf[ií]a', 'encriptaci[oó]n', 'encryption'] },

    // ── Herramientas / Otros ──────────────────────────────────────────────
    { label: 'GraphQL',       patterns: ['graphql'] },
    { label: 'REST API',      patterns: ['rest api', 'restful', '\\brest\\b'] },
    { label: 'Figma',         patterns: ['figma'] },
    { label: 'Scrum',         patterns: ['scrum'] },
    { label: 'Jira',          patterns: ['jira'] },
    { label: 'Power BI',      patterns: ['power bi', 'powerbi'] },
    { label: 'Tableau',       patterns: ['tableau'] },
];

/**
 * CATEGORÍAS / ESPECIALIDADES
 * Cada categoría tiene un peso base y palabras clave que la activan.
 * El clasificador usa estas listas junto con TF-IDF para calcular el
 * porcentaje de afinidad del graduado en cada especialidad.
 *
 * Marco teórico: Sección 2.3.2 – TF-IDF como ponderador léxico
 */
const CATEGORIAS = {
    'Desarrollo Web': {
        peso: 1.0,
        keywords: [
            'html', 'css', 'javascript', 'react', 'angular', 'vue', 'frontend',
            'backend', 'fullstack', 'full.stack', 'web', 'api', 'rest', 'http',
            'node', 'express', 'laravel', 'django', 'flask', 'next', 'svelte',
            'tailwind', 'bootstrap', 'jquery', 'typescript', 'responsive',
            'sitio web', 'aplicaci[oó]n web', 'p[aá]gina web', 'portal web',
            'sistema web', 'plataforma web', 'e-commerce', 'tienda online',
            'landing page', 'nestjs', 'graphql', 'php', 'spring',
        ],
    },
    'Desarrollo Móvil': {
        peso: 1.0,
        keywords: [
            'android', 'ios', 'mobile', 'm[oó]vil', 'flutter', 'react native',
            'kotlin', 'swift', 'ionic', 'dart', 'aplicaci[oó]n m[oó]vil',
            'app m[oó]vil', 'apk', 'play store', 'app store', 'celular',
            'smartphone', 'multiplataforma', 'cross.platform',
        ],
    },
    'Bases de Datos': {
        peso: 1.0,
        keywords: [
            'mysql', 'postgresql', 'mongodb', 'sqlite', 'oracle', 'sql server',
            'redis', 'firebase', 'supabase', 'base de datos', 'base datos',
            'sql', 'nosql', 'consulta', 'query', 'stored procedure',
            'normalizaci[oó]n', 'esquema', 'modelo entidad', 'er diagram',
            'dba', 'administraci[oó]n de base', 'migraci[oó]n de datos',
            'etl', 'data warehouse', 'power bi', 'tableau', 'reportes',
        ],
    },
    'Inteligencia Artificial': {
        peso: 1.0,
        keywords: [
            'machine learning', 'deep learning', 'inteligencia artificial',
            'ia', '\\bai\\b', 'redes neuronales', 'neural network',
            'tensorflow', 'pytorch', 'scikit', 'sklearn', 'pandas', 'numpy',
            'opencv', 'visi[oó]n por computadora', 'computer vision',
            'procesamiento lenguaje', 'nlp', 'chatbot', 'modelo predictivo',
            'clasificaci[oó]n', 'regresi[oó]n', 'clustering',
            'reconocimiento', 'detecci[oó]n', 'algoritmo',
            'aprendizaje autom[aá]tico', 'aprendizaje profundo',
            'tf.idf', 'transformers', 'llm', 'openai',
        ],
    },
    'Desarrollo de Escritorio': {
        peso: 1.0,
        keywords: [
            'escritorio', 'desktop', 'java', 'c#', 'csharp', 'winforms',
            'wpf', 'electron', 'tkinter', 'pyqt', 'javafx', 'swing',
            'aplicaci[oó]n de escritorio', 'software de escritorio',
            'sistema de gesti[oó]n', 'sistema administrativo',
            'punto de venta', 'pos', 'facturaci[oó]n',
        ],
    },
    'Ciberseguridad': {
        peso: 1.0,
        keywords: [
            'ciberseguridad', 'seguridad inform[aá]tica', 'ethical hacking',
            'hacking [eé]tico', 'pentest', 'penetration', 'vulnerabilidad',
            'exploit', 'malware', 'firewall', 'criptograf[ií]a', 'encriptaci[oó]n',
            'kali', 'metasploit', 'wireshark', 'owasp', 'autenticaci[oó]n',
            'autorizaci[oó]n', 'jwt', 'oauth', 'seguridad web',
            'análisis forense', 'ctf',
        ],
    },
    'DevOps': {
        peso: 1.0,
        keywords: [
            'devops', 'docker', 'kubernetes', 'k8s', 'ci\\/cd', 'cicd',
            'pipeline', 'jenkins', 'github actions', 'aws', 'azure', 'gcp',
            'cloud', 'nube', 'terraform', 'ansible', 'linux', 'ubuntu',
            'servidor', 'deploy', 'despliegue', 'contenedor', 'microservicio',
            'arquitectura', 'infraestructura', 'monitoreo', 'automatizaci[oó]n',
        ],
    },
    'Consultoría': {
        peso: 0.8,
        keywords: [
            'consultor[ií]a', 'consultor', 'asesor[ií]a', 'levantamiento',
            'requerimientos', 'cliente', 'stakeholder', 'propuesta',
            'documentaci[oó]n', 'manual', 'capacitaci[oó]n', 'entrenamiento',
            'implementaci[oó]n', 'migraci[oó]n', 'soporte t[eé]cnico',
            'scrum', 'agile', '\\bagil\\b', 'kanban', 'gesti[oó]n',
            'planificaci[oó]n', 'presupuesto', 'cronograma',
        ],
    },
};

/**
 * HABILIDADES BLANDAS
 * Detectadas mediante frases contextuales (no términos exactos).
 * El contexto es importante: "trabajé en equipo" activa "Trabajo en equipo",
 * pero solo "equipo" no necesariamente.
 *
 * Marco teórico: Sección 2.3.3 – Identificación de habilidades blandas
 *
 * Formato: { label: 'Nombre visible', frases: ['regex1', 'regex2', ...] }
 */
const HABILIDADES_BLANDAS = [
    {
        label: 'Trabajo en equipo',
        frases: [
            'trabaj[eé] en equipo', 'trabajo en equipo', 'equipo de trabajo',
            'trabaj[eé] con', 'col[ea]bor[eé] con', 'colaboraci[oó]n',
            'en conjunto', 'junto[sa]? con', 'miembro del equipo',
            'team work', 'teamwork', 'grupo de', 'con otros',
        ],
    },
    {
        label: 'Liderazgo',
        frases: [
            'lider[eé]', 'lider[eé] el equipo', 'lider[eé] el proyecto',
            'liderazgo', 'l[ií]der del', 'coordiné', 'coordin[eé]',
            'responsable del equipo', 'dirigi[oó]', 'dirig[ií] el',
            'encargado de', 'jefe de', 'coordinador de',
        ],
    },
    {
        label: 'Comunicación efectiva',
        frases: [
            'comunicaci[oó]n', 'present[eé]', 'expuse', 'expos[ií]ci[oó]n',
            'inform[eé] al', 'reuniones con el cliente', 'reuniones con',
            'expliqu[eé]', 'documenti[eé]', 'informe técnico',
            'present[eé] los resultados', 'comunicación con el cliente',
        ],
    },
    {
        label: 'Pensamiento crítico',
        frases: [
            'analice', 'anali[zs][eé]', 'identifiqu[eé] el problema',
            'solucion[eé]', 'resolv[ií]', 'resolve', 'identifiqu[eé]',
            'diagnos\b', 'diagnosti[cq]ué', 'propu[sz]e una soluci[oó]n',
            'evalué', 'eval[uú][eé]', 'optimiz[eé]', 'mejor[eé]',
        ],
    },
    {
        label: 'Resolución de problemas',
        frases: [
            'resolv[ií] el problema', 'solucion[eé] el problema',
            'problem[aá]tica', 'necesidad del cliente', 'identificado el problema',
            'correg[ií]', 'debug', 'depuraci[oó]n', 'solución técnica',
            'implement[eé] una soluci[oó]n', 'desaf[ií]o t[eé]cnico',
        ],
    },
    {
        label: 'Creatividad e innovación',
        frases: [
            'diseñ[eé]', 'dise[nñ][oó]', 'creat', 'innov', 'propuse',
            'nueva idea', 'nueva funcionalidad', 'nueva herramienta',
            'nueva soluci[oó]n', 'propuesta creativa', 'creat[ií]vo',
        ],
    },
    {
        label: 'Adaptabilidad',
        frases: [
            'aprend[ií] r[aá]pidamente', 'me adapt[eé]', 'adaptaci[oó]n',
            'nueva tecnolog[ií]a', 'nueva herramienta', 'apr[eé]nd[ií]',
            'aprend[ií] a usar', 'aprendizaje continuo', 'auto.didacta',
        ],
    },
    {
        label: 'Responsabilidad y autonomía',
        frases: [
            'de forma individual', 'trabaj[eé] solo', 'de manera independiente',
            'individualmente', 'por mi cuenta', 'autonom[ií]a',
            'responsable de', 'a mi cargo', 'encargado de', 'sin supervisi[oó]n',
        ],
    },
    {
        label: 'Gestión del tiempo',
        frases: [
            'gesti[oó]n del tiempo', 'plazo', 'deadline', 'entrega a tiempo',
            'dentro del plazo', 'cronograma', 'planificaci[oó]n del proyecto',
            'sprint', 'iteraci[oó]n', 'tiempo de entrega',
        ],
    },
    {
        label: 'Orientación a resultados',
        frases: [
            'result[oó]', 'impact[oó]', 'logr[eé]', 'alcanc[eé]',
            'se logr[oó]', 'se implementó', 'fue implementado',
            'fue desplegado', 'fue entregado', 'fue aprobado',
            'fue exitoso', 'redujo', 'aument[oó]', 'mejor[oó]',
            'optimiz[oó]', 'reducci[oó]n de', 'aumento del',
        ],
    },
];

module.exports = { TECNOLOGIAS, CATEGORIAS, HABILIDADES_BLANDAS };