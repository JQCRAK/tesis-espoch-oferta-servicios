/**
 * keywords.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Diccionario de clasificación NLP para perfiles de Ingeniería de Software
 * ESPOCH. Sirve como base léxica para tres propósitos:
 *   1. Detectar tecnologías específicas presentes en texto libre
 *   2. Mapear términos técnicos a categorías/especialidades
 *   3. Identificar habilidades blandas mediante frases contextuales
 *
 * Fundamentación teórica:
 *   - Washizaki, H. (Ed.). Guide to the Software Engineering Body of Knowledge
 *     (SWEBOK Guide), Version 4.0. IEEE Computer Society, 2024.
 *     Capítulos referenciados: Ch.3 (Design), Ch.4 (Construction),
 *     Ch.5 (Testing), Ch.6 (Operations), Ch.13 (Security), Ch.14
 *     (Professional Practice), Ch.16 (Computing Foundations).
 *
 * Marco teórico tesis: Secciones 2.3.1, 2.3.2 y 2.3.3
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * TECNOLOGÍAS DETECTABLES
 * Alineadas con el vocabulario de SWEBOK v4, Ch.4 (Software Construction)
 * y Ch.16 (Computing Foundations).
 *
 * Formato: { label: 'Nombre visible', patterns: ['regex1', 'regex2', ...] }
 */
