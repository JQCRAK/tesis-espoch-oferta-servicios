// frontend/src/pages/docs/docsPublicoData.js
// Contenido de la Guía de Usuario — sección "Público" (visitantes sin cuenta).
// Cada categoría agrupa artículos; cada artículo es una lista de bloques
// (párrafo, imagen con pie de foto, lista o subtítulo) que se renderizan
// en orden dentro de Documentacion.jsx.

export const categoriasPublico = [
    {
        id: 'primeros-pasos',
        titulo: 'Primeros pasos',
        icono: '🧭',
        articulos: ['inicio', 'buscar'],
    },
    {
        id: 'perfiles-proyectos',
        titulo: 'Perfiles y proyectos',
        icono: '👤',
        articulos: ['perfil-publico', 'contactar', 'proyectos'],
    },
    {
        id: 'noticias-eventos',
        titulo: 'Noticias y eventos',
        icono: '📰',
        articulos: ['noticias-eventos'],
    },
    {
        id: 'cuenta-acceso',
        titulo: 'Cuenta y acceso',
        icono: '🔐',
        articulos: ['iniciar-sesion', 'registro-correo', 'registro-cedula'],
    },
    {
        id: 'empleadores',
        titulo: 'Empleadores',
        icono: '🏢',
        articulos: ['encuesta-empleador'],
    },
];

