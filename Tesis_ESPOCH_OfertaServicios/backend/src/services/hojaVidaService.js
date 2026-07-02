// backend/src/services/hojaVidaService.js
// Generación de Hoja de Vida (CV) PDF y DOCX — diseño profesional ESPOCH.
//
// Cambios clave en esta versión:
//   • PDF: control estricto de salto de página, sin páginas vacías al final.
//   • DOCX: usa SOLO paragraphs + 2 tablas mínimas (cabecera + datos personales).
//     Esto evita el bug "contenido no legible" de Word al mezclar tablas complejas.
//   • Eliminado "Estado actual" de los datos personales.
//   • Tesis: solo título + URL (sin resumen).

const path    = require('path');
const fs      = require('fs');
const PDFDoc  = require('pdfkit');
const {
    Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType,
    Table, TableRow, TableCell, WidthType, BorderStyle,
    ShadingType, HeightRule, VerticalAlign, TabStopType, TabStopPosition,
} = require('docx');

// ── Paleta institucional ESPOCH ────────────────────────────────
const ROJO        = '#BE1E2D';
const VERDE       = '#1B5E20';
const TEXTO       = '#1F2937';
const TEXTO_SUAVE = '#4B5563';

const ASSETS_DIR    = path.join(__dirname, '..', 'assets');
const ESPOCH_LOGO   = path.join(ASSETS_DIR, 'ESPOCH_LOGO.png');
const SOFTWARE_LOGO = path.join(ASSETS_DIR, 'SOFTWARE_LOGO.png');

// ── Helpers de formato ─────────────────────────────────────────
const fmt = (d, opts = { year: 'numeric', month: 'long' }) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-EC', opts);
};
const fmtRango = (ini, fin, actual) => {
    if (!ini) return '';
    const d1 = fmt(ini);
    if (actual) return `${d1} — actualidad`;
    if (!fin) return d1;
    return `${d1} — ${fmt(fin)}`;
};
const fmtCompleta = (d) => fmt(d, { day: '2-digit', month: 'long', year: 'numeric' });
const anyo = (d) => d ? new Date(d).getFullYear() : '';

const cargarFotoBuffer = async (urlOrPath) => {
    if (!urlOrPath) return null;
    try {
        if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
            const axios = require('axios');
            const r = await axios.get(urlOrPath, { responseType: 'arraybuffer', timeout: 8000 });
            return Buffer.from(r.data);
        }
        const p = path.isAbsolute(urlOrPath) ? urlOrPath : path.join(__dirname, '..', urlOrPath);
        if (fs.existsSync(p)) return fs.readFileSync(p);
    } catch (e) {
        console.error('[HojaVida] No se pudo cargar la foto:', e.message);
    }
    return null;
};