const TECNOLOGIAS = [
    // ── Lenguajes de programación (SWEBOK v4, Ch.4 Software Construction) ──
    { label: 'JavaScript',  patterns: ['javascript', 'js\\b'] },
    { label: 'TypeScript',  patterns: ['typescript', 'ts\\b'] },
    { label: 'Python',      patterns: ['python'] },
    { label: 'Java',        patterns: ['\\bjava\\b'] },
    { label: 'PHP',         patterns: ['\\bphp\\b'] },
    { label: 'C#',          patterns: ['\\bc#\\b', 'csharp', 'c sharp'] },
    { label: 'C++',         patterns: ['c\\+\\+', 'cpp'] },
    { label: 'C',           patterns: ['\\blanguage c\\b', '\\blenguaje c\\b', '\\bprogramaci[oó]n en c\\b'] },
    { label: 'Kotlin',      patterns: ['kotlin'] },
    { label: 'Swift',       patterns: ['\\bswift\\b'] },
    { label: 'Go',          patterns: ['\\bgolang\\b', '\\bgo lang\\b'] },
    { label: 'Dart',        patterns: ['\\bdart\\b'] },
    { label: 'R',           patterns: ['\\blanguage r\\b', '\\blenguaje r\\b', '\\bprogramaci[oó]n en r\\b'] },
    { label: 'Rust',        patterns: ['\\brust\\b'] },
    { label: 'Ruby',        patterns: ['\\bruby\\b'] },
    { label: 'Perl',        patterns: ['\\bperl\\b'] },

    // ── Frontend (SWEBOK v4, Ch.4 - Cross-Platform Development) ───────────
    { label: 'React',       patterns: ['\\breact\\b', 'react\\.js', 'reactjs'] },
    { label: 'Angular',     patterns: ['angular'] },
    { label: 'Vue.js',      patterns: ['vue\\.js', '\\bvue\\b', 'vuejs'] },
    { label: 'HTML5',       patterns: ['\\bhtml\\b', 'html5'] },
    { label: 'CSS3',        patterns: ['\\bcss\\b', 'css3'] },
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

    // ── API Design (SWEBOK v4, Ch.4 - RESTful, OpenAPI) ───────────────────
    { label: 'REST API',    patterns: ['rest api', 'restful', '\\brest\\b', 'openapi'] },
    { label: 'GraphQL',     patterns: ['graphql'] },

    // ── Mobile (SWEBOK v4, Ch.5 - Mobile Domain Testing) ──────────────────
    { label: 'React Native',  patterns: ['react native'] },
    { label: 'Flutter',       patterns: ['flutter'] },
    { label: 'Android',       patterns: ['android'] },
    { label: 'iOS',           patterns: ['\\bios\\b', 'iphone', 'xcode'] },
    { label: 'Ionic',         patterns: ['ionic'] },

    // ── Bases de datos (SWEBOK v4, Ch.16 - Database Management) ───────────
    { label: 'MySQL',         patterns: ['mysql'] },
    { label: 'PostgreSQL',    patterns: ['postgresql', 'postgres'] },
    { label: 'MongoDB',       patterns: ['mongodb', 'mongo'] },
    { label: 'SQLite',        patterns: ['sqlite'] },
    { label: 'Oracle',        patterns: ['\\boracle\\b'] },
    { label: 'SQL Server',    patterns: ['sql server', 'mssql', 'sqlserver'] },
    { label: 'Redis',         patterns: ['redis'] },
    { label: 'Firebase',      patterns: ['firebase', 'firestore'] },
    { label: 'Supabase',      patterns: ['supabase'] },

    // ── IA / ML (SWEBOK v4, Ch.16 - AI and Machine Learning) ──────────────
    { label: 'TensorFlow',    patterns: ['tensorflow'] },
    { label: 'PyTorch',       patterns: ['pytorch'] },
    { label: 'Scikit-learn',  patterns: ['scikit.learn', 'sklearn'] },
    { label: 'Pandas',        patterns: ['pandas'] },
    { label: 'NumPy',         patterns: ['numpy'] },
    { label: 'OpenCV',        patterns: ['opencv'] },
    { label: 'Machine Learning', patterns: ['machine learning', 'aprendizaje autom[aá]tico'] },
    { label: 'Deep Learning',    patterns: ['deep learning', 'aprendizaje profundo'] },
    { label: 'NLP',              patterns: ['\\bnlp\\b', 'procesamiento de lenguaje natural'] },

    // ── DevOps / Cloud (SWEBOK v4, Ch.6 - Software Engineering Operations) ─
    { label: 'Docker',        patterns: ['docker'] },
    { label: 'Kubernetes',    patterns: ['kubernetes', '\\bk8s\\b'] },
    { label: 'AWS',           patterns: ['\\baws\\b', 'amazon web services'] },
    { label: 'Azure',         patterns: ['\\bazure\\b', 'microsoft azure'] },
    { label: 'GCP',           patterns: ['\\bgcp\\b', 'google cloud'] },
    { label: 'CI/CD',         patterns: ['ci\\/cd', '\\bcicd\\b', 'continuous integration', 'integraci[oó]n continua', 'continuous delivery', 'entrega continua'] },
    { label: 'Git',           patterns: ['\\bgit\\b', 'github', 'gitlab', 'bitbucket'] },
    { label: 'Linux',         patterns: ['linux', 'ubuntu', 'debian', 'centos'] },
    { label: 'Terraform',     patterns: ['terraform'] },
    { label: 'Ansible',       patterns: ['ansible'] },
    { label: 'Jenkins',       patterns: ['jenkins'] },

    // ── Seguridad (SWEBOK v4, Ch.13 - Software Security) ──────────────────
    { label: 'Ethical Hacking',  patterns: ['ethical hack', 'hacking [eé]tico', 'pentest', 'penetration test'] },
    { label: 'Kali Linux',       patterns: ['kali linux', 'kali'] },
    { label: 'Criptografía',     patterns: ['criptograf[ií]a', 'encriptaci[oó]n', 'encryption', 'cryptography'] },
    { label: 'OWASP',            patterns: ['owasp'] },
    { label: 'Metasploit',       patterns: ['metasploit'] },

    // ── Herramientas / Otros (SWEBOK v4, Ch.14 - Professional Practice) ───
    { label: 'UML',           patterns: ['\\buml\\b', 'unified modeling'] },
    { label: 'Scrum',         patterns: ['scrum'] },
    { label: 'Figma',         patterns: ['figma'] },
    { label: 'Jira',          patterns: ['jira'] },
    { label: 'Power BI',      patterns: ['power bi', 'powerbi'] },
    { label: 'Tableau',       patterns: ['tableau'] },
    { label: 'TDD',           patterns: ['\\btdd\\b', 'test.driven'] },
];

