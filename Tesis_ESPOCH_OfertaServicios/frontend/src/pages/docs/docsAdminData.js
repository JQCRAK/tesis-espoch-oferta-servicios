// frontend/src/pages/docs/docsAdminData.js
// Contenido de la Guía de Usuario — sección ADMINISTRADOR (panel privado).

export const categoriasAdmin = [
    {
        id: 'panel',
        icono: '📊',
        titulo: 'Panel principal',
        articulos: ['a-dashboard'],
    },
    {
        id: 'graduados',
        icono: '🎓',
        titulo: 'Gestión de Graduados',
        articulos: ['a-graduados-lista', 'a-graduados-registrar', 'a-graduados-ver-editar', 'a-graduados-csv'],
    },
    {
        id: 'empleadores',
        icono: '🏢',
        titulo: 'Gestión de Empleadores',
        articulos: ['a-empleadores-lista', 'a-empleadores-registrar'],
    },
    {
        id: 'encuestas',
        icono: '📋',
        titulo: 'Gestión de Encuestas',
        articulos: ['a-encuestas-lista', 'a-encuestas-crear', 'a-encuestas-preguntas'],
    },
    {
        id: 'estadisticas',
        icono: '📈',
        titulo: 'Estadísticas',
        articulos: ['a-estadisticas-graduados', 'a-estadisticas-resultados', 'a-estadisticas-empleadores'],
    },
    {
        id: 'reportes',
        icono: '📑',
        titulo: 'Reportes',
        articulos: ['a-reportes-anexo25', 'a-reportes-anexo19'],
    },
    {
        id: 'eventos',
        icono: '📅',
        titulo: 'Eventos y Noticias',
        articulos: ['a-eventos', 'a-noticias'],
    },
];

