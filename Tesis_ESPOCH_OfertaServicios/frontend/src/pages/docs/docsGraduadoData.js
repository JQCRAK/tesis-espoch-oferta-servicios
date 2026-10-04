// frontend/src/pages/docs/docsGraduadoData.js
// Contenido de la Guía de Usuario — sección GRADUADO (panel privado).

export const categoriasGraduado = [
    {
        id: 'perfil',
        icono: '👤',
        titulo: 'Mi perfil profesional',
        articulos: ['g-mi-perfil', 'g-editar-perfil', 'g-publicar-perfil', 'g-hoja-vida'],
    },
    {
        id: 'portafolio',
        icono: '💼',
        titulo: 'Proyectos y certificados',
        articulos: ['g-agregar-proyecto', 'g-agregar-certificado'],
    },
    {
        id: 'encuestas',
        icono: '📋',
        titulo: 'Encuestas de seguimiento',
        articulos: ['g-encuestas-lista', 'g-responder-encuesta'],
    },
    {
        id: 'noticias',
        icono: '🔔',
        titulo: 'Noticias y notificaciones',
        articulos: ['g-noticias', 'g-notificaciones'],
    },
];

export const articulosGraduado = {

    // ═══════════════ MI PERFIL ═══════════════
    'g-mi-perfil': {
        titulo: 'Tu panel de Mi Perfil',
        resumen: 'Qué ves al entrar a tu cuenta de graduado y qué significa cada elemento.',
        bloques: [
            { t: 'p', c: 'Al iniciar sesión llegas directo a <strong>Mi Perfil</strong>, tu panel principal como graduado. Desde la cabecera roja superior puedes moverte entre <strong>Noticias</strong>, <strong>Encuestas</strong> y <strong>Mi Perfil</strong>, revisar tus notificaciones (icono de campana) y abrir esta Guía de Usuario (icono de libro).' },
            { t: 'img', src: 'g-01-perfil-vista.png', alt: 'Panel Mi Perfil de un graduado', caption: 'Panel "Mi Perfil": foto, estado de disponibilidad, especialidades, proyectos y certificados.' },
            { t: 'h3', c: 'Lo que muestra esta pantalla' },
            { t: 'list', items: [
                '<strong>Foto y nombre:</strong> haz clic sobre tu foto (o el ícono de cámara) para cambiarla en cualquier momento.',
                '<strong>Insignias:</strong> tu disponibilidad laboral, si tu perfil es público o privado, y si eres "Graduado verificado" (tesis confirmada).',
                '<strong>Sobre mí:</strong> tu biografía profesional, visible para las empresas si tu perfil es público.',
                '<strong>Especialidades:</strong> se calculan automáticamente según las tecnologías de tus proyectos y certificados.',
                '<strong>Proyectos y Certificados:</strong> tu portafolio, con un máximo de 5 elementos cada uno.',
            ] },
            { t: 'p', c: 'En la parte superior derecha tienes los botones <strong>Editar perfil</strong> y, según el estado de tu cuenta, <strong>Publicar perfil</strong> (si tu tesis aún no está verificada) o <strong>Hoja de Vida</strong> (si ya lo está).' },
        ],
    },

    'g-editar-perfil': {
        titulo: 'Editar tus datos de contacto y biografía',
        resumen: 'Cómo actualizar tu teléfono, correo personal, biografía, disponibilidad y redes profesionales.',
        bloques: [
            { t: 'p', c: 'Haz clic en el botón <strong>Editar perfil</strong> (parte superior derecha de tu panel) para abrir el formulario de edición.' },
            { t: 'img', src: 'g-02-editar-perfil-modal.png', alt: 'Formulario de edición de perfil', caption: 'Formulario "Editar perfil": biografía, disponibilidad, ubicación y redes.' },
            { t: 'h3', c: 'Campos que puedes editar' },
            { t: 'list', items: [
                '<strong>Teléfono y correo personal:</strong> para que las empresas interesadas puedan contactarte.',
                '<strong>Discapacidad:</strong> campo informativo opcional, usado solo con fines estadísticos.',
                '<strong>Disponibilidad:</strong> Buscando empleo, Trabajando, Estudiando o No disponible. Se muestra como insignia en tu perfil.',
                '<strong>Biografía:</strong> una descripción breve de tu perfil profesional (máx. 500 caracteres).',
                '<strong>Provincia y cantón actual:</strong> campos obligatorios para completar tu perfil.',
                '<strong>GitHub y LinkedIn:</strong> enlaces a tus redes profesionales, visibles en tu perfil público.',
                '<strong>Perfil público:</strong> un interruptor para decidir si tu perfil aparece en el buscador de graduados (requiere tener tu tesis verificada).',
            ] },
            { t: 'p', c: 'Haz clic en <strong>Guardar</strong> para aplicar los cambios. Verás una notificación confirmando que tu perfil fue actualizado.' },
        ],
    },

    'g-publicar-perfil': {
        titulo: 'Publicar tu perfil (verificar tu tesis)',
        resumen: 'El proceso para que tu perfil aparezca en el buscador público de graduados.',
        bloques: [
            { t: 'p', c: 'Mientras tu graduación no esté verificada, tu perfil permanece <strong>privado</strong>: no aparece en el buscador público ni en Proyectos destacados. Para publicarlo, haz clic en el botón <strong>Publicar perfil</strong>.' },
            { t: 'img', src: 'g-03-publicar-perfil-modal.png', alt: 'Modal de verificación de tesis mediante URL de DSpace', caption: 'Paso 1: pega el enlace de tu tesis en el repositorio digital DSpace de la ESPOCH.' },
            { t: 'h3', c: 'Cómo funciona la verificación' },
            { t: 'list', items: [
                'Antes de empezar, el sistema revisa que tengas <strong>foto de perfil, biografía, disponibilidad, provincia y cantón</strong> completos. Si falta algo, te lo indica antes de continuar.',
                'Pega el enlace de tu tesis publicada en <strong>dspace.espoch.edu.ec</strong> y haz clic en "Verificar".',
                'El sistema confirma que el nombre del autor en el repositorio coincida con tu nombre registrado.',
                'Si coincide, aceptas el consentimiento informado y tu perfil pasa a ser <strong>público</strong> automáticamente: ya apareces en el buscador de graduados y en la sección de Proyectos.',
            ] },
            { t: 'p', c: 'Una vez verificado, la insignia morada "Graduado verificado" aparece en tu perfil y el botón cambia a <strong>Hoja de Vida</strong>.' },
        ],
    },

    'g-hoja-vida': {
        titulo: 'Descargar tu hoja de vida en PDF',
        resumen: 'Genera automáticamente tu CV profesional a partir de los datos de tu perfil.',
        bloques: [
            { t: 'p', c: 'Con tu graduación verificada, el botón <strong>Hoja de Vida</strong> aparece en la cabecera de tu perfil. Al hacer clic se abre una vista previa de tu currículum generado automáticamente con tus datos, experiencia, educación, proyectos y certificados.' },
            { t: 'img', src: 'g-04-hoja-vida-preview.png', alt: 'Vista previa de la hoja de vida generada', caption: 'Vista previa de la Hoja de Vida, lista para descargar en PDF o Word.' },
            { t: 'p', c: 'Desde esta ventana puedes descargar el documento en formato <strong>PDF</strong> o <strong>Word</strong>. El contenido se actualiza automáticamente cada vez que modificas tu perfil, tus proyectos o certificados.' },
        ],
    },

    // ═══════════════ PORTAFOLIO ═══════════════
    'g-agregar-proyecto': {
        titulo: 'Agregar un proyecto a tu portafolio',
        resumen: 'Cómo mostrar tu experiencia técnica con hasta 5 proyectos destacados.',
        bloques: [
            { t: 'p', c: 'En la tarjeta <strong>Proyectos</strong> de tu panel, haz clic en <strong>Nuevo</strong> para abrir el formulario de registro.' },
            { t: 'img', src: 'g-05-agregar-proyecto.png', alt: 'Formulario para agregar un nuevo proyecto', caption: 'Formulario "Nuevo proyecto": título, fecha, descripción, repositorio e imagen.' },
            { t: 'h3', c: 'Campos del formulario' },
            { t: 'list', items: [
                '<strong>Título:</strong> entre 3 y 10 palabras.',
                '<strong>Fecha de finalización.</strong>',
                '<strong>Descripción:</strong> mínimo 10 palabras. Indica si trabajaste solo o en equipo, qué tecnologías usaste, qué problema resolviste y cuál fue el resultado.',
                '<strong>URL del repositorio</strong> (opcional): enlace a GitHub u otro repositorio público.',
                '<strong>Imagen del proyecto:</strong> una captura o portada representativa (JPG, PNG o WEBP, máx. 5MB).',
            ] },
            { t: 'p', c: 'Tienes un máximo de <strong>5 proyectos</strong>. Puedes editar o eliminar cualquiera desde los íconos de su tarjeta. Las tecnologías que menciones ayudan a calcular tus "Especialidades" automáticamente.' },
        ],
    },

    'g-agregar-certificado': {
        titulo: 'Agregar un certificado o curso',
        resumen: 'Cómo registrar certificaciones, talleres y cursos realizados.',
        bloques: [
            { t: 'p', c: 'En la tarjeta <strong>Certificados</strong>, haz clic en <strong>Nuevo</strong> para registrar un certificado, curso o taller.' },
            { t: 'img', src: 'g-06-agregar-certificado.png', alt: 'Formulario para agregar un nuevo certificado', caption: 'Formulario "Nuevo certificado": título, institución, fecha, URL de verificación e imagen.' },
            { t: 'h3', c: 'Campos del formulario' },
            { t: 'list', items: [
                '<strong>Título</strong> del certificado o curso.',
                '<strong>Institución</strong> que lo emitió (ej: ESPOCH, Udemy, Coursera).',
                '<strong>Fecha de finalización.</strong>',
                '<strong>URL de verificación:</strong> enlace público donde se puede confirmar el certificado.',
                '<strong>Descripción:</strong> qué aprendiste o qué hiciste para obtenerlo.',
                '<strong>Imagen del certificado</strong> (JPG, PNG o WEBP).',
            ] },
            { t: 'p', c: 'Puedes tener hasta <strong>5 certificados</strong>. Mantener coherencia entre tus certificados y tus tecnologías declaradas genera más confianza ante las empresas.' },
        ],
    },

    // ═══════════════ ENCUESTAS ═══════════════
    'g-encuestas-lista': {
        titulo: 'Ver tus encuestas asignadas',
        resumen: 'Dónde revisar las encuestas de seguimiento a graduados pendientes y completadas.',
        bloques: [
            { t: 'p', c: 'En la sección <strong>Encuestas</strong> del menú superior encuentras todas las encuestas de seguimiento dirigidas a tu promoción.' },
            { t: 'img', src: 'g-07-encuestas-lista.png', alt: 'Lista de encuestas asignadas al graduado', caption: 'Lista de encuestas: contadores de pendientes, completadas y total.' },
            { t: 'h3', c: 'Qué información verás' },
            { t: 'list', items: [
                'Tres contadores en la parte superior: <strong>Pendientes</strong>, <strong>Completadas</strong> y <strong>Total</strong>.',
                'Filtros rápidos para ver "Todas", solo "Pendientes" o solo "Completadas".',
                'Cada encuesta muestra su estado con un color: amarillo (pendiente), verde (completada) o gris (cerrada).',
            ] },
            { t: 'p', c: 'Las encuestas solo están disponibles una vez que tu graduación ha sido <strong>verificada</strong> por el administrador de la Carrera.' },
        ],
    },

    'g-responder-encuesta': {
        titulo: 'Cómo responder una encuesta',
        resumen: 'El proceso paso a paso: consentimiento, tus datos y las preguntas de la encuesta.',
        bloques: [
            { t: 'p', c: 'Haz clic sobre una encuesta <strong>pendiente</strong> para abrirla. El formulario avanza en tres pasos.' },
            { t: 'h3', c: 'Paso 1 — Consentimiento informado' },
            { t: 'p', c: 'Antes de cualquier pregunta, se presenta el consentimiento informado del estudio: para qué se usan tus respuestas y cómo se protegen tus datos. Puedes <strong>aceptar</strong> y continuar, o <strong>rechazar</strong> tu participación en cualquier momento.' },
            { t: 'img', src: 'g-08-encuesta-consentimiento.png', alt: 'Paso de consentimiento informado de la encuesta', caption: 'Paso 1: consentimiento informado antes de iniciar la encuesta.' },
            { t: 'h3', c: 'Paso 2 — Tus datos' },
            { t: 'p', c: 'Se muestran (de solo lectura) tus datos de graduación ya registrados, para que los confirmes antes de continuar: nombre, cédula, correo, año de graduación y título obtenido.' },
            { t: 'img', src: 'g-09-encuesta-datos.png', alt: 'Paso de confirmación de datos del graduado', caption: 'Paso 2: confirmación de tus datos de graduación.' },
            { t: 'h3', c: 'Paso 3 — Preguntas de la encuesta' },
            { t: 'p', c: 'Responde cada pregunta. Pueden ser de varios tipos: opción múltiple, escala de satisfacción, sí/no, selección múltiple (checkboxes), texto libre o tablas tipo matriz. Las preguntas marcadas como obligatorias deben completarse antes de enviar.' },
            { t: 'img', src: 'g-10-encuesta-preguntas.png', alt: 'Paso de preguntas de la encuesta respondiéndose', caption: 'Paso 3: preguntas de la encuesta, incluyendo escalas tipo tabla.' },
            { t: 'p', c: 'Al finalizar, haz clic en <strong>Enviar</strong>. Verás una confirmación de que tus respuestas fueron registradas y la encuesta pasará a estado "Completada" en tu lista.' },
            { t: 'img', src: 'g-11-encuesta-completada.png', alt: 'Confirmación de encuesta completada', caption: 'Confirmación final tras enviar tus respuestas.' },
        ],
    },

    // ═══════════════ NOTICIAS Y NOTIFICACIONES ═══════════════
    'g-noticias': {
        titulo: 'Noticias y eventos para graduados',
        resumen: 'Dónde ver comunicados, convocatorias y eventos de la Carrera de Software.',
        bloques: [
            { t: 'p', c: 'La sección <strong>Noticias</strong> de tu panel muestra comunicados oficiales, convocatorias, oportunidades laborales y eventos organizados por la Carrera de Software, igual que en la vista pública pero adaptada a tu panel de graduado.' },
            { t: 'img', src: 'g-12-noticias.png', alt: 'Listado de noticias y eventos para graduados', caption: 'Noticias y eventos: convocatorias, comunicados y oportunidades laborales.' },
            { t: 'p', c: 'Cada publicación indica su categoría con un color distintivo. Los eventos muestran además la fecha, modalidad (presencial, virtual o híbrida) y el lugar o enlace de acceso.' },
        ],
    },

    'g-notificaciones': {
        titulo: 'Tus notificaciones',
        resumen: 'Cómo revisar los mensajes de empresas interesadas en tu perfil.',
        bloques: [
            { t: 'p', c: 'El ícono de campana en la cabecera muestra un contador con tus notificaciones sin leer. Al hacer clic se abre un panel con el historial.' },
            { t: 'img', src: 'g-13-notificaciones-panel.png', alt: 'Panel de notificaciones con detalle de contacto de una empresa', caption: 'Panel de notificaciones: detalle de una empresa interesada en el perfil.' },
            { t: 'h3', c: 'Tipo de notificaciones más común' },
            { t: 'p', c: 'Cuando una empresa usa el botón "Contactar" en tu perfil público, recibes una notificación con sus datos (nombre, empresa y correo) y el mensaje que escribió. También recibes una copia en tu correo personal, para que puedas responder directamente.' },
            { t: 'p', c: 'Usa <strong>Marcar todas leídas</strong> para limpiar el contador, o haz clic en una notificación individual para marcarla como leída y ver su detalle.' },
        ],
    },
};