/**
 * CATEGORÍAS / ESPECIALIDADES
 * Alineadas con los "Application Domains" y KAs del SWEBOK v4.0.
 * Referencias por capítulo indicadas en cada categoría.
 *
 * Marco teórico: Sección 2.3.2 – TF-IDF como ponderador léxico
 * Referencia SWEBOK: Ch.2 (Architecture), Ch.3 (Design), Ch.4 (Construction),
 *   Ch.6 (Operations), Ch.13 (Security), Ch.16 (Computing Foundations)
 */
const CATEGORIAS = {

    // ── SWEBOK v4: Ch.4 (Construction) + Ch.3 (Design) + Ch.5 (Testing) ──
    'Desarrollo Web': {
        peso: 1.0,
        keywords: [
            // Tecnologías web reconocidas en SWEBOK Ch.4
            'html', 'css', 'javascript', 'typescript', 'react', 'angular', 'vue',
            'next', 'svelte', 'tailwind', 'bootstrap', 'jquery',
            // Backend web
            'node', 'express', 'laravel', 'django', 'flask', 'fastapi',
            'nestjs', 'spring', 'php',
            // Conceptos web SWEBOK
            'frontend', 'backend', 'fullstack', 'full.stack',
            'api', 'rest', 'restful', 'openapi', 'graphql', 'http', 'https',
            'responsive', 'web app', 'aplicaci[oó]n web',
            'sitio web', 'p[aá]gina web', 'portal web',
            'sistema web', 'plataforma web',
            // E-commerce / dominio web
            'e-commerce', 'tienda online', 'landing page',
            // Cross-platform (SWEBOK Ch.4)
            'cross.platform', 'multiplataforma', 'html5', 'css3',
        ],
    },

    // ── SWEBOK v4: Ch.5 (Testing - Mobile Domain Testing) + Ch.4 ──────────
    'Desarrollo Móvil': {
        peso: 1.0,
        keywords: [
            'android', 'ios', 'mobile', 'm[oó]vil', 'flutter', 'react native',
            'kotlin', 'swift', 'ionic', 'dart',
            'aplicaci[oó]n m[oó]vil', 'app m[oó]vil', 'apk',
            'play store', 'app store', 'smartphone',
            // SWEBOK Ch.4: Cross-Platform Development
            'multiplataforma', 'cross.platform', 'hybrid app', 'nativo',
        ],
    },

    // ── SWEBOK v4: Ch.16 (Computing Foundations - Database Management) ─────
    'Bases de Datos': {
        peso: 1.0,
        keywords: [
            // Tecnologías — Ch.16 menciona RDBMS, NoSQL, Data Warehousing
            'mysql', 'postgresql', 'mongodb', 'sqlite', 'oracle', 'sql server',
            'redis', 'firebase', 'supabase',
            // Conceptos SWEBOK Ch.16
            'sql', 'nosql', 'relational', 'relacional',
            'base de datos', 'base datos', 'dbms', 'rdbms',
            'stored procedure', 'normalizaci[oó]n', 'esquema',
            'modelo entidad', 'er diagram', 'dba',
            // Data warehousing y minería (Ch.16)
            'data warehouse', 'data mining', 'etl',
            'administraci[oó]n de base', 'migraci[oó]n de datos',
            // Reporting
            'power bi', 'tableau', 'reportes', 'consulta', 'query',
        ],
    },

    // ── SWEBOK v4: Ch.16 (AI & Machine Learning + NLP) ────────────────────
    'Inteligencia Artificial': {
        peso: 1.0,
        keywords: [
            // Subtópicos exactos de SWEBOK v4 Ch.16
            'machine learning', 'deep learning', 'neural network', 'redes neuronales',
            'supervised learning', 'unsupervised learning', 'aprendizaje supervisado',
            'reasoning', 'razonamiento autom[aá]tico',
            // NLP (definido explícitamente en SWEBOK v4 Ch.16)
            'nlp', 'procesamiento de lenguaje natural', 'natural language processing',
            // Frameworks reconocidos
            'tensorflow', 'pytorch', 'scikit', 'sklearn', 'pandas', 'numpy',
            'opencv',
            // Vocabulario de dominio
            'inteligencia artificial', '\\bia\\b', '\\bai\\b',
            'visi[oó]n por computadora', 'computer vision',
            'clasificaci[oó]n', 'regresi[oó]n', 'clustering',
            'modelo predictivo', 'reconocimiento', 'detecci[oó]n',
            'algoritmo', 'aprendizaje autom[aá]tico', 'aprendizaje profundo',
            // Tecnologías emergentes (SWEBOK v4 Emerging Technologies)
            'transformers', 'llm', 'generative ai', 'chatbot',
            'tf.idf', 'openai', 'langchain',
        ],
    },

    // ── SWEBOK v4: Ch.3 (Design) + Ch.4 (Construction - Desktop focus) ────
    'Desarrollo de Escritorio': {
        peso: 1.0,
        keywords: [
            'escritorio', 'desktop',
            // Lenguajes de escritorio mencionados en SWEBOK Ch.4
            '\\bjava\\b', 'c#', 'csharp', 'python',
            // Frameworks de escritorio
            'winforms', 'wpf', 'electron', 'tkinter', 'pyqt', 'javafx',
            'swing', 'gtk', 'qt',
            // Tipos de sistemas de escritorio
            'aplicaci[oó]n de escritorio', 'software de escritorio',
            'sistema de gesti[oó]n', 'sistema administrativo',
            'punto de venta', '\\bpos\\b', 'facturaci[oó]n',
            // GUI (SWEBOK Ch.4 - GUI builders)
            '\\bgui\\b', 'interfaz gr[aá]fica', 'graphical user interface',
        ],
    },

    // ── SWEBOK v4: Ch.13 (Software Security — KA completo) ────────────────
    'Ciberseguridad': {
        peso: 1.0,
        keywords: [
            // Subtemas directos del Ch.13 SWEBOK v4
            'ciberseguridad', 'cybersecurity', 'seguridad inform[aá]tica',
            'information security', 'seguridad de la informaci[oó]n',
            // Security Engineering (Ch.13)
            'secure development', 'sdlc', 'security requirements',
            'security design', 'security patterns', 'security testing',
            'vulnerability management', 'vulnerabilidad',
            // Software Security Tools (Ch.13)
            'penetration test', 'pentest', 'ethical hack', 'hacking [eé]tico',
            'fuzzing', 'fuzz testing',
            // Cryptography (Ch.13 - Data Protection)
            'criptograf[ií]a', 'encriptaci[oó]n', 'encryption', 'cryptography',
            'cryptographic', 'aes', 'rsa', 'hash',
            // Access Control (Ch.13 - Security Design)
            'access control', 'control de acceso', 'autenticaci[oó]n',
            'autorizaci[oó]n', 'authentication', 'authorization',
            'jwt', 'oauth', 'sso',
            // Session Management (Ch.13)
            'session management', 'gesti[oó]n de sesiones', 'timeout',
            // Common Criteria y estándares (Ch.13)
            'owasp', 'cve', 'cvss', 'common criteria',
            'iso 27001', 'nist',
            // Domain-Specific Security (Ch.13)
            'seguridad web', 'cloud security', 'iot security',
            // Herramientas
            'kali', 'metasploit', 'wireshark', 'burp suite',
            'firewall', 'malware', 'exploit',
            // Análisis forense (Ch.13)
            'an[aá]lisis forense', '\\bctf\\b',
        ],
    },

    // ── SWEBOK v4: Ch.6 (Software Engineering Operations) ─────────────────
    'DevOps': {
        peso: 1.0,
        keywords: [
            // Términos exactos de SWEBOK v4 Ch.6
            'devops', 'devsecops', 'site reliability', '\\bsre\\b',
            // CI/CD (Ch.6 + Ch.4 Construction)
            'ci\\/cd', 'cicd', 'continuous integration', 'integraci[oó]n continua',
            'continuous delivery', 'entrega continua', 'continuous deployment',
            'pipeline', 'github actions', 'jenkins',
            // Infrastructure-as-Code (Ch.6 - IaC, PaC)
            'infrastructure.as.code', '\\biac\\b', 'terraform', 'ansible',
            'platform.as.code',
            // Containerization (Ch.6)
            'docker', 'kubernetes', '\\bk8s\\b', 'contenedor', 'container',
            'microservicio', 'microservice',
            // Cloud (Ch.6 + Emerging Technologies)
            'aws', 'azure', 'gcp', 'cloud', 'nube',
            'virtualizaci[oó]n', 'virtualization',
            // Operations (Ch.6)
            'deploy', 'despliegue', 'monitoreo', 'monitoring', 'telemetry',
            'telemetr[ií]a', 'load balancing', 'failover', 'rollback',
            'automatizaci[oó]n', 'servidor',
            // SCM (SWEBOK Ch.8 - Software Configuration Management)
            '\\bgit\\b', 'github', 'gitlab', 'bitbucket',
            'version control', 'control de versiones', 'branching',
        ],
    },

    // ── SWEBOK v4: Ch.2 (Architecture) ────────────────────────────────────
    'Arquitectura de Software': {
        peso: 0.9,
        keywords: [
            // Estilos y patrones — SWEBOK v4 Ch.2
            'arquitectura', 'architecture',
            'microservices', 'microservicios', 'n-tier', 'monolith',
            'publish.subscribe', 'event.driven', 'event driven',
            'serverless', 'service oriented', 'soa',
            // Notaciones (Ch.2)
            '\\buml\\b', 'sysml', 'adl', 'architecture description',
            'viewpoint', 'c4 model',
            // Conceptos SWEBOK Ch.2
            'separation of concerns', 'separaci[oó]n de responsabilidades',
            'technical debt', 'deuda t[eé]cnica',
            'reference architecture', 'arquitectura de referencia',
            // Design Patterns (Ch.3)
            'design pattern', 'patr[oó]n de dise[nñ]o',
            'solid', 'clean architecture',
        ],
    },

    // ── SWEBOK v4: Ch.14 (Professional Practice) ──────────────────────────
    'Consultoría y Gestión': {
        peso: 0.8,
        keywords: [
            // Gestión de proyectos
            'consultor[ií]a', 'consultor', 'asesor[ií]a',
            'levantamiento', 'requerimientos', 'requirements elicitation',
            'cliente', 'stakeholder',
            // Documentación (SWEBOK Ch.14 - Technical writing)
            'documentaci[oó]n', 'manual', 'informe t[eé]cnico',
            'project plan', 'risk analysis',
            // Capacitación
            'capacitaci[oó]n', 'entrenamiento', 'training',
            // Implementación
            'implementaci[oó]n', 'migraci[oó]n', 'soporte t[eé]cnico',
            // Metodologías Agile/Scrum (integradas en SWEBOK v4)
            'scrum', 'agile', '\\bagil\\b', 'kanban',
            'sprint', 'iteraci[oó]n', 'backlog',
            'gesti[oó]n', 'planificaci[oó]n', 'presupuesto', 'cronograma',
        ],
    },
};

