/**
 * verificacionAnteriorController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Endpoint público (sin JWT) para verificar graduados que NO tienen acceso
 * al correo institucional @espoch.edu.ec.
 *
 * Proceso:
 *   1. Recibe foto cédula (frontal obligatoria, posterior opcional)
 *   2. Recibe URL del repositorio DSpace ESPOCH
 *   3. Tesseract.js extrae texto de la imagen de cédula
 *   4. Se comparan nombres/apellidos y cédula del formulario con lo extraído
 *   5. Se consulta DSpace y se comparan apellidos con autores encontrados
 *   6. Si todo coincide → responde OK (no guarda nada en BD)
 *
 * NO guarda nada en base de datos.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const path = require('path');
const fs   = require('fs');

// ── Tesseract.js v4/v5 usa import dinámico ────────────────────────────────────
// Para compatibilidad con CommonJS usamos createWorker vía require si es v4,
// o dynamic import si es v5+. Detectamos automáticamente.
let createWorker;
const cargarTesseract = async () => {
    if (createWorker) return createWorker;
    try {
        // Tesseract.js v4+ (CommonJS)
        const tesseract = require('tesseract.js');
        createWorker = tesseract.createWorker;
    } catch {
        // Fallback para ESM
        const tesseract = await import('tesseract.js');
        createWorker = tesseract.createWorker;
    }
    return createWorker;
};

// ── Reutilizamos la función de scraping ya existente en tesisController ───────
const { extraerDatosDspace } = require('./tesisController');   // ← re-export abajo

// ─────────────────────────────────────────────────────────
// HELPERS (mismos que tesisController para consistencia)
// ─────────────────────────────────────────────────────────

const normalizar = (str = '') =>
    str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

/**
 * Calcula similitud de Jaccard entre dos cadenas de texto.
 * Usado para comparar nombres con tolerancia a errores de OCR.
 */
const similitudJaccard = (a, b) => {
    const setA = new Set(normalizar(a).split(' ').filter(Boolean));
    const setB = new Set(normalizar(b).split(' ').filter(Boolean));
    if (setA.size === 0 || setB.size === 0) return 0;
    const interseccion = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return interseccion.size / union.size;
};

/**
 * Verifica si al menos un apellido del graduado aparece
 * en alguno de los autores del DSpace.
 */
const apellidoEnAutores = (apellidos = '', autores = []) => {
    const partes = normalizar(apellidos).split(' ').filter(Boolean);
    const autoresNorm = autores.map(a => normalizar(a));
    return partes.some(ap => autoresNorm.some(au => au.includes(ap)));
};

/**
 * Extrae texto de una imagen usando Tesseract.js.
 * Idioma: español (spa). Si falla, retorna string vacío.
 *
 * @param {string} rutaImagen - Ruta absoluta al archivo de imagen
 * @returns {Promise<string>} Texto extraído
 */
const extraerTextoImagen = async (rutaImagen) => {
    let worker;
    try {
        const fn = await cargarTesseract();
        worker = await fn('spa', 1, {
            // Suprimir logs verbose de Tesseract en producción
            logger: process.env.NODE_ENV === 'development'
                ? m => console.log('[Tesseract]', m.status, Math.round((m.progress || 0) * 100) + '%')
                : () => {}
        });
        const { data: { text } } = await worker.recognize(rutaImagen);
        return text || '';
    } catch (err) {
        console.error('[Tesseract] Error al procesar imagen:', err.message);
        return '';
    } finally {
        if (worker) {
            try { await worker.terminate(); } catch { /* ignorar */ }
        }
    }
};

/**
 * Busca el número de cédula ecuatoriana (10 dígitos) en un texto extraído
 * por OCR. Filtra secuencias que no sean cédulas válidas.
 *
 * @param {string} texto
 * @returns {string|null} Número de cédula o null
 */