// ═══════════════════════════════════════════════════════════════════
//  PDF — Generación con control manual de páginas (sin huecos)
// ═══════════════════════════════════════════════════════════════════
const generarPDF = (datos) => new Promise((resolve, reject) => {
    try {
        const {
            graduado, proyectos = [], certificados = [], tesis,
            cedulaPlain, telefonoPlain, fotoBuffer,
        } = datos;

        const doc = new PDFDoc({
            size: 'A4',
            margin: 0,                  // controlamos margen manualmente
            bufferPages: true,
            autoFirstPage: true,
            info: {
                Title:   `Hoja de Vida - ${graduado.nombres} ${graduado.apellidos}`,
                Author:  `${graduado.nombres} ${graduado.apellidos}`,
                Subject: 'Hoja de Vida - Carrera de Software ESPOCH',
                Creator: 'Portal de Graduados ESPOCH',
            },
        });

        const chunks = [];
        doc.on('data',  c => chunks.push(c));
        doc.on('end',   () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const W   = doc.page.width;
        const H   = doc.page.height;
        const M   = 36;
        const CW  = W - M * 2;
        const BOTTOM_LIMIT = H - 40;     // margen inferior antes de salto de página

        // Estado global de cursor vertical
        let y = M;

        // Helper: asegura que hay espacio para `need` px; si no, salta de página
        const necesitaEspacio = (need) => {
            if (y + need > BOTTOM_LIMIT) {
                doc.addPage();
                y = M;
            }
        };

        // ───────────── CABECERA BLANCA ─────────────
        const HEAD_H = 68;
        try { if (fs.existsSync(ESPOCH_LOGO))   doc.image(ESPOCH_LOGO,   M, y, { height: HEAD_H }); } catch {}
        try { if (fs.existsSync(SOFTWARE_LOGO)) doc.image(SOFTWARE_LOGO, W - M - HEAD_H, y, { height: HEAD_H }); } catch {}

        const TX = M + HEAD_H + 12;
        const TW = CW - (HEAD_H + 12) * 2;
        doc.fillColor(TEXTO).font('Helvetica-Bold').fontSize(12)
           .text('ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO', TX, y + 6, { width: TW, align: 'center' });
        doc.font('Helvetica').fontSize(9).fillColor(TEXTO_SUAVE)
           .text('Facultad de Informática y Electrónica · Carrera de Software', TX, y + 26, { width: TW, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(ROJO)
           .text('RESUMEN DE HOJA DE VIDA — CV', TX, y + 44, { width: TW, align: 'center' });

        y += HEAD_H + 6;

        // Línea verde
        doc.lineWidth(2.5).strokeColor(VERDE).moveTo(M, y).lineTo(W - M, y).stroke();
        y += 14;

        // Nombre + carrera
        doc.fillColor(TEXTO).font('Helvetica-Bold').fontSize(18)
           .text(`${graduado.nombres || ''} ${graduado.apellidos || ''}`.toUpperCase().trim(),
                 M, y, { width: CW, align: 'center' });
        y = doc.y + 1;
        doc.font('Helvetica').fontSize(9.5).fillColor(ROJO)
           .text('Ingeniero en Software · ESPOCH', M, y, { width: CW, align: 'center' });
        y = doc.y + 14;

        // ───── Helper: banda de sección verde ─────
        const banda = (texto) => {
            necesitaEspacio(28);
            doc.fillColor(VERDE).rect(M, y, CW, 18).fill();
            doc.fillColor('white').font('Helvetica-Bold').fontSize(10)
               .text(texto.toUpperCase(), M + 10, y + 5, { width: CW - 20 });
            y += 22;
        };

        // Línea separadora gris bajo cada fila
        const lineaSep = () => {
            doc.lineWidth(0.4).strokeColor('#E5E7EB')
               .moveTo(M, y).lineTo(W - M, y).stroke();
        };

        // ═══════ DATOS PERSONALES ═══════
        banda('Datos personales');

        const FOTO_W = 70, FOTO_H = 88;
        const FOTO_X = W - M - FOTO_W - 4;
        const FOTO_Y = y + 4;
        if (fotoBuffer) {
            try {
                doc.image(fotoBuffer, FOTO_X, FOTO_Y, { fit: [FOTO_W, FOTO_H], align: 'center', valign: 'center' });
                doc.lineWidth(1).strokeColor(ROJO).rect(FOTO_X, FOTO_Y, FOTO_W, FOTO_H).stroke();
            } catch {}
        }

        const camposCW = CW - FOTO_W - 12;
        const LBL_W    = 130;

        const campo = (label, valor) => {
            if (!valor) return;
            necesitaEspacio(20);
            const startY = y;
            doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXTO)
               .text(label, M + 6, startY + 4, { width: LBL_W });
            const yLabel = doc.y;
            doc.font('Helvetica').fontSize(9).fillColor(TEXTO_SUAVE)
               .text(String(valor), M + 6 + LBL_W, startY + 4, { width: camposCW - LBL_W - 12 });
            const yEnd = Math.max(doc.y, yLabel);
            const total = Math.max(16, yEnd - startY + 2);
            y = startY + total;
            // línea separadora (sólo hasta antes de la foto)
            doc.lineWidth(0.4).strokeColor('#E5E7EB')
               .moveTo(M, y).lineTo(W - M - FOTO_W - 12, y).stroke();
        };

        campo('Cédula',               cedulaPlain);
        campo('Correo institucional', graduado.emailInstitucional);
        campo('Correo personal',      graduado.emailPersonal);
        campo('Teléfono',             telefonoPlain);
        if (graduado.fechaNacimiento) campo('Fecha de nacimiento', fmtCompleta(graduado.fechaNacimiento));
        campo('Género',               graduado.genero);
        campo('Discapacidad',         graduado.tieneDiscapacidad);
        campo('Ubicación',            [graduado.cantonActual, graduado.provinciaActual].filter(Boolean).join(', '));
        if (graduado.anioGraduacion)  campo('Año de graduación', graduado.anioGraduacion);
        if (graduado.github)          campo('GitHub',   graduado.github);
        if (graduado.linkedin)        campo('LinkedIn', graduado.linkedin);

        // Empujar y al pie del bloque foto
        y = Math.max(y, FOTO_Y + FOTO_H) + 8;

        // ═══════ SOBRE MÍ ═══════
        if (graduado.bio && graduado.bio.trim()) {
            banda('Sobre mí');
            doc.font('Helvetica').fontSize(9.5).fillColor(TEXTO);
            // medir altura aproximada
            const altura = doc.heightOfString(graduado.bio.trim(), { width: CW - 12, align: 'justify' });
            necesitaEspacio(altura + 8);
            doc.text(graduado.bio.trim(), M + 6, y, { width: CW - 12, align: 'justify' });
            y = doc.y + 10;
        }

        // ═══════ FORMACIÓN ═══════
        if (graduado.educacionFormal && graduado.educacionFormal.length > 0) {
            banda('Formación');
            const ord = [...graduado.educacionFormal].sort((a, b) => (b.anioFin || 0) - (a.anioFin || 0));
            for (const edu of ord) {
                necesitaEspacio(40);
                const COL1 = 80;
                const startY = y;
                doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXTO_SUAVE)
                   .text(edu.anioFin ? String(edu.anioFin) : '—', M + 6, startY + 5, { width: COL1 });
                doc.font('Helvetica-Bold').fontSize(9.5).fillColor(TEXTO)
                   .text(edu.titulo, M + 6 + COL1, startY + 5, { width: CW - COL1 - 12 });
                let yAfter = doc.y;
                doc.font('Helvetica').fontSize(8.5).fillColor(VERDE)
                   .text(`${edu.institucion} · ${edu.nivel}`, M + 6 + COL1, yAfter + 1, { width: CW - COL1 - 12 });
                yAfter = doc.y;
                const total = Math.max(26, yAfter - startY + 6);
                y = startY + total;
                lineaSep();
            }
            y += 8;
        }

        // ═══════ EXPERIENCIA LABORAL ═══════
        if (graduado.experienciasLaborales && graduado.experienciasLaborales.length > 0) {
            banda('Experiencia laboral');
            const ord = [...graduado.experienciasLaborales]
                .sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));
            for (const exp of ord) {
                necesitaEspacio(60);
                const COL1 = 120;
                const startY = y + 4;

                // Fecha a la izquierda
                doc.font('Helvetica-Bold').fontSize(8.5).fillColor(TEXTO_SUAVE)
                   .text(fmtRango(exp.fechaInicio, exp.fechaFin, exp.actual),
                         M + 6, startY, { width: COL1 - 4 });

                // Cargo a la derecha
                doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXTO)
                   .text(exp.cargo, M + 6 + COL1, startY, { width: CW - COL1 - 12 });

                // Empresa
                doc.font('Helvetica-Bold').fontSize(9).fillColor(VERDE)
                   .text(exp.empresa, M + 6 + COL1, doc.y + 2, { width: CW - COL1 - 12 });

                // Descripción
                let yDesc = doc.y;
                if (exp.descripcion) {
                    doc.font('Helvetica').fontSize(9).fillColor(TEXTO)
                       .text(exp.descripcion, M + 6 + COL1, yDesc + 3,
                             { width: CW - COL1 - 12, align: 'justify' });
                    yDesc = doc.y;
                }
                const total = Math.max(34, yDesc - startY + 10);
                y = startY + total;
                lineaSep();
            }
            y += 8;
        }

        // ═══════ CERTIFICACIONES (solo año + título + institución) ═══════
        if (certificados && certificados.length > 0) {
            banda('Certificaciones y capacitaciones');
            for (const cert of certificados) {
                necesitaEspacio(32);
                const COL1 = 80;
                const startY = y + 4;
                doc.font('Helvetica-Bold').fontSize(8.5).fillColor(TEXTO_SUAVE)
                   .text(String(anyo(cert.fechaFinalizacion) || '—'), M + 6, startY, { width: COL1 });
                doc.font('Helvetica-Bold').fontSize(9.5).fillColor(TEXTO)
                   .text(cert.titulo, M + 6 + COL1, startY, { width: CW - COL1 - 12 });
                let yAfter = doc.y;
                if (cert.institucion) {
                    doc.font('Helvetica').fontSize(8.5).fillColor(VERDE)
                       .text(cert.institucion, M + 6 + COL1, yAfter + 1, { width: CW - COL1 - 12 });
                    yAfter = doc.y;
                }
                const total = Math.max(22, yAfter - startY + 8);
                y = startY + total;
                lineaSep();
            }
            y += 8;
        }

        // ═══════ PROYECTOS (solo año + título + tecnologías) ═══════
        if (proyectos && proyectos.length > 0) {
            banda('Proyectos destacados');
            for (const proy of proyectos) {
                necesitaEspacio(32);
                const COL1 = 80;
                const startY = y + 4;
                doc.font('Helvetica-Bold').fontSize(8.5).fillColor(TEXTO_SUAVE)
                   .text(String(anyo(proy.fechaRealizacion) || '—'), M + 6, startY, { width: COL1 });
                doc.font('Helvetica-Bold').fontSize(9.5).fillColor(TEXTO)
                   .text(proy.titulo, M + 6 + COL1, startY, { width: CW - COL1 - 12 });
                let yAfter = doc.y;
                if (proy.tecnologias && proy.tecnologias.length > 0) {
                    doc.font('Helvetica').fontSize(8.5).fillColor(VERDE)
                       .text(proy.tecnologias.join(' · '), M + 6 + COL1, yAfter + 1,
                             { width: CW - COL1 - 12 });
                    yAfter = doc.y;
                }
                const total = Math.max(22, yAfter - startY + 8);
                y = startY + total;
                lineaSep();
            }
            y += 8;
        }

        // ═══════ COMPETENCIAS ═══════
        if ((graduado.tecnologias && graduado.tecnologias.length > 0) ||
            (graduado.habilidadesBlandas && graduado.habilidadesBlandas.length > 0)) {
            banda('Competencias');
            if (graduado.tecnologias && graduado.tecnologias.length > 0) {
                necesitaEspacio(24);
                const startY = y + 4;
                doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXTO)
                   .text('Tecnologías', M + 6, startY, { width: 130 });
                doc.font('Helvetica').fontSize(9).fillColor(TEXTO_SUAVE)
                   .text(graduado.tecnologias.join(' · '), M + 6 + 130, startY, { width: CW - 130 - 12 });
                y = startY + Math.max(16, doc.y - startY + 6);
                lineaSep();
            }
            if (graduado.habilidadesBlandas && graduado.habilidadesBlandas.length > 0) {
                necesitaEspacio(24);
                const startY = y + 4;
                doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXTO)
                   .text('Habilidades blandas', M + 6, startY, { width: 130 });
                doc.font('Helvetica').fontSize(9).fillColor(TEXTO_SUAVE)
                   .text(graduado.habilidadesBlandas.join(' · '), M + 6 + 130, startY, { width: CW - 130 - 12 });
                y = startY + Math.max(16, doc.y - startY + 6);
                lineaSep();
            }
            y += 8;
        }

        // ═══════ TESIS DE GRADO (solo título + URL) ═══════
        if (tesis) {
            banda('Tesis de grado');
            const titulo = tesis.tituloEncontrado || tesis.titulo || '';
            doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXTO);
            const altT = doc.heightOfString(titulo, { width: CW - 12, align: 'justify' });
            necesitaEspacio(altT + 24);
            doc.text(titulo, M + 6, y + 2, { width: CW - 12, align: 'justify' });
            y = doc.y + 4;
            if (tesis.urlDspace) {
                doc.font('Helvetica-Oblique').fontSize(9).fillColor(ROJO)
                   .text(`Repositorio: ${tesis.urlDspace}`, M + 6, y, { width: CW - 12 });
                y = doc.y + 4;
            }
        }

        // ═══════ Pie de página (sólo páginas escritas hasta ahora) ═══════
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(TEXTO_SUAVE)
               .text(`Generado por el Portal de Graduados ESPOCH · ${fmtCompleta(new Date())}`,
                     M, H - 24, { width: CW, align: 'center', lineBreak: false });
        }

        doc.end();
    } catch (err) {
        reject(err);
    }
});