export const articulosPublico = {

    'inicio': {
        titulo: 'Página de inicio y directorio de perfiles',
        resumen: 'Qué muestra la portada del portal y cómo leer los contadores en tiempo real.',
        bloques: [
            { t: 'p', c: 'Al entrar al portal, la página de inicio funciona como un directorio público de los graduados de la Carrera de Software. No necesitas una cuenta para verla.' },
            { t: 'img', src: '01-inicio-directorio.png', alt: 'Página de inicio del portal con el buscador y el directorio de perfiles', caption: 'Encabezado con el buscador principal y el listado de perfiles debajo.' },
            { t: 'h3', c: '¿Qué hace cada elemento?' },
            { t: 'list', items: [
                '<strong>Buscador grande</strong>: escribe un nombre, una tecnología (por ejemplo "React") o una especialidad, y el listado de abajo se filtra al instante.',
                '<strong>Contadores</strong> (Graduados, Disponibles, Tecnologías, Proyectos): se actualizan solos con los datos reales del portal; no hay que recargar la página.',
                '<strong>Botón "Perfiles Profesionales" / "Noticias" / "Proyectos"</strong> en el menú superior: cambian de sección sin salir del sitio.',
                '<strong>"Ingresar" / "Registrarse"</strong>: llevan a la pantalla de acceso, solo las usan quienes ya son o quieren ser graduados registrados.',
            ] },
            { t: 'p', c: 'Debajo del buscador aparecen las tarjetas de los graduados que ya hicieron público su perfil. Cada tarjeta muestra foto, nombre, carrera, disponibilidad y un botón para ver el perfil completo.' },
        ],
    },

    'buscar': {
        titulo: 'Buscar y filtrar graduados',
        resumen: 'Cómo combinar el buscador con los filtros de disponibilidad para encontrar perfiles específicos.',
        bloques: [
            { t: 'p', c: 'El buscador acepta nombres, tecnologías o especialidades. Mientras escribes, debajo aparecen sugerencias de búsquedas populares (React, Node.js, MongoDB, Docker) que puedes usar con un clic.' },
            { t: 'img', src: '02-buscador-filtro.png', alt: 'Buscador del portal con el texto React escrito', caption: 'El buscador filtra el directorio apenas escribes; se puede limpiar con el botón ✕.' },
            { t: 'h3', c: 'Filtros rápidos' },
            { t: 'list', items: [
                '<strong>Todos</strong>: muestra el directorio completo, sin filtrar.',
                '<strong>Disponibles</strong>: incluye a los graduados que están buscando empleo, trabajando o estudiando (los tres estados en los que el graduado aparece como activo).',
                '<strong>No disponibles</strong>: graduados que marcaron que no están buscando oportunidades por el momento.',
            ] },
            { t: 'p', c: 'Si una búsqueda no encuentra coincidencias, el portal muestra "0 resultados" junto con un botón "Limpiar filtros" para volver a empezar.' },
        ],
    },

    'perfil-publico': {
        titulo: 'Ver el perfil público de un graduado',
        resumen: 'Qué información puede ver un visitante y de dónde sale cada dato.',
        bloques: [
            { t: 'p', c: 'Al hacer clic en una tarjeta del directorio se abre el perfil completo del graduado. Esta vista es pública: cualquier persona con el enlace puede verla, sin iniciar sesión.' },
            { t: 'img', src: '03-perfil-publico.png', alt: 'Perfil público de un graduado con proyectos, certificados y especialidades', caption: 'Columna izquierda: identidad y contacto. Centro: proyectos, certificados, experiencia y educación. Derecha: especialidades detectadas automáticamente.' },
            { t: 'h3', c: 'Secciones del perfil' },
            { t: 'list', items: [
                '<strong>Tarjeta de identidad</strong>: foto, nombre, carrera, estado de disponibilidad y botón "Contactar".',
                '<strong>Sobre mí</strong>: la descripción profesional que el graduado escribió.',
                '<strong>Proyectos y Certificados</strong>: tarjetas con imagen, descripción, tecnologías y el año. Al hacer clic en "Ver más" se abre el detalle completo.',
                '<strong>Experiencia laboral y Educación formal</strong>: historial que el graduado cargó desde su panel.',
                '<strong>Especialidades</strong> (columna derecha): barras de progreso calculadas automáticamente por el sistema a partir de los proyectos y certificados; no las escribe el graduado a mano.',
                '<strong>Tecnologías y Habilidades blandas</strong>: etiquetas detectadas de la misma forma.',
            ] },
            { t: 'p', c: 'El correo, el teléfono y la cédula del graduado nunca se muestran en esta vista pública; solo se usan internamente. Para comunicarte con la persona se usa el botón "Contactar".' },
        ],
    },

    'contactar': {
        titulo: 'Solicitar contacto con un graduado',
        resumen: 'Cómo enviar una notificación directa al graduado sin exponer su correo.',
        bloques: [
            { t: 'p', c: 'Si te interesa un perfil (por ejemplo, para ofrecer una vacante), el botón rojo "Contactar" abre un formulario corto.' },
            { t: 'img', src: '04-perfil-contactar-modal.png', alt: 'Formulario para notificar a un graduado', caption: 'Formulario de contacto: nombre, correo, empresa (opcional) y el motivo del interés.' },
            { t: 'list', items: [
                '<strong>Tu nombre</strong> y <strong>Correo</strong>: obligatorios, así el graduado sabe quién escribe y puede responder.',
                '<strong>Empresa u organización</strong>: opcional.',
                '<strong>"¿Por qué te interesa este perfil?"</strong>: cuéntale al graduado el proyecto o la vacante; es obligatorio.',
                '<strong>"Enviar notificación"</strong>: envía el mensaje directo al graduado. No se comparten tus datos con nadie más que con él.',
            ] },
            { t: 'p', c: 'Al enviar el formulario aparece un mensaje de confirmación en verde. El graduado recibe la solicitud en su panel y decide si te responde directamente a tu correo.' },
        ],
    },

    'proyectos': {
        titulo: 'Ver proyectos de graduados',
        resumen: 'La galería pública de proyectos, con filtros por tecnología en tendencia.',
        bloques: [
            { t: 'p', c: 'Desde el menú superior, "Proyectos" lleva a una galería con los trabajos de todos los graduados que tienen el perfil público y la tesis verificada.' },
            { t: 'img', src: '05-proyectos.png', alt: 'Página de proyectos de graduados con un proyecto en tendencia', caption: 'Bloque de "Tendencia semanal" arriba, y debajo las tarjetas de proyectos filtrables por tecnología.' },
            { t: 'list', items: [
                '<strong>Tendencia semanal</strong>: la categoría tecnológica que el sistema destaca esa semana (cambia automáticamente cada lunes).',
                '<strong>Botones de tecnología</strong> ("Todos", "React", "Node.js", etc.): filtran las tarjetas sin recargar la página.',
                '<strong>Buscador</strong> de la derecha: busca por título del proyecto, tecnología usada o especialidad del graduado.',
            ] },
            { t: 'p', c: 'Al hacer clic en "Ver perfil" dentro de una tarjeta de proyecto, se abre directamente el perfil completo del graduado que lo desarrolló.' },
        ],
    },

    'noticias-eventos': {
        titulo: 'Noticias y eventos del portal',
        resumen: 'Las dos pestañas de la sección de comunicación de la carrera.',
        bloques: [
            { t: 'p', c: 'La sección "Noticias" del menú superior tiene dos pestañas: Noticias y Eventos. Ambas son públicas y no requieren cuenta.' },
            { t: 'img', src: '06-noticias.png', alt: 'Pestaña de noticias del portal', caption: 'Pestaña Noticias: la más reciente aparece destacada arriba, y el panel derecho adelanta el próximo evento.' },
            { t: 'img', src: '07-eventos.png', alt: 'Pestaña de eventos del portal', caption: 'Pestaña Eventos: tarjetas con la etiqueta "Próximo" o "En curso" según la fecha.' },
            { t: 'p', c: 'Al hacer clic en cualquier tarjeta de evento se abre una ventana con los detalles completos: hora de inicio, duración, modalidad (presencial, virtual o híbrida), el aforo si aplica, y una descripción completa.' },
            { t: 'img', src: '08-evento-detalle-modal.png', alt: 'Modal con el detalle de un evento', caption: 'Detalle de un evento virtual, con el enlace de acceso y el cupo de inscritos.' },
        ],
    },

    'iniciar-sesion': {
        titulo: 'Iniciar sesión',
        resumen: 'El punto de entrada para graduados y administradores ya registrados.',
        bloques: [
            { t: 'p', c: 'El botón "Ingresar" del menú público lleva a la pantalla de inicio de sesión, común para graduados y administradores del portal.' },
            { t: 'img', src: '09-login.png', alt: 'Pantalla de inicio de sesión del portal', caption: 'A la izquierda, una foto del campus; a la derecha, el formulario de acceso.' },
            { t: 'list', items: [
                '<strong>Correo electrónico</strong> y <strong>Contraseña</strong>: las credenciales con las que te registraste o las que te asignó el administrador.',
                '<strong>¿Olvidaste tu contraseña?</strong>: inicia el proceso de recuperación por correo.',
                '<strong>Ingresar</strong>: valida tus datos y te lleva a tu panel correspondiente (graduado o administrador) según tu rol.',
                '<strong>¿No tienes cuenta? Regístrate</strong>: solo aparece para quienes todavía no tienen perfil de graduado.',
                '<strong>Ver graduados</strong> (arriba a la izquierda): regresa al directorio público sin iniciar sesión.',
            ] },
            { t: 'p', c: 'Si tu cuenta de graduado fue bloqueada por inactividad, el aviso de abajo del formulario te indica que contactes a soporte técnico.' },
        ],
    },

    'registro-correo': {
        titulo: 'Registrarte con tu correo institucional',
        resumen: 'El camino más rápido, para quien todavía tiene acceso a su correo @espoch.edu.ec.',
        bloques: [
            { t: 'p', c: 'El registro empieza siempre con el mismo primer paso: tus datos personales (nombres, apellidos, cédula, celular, género, discapacidad y fecha de nacimiento). Al terminar, el sistema te pregunta si tienes acceso a tu correo institucional.' },
            { t: 'img', src: '10-registro-paso1-datos.png', alt: 'Paso 1 del registro con los datos personales', caption: 'Paso 1 de 2, común a los dos flujos de registro. Al final está la pregunta clave: "¿Tienes acceso a tu correo @espoch.edu.ec?"' },
            { t: 'p', c: 'Si respondes "Sí, tengo acceso", avanzas directo al segundo paso con este flujo.' },
            { t: 'img', src: '11-registro-flujoA-correo-institucional.png', alt: 'Paso 2 del registro vinculando el correo institucional', caption: 'Paso 2 de 2: se piden el correo personal, el correo @espoch.edu.ec y la contraseña.' },
            { t: 'list', items: [
                '<strong>Correo personal</strong>: el que vas a usar para iniciar sesión de ahora en adelante (no tiene que ser el institucional).',
                '<strong>Correo @espoch.edu.ec</strong>: el sistema envía un código de verificación de seis dígitos a esta dirección.',
                '<strong>Contraseña</strong>: debe cumplir los cuatro requisitos que se marcan en verde a medida que los completas.',
                '<strong>Registrarme</strong>: una vez verificado el código, crea tu cuenta.',
            ] },
            { t: 'p', c: 'Revisa tu bandeja de entrada, incluida la carpeta de spam, para encontrar el código. Si no te llega, el formulario permite pedir que se reenvíe.' },
        ],
    },

    'registro-cedula': {
        titulo: 'Registrarte verificando tu cédula y tesis',
        resumen: 'La opción para graduados que ya no tienen acceso a su correo @espoch.edu.ec.',
        bloques: [
            { t: 'p', c: 'Si en el primer paso respondes "No tengo acceso" a tu correo institucional, el sistema te pide verificar tu identidad de otra forma: con tu cédula y el enlace de tu tesis en el repositorio de la ESPOCH.' },
            { t: 'img', src: '10-registro-paso1-datos.png', alt: 'Paso 1 del registro con los datos personales', caption: 'Paso 1 de 2, común a los dos flujos de registro.' },
            { t: 'img', src: '12-registro-flujoB-verificacion-cedula.png', alt: 'Paso 2 del registro con verificación de cédula y tesis', caption: 'Paso 2 de 2: fotos de la cédula, enlace de la tesis, correo personal y contraseña.' },
            { t: 'list', items: [
                '<strong>Cédula — frente</strong> y <strong>Cédula — reverso</strong>: haz clic en cada recuadro para subir una foto nítida y con buena iluminación (JPG, PNG o WEBP, máximo 5 MB).',
                '<strong>URL de tu tesis en el repositorio ESPOCH</strong>: entra a dspace.espoch.edu.ec, busca tu tesis y pega la dirección completa.',
                '<strong>Correo personal</strong> y <strong>Contraseña</strong>: igual que en el otro flujo.',
                '<strong>Verificar identidad</strong>: el sistema revisa tu cédula y confirma que la tesis del enlace coincide contigo antes de crear la cuenta.',
            ] },
            { t: 'p', c: 'Este proceso puede tardar un poco más porque incluye una revisión real contra el repositorio institucional, no solo un código de correo.' },
        ],
    },

    'encuesta-empleador': {
        titulo: 'Responder la encuesta de empleador',
        resumen: 'El empleador no crea una cuenta: responde desde un enlace de invitación que le envía el administrador.',
        bloques: [
            { t: 'p', c: 'Cuando el administrador de la carrera activa una encuesta dirigida a empleadores, cada empresa registrada recibe un enlace único por correo. Ese enlace abre directamente el cuestionario, sin necesidad de registrarse ni iniciar sesión.' },
            { t: 'h3', c: 'Paso 1 — Consentimiento informado' },
            { t: 'img', src: '13-encuesta-empleador-consentimiento.png', alt: 'Pantalla de consentimiento informado para empleadores', caption: 'Hay que leer el texto completo antes de decidir si se participa.' },
            { t: 'p', c: 'El botón verde "Sí, acepto participar" avanza al siguiente paso. "No acepto" registra la decisión y cierra la encuesta sin pedir más datos.' },
            { t: 'h3', c: 'Paso 2 — Datos del encuestado' },
            { t: 'img', src: '14-encuesta-empleador-datos.png', alt: 'Formulario de datos del encuestado en la encuesta de empleador', caption: 'Los datos de la empresa ya vienen cargados (solo lectura); abajo se completan los datos de la persona que responde.' },
            { t: 'p', c: 'Si intentas continuar sin llenar un campo obligatorio, aparece un aviso abajo indicando cuál falta. El botón rojo "Continuar al cuestionario" pasa al paso final.' },
            { t: 'h3', c: 'Paso 3 — Cuestionario' },
            { t: 'img', src: '15-encuesta-empleador-preguntas.png', alt: 'Preguntas del cuestionario para empleadores', caption: 'Las preguntas pueden ser de escala, de sí/no, de selección múltiple con límite de opciones, o de texto libre.' },
            { t: 'p', c: 'Al terminar, "Enviar respuestas" guarda el cuestionario. Si falta alguna respuesta obligatoria, un aviso en la esquina inferior indica los números de las preguntas pendientes. El enlace solo puede usarse una vez; después de enviar, deja de funcionar.' },
        ],
    },
};