const extraerCedulaDeTexto = (texto) => {
    // Buscar secuencias de exactamente 10 dígitos
    const matches = texto.match(/\b\d{10}\b/g) || [];
    for (const candidato of matches) {
        const provincia = parseInt(candidato.substring(0, 2), 10);
        const provinciaValida = (provincia >= 1 && provincia <= 24) || provincia === 30;
        const tipoDoc = parseInt(candidato.substring(2, 3), 10);
        if (provinciaValida && tipoDoc <= 5) {
            return candidato;
        }
    }
    return null;
};

/**
 * Busca fecha de nacimiento en texto OCR.
 * Formatos comunes en cédulas ecuatorianas: DD/MM/YYYY, DD-MM-YYYY
 *
 * @param {string} texto
 * @returns {string|null} Fecha en formato YYYY-MM-DD o null
 */
const extraerFechaDeTexto = (texto) => {
    // Formato DD/MM/YYYY o DD-MM-YYYY
    const match = texto.match(/\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/);
    if (match) {
        const [, d, m, y] = match;
        return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    }
    return null;
};

// ─────────────────────────────────────────────────────────
// POST /api/auth/verificar-cedula-dspace
// ─────────────────────────────────────────────────────────
/**
 * Verifica identidad de un graduado antiguo comparando:
 *   - Nombres/apellidos/cédula del formulario vs texto OCR de la foto
 *   - Apellidos del formulario vs autores del DSpace
 *
 * Body (multipart/form-data):
 *   - cedula_frontal: archivo imagen (obligatorio)
 *   - cedula_posterior: archivo imagen (opcional, mejora OCR)
 *   - urlDspace: string
 *   - nombres: string (del formulario paso 1)
 *   - apellidos: string (del formulario paso 1)
 *   - cedula: string (del formulario paso 1)
 *   - fechaNacimiento: string YYYY-MM-DD (del formulario paso 1, opcional)
 *
 * Respuesta exitosa:
 *   { verificado: true, tituloEncontrado, autoresEncontrados, msg }
 *
 * Respuesta fallida:
 *   { msg: 'descripción del error', campo: 'cedula'|'nombres'|'dspace' }
 */