export const articulosAdmin = {

    // ═══════════════ PANEL PRINCIPAL ═══════════════
    'a-dashboard': {
        titulo: 'Panel principal',
        resumen: 'Qué ves al iniciar sesión como administrador: métricas globales y accesos rápidos.',
        bloques: [
            { t: 'p', c: 'Al iniciar sesión como administrador llegas al <strong>Panel Principal</strong>. La barra lateral izquierda te lleva a cada módulo (Graduados, Empleadores, Encuestas, Estadísticas, Reportes, Eventos); en la cabecera superior están el ícono de <strong>Guía de Usuario</strong> y la campana de notificaciones.' },
            { t: 'img', src: 'a-01-dashboard.png', alt: 'Panel principal del administrador', caption: 'Panel Principal: métricas globales, registros recientes y accesos rápidos.' },
            { t: 'h3', c: 'Qué muestra esta pantalla' },
            { t: 'list', items: [
                '<strong>4 tarjetas de métricas:</strong> Graduados Registrados, Perfiles Públicos, Encuestas Activas y Eventos Próximos.',
                '<strong>Registros Recientes:</strong> los últimos 5 graduados registrados, con su correo, estado de tesis y visibilidad del perfil. El botón <strong>"Ver Todos"</strong> te lleva al listado completo.',
                '<strong>Acciones Rápidas:</strong> tres botones directos — <strong>"Crear Eventos"</strong>, <strong>"Crear Encuestas"</strong> y <strong>"Ver Reportes"</strong>.',
            ] },
        ],
    },

    // ═══════════════ GRADUADOS ═══════════════
    'a-graduados-lista': {
        titulo: 'Ver y filtrar graduados',
        resumen: 'La tabla completa de graduados, con filtros por promoción, estado y texto.',
        bloques: [
            { t: 'p', c: 'En <strong>Graduados</strong> encuentras la tabla completa de graduados registrados, con sus datos principales y acciones por fila.' },
            { t: 'img', src: 'a-02-graduados-lista.png', alt: 'Listado de graduados con filtros', caption: 'Listado de graduados: búsqueda, filtros de promoción y estado, y acciones por fila.' },
            { t: 'h3', c: 'Filtros disponibles' },
            { t: 'list', items: [
                '<strong>Búsqueda</strong> por nombre, cédula o tecnología.',
                '<strong>Promoción:</strong> filtra por año de graduación.',
                '<strong>Estado:</strong> Todos, Verificados, Pendientes, Bloqueados, o Antiguos (+5 años).',
            ] },
            { t: 'h3', c: 'Acciones por fila' },
            { t: 'list', items: [
                '👁 <strong>Ver perfil:</strong> abre una ventana de solo lectura con los datos del graduado, sus proyectos y certificados.',
                '✏️ <strong>Editar datos:</strong> abre la misma ventana lista para editar teléfono y correo personal.',
                '🗑 <strong>Eliminar:</strong> elimina al graduado de forma permanente, previa confirmación.',
            ] },
        ],
    },

    'a-graduados-registrar': {
        titulo: 'Registrar un graduado manualmente',
        resumen: 'El formulario de alta individual, para cuando un graduado necesita que tú le crees la cuenta.',
        bloques: [
            { t: 'p', c: 'Haz clic en <strong>"Nuevo Graduado"</strong> (arriba a la derecha de la tabla) y elige <strong>"Individual"</strong> para abrir el formulario de registro manual.' },
            { t: 'img', src: 'a-03-graduados-nuevo-individual.png', alt: 'Formulario de registro individual de un graduado', caption: 'Formulario "Nuevo Graduado — Individual".' },
            { t: 'h3', c: 'Campos del formulario' },
            { t: 'list', items: [
                'Nombres y Apellidos.',
                'Cédula y Teléfono (10 dígitos cada uno).',
                'Correo personal.',
                'Género: Masculino, Femenino o LGTBI.',
                'Fecha de nacimiento.',
                'Discapacidad (opcional, varias categorías).',
            ] },
            { t: 'p', c: 'Al hacer clic en <strong>"Registrar y enviar correo"</strong>, el sistema crea la cuenta y notifica al graduado por correo para que pueda completar su perfil e iniciar sesión.' },
        ],
    },

    'a-graduados-ver-editar': {
        titulo: 'Ver y editar el perfil de un graduado',
        resumen: 'Qué información puedes consultar y qué puedes modificar desde el panel de administración.',
        bloques: [
            { t: 'p', c: 'Al hacer clic en el ícono de ojo (o de lápiz) de una fila se abre una ventana con tres pestañas: <strong>Información</strong>, <strong>Proyectos</strong> y <strong>Certificados</strong>.' },
            { t: 'img', src: 'a-04-graduados-ver-editar.png', alt: 'Ventana de información de un graduado, en modo edición', caption: 'Ventana "Ver graduado" — pestaña Información, con los campos editables desplegados.' },
            { t: 'h3', c: 'Pestaña Información' },
            { t: 'list', items: [
                'Datos personales de solo lectura: cédula, teléfono, correo, género, fecha de nacimiento, discapacidad y año de graduación (los campos cifrados se muestran enmascarados).',
                'Un interruptor para <strong>bloquear o desbloquear</strong> la cuenta del graduado.',
                'Sección "Datos editables": al hacer clic en <strong>"Editar"</strong> puedes corregir el <strong>teléfono</strong> y el <strong>correo personal</strong> del graduado, por ejemplo si se equivocó al registrarse. Se confirma con <strong>"Guardar"</strong>.',
            ] },
            { t: 'p', c: 'Las pestañas <strong>Proyectos</strong> y <strong>Certificados</strong> muestran en solo lectura lo que el propio graduado ha subido desde su panel, con la opción de eliminar algún elemento si fuera necesario.' },
        ],
    },

    'a-graduados-csv': {
        titulo: 'Carga masiva de graduados por CSV',
        resumen: 'Cómo registrar muchos graduados a la vez usando una plantilla de Excel/CSV.',
        bloques: [
            { t: 'p', c: 'Para registrar varios graduados de una sola vez (hasta 200 por archivo), haz clic en <strong>"Nuevo Graduado" → "Carga masiva CSV"</strong>.' },
            { t: 'img', src: 'a-05-graduados-csv.png', alt: 'Modal de carga masiva de graduados por CSV', caption: 'Carga masiva de graduados: plantilla, zona de arrastre y procesamiento.' },
            { t: 'h3', c: 'Pasos' },
            { t: 'list', items: [
                'Descarga la plantilla con el botón <strong>"Descargar plantilla_graduados_espoch.csv"</strong> y complétala respetando las columnas.',
                'Arrastra el archivo a la zona indicada, o haz clic para seleccionarlo.',
                'Haz clic en <strong>"Procesar CSV y registrar"</strong>.',
                'Al finalizar, se abre un reporte con tres pestañas: <strong>Todos</strong>, <strong>✅ Exitosos</strong> y <strong>❌ Errores</strong>, para que revises fila por fila qué se registró y qué falló (y por qué).',
            ] },
        ],
    },

    // ═══════════════ EMPLEADORES ═══════════════
    'a-empleadores-lista': {
        titulo: 'Ver y filtrar empleadores',
        resumen: 'El listado de empresas registradas para las encuestas de seguimiento a empleadores.',
        bloques: [
            { t: 'p', c: 'En <strong>Empleadores</strong> encuentras la tabla de empresas registradas, con su ubicación, tipo de capital y actividad.' },
            { t: 'img', src: 'a-06-empleadores-lista.png', alt: 'Listado de empleadores con filtros', caption: 'Listado de empleadores: tarjetas de resumen, filtros y tabla.' },
            { t: 'h3', c: 'Filtros disponibles' },
            { t: 'list', items: [
                '<strong>Búsqueda</strong> por empresa, gerente o correo.',
                '<strong>Capital:</strong> Todos, Pública, Privada o Mixto.',
                '<strong>Actividad:</strong> Todas, Industrial, Comercial o Servicios.',
            ] },
            { t: 'p', c: 'Igual que en Graduados, cada fila tiene acciones de <strong>Ver</strong>, <strong>Editar</strong> y <strong>Eliminar</strong>. La ventana de detalle además muestra los "Datos del encuestado" una vez que la empresa respondió su primera encuesta.' },
        ],
    },

    'a-empleadores-registrar': {
        titulo: 'Registrar un empleador',
        resumen: 'Alta individual o carga masiva de empresas por CSV.',
        bloques: [
            { t: 'p', c: 'Haz clic en <strong>"Nuevo Empleador" → "Individual"</strong> para registrar una empresa manualmente.' },
            { t: 'img', src: 'a-07-empleadores-nuevo.png', alt: 'Formulario de registro de un nuevo empleador', caption: 'Formulario "Nuevo Empleador — Individual".' },
            { t: 'h3', c: 'Campos del formulario' },
            { t: 'list', items: [
                'Nombre de la empresa y Gerente / Propietario.',
                'Correo de la organización y Teléfono de contacto.',
                'Provincia y Ciudad.',
                'Tipo de capital: Pública, Privada o Mixto.',
                'Tipo de actividad: Industrial, Comercial o Servicios.',
            ] },
            { t: 'p', c: 'También puedes usar <strong>"Nuevo Empleador" → "Carga masiva CSV"</strong> para registrar varias empresas a la vez, con el mismo flujo de plantilla, arrastre y reporte de resultados que en Graduados (ver <a href="/documentacion/admin/a-graduados-csv" style="color:#BC0613;font-weight:700;">Carga masiva de graduados por CSV</a>).' },
        ],
    },

    // ═══════════════ ENCUESTAS ═══════════════
    'a-encuestas-lista': {
        titulo: 'Ver encuestas de graduados y empleadores',
        resumen: 'Cómo alternar entre encuestas de graduados y de empleadores, y qué indican sus estados.',
        bloques: [
            { t: 'p', c: 'En <strong>Encuestas</strong> puedes alternar entre dos pestañas: <strong>Graduados</strong> y <strong>Empleadores</strong>. Cada una lista sus propias encuestas, con contadores de Activas, Borrador, Cerradas y Respuestas totales.' },
            { t: 'img', src: 'a-08-encuestas-lista.png', alt: 'Listado de encuestas con estados y acciones', caption: 'Listado de encuestas: estadísticas rápidas, búsqueda y acciones por fila.' },
            { t: 'h3', c: 'Acciones por fila' },
            { t: 'list', items: [
                '🔔 <strong>Notificar:</strong> envía la invitación por correo (solo disponible si la encuesta está Activa).',
                '❓ <strong>Gestionar preguntas:</strong> abre el constructor de preguntas.',
                '👁 <strong>Vista previa</strong> de la encuesta tal como la ve el encuestado.',
                '✏️ <strong>Editar</strong> el título, fechas o consentimiento.',
                '📄 <strong>Duplicar:</strong> crea una copia con el nombre "Copia de …", útil para reutilizar una encuesta de un año anterior.',
                '🗑 <strong>Eliminar.</strong>',
            ] },
        ],
    },

    'a-encuestas-crear': {
        titulo: 'Crear una nueva encuesta',
        resumen: 'Metadatos de la encuesta: título, consentimiento informado, fechas y audiencia.',
        bloques: [
            { t: 'p', c: 'Haz clic en <strong>"+ Nueva"</strong> para abrir el formulario de creación.' },
            { t: 'img', src: 'a-09-encuestas-nueva-modal.png', alt: 'Formulario de creación de una nueva encuesta', caption: 'Formulario "Nueva Encuesta": metadatos, fechas y audiencia por año de graduación.' },
            { t: 'h3', c: 'Campos del formulario' },
            { t: 'list', items: [
                '<strong>Título</strong> de la encuesta.',
                '<strong>Consentimiento informado:</strong> el texto legal que verá el encuestado antes de responder (viene con un texto por defecto que puedes ajustar, máx. 3000 caracteres).',
                '<strong>Descripción interna</strong> (notas que solo ve el equipo administrador).',
                '<strong>Inicio</strong> y <strong>Cierre:</strong> ventana de vigencia de la encuesta.',
                '<strong>Estado:</strong> Borrador, Activa o Cerrada.',
                '<strong>Dirigida a — Años de graduación</strong> (solo para encuestas de graduados): marca los años específicos a los que va dirigida, o déjalo todo sin marcar para incluir a todos los graduados con tesis verificada.',
            ] },
            { t: 'p', c: 'Guarda con el botón <strong>"Guardar"</strong>. Si la encuesta se crea en estado Borrador, no es visible para los graduados/empleadores hasta que la cambies a Activa.' },
        ],
    },

    'a-encuestas-preguntas': {
        titulo: 'Construir las preguntas de una encuesta',
        resumen: 'Tipos de pregunta disponibles, modo matriz y lógica condicional.',
        bloques: [
            { t: 'p', c: 'Desde el ícono <strong>"Gestionar preguntas"</strong> de una encuesta se abre la lista de preguntas, donde puedes reordenarlas arrastrándolas por el ícono "⋮⋮", editarlas o eliminarlas.' },
            { t: 'img', src: 'a-10-encuestas-preguntas-lista.png', alt: 'Lista de preguntas de una encuesta, reordenable por arrastre', caption: 'Lista de preguntas: se reordenan arrastrando cada tarjeta.' },
            { t: 'p', c: 'Haz clic en <strong>"+ Agregar pregunta"</strong> para abrir el formulario de una nueva pregunta.' },
            { t: 'img', src: 'a-11-encuestas-agregar-pregunta.png', alt: 'Formulario para agregar una pregunta de opción múltiple', caption: 'Formulario "Agregar Pregunta": tipo de pregunta y sus opciones.' },
            { t: 'h3', c: 'Tipos de pregunta disponibles' },
            { t: 'list', items: [
                '<strong>Título de sección:</strong> un separador visual, no se responde.',
                '<strong>Opción múltiple</strong> y <strong>Selección múltiple (checkboxes):</strong> con un límite opcional de opciones a marcar.',
                '<strong>Sí/No:</strong> puede activar "preguntas condicionales" adicionales que solo aparecen según la respuesta.',
                '<strong>Escala 1-5:</strong> con etiquetas personalizables para el valor 1 y el valor 5.',
                '<strong>Texto libre</strong> y <strong>Número entero.</strong>',
            ] },
            { t: 'p', c: 'Las preguntas de tipo <strong>Escala</strong> y <strong>Opción múltiple</strong> pueden activar el interruptor <strong>"Activar modo tabla / matriz"</strong>, que convierte la pregunta en una tabla con varias filas (ítems) evaluadas con la misma escala u opciones — útil, por ejemplo, para evaluar varios objetivos educativos con la misma escala de 1 a 5 en una sola pregunta.' },
        ],
    },

    // ═══════════════ ESTADÍSTICAS ═══════════════
    'a-estadisticas-graduados': {
        titulo: 'Información de Graduados',
        resumen: 'Indicadores y gráficos sobre el conjunto de graduados registrados.',
        bloques: [
            { t: 'p', c: 'En <strong>Estadísticas → Graduados → Información de Graduados</strong> encuentras un panel de indicadores filtrable por año, provincia, cantón, género, disponibilidad y especialidad.' },
            { t: 'img', src: 'a-12-estadisticas-graduados.png', alt: 'Panel de estadísticas de graduados', caption: 'Información de Graduados: KPIs, género, disponibilidad y distribución por año.' },
            { t: 'list', items: [
                '6 indicadores clave: Graduados, Perfiles públicos, Empleados, Certificados, Proyectos y Buscando empleo.',
                'Gráfico de género y de disponibilidad laboral (Buscando empleo / Trabajando / Estudiando / No disponible).',
                'Medidores circulares de Empleabilidad, Visibilidad, Portafolio y Certificación.',
                'Tendencia de graduados por año, tecnologías más usadas, distribución de proyectos/certificados por graduado, especialidades y habilidades blandas.',
                'Un panel de información/plan de acción generado automáticamente a partir de los datos.',
            ] },
        ],
    },

    'a-estadisticas-resultados': {
        titulo: 'Resultados de Encuestas de Graduados',
        resumen: 'Cómo se agrupan y visualizan las respuestas de las encuestas ya cerradas.',
        bloques: [
            { t: 'p', c: 'En <strong>Estadísticas → Graduados → Resultados de Encuestas</strong> puedes filtrar por período, encuesta, promoción y género. Solo se consideran las encuestas <strong>cerradas</strong>.' },
            { t: 'img', src: 'a-13-estadisticas-resultados-encuestas.png', alt: 'Panel de resultados de encuestas de graduados', caption: 'Resultados de Encuestas: preguntas recurrentes vs. preguntas específicas, con su gráfico correspondiente.' },
            { t: 'p', c: 'Las preguntas se agrupan en dos bloques: las que se repiten en 2 o más encuestas (para comparar resultados en el tiempo) y las específicas de una sola encuesta. Cada pregunta se grafica según su tipo (barras, escala, etc.), y al final se muestra un resumen comparando la encuesta cerrada más antigua con la más reciente.' },
        ],
    },

    'a-estadisticas-empleadores': {
        titulo: 'Estadísticas de Empleadores',
        resumen: 'Resultados de las encuestas respondidas por las empresas.',
        bloques: [
            { t: 'p', c: 'En <strong>Estadísticas → Empleadores</strong> encuentras los resultados agregados de las encuestas dirigidas a empresas, con filtros por período, encuesta y tipo de capital.' },
            { t: 'img', src: 'a-14-estadisticas-empleadores.png', alt: 'Panel de estadísticas de empleadores', caption: 'Estadísticas de Empleadores: distribución geográfica y encuestadores por empresa.' },
            { t: 'list', items: [
                'Distribución geográfica de las empresas (por provincia o por cantón).',
                'Panel "Encuestadores por Empresa", con tarjetas expandibles por cada persona que respondió en nombre de su empresa.',
                'Las mismas tarjetas de preguntas recurrentes vs. específicas que en Resultados de Graduados, incluyendo un dato sobre cuántos encuestadores son también egresados de la ESPOCH.',
            ] },
        ],
    },

    // ═══════════════ REPORTES ═══════════════
    'a-reportes-anexo25': {
        titulo: 'Anexo 25 — Base de datos de Graduados y Empleadores',
        resumen: 'Cómo generar el reporte oficial de base de datos en PDF o Excel.',
        bloques: [
            { t: 'p', c: 'En <strong>Reportes</strong> encuentras tarjetas por cada reporte disponible. Haz clic en <strong>"Ver y Descargar"</strong> sobre "Base de Datos Graduados" o "Base de Datos Empleadores" (ambos Anexo 25).' },
            { t: 'img', src: 'a-15-reportes-lista.png', alt: 'Tarjetas de reportes disponibles', caption: 'Reportes Estadísticos — PIMAC: tarjetas de cada reporte disponible.' },
            { t: 'img', src: 'a-16-reportes-anexo25-modal.png', alt: 'Modal de generación del Anexo 25 de graduados', caption: 'Anexo 25 — Base de Datos Graduados: filtro de período y vista previa.' },
            { t: 'p', c: 'Filtra por año (o rango de años) con <strong>"Filtrar"</strong>, revisa la vista previa de los primeros registros (puedes ordenar haciendo clic en los encabezados de columna) y descarga con los botones <strong>"PDF"</strong> o <strong>"Excel"</strong>. Ambos formatos se generan directamente en el navegador a partir de los datos filtrados.' },
        ],
    },

    'a-reportes-anexo19': {
        titulo: 'Anexo 19 — Informe del Encuentro de Graduados',
        resumen: 'El asistente de 2 pasos para generar el informe en Word.',
        bloques: [
            { t: 'p', c: 'Haz clic en <strong>"Ver y Descargar"</strong> sobre "Informe Encuentro de Graduados" para abrir el asistente de 2 pasos.' },
            { t: 'img', src: 'a-17-reportes-anexo19-paso1.png', alt: 'Paso 1 del asistente del Anexo 19', caption: 'Paso 1: selección del evento y las encuestas cerradas que alimentan el informe.' },
            { t: 'h3', c: 'Paso 1 — Selección de datos' },
            { t: 'list', items: [
                '<strong>Evento:</strong> solo se listan eventos ya finalizados.',
                '<strong>Encuesta de Graduados</strong> y <strong>Encuesta de Empleadores:</strong> solo encuestas cerradas.',
                '<strong>Año del informe:</strong> se autocompleta con el año del evento elegido, pero puedes corregirlo.',
            ] },
            { t: 'h3', c: 'Paso 2 — Generar' },
            { t: 'p', c: 'Tras hacer clic en <strong>"Siguiente"</strong> se muestra una vista previa, y con <strong>"Descargar Word"</strong> se genera el archivo <code>Informe_Encuentro_Graduados_&lt;año&gt;.docx</code>. El informe incluye automáticamente la sección E (resultados); las secciones B, C, D, F, G y H quedan en blanco para completarlas manualmente, como indica el propio asistente al finalizar.' },
        ],
    },

    // ═══════════════ EVENTOS Y NOTICIAS ═══════════════
    'a-eventos': {
        titulo: 'Crear y gestionar eventos',
        resumen: 'Encuentros, webinars, seminarios y cursos para la comunidad de graduados.',
        bloques: [
            { t: 'p', c: 'La sección <strong>Eventos</strong> administra en una sola pantalla tanto los <strong>eventos</strong> como las <strong>noticias</strong> del portal. Verás los "Eventos Vigentes" como tarjetas, y más abajo el "Historial de Eventos" como tabla.' },
            { t: 'img', src: 'a-18-eventos-noticias.png', alt: 'Panel de gestión de eventos y noticias', caption: 'Eventos Vigentes, Historial de Eventos e Historial de Noticias en una sola pantalla.' },
            { t: 'p', c: 'Haz clic en <strong>"Nuevo Evento"</strong> para abrir el formulario.' },
            { t: 'img', src: 'a-19-eventos-nuevo-modal.png', alt: 'Formulario de creación de un nuevo evento', caption: 'Formulario "Nuevo Evento": tipo, modalidad, fechas y lugar o enlace de acceso.' },
            { t: 'h3', c: 'Campos del formulario' },
            { t: 'list', items: [
                'Título y Descripción.',
                '<strong>Tipo:</strong> Webinar, Encuentro, Seminario o Curso.',
                '<strong>Modalidad:</strong> Virtual, Presencial o Híbrida — según la modalidad, el formulario pide el <strong>lugar</strong>, la <strong>URL de acceso</strong>, o ambos.',
                'Fecha y hora de inicio y de fin.',
                'Capacidad máxima (0 = sin límite) e imagen de portada opcional.',
            ] },
            { t: 'p', c: 'Una vez guardado, puedes usar el ícono de campana en la tarjeta del evento para <strong>notificar por correo</strong> a graduados y empleadores.' },
        ],
    },

    'a-noticias': {
        titulo: 'Publicar noticias',
        resumen: 'Comunicados, convocatorias y oportunidades laborales para el portal público y el panel del graduado.',
        bloques: [
            { t: 'p', c: 'En la misma pantalla de <strong>Eventos</strong>, haz clic en <strong>"Nueva Noticia"</strong> para publicar un comunicado, convocatoria, logro, evento informativo u oportunidad laboral.' },
            { t: 'h3', c: 'Campos del formulario' },
            { t: 'list', items: [
                'Título (máx. 200 caracteres) y Resumen (máx. 300, para la vista previa en las tarjetas).',
                'Contenido completo de la noticia.',
                '<strong>Categoría:</strong> Comunicado, Convocatoria, Logro, Evento u Oportunidad Laboral.',
                '<strong>Estado:</strong> Borrador, Publicar ahora o Archivar.',
                'Imagen de portada (opcional).',
            ] },
            { t: 'p', c: 'Las noticias publicadas aparecen de inmediato en la sección Noticias del portal público y del panel del graduado. Desde el "Historial de Noticias" puedes filtrar por estado y editar o archivar cualquier publicación existente.' },
        ],
    },
};
