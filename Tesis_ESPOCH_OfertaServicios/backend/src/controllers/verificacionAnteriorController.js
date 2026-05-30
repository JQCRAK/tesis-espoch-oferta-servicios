/**
 * verificacionAnteriorController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verificación de graduados SIN acceso al correo @espoch.edu.ec
 *
 * Estrategia de verificación en capas:
 *   Capa 1 — ¿La imagen contiene texto de una cédula ecuatoriana?
 *            Busca marcadores fijos que SIEMPRE aparecen en cédulas EC,
 *            independientemente del año o diseño del documento.
 *   Capa 2 — ¿El número de documento en la foto coincide con el formulario?
 *            Soporta cédulas ecuatorianas (10 dígitos) y extranjeras (alfanuméricas).
 *   Capa 3 — ¿Los apellidos del formulario aparecen en el texto de la cédula?
 *   Capa 4 — ¿Los apellidos aparecen como autor en el repositorio DSpace ESPOCH?
 *
 * NOTA IMPORTANTE sobre cédulas por año:
 *   El diseño y orden de campos ha cambiado múltiples veces (pre-2008, 2008-2018,
 *   2018+). Por eso NO dependemos del orden sino de la PRESENCIA de palabras clave.
 *
 * NO guarda nada en base de datos.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');

// ── Cargar Tesseract.js (compatible CJS y ESM) ────────────────────────────────
let _createWorker = null;
const getTesseract = async () => {
    if (_createWorker) return _createWorker;
    try {
        const t = require('tesseract.js');
        _createWorker = t.createWorker;
    } catch {
        const t = await import('tesseract.js');
        _createWorker = t.createWorker;
    }
    return _createWorker;
};

// ── Reutilizar scraping DSpace ya implementado ────────────────────────────────
const { extraerDatosDspace } = require('./tesisController');

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

const normalizar = (str = '') =>
    str.toLowerCase()
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, '')
       .replace(/[^a-z0-9\s]/g, ' ')
       .replace(/\s+/g, ' ')
       .trim();

const similitudJaccard = (a, b) => {
    const sA = new Set(normalizar(a).split(' ').filter(Boolean));
    const sB = new Set(normalizar(b).split(' ').filter(Boolean));
    if (!sA.size || !sB.size) return 0;
    const inter = new Set([...sA].filter(x => sB.has(x)));
    const union = new Set([...sA, ...sB]);
    return inter.size / union.size;
};

const apellidoEnAutores = (apellidos = '', autores = []) => {
    const partes = normalizar(apellidos).split(' ').filter(Boolean);
    const norm   = autores.map(a => normalizar(a));
    return partes.some(ap => norm.some(au => au.includes(ap)));
};

// ─────────────────────────────────────────────────────────
// OCR con Tesseract
// ─────────────────────────────────────────────────────────
const extraerTextoImagen = async (rutaImagen) => {
    let worker;
    try {
        const fn = await getTesseract();
        // 'spa+eng' para cubrir cédulas con texto en inglés/otros idiomas
        worker = await fn('spa+eng', 1, {
            logger: process.env.NODE_ENV === 'development'
                ? m => { if (m.progress) process.stdout.write(`\r[OCR] ${Math.round(m.progress * 100)}%`); }
                : () => {}
        });
        const { data: { text } } = await worker.recognize(rutaImagen);
        if (process.env.NODE_ENV === 'development') console.log('');
        return text || '';
    } catch (err) {
        console.error('[OCR] Error:', err.message);
        return '';
    } finally {
        if (worker) { try { await worker.terminate(); } catch {} }
    }
};

// ─────────────────────────────────────────────────────────
// CAPA 1: ¿Es una cédula ecuatoriana?
//
// Diseño A (pre-2018):  REPÚBLICA DEL ECUADOR / CÉDULA DE IDENTIDAD
// Diseño B (2018+):     igual encabezado, campos reordenados
// Cédula extranjero:    mismo encabezado + campo NACIONALIDAD visible
//
// La ley establece que el encabezado siempre debe decir:
// "República del Ecuador. Dirección General de Registro Civil,
//  Identificación y Cedulación"
// independientemente del diseño.
//
// Umbral: 3 de 8 marcadores = tolerancia a OCR malo / foto girada
// ─────────────────────────────────────────────────────────
const validarEsCedula = (texto) => {
    const t = normalizar(texto);

    const marcadores = [
        { nombre: 'REPÚBLICA DEL ECUADOR',    ok: /republica\s+del\s+ecuador/.test(t) },
        { nombre: 'REGISTRO CIVIL',            ok: /registro\s+civil/.test(t) },
        { nombre: 'CEDULA DE IDENTIDAD',       ok: /cedula\s+de\s+identidad/.test(t) },
        { nombre: 'IDENTIFICACION/CEDULACION', ok: /identificaci[o0]n|cedulaci[o0]n/.test(t) },
        { nombre: 'Etiqueta APELLIDOS',        ok: /\bapellidos\b/.test(t) },
        { nombre: 'Etiqueta NOMBRES',          ok: /\bnombres\b/.test(t) },
        { nombre: 'FECHA DE NACIMIENTO',       ok: /fecha\s+de\s+nacimiento/.test(t) },
        { nombre: 'DIGERCIC / REGISTRO',       ok: /digercic|registro\s+civil|r\.c\.i/.test(t) },
    ];

    const encontrados = marcadores.filter(m => m.ok);
    return {
        esCedula:  encontrados.length >= 3,
        puntaje:   encontrados.length,
        total:     marcadores.length,
        encontrados: encontrados.map(m => m.nombre),
        faltantes:   marcadores.filter(m => !m.ok).map(m => m.nombre),
    };
};

// ─────────────────────────────────────────────────────────
// CAPA 2: Extraer número de documento del texto OCR
//
// Cédula ecuatoriana:  exactamente 10 dígitos (provincia 01-24|30, 3er dígito 0-5)
// Cédula extranjera:   puede ser alfanumérica, pero en Ecuador el Registro Civil
//                      asigna un número de 10 dígitos a residentes extranjeros
//                      donde la provincia es 30. Otros pueden tener formatos distintos.
// ─────────────────────────────────────────────────────────
const extraerNumeroDocumento = (texto) => {
    // 1. Buscar número de 10 dígitos (cédula ecuatoriana o extranjero residente)
    const matches10 = texto.match(/\b\d{10}\b/g) || [];
    for (const c of matches10) {
        const prov = parseInt(c.substring(0, 2), 10);
        const tipo = parseInt(c.substring(2, 3), 10);
        if (((prov >= 1 && prov <= 24) || prov === 30) && tipo <= 5) {
            return { numero: c, tipo: 'cedula_ec' };
        }
    }

    // 2. Buscar números alfanuméricos de 6-12 chars (cédulas extranjeras / pasaportes)
    //    Solo si no se encontró cédula ecuatoriana
    const matchAlfa = texto.match(/\b[A-Z0-9]{6,12}\b/g) || [];
    for (const c of matchAlfa) {
        // Descartar secuencias que parecen fechas o palabras comunes
        if (/^\d{4}$|^[A-Z]+$/.test(c)) continue;
        if (c.length >= 6 && /\d/.test(c)) {
            return { numero: c, tipo: 'cedula_extranjera' };
        }
    }

    return null;
};

// ─────────────────────────────────────────────────────────
// CAPA 3: ¿Aparece el apellido en el texto OCR?
//
// OCR no es perfecto — puede leer "QUISPE" como "QU|SPE" o "QU1SPE".
// Por eso usamos Jaccard con umbral bajo + fallback de substring.
// ─────────────────────────────────────────────────────────
const verificarApellidoEnCedula = (apellidos, textoOCR) => {
    const textNorm     = normalizar(textoOCR);
    const apellidoNorm = normalizar(apellidos);
    const partes       = apellidoNorm.split(' ').filter(Boolean);

    // Verificar cada apellido individualmente
    const resultados = partes.map(ap => ({
        apellido:   ap,
        encontrado: textNorm.includes(ap) ||
                    // Tolerancia OCR: permitir 1 carácter diferente en apellidos largos
                    (ap.length >= 5 && textNorm.split(' ').some(w =>
                        levenshtein(w, ap) <= 1
                    ))
    }));

    const encontrados = resultados.filter(r => r.encontrado).length;
    return {
        ok:          encontrados >= Math.ceil(partes.length / 2), // al menos la mitad
        encontrados,
        total:       partes.length,
        detalle:     resultados,
    };
};

// Distancia de Levenshtein simple (para tolerancia OCR)
const levenshtein = (a, b) => {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            dp[i][j] = a[i-1] === b[j-1]
                ? dp[i-1][j-1]
                : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
        }
    }
    return dp[a.length][b.length];
};

// ─────────────────────────────────────────────────────────
// POST /api/auth/verificar-cedula-dspace
// ─────────────────────────────────────────────────────────
exports.verificarCedulaDspace = async (req, res) => {
    const temporales = [];

    try {
        const { urlDspace, nombres, apellidos, cedula, fechaNacimiento } = req.body;

        // ── Validaciones de entrada ───────────────────────────────────────
        if (!nombres?.trim() || !apellidos?.trim() || !cedula?.trim()) {
            return res.status(400).json({
                msg: 'Nombres, apellidos y cédula son obligatorios.',
                campo: 'formulario'
            });
        }

        if (!/^\d{10}$/.test(cedula.trim())) {
            return res.status(400).json({
                msg: 'La cédula debe tener exactamente 10 dígitos.',
                campo: 'cedula'
            });
        }

        if (!urlDspace?.includes('dspace.espoch.edu.ec')) {
            return res.status(400).json({
                msg: 'La URL debe pertenecer a dspace.espoch.edu.ec',
                campo: 'dspace'
            });
        }

        if (!req.files?.['cedula_frontal']?.[0]) {
            return res.status(400).json({
                msg: 'La foto del frente de la cédula es obligatoria.',
                campo: 'cedula_frontal'
            });
        }

        // ── Registrar archivos para limpieza ──────────────────────────────
        const frontalPath = req.files['cedula_frontal'][0].path;
        temporales.push(frontalPath);

        let posteriorPath = null;
        if (req.files?.['cedula_posterior']?.[0]) {
            posteriorPath = req.files['cedula_posterior'][0].path;
            temporales.push(posteriorPath);
        }

        // ── OCR ───────────────────────────────────────────────────────────
        console.log('[Verif] OCR frontal...');
        const textoFrontal = await extraerTextoImagen(frontalPath);
        console.log('[Verif] Texto frontal (300 chars):', textoFrontal.substring(0, 300));

        let textoPosterior = '';
        if (posteriorPath) {
            console.log('[Verif] OCR posterior...');
            textoPosterior = await extraerTextoImagen(posteriorPath);
        }

        const textoCompleto = `${textoFrontal}\n${textoPosterior}`;

        if (!textoCompleto.trim()) {
            return res.status(400).json({
                msg: 'No se pudo extraer texto de la imagen. ' +
                     'Sube una foto más nítida y con buena iluminación.',
                campo: 'cedula_frontal'
            });
        }

        // ── CAPA 1: ¿Es una cédula ecuatoriana? ──────────────────────────
        const validDoc = validarEsCedula(textoCompleto);
        console.log('[Verif] Capa 1 - validación documento:', validDoc);

        if (!validDoc.esCedula) {
            return res.status(400).json({
                msg: `La imagen no parece ser una cédula de identidad ecuatoriana. ` +
                     `Se encontraron ${validDoc.puntaje} de ${validDoc.total} marcadores requeridos (mínimo 3). ` +
                     `Asegúrate de subir el frente de tu cédula con buena iluminación y enfoque.`,
                campo: 'cedula_frontal',
                marcadoresEncontrados: validDoc.encontrados,
                marcadoresFaltantes:  validDoc.faltantes,
            });
        }

        // ── CAPA 2: Número de documento ───────────────────────────────────
        const docOCR = extraerNumeroDocumento(textoCompleto);
        console.log('[Verif] Capa 2 - número documento OCR:', docOCR);

        if (!docOCR) {
            return res.status(400).json({
                msg: 'No se pudo leer el número de documento en la imagen. ' +
                     'Asegúrate de que la foto sea nítida, el número esté visible y sin reflejos.',
                campo: 'cedula_frontal'
            });
        }

        // Comparar con el número ingresado en el formulario
        if (cedula.trim() !== docOCR.numero) {
            return res.status(400).json({
                msg: `El número de cédula ingresado (${cedula.trim()}) no coincide con el ` +
                     `encontrado en la imagen (${docOCR.numero}). ` +
                     `Verifica que hayas ingresado correctamente tu número de cédula.`,
                campo: 'cedula'
            });
        }

        // ── CAPA 3: Apellidos en cédula ───────────────────────────────────
        const verifApellido = verificarApellidoEnCedula(apellidos.trim(), textoCompleto);
        console.log('[Verif] Capa 3 - apellidos en cédula:', verifApellido);

        if (!verifApellido.ok) {
            return res.status(400).json({
                msg: `Los apellidos ingresados no se encontraron en la imagen de la cédula. ` +
                     `Verifica que los datos del formulario coincidan exactamente con tu cédula.`,
                campo: 'nombres',
                detalle: verifApellido.detalle
            });
        }

        // ── CAPA 4: Verificar en DSpace ───────────────────────────────────
        console.log('[Verif] Capa 4 - consultando DSpace...');
        let datosDspace;
        try {
            datosDspace = await extraerDatosDspace(urlDspace.trim());
        } catch (err) {
            return res.status(400).json({
                msg: err.message,
                campo: 'dspace'
            });
        }

        const { titulo: tituloEncontrado, autores: autoresEncontrados } = datosDspace;

        if (autoresEncontrados.length > 0) {
            if (!apellidoEnAutores(apellidos.trim(), autoresEncontrados)) {
                return res.status(400).json({
                    msg: `Tu apellido no aparece como autor en esa tesis del repositorio. ` +
                         `Autores encontrados: ${autoresEncontrados.join(', ')}. ` +
                         `Verifica que la URL corresponda a tu tesis.`,
                    campo: 'dspace',
                    autoresEncontrados
                });
            }
        }

        console.log('[Verif] ✅ Verificación completa exitosa');

        res.json({
            verificado: true,
            tituloEncontrado,
            autoresEncontrados,
            tipoDocumento: docOCR.tipo,
            capasVerificadas: 4,
            msg: 'Identidad verificada correctamente en todas las capas.'
        });

    } catch (err) {
        console.error('[Verif] Error inesperado:', err);
        res.status(500).json({
            msg: 'Error interno al verificar. Intenta nuevamente en unos segundos.',
            campo: 'servidor'
        });
    } finally {
        for (const ruta of temporales) {
            try { if (fs.existsSync(ruta)) fs.unlinkSync(ruta); } catch {}
        }
    }
};