/**
 * HABILIDADES BLANDAS
 * Alineadas con SWEBOK v4, Ch.14: Software Engineering Professional Practice.
 * Subtemas: "Group Dynamics and Psychology" y "Communication Skills".
 *
 * Nombres exactos derivados del SWEBOK v4 Ch.14:
 *   - Dynamics of Working in Teams/Groups
 *   - Individual Cognition / Intellectual Humility
 *   - Dealing with Problem Complexity
 *   - Interacting with Stakeholders
 *   - Dealing with Uncertainty and Ambiguity
 *   - Communication Skills (Reading, Writing, Presentation)
 *
 * Marco teórico: Sección 2.3.3 – Identificación de habilidades blandas
 * Referencia: SWEBOK v4 Ch.14; Malinen et al. (2025); Mardiyah y Hayat (2026)
 *
 * Formato: { label: 'Nombre visible', frases: ['regex1', 'regex2', ...] }
 */
const HABILIDADES_BLANDAS = [

    // ── SWEBOK Ch.14: "Dynamics of Working in Teams/Groups" ───────────────
    {
        label: 'Trabajo en equipo',
        frases: [
            'trabaj[eé] en equipo', 'trabajo en equipo', 'equipo de trabajo',
            'trabaj[eé] con', 'col[ea]bor[eé] con', 'colaboraci[oó]n',
            'en conjunto', 'junto[sa]? con', 'miembro del equipo',
            'team work', 'teamwork', 'grupo de', 'con otros',
            // SWEBOK Ch.14: "performing teams"
            'equipo de desarrollo', 'equipo multidisciplinario',
        ],
    },

    // ── SWEBOK Ch.14: "Dynamics of Working in Teams" — liderazgo ──────────
    {
        label: 'Liderazgo',
        frases: [
            'lider[eé]', 'lider[eé] el equipo', 'lider[eé] el proyecto',
            'liderazgo', 'l[ií]der del', 'coordiné', 'coordin[eé]',
            'responsable del equipo', 'dirigi[oó]', 'dirig[ií] el',
            'encargado de', 'jefe de', 'coordinador de',
            // Roles SWEBOK v4 (Scrum Master, etc.)
            'scrum master', 'tech lead', 'l[ií]der t[eé]cnico',
        ],
    },

    // ── SWEBOK Ch.14: "Communication Skills" ──────────────────────────────
    {
        label: 'Comunicación efectiva',
        frases: [
            'comunicaci[oó]n', 'present[eé]', 'expuse', 'expos[ií]ci[oó]n',
            'inform[eé] al', 'reuniones con el cliente', 'reuniones con',
            'expliqu[eé]', 'documenti[eé]', 'informe t[eé]cnico',
            'present[eé] los resultados', 'comunicación con el cliente',
            // SWEBOK Ch.14: "Presentation Skills"
            'presentaci[oó]n t[eé]cnica', 'pitch', 'demo',
            // SWEBOK Ch.14: "Interacting with Stakeholders"
            'stakeholder', 'cliente', 'usuario final',
        ],
    },

    // ── SWEBOK Ch.14: "Individual Cognition" + "Intellectual Humility" ─────
    {
        label: 'Pensamiento crítico',
        frases: [
            'analice', 'anali[zs][eé]', 'identifiqu[eé] el problema',
            'solucion[eé]', 'resolv[ií]', 'identifiqu[eé]',
            'diagnosti[cq]u[eé]', 'propu[sz]e una soluci[oó]n',
            'eval[uú][eé]', 'optimiz[eé]', 'mejor[eé]',
            // SWEBOK Ch.14: "Intellectual Humility" y "Minimizar supuestos erróneos"
            'analiz[eé] los requerimientos', 'identifiqu[eé] los riesgos',
            'evalu[eé] alternativas', 'comparé opciones',
        ],
    },

    // ── SWEBOK Ch.14: "Dealing with Problem Complexity" ───────────────────
    {
        label: 'Resolución de problemas',
        frases: [
            'resolv[ií] el problema', 'solucion[eé] el problema',
            'problem[aá]tica', 'necesidad del cliente', 'identificado el problema',
            'correg[ií]', 'debug', 'depuraci[oó]n', 'solución técnica',
            'implement[eé] una soluci[oó]n', 'desaf[ií]o t[eé]cnico',
            // SWEBOK Ch.14: complejidad técnica
            'problema complejo', 'arquitectura compleja', 'optimiz[eé] el rendimiento',
        ],
    },

    // ── SWEBOK Ch.14: Professional Practice — creatividad e innovación ─────
    {
        label: 'Creatividad e innovación',
        frases: [
            'dise[nñ][eé]', 'creat', 'innov', 'propuse',
            'nueva idea', 'nueva funcionalidad', 'nueva herramienta',
            'nueva soluci[oó]n', 'propuesta creativa', 'creat[ií]vo',
            // UI/UX (SWEBOK Ch.14 menciona explícitamente UI/UX)
            'dise[nñ]o de interfaz', 'experiencia de usuario', 'ui.ux',
            'prototipo', 'wireframe',
        ],
    },

    // ── SWEBOK Ch.14: "Dealing with Uncertainty and Ambiguity" ────────────
    {
        label: 'Adaptabilidad',
        frases: [
            'aprend[ií] r[aá]pidamente', 'me adapt[eé]', 'adaptaci[oó]n',
            'nueva tecnolog[ií]a', 'nueva herramienta', 'aprend[ií] a usar',
            'aprendizaje continuo', 'auto.didacta',
            // SWEBOK Ch.14: ambigüedad e incertidumbre
            'contexto cambiante', 'requisitos cambiantes', 'entorno [aá]gil',
        ],
    },

    // ── SWEBOK Ch.14: Professional Practice — autonomía ───────────────────
    {
        label: 'Responsabilidad y autonomía',
        frases: [
            'de forma individual', 'trabaj[eé] solo', 'de manera independiente',
            'individualmente', 'por mi cuenta', 'autonom[ií]a',
            'responsable de', 'a mi cargo', 'encargado de', 'sin supervisi[oó]n',
        ],
    },

    // ── SWEBOK Ch.14: Process + Scrum (integrado en v4) ───────────────────
    {
        label: 'Gestión del tiempo',
        frases: [
            'gesti[oó]n del tiempo', 'plazo', 'deadline', 'entrega a tiempo',
            'dentro del plazo', 'cronograma', 'planificaci[oó]n del proyecto',
            'sprint', 'iteraci[oó]n', 'tiempo de entrega',
            // SWEBOK v4: Agile integrado
            'velocidad del equipo', 'burndown', 'retrospectiva',
        ],
    },

    // ── SWEBOK Ch.14: Professional Practice — resultados ──────────────────
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

    // ── SWEBOK Ch.14: "Dealing with Equity, Diversity, and Inclusivity" ────
    {
        label: 'Diversidad e inclusión',
        frases: [
            'diversidad', 'inclusi[oó]n', 'inclusivo', 'equidad',
            'accesibilidad', 'wcag', 'dise[nñ]o inclusivo',
            'tolerancia cultural', 'entorno multicultural',
        ],
    },

    // ── SWEBOK Ch.14: "Reading, Understanding, Summarizing" ───────────────
    {
        label: 'Documentación técnica',
        frases: [
            'document[eé]', 'redact[eé]', 'escribí el manual',
            'elabor[eé] el informe', 'dise[nñ][eé] la arquitectura',
            'especificaci[oó]n t[eé]cnica', 'manual de usuario',
            'manual t[eé]cnico', 'informe final',
            // SWEBOK Ch.14: technical documentation
            'project plan', 'risk analysis', 'plan de proyecto',
            'an[aá]lisis de riesgos',
        ],
    },
];

module.exports = { TECNOLOGIAS, CATEGORIAS, HABILIDADES_BLANDAS };