exports.verificarCedulaDspace = async (req, res) => {
    // ── Limpiar archivos temporales al final ───────────────────────────────
    const archivosTemporales = [];

    try {
        const { urlDspace, nombres, apellidos, cedula, fechaNacimiento } = req.body;

        // ── Validaciones básicas ──────────────────────────────────────────
        if (!nombres || !apellidos || !cedula) {
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

        if (!urlDspace || !urlDspace.includes('dspace.espoch.edu.ec')) {
            return res.status(400).json({
                msg: 'La URL debe pertenecer a dspace.espoch.edu.ec',
                campo: 'dspace'
            });
        }

        if (!req.files || !req.files['cedula_frontal']) {
            return res.status(400).json({
                msg: 'La foto del frente de la cédula es obligatoria.',
                campo: 'cedula_frontal'
            });
        }

        // ── Registrar rutas para limpieza posterior ───────────────────────
        const frontalPath = req.files['cedula_frontal'][0].path;
        archivosTemporales.push(frontalPath);

        let posteriorPath = null;
        if (req.files['cedula_posterior']) {
            posteriorPath = req.files['cedula_posterior'][0].path;
            archivosTemporales.push(posteriorPath);
        }

        // ── PASO 1: OCR de la cédula frontal ──────────────────────────────
        console.log('[VerifAnterior] Iniciando OCR cédula frontal...');
        const textoFrontal = await extraerTextoImagen(frontalPath);
        console.log('[VerifAnterior] Texto OCR frontal (primeros 300 chars):', textoFrontal.substring(0, 300));

        // OCR cédula posterior si está disponible (para más contexto)
        let textoPosterior = '';
        if (posteriorPath) {
            console.log('[VerifAnterior] Iniciando OCR cédula posterior...');
            textoPosterior = await extraerTextoImagen(posteriorPath);
        }

        const textoCompleto = `${textoFrontal}\n${textoPosterior}`;

        // ── PASO 2: Extraer cédula del texto OCR ──────────────────────────
        const cedulaOCR = extraerCedulaDeTexto(textoCompleto);
        console.log('[VerifAnterior] Cédula encontrada en OCR:', cedulaOCR);

        if (!cedulaOCR) {
            return res.status(400).json({
                msg: 'No se pudo leer el número de cédula en la imagen. ' +
                     'Asegúrate de que la foto sea nítida y bien iluminada.',
                campo: 'cedula_frontal'
            });
        }

        // ── PASO 3: Comparar cédula del formulario vs OCR ─────────────────
        if (cedula.trim() !== cedulaOCR) {
            return res.status(400).json({
                msg: 'El número de cédula no coincide con el de la imagen. ' +
                     'Verifica que hayas ingresado tu cédula correctamente.',
                campo: 'cedula'
            });
        }

        // ── PASO 4: Comparar nombres del formulario vs texto OCR ──────────
        const nombreCompleto = `${nombres.trim()} ${apellidos.trim()}`;
        const similitudNombres = similitudJaccard(nombreCompleto, textoCompleto);
        console.log('[VerifAnterior] Similitud nombres vs OCR:', Math.round(similitudNombres * 100) + '%');

        // Umbral más bajo para OCR (errores de lectura son comunes)
        if (similitudNombres < 0.30) {
            // Verificación adicional: al menos un apellido debe estar en el texto
            const apellidosPartes = normalizar(apellidos).split(' ').filter(Boolean);
            const textoNorm = normalizar(textoCompleto);
            const algunApellidoEncontrado = apellidosPartes.some(ap => textoNorm.includes(ap));

            if (!algunApellidoEncontrado) {
                return res.status(400).json({
                    msg: 'Los nombres no coinciden con los de la cédula fotográfica. ' +
                         'Verifica que los datos ingresados correspondan a tu cédula.',
                    campo: 'nombres'
                });
            }
        }

        // ── PASO 5: Verificar fecha de nacimiento (opcional) ──────────────
        if (fechaNacimiento) {
            const fechaOCR = extraerFechaDeTexto(textoCompleto);
            if (fechaOCR && fechaOCR !== fechaNacimiento) {
                console.log('[VerifAnterior] Fecha formulario:', fechaNacimiento, '| Fecha OCR:', fechaOCR);
                // No bloqueamos por fecha porque el OCR puede fallar en este campo,
                // pero lo logueamos para auditoría
            }
        }

        // ── PASO 6: Verificar en DSpace ───────────────────────────────────
        console.log('[VerifAnterior] Consultando DSpace:', urlDspace);
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

        // ── PASO 7: Comparar apellidos vs autores DSpace ──────────────────
        if (autoresEncontrados.length > 0) {
            if (!apellidoEnAutores(apellidos.trim(), autoresEncontrados)) {
                return res.status(400).json({
                    msg: `Tu nombre no aparece como autor en esta tesis. ` +
                         `Autores encontrados: ${autoresEncontrados.join(', ')}.`,
                    campo: 'dspace',
                    autoresEncontrados
                });
            }
        }

        console.log('[VerifAnterior] ✅ Verificación exitosa');

        // ── Respuesta exitosa ─────────────────────────────────────────────
        res.json({
            verificado: true,
            tituloEncontrado,
            autoresEncontrados,
            msg: 'Identidad verificada correctamente. Puedes completar tu registro.'
        });

    } catch (err) {
        console.error('[VerifAnterior] Error inesperado:', err);
        res.status(500).json({
            msg: 'Error interno al verificar. Intenta nuevamente.',
            campo: 'servidor'
        });
    } finally {
        // ── Limpiar archivos temporales siempre ───────────────────────────
        for (const ruta of archivosTemporales) {
            try {
                if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
            } catch (e) {
                console.warn('[VerifAnterior] No se pudo eliminar archivo temporal:', ruta);
            }
        }
    }
};