// ═══════════════════════════════════════════════════════════════════
//  DOCX — Generación SIMPLE (solo paragraphs + 2 tablas mínimas)
//  Patrón conservador que Word abre limpio en cualquier versión.
// ═══════════════════════════════════════════════════════════════════
const generarDOCX = async (datos) => {
    const {
        graduado, proyectos = [], certificados = [], tesis,
        cedulaPlain, telefonoPlain, fotoBuffer,
    } = datos;

    // Helper: TextRun seguro (nunca null)
    const T = (texto, opts = {}) => new TextRun({
        text: texto == null ? '' : String(texto),
        font: 'Calibri',
        ...opts,
    });

    // Helper: párrafo simple
    const P = (children, opts = {}) => new Paragraph({
        spacing: { after: 80, ...(opts.spacing || {}) },
        ...opts,
        children: Array.isArray(children) ? children : [children],
    });

    // Banda verde de título de sección
    const banda = (texto) => new Paragraph({
        spacing: { before: 200, after: 120 },
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: '1B5E20' },
        border: {
            top:    { style: BorderStyle.SINGLE, size: 4, color: '1B5E20' },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: '1B5E20' },
            left:   { style: BorderStyle.SINGLE, size: 4, color: '1B5E20' },
            right:  { style: BorderStyle.SINGLE, size: 4, color: '1B5E20' },
        },
        children: [ T('  ' + texto.toUpperCase(), { bold: true, size: 22, color: 'FFFFFF' }) ],
    });

    // ── Cabecera con logos (tabla simple sin bordes) ──
    const sinBordes = {
        top:    { style: BorderStyle.NONE, size: 0, color: 'auto' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        left:   { style: BorderStyle.NONE, size: 0, color: 'auto' },
        right:  { style: BorderStyle.NONE, size: 0, color: 'auto' },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        insideVertical:   { style: BorderStyle.NONE, size: 0, color: 'auto' },
    };

    const headerCells = [
        new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            borders: sinBordes,
            verticalAlign: VerticalAlign.CENTER,
            children: [
                fs.existsSync(ESPOCH_LOGO)
                    ? new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [ new ImageRun({
                            data: fs.readFileSync(ESPOCH_LOGO),
                            transformation: { width: 66, height: 66 },
                        }) ],
                    })
                    : P([T('')]),
            ],
        }),
        new TableCell({
            width: { size: 64, type: WidthType.PERCENTAGE },
            borders: sinBordes,
            verticalAlign: VerticalAlign.CENTER,
            children: [
                P([T('ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO', { bold: true, size: 22, color: '1F2937' })],
                  { alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
                P([T('Facultad de Informática y Electrónica · Carrera de Software', { size: 18, color: '4B5563' })],
                  { alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
                P([T('RESUMEN DE HOJA DE VIDA — CV', { bold: true, size: 18, color: 'BE1E2D' })],
                  { alignment: AlignmentType.CENTER, spacing: { after: 0 } }),
            ],
        }),
        new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            borders: sinBordes,
            verticalAlign: VerticalAlign.CENTER,
            children: [
                fs.existsSync(SOFTWARE_LOGO)
                    ? new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [ new ImageRun({
                            data: fs.readFileSync(SOFTWARE_LOGO),
                            transformation: { width: 66, height: 66 },
                        }) ],
                    })
                    : P([T('')]),
            ],
        }),
    ];

    const cabecera = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            ...sinBordes,
            bottom: { style: BorderStyle.SINGLE, size: 18, color: '1B5E20' },
        },
        rows: [ new TableRow({ children: headerCells }) ],
    });

    // ── Bloque "Datos personales": foto a la derecha + lista a la izquierda ──
    // Usamos una sola tabla 1x2; cada celda tiene paragraphs simples.
    const nombreCompleto = `${graduado.nombres || ''} ${graduado.apellidos || ''}`.toUpperCase().trim();

    // Para alinear "etiqueta" y "valor" usamos tabulación + espacios (más robusto que sub-tablas)
    const lineaDato = (label, valor) => valor ? P([
        T(label + ':\t', { bold: true, size: 18, color: '1F2937' }),
        T(String(valor), { size: 18, color: '4B5563' }),
    ], {
        spacing: { after: 60 },
        tabStops: [ { type: TabStopType.LEFT, position: 2000 } ],
    }) : null;

    const datosIzqChildren = [
        lineaDato('Cédula', cedulaPlain),
        lineaDato('Correo institucional', graduado.emailInstitucional),
        lineaDato('Correo personal', graduado.emailPersonal),
        lineaDato('Teléfono', telefonoPlain),
        lineaDato('Fecha de nacimiento', graduado.fechaNacimiento ? fmtCompleta(graduado.fechaNacimiento) : null),
        lineaDato('Género', graduado.genero),
        lineaDato('Discapacidad', graduado.tieneDiscapacidad),
        lineaDato('Ubicación', [graduado.cantonActual, graduado.provinciaActual].filter(Boolean).join(', ')),
        lineaDato('Año de graduación', graduado.anioGraduacion),
        lineaDato('GitHub', graduado.github),
        lineaDato('LinkedIn', graduado.linkedin),
    ].filter(Boolean);

    if (datosIzqChildren.length === 0) datosIzqChildren.push(P([T('Sin datos adicionales')]));

    const datosCells = [
        new TableCell({
            width: { size: fotoBuffer ? 75 : 100, type: WidthType.PERCENTAGE },
            borders: sinBordes,
            verticalAlign: VerticalAlign.TOP,
            children: datosIzqChildren,
        }),
    ];
    if (fotoBuffer) {
        datosCells.push(new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: sinBordes,
            verticalAlign: VerticalAlign.TOP,
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [ new ImageRun({
                        data: fotoBuffer,
                        transformation: { width: 105, height: 132 },
                    }) ],
                }),
            ],
        }));
    }

    const tablaDatos = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: sinBordes,
        rows: [ new TableRow({ children: datosCells }) ],
    });

    // ───────── Cuerpo del documento ─────────
    const children = [
        cabecera,
        P([T('')], { spacing: { after: 200 } }),
        P([T(nombreCompleto, { bold: true, size: 30, color: '1F2937' })],
          { alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
        P([T('Ingeniero en Software · ESPOCH', { size: 18, color: 'BE1E2D' })],
          { alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
        banda('Datos personales'),
        tablaDatos,
    ];

    // SOBRE MÍ
    if (graduado.bio && graduado.bio.trim()) {
        children.push(banda('Sobre mí'));
        children.push(P([T(graduado.bio.trim(), { size: 18, color: '1F2937' })],
                       { alignment: AlignmentType.JUSTIFIED, spacing: { after: 120 } }));
    }

    // FORMACIÓN — usando tabs para alinear año y título
    if (graduado.educacionFormal && graduado.educacionFormal.length > 0) {
        children.push(banda('Formación'));
        const ord = [...graduado.educacionFormal].sort((a, b) => (b.anioFin || 0) - (a.anioFin || 0));
        for (const edu of ord) {
            children.push(P([
                T((edu.anioFin ? String(edu.anioFin) : '—') + '\t', { bold: true, size: 18, color: '4B5563' }),
                T(edu.titulo, { bold: true, size: 19, color: '1F2937' }),
            ], { tabStops: [ { type: TabStopType.LEFT, position: 1400 } ], spacing: { after: 30 } }));
            children.push(P([
                T('\t', {}),
                T(`${edu.institucion} · ${edu.nivel}`, { size: 17, color: '1B5E20' }),
            ], { tabStops: [ { type: TabStopType.LEFT, position: 1400 } ], spacing: { after: 140 } }));
        }
    }

    // EXPERIENCIA — con buena maquetación
    if (graduado.experienciasLaborales && graduado.experienciasLaborales.length > 0) {
        children.push(banda('Experiencia laboral'));
        const ord = [...graduado.experienciasLaborales]
            .sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));
        for (const exp of ord) {
            children.push(P([
                T(fmtRango(exp.fechaInicio, exp.fechaFin, exp.actual), { bold: true, size: 17, color: '4B5563' }),
            ], { spacing: { after: 30 } }));
            children.push(P([
                T(exp.cargo, { bold: true, size: 20, color: '1F2937' }),
            ], { spacing: { after: 20 } }));
            children.push(P([
                T(exp.empresa, { bold: true, size: 18, color: '1B5E20' }),
            ], { spacing: { after: 40 } }));
            if (exp.descripcion) {
                children.push(P([T(exp.descripcion, { size: 18, color: '1F2937' })],
                              { alignment: AlignmentType.JUSTIFIED, spacing: { after: 160 } }));
            } else {
                children.push(P([T('')], { spacing: { after: 80 } }));
            }
        }
    }

    // CERTIFICACIONES — solo año + título + institución
    if (certificados && certificados.length > 0) {
        children.push(banda('Certificaciones y capacitaciones'));
        for (const cert of certificados) {
            children.push(P([
                T(String(anyo(cert.fechaFinalizacion) || '—') + '\t', { bold: true, size: 18, color: '4B5563' }),
                T(cert.titulo, { bold: true, size: 19, color: '1F2937' }),
            ], { tabStops: [ { type: TabStopType.LEFT, position: 1400 } ], spacing: { after: 30 } }));
            if (cert.institucion) {
                children.push(P([
                    T('\t', {}),
                    T(cert.institucion, { size: 17, color: '1B5E20' }),
                ], { tabStops: [ { type: TabStopType.LEFT, position: 1400 } ], spacing: { after: 140 } }));
            } else {
                children.push(P([T('')], { spacing: { after: 100 } }));
            }
        }
    }

    // PROYECTOS — solo año + título + tecnologías
    if (proyectos && proyectos.length > 0) {
        children.push(banda('Proyectos destacados'));
        for (const proy of proyectos) {
            children.push(P([
                T(String(anyo(proy.fechaRealizacion) || '—') + '\t', { bold: true, size: 18, color: '4B5563' }),
                T(proy.titulo, { bold: true, size: 19, color: '1F2937' }),
            ], { tabStops: [ { type: TabStopType.LEFT, position: 1400 } ], spacing: { after: 30 } }));
            if (proy.tecnologias && proy.tecnologias.length > 0) {
                children.push(P([
                    T('\t', {}),
                    T(proy.tecnologias.join(' · '), { size: 17, color: '1B5E20' }),
                ], { tabStops: [ { type: TabStopType.LEFT, position: 1400 } ], spacing: { after: 140 } }));
            } else {
                children.push(P([T('')], { spacing: { after: 100 } }));
            }
        }
    }

    // COMPETENCIAS
    if ((graduado.tecnologias && graduado.tecnologias.length > 0) ||
        (graduado.habilidadesBlandas && graduado.habilidadesBlandas.length > 0)) {
        children.push(banda('Competencias'));
        if (graduado.tecnologias && graduado.tecnologias.length > 0) {
            children.push(P([
                T('Tecnologías:\t', { bold: true, size: 18, color: '1F2937' }),
                T(graduado.tecnologias.join(' · '), { size: 18, color: '4B5563' }),
            ], { tabStops: [ { type: TabStopType.LEFT, position: 2200 } ], spacing: { after: 80 } }));
        }
        if (graduado.habilidadesBlandas && graduado.habilidadesBlandas.length > 0) {
            children.push(P([
                T('Habilidades blandas:\t', { bold: true, size: 18, color: '1F2937' }),
                T(graduado.habilidadesBlandas.join(' · '), { size: 18, color: '4B5563' }),
            ], { tabStops: [ { type: TabStopType.LEFT, position: 2200 } ], spacing: { after: 80 } }));
        }
    }

    // TESIS — solo título + URL
    if (tesis) {
        children.push(banda('Tesis de grado'));
        children.push(P([T(tesis.tituloEncontrado || tesis.titulo || '', { bold: true, size: 19, color: '1F2937' })],
                       { alignment: AlignmentType.JUSTIFIED, spacing: { after: 60 } }));
        if (tesis.urlDspace) {
            children.push(P([T(`Repositorio: ${tesis.urlDspace}`, { italics: true, size: 17, color: 'BE1E2D' })],
                           { spacing: { after: 120 } }));
        }
    }

    // Pie
    children.push(P([T('')], { spacing: { before: 240 } }));
    children.push(P([T(`Generado por el Portal de Graduados ESPOCH · ${fmtCompleta(new Date())}`,
                       { italics: true, size: 14, color: '4B5563' })],
                    { alignment: AlignmentType.CENTER }));

    const docx = new Document({
        creator:     nombreCompleto,
        title:       `Hoja de Vida - ${nombreCompleto}`,
        description: 'Hoja de Vida generada por el Portal de Graduados ESPOCH',
        sections: [
            {
                properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
                children,
            },
        ],
    });

    return await Packer.toBuffer(docx);
};

module.exports = { generarPDF, generarDOCX, cargarFotoBuffer };
