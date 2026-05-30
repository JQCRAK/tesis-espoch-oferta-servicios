/**
 * verificacionAnteriorController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verificación de graduados SIN acceso al correo @espoch.edu.ec
 *
 * Capas de verificación:
 *   Capa 1 — ¿La imagen contiene texto de una cédula ecuatoriana?
 *   Capa 2 — ¿El número de cédula en la foto coincide con el formulario?
 *   Capa 3 — ¿Los apellidos del formulario aparecen en el texto OCR?
 *   Capa 4 — ¿Los apellidos aparecen como autor en DSpace ESPOCH?
 *
 * Diseños soportados:
 *   - Cédula celeste/azul (2018+): número junto a "NUI." abajo izquierda
 *   - Cédula verde (2008-2018):    número junto a "No." arriba derecha
 *   - Cédula amarilla (anterior):  número en área similar
 *
 * Validación de cédula: solo 10 dígitos + provincia válida (01-24 o 30).
 * Sin algoritmo matemático de verificación.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');

// ── Cargar Tesseract.js ───────────────────────────────────────────────────────
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

// ── Reutilizar scraping DSpace ────────────────────────────────────────────────
const { extraerDatosDspace } = require('./tesisController');
const Graduado              = require('../models/Graduado');
const { hashParaBusqueda }  = require('../utils/cryptoHelper');

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

// Distancia de Levenshtein para tolerancia OCR
const levenshtein = (a, b) => {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++)
        for (let j = 1; j <= b.length; j++)
            dp[i][j] = a[i-1] === b[j-1]
                ? dp[i-1][j-1]
                : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[a.length][b.length];
};

// ─────────────────────────────────────────────────────────
// OCR con Tesseract
// ─────────────────────────────────────────────────────────
const extraerTextoImagen = async (rutaImagen) => {
    let worker;
    try {
        const fn = await getTesseract();
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
// Marcadores fijos que aparecen en TODOS los diseños:
//   - "REPÚBLICA DEL ECUADOR" (siempre en el encabezado)
//   - "DIRECCIÓN GENERAL DE REGISTRO CIVIL" (siempre presente)
//   - Etiquetas de campo: APELLIDOS, NOMBRES, FECHA DE NACIMIENTO
//
// Tolerancia: 3 de 8 marcadores mínimo (OCR puede fallar en algunos)
// ─────────────────────────────────────────────────────────
const validarEsCedula = (texto) => {
    const t = normalizar(texto);

    const marcadores = [
        // Encabezado — siempre presente, OCR puede distorsionar el inicio
        { nombre: 'REPÚBLICA DEL ECUADOR',
          ok: /r[e3]publica\s+del\s+ecuador|del\s+ecuador/.test(t) },
        // Institución emisora
        { nombre: 'REGISTRO CIVIL',
          ok: /registro\s+civil|reg\s*civil/.test(t) },
        // Tipo de documento
        { nombre: 'CEDULA / CIUDADANIA',
          ok: /c[e3][dl]?u?l?a|ciudadan[ií]a|ciudadana/.test(t) },
        // Institución abreviada
        { nombre: 'IDENTIFICACION/CEDULACION',
          ok: /identificaci|cedulaci/.test(t) },
        // Etiquetas de campos — presentes en todos los diseños
        { nombre: 'Etiqueta APELLIDOS',
          ok: /\bapellidos\b/.test(t) },
        { nombre: 'Etiqueta NOMBRES',
          ok: /\bnombres\b/.test(t) },
        { nombre: 'FECHA DE NACIMIENTO',
          ok: /fecha\s+de\s+nacimiento|fec.*nacim/.test(t) },
        // Campo ubicación — presente en todos los diseños
        { nombre: 'LUGAR DE NACIMIENTO',
          ok: /lugar\s+de\s+nacimiento|lugar.*nacim/.test(t) },
    ];

    const encontrados = marcadores.filter(m => m.ok);
    return {
        esCedula:    encontrados.length >= 3,
        puntaje:     encontrados.length,
        total:       marcadores.length,
        encontrados: encontrados.map(m => m.nombre),
        faltantes:   marcadores.filter(m => !m.ok).map(m => m.nombre),
    };
};

// ─────────────────────────────────────────────────────────
// CAPA 2: Extraer número de cédula del texto OCR
//
// Diseños identificados en las fotos reales:
//
//   Cédula celeste/azul (2018+):
//     "NUI.1719142905" — número junto a etiqueta NUI abajo izquierda
//     Ejemplo log real: "NUL185" → OCR distorsionó "NUI.1850867241"
//
//   Cédula verde (2008-2018):
//     "No. 178455996-4" — número arriba derecha con guiones
//     "No DOCUMENTO / 016338212" — número junto a etiqueta
//
//   Validación: solo 10 dígitos + provincia 01-24 o 30.
//   SIN algoritmo matemático.
// ─────────────────────────────────────────────────────────
const esCedulaValida = (num) => {
    // Solo 10 dígitos exactos
    if (!/^\d{10}$/.test(num)) return false;
    // Provincia válida: 01-24 o 30
    const prov = parseInt(num.substring(0, 2), 10);
    return (prov >= 1 && prov <= 24) || prov === 30;
};

const extraerNumeroCedula = (texto) => {
    // ── Estrategia 1: Patrón "NUI" (cédula celeste 2018+) ────────────────
    // "NUI.1719142905" o "NUL1850867241" (OCR confunde I con L)
    // El número va pegado o muy cerca de NUI
    const patronNUI = [
        /nu[il1]\.?\s*(\d{10})/i,           // NUI.XXXXXXXXXX
        /nu[il1]\s+(\d{10})/i,               // NUI XXXXXXXXXX
        /\bnu[il1][:\s\.]*(\d{9,10})\b/i,   // NUI: XXXXXXXXX (9 o 10)
    ];
    for (const p of patronNUI) {
        const m = texto.match(p);
        if (m?.[1]) {
            const num = m[1].padStart(10, '0');
            if (esCedulaValida(num)) {
                console.log('[OCR] Cédula encontrada con patrón NUI:', num);
                return { numero: num, tipo: 'cedula_ec', metodo: 'NUI' };
            }
        }
    }

    // ── Estrategia 2: Patrón "No." (cédula verde anterior) ───────────────
    // "No. 178455996-4" — puede tener guiones que el OCR lee como separadores
    const patronNo = [
        /no\.?\s*documento[^\d]{0,20}(\d{9,10})/i,
        /no\.?\s*(\d{9,10})/i,
        /n[uú]m\.?\s*(\d{9,10})/i,
    ];
    for (const p of patronNo) {
        const m = texto.match(p);
        if (m?.[1]) {
            // Quitar guiones si los hay y limpiar
            const numLimpio = m[1].replace(/[-\s]/g, '').padStart(10, '0');
            if (esCedulaValida(numLimpio)) {
                console.log('[OCR] Cédula encontrada con patrón No.:', numLimpio);
                return { numero: numLimpio, tipo: 'cedula_ec', metodo: 'No.' };
            }
        }
    }

    // ── Estrategia 3: Buscar secuencia con guiones (cédula verde) ─────────
    // "178455996-4" — número con guión al final
    const patronGuion = /(\d{8,9})-(\d{1,2})/g;
    let mg;
    while ((mg = patronGuion.exec(texto)) !== null) {
        const num = (mg[1] + mg[2]).padStart(10, '0');
        if (esCedulaValida(num)) {
            console.log('[OCR] Cédula encontrada con guión:', num);
            return { numero: num, tipo: 'cedula_ec', metodo: 'guion' };
        }
    }

    // ── Estrategia 4: Cualquier secuencia de 10 dígitos válida ────────────
    // Buscar en TODO el texto pero filtrando falsos positivos del reverso
    const todosNums = [...texto.matchAll(/\b(\d{10})\b/g)].map(m => m[1]);
    for (const num of todosNums) {
        if (!esCedulaValida(num)) continue;
        // Filtrar seriales: si los 4 primeros dígitos parecen un año → es serial
        const year = parseInt(num.substring(0, 4), 10);
        if (year >= 1900 && year <= 2099) {
            console.log('[OCR] Descartado por parecer serial/año:', num);
            continue;
        }
        console.log('[OCR] Cédula encontrada en texto libre:', num);
        return { numero: num, tipo: 'cedula_ec', metodo: 'libre' };
    }

    // ── Estrategia 5: 9 dígitos (OCR perdió 1 dígito) ────────────────────
    const nums9 = [...texto.matchAll(/\b(\d{9})\b/g)].map(m => m[1]);
    for (const num of nums9) {
        const con0 = '0' + num;
        if (esCedulaValida(con0)) {
            console.log('[OCR] Cédula 9→10 dígitos completada:', con0);
            return { numero: con0, tipo: 'cedula_ec', metodo: 'completado' };
        }
    }

    return null;
};

// ─────────────────────────────────────────────────────────
// CAPA 3: ¿Aparece el apellido en el texto OCR?
//
// Tolerante a errores OCR usando Levenshtein (1 carácter diferente)
// ─────────────────────────────────────────────────────────
const verificarApellidoEnCedula = (apellidos, textoOCR) => {
    const textNorm     = normalizar(textoOCR);
    const palabrasOCR  = textNorm.split(' ').filter(Boolean);
    const partes       = normalizar(apellidos).split(' ').filter(Boolean);

    const resultados = partes.map(ap => {
        // Coincidencia exacta
        if (textNorm.includes(ap)) return { apellido: ap, encontrado: true };
        // Tolerancia OCR: 1 carácter diferente en apellidos de 5+ letras
        if (ap.length >= 5) {
            const cercano = palabrasOCR.some(w => levenshtein(w, ap) <= 1);
            if (cercano) return { apellido: ap, encontrado: true };
        }
        return { apellido: ap, encontrado: false };
    });

    const encontrados = resultados.filter(r => r.encontrado).length;
    return {
        ok:          encontrados >= Math.ceil(partes.length / 2),
        encontrados,
        total:       partes.length,
        detalle:     resultados,
    };
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

        const provCedula = parseInt(cedula.trim().substring(0, 2), 10);
        if (!((provCedula >= 1 && provCedula <= 24) || provCedula === 30)) {
            return res.status(400).json({
                msg: 'Los primeros dos dígitos de la cédula deben ser una provincia válida (01-24 o 30).',
                campo: 'cedula'
            });
        }

        // ── Verificar que la cédula no esté ya registrada ─────────────────────
        const hashCed = hashParaBusqueda(cedula.trim());
        const yaExiste = await Graduado.findOne({ cedulaHash: hashCed });
        if (yaExiste) {
            return res.status(400).json({
                msg: 'Ya existe una cuenta registrada con esa cédula. Si olvidaste tu contraseña usa la opción "¿Olvidaste tu contraseña?" en el inicio de sesión.',
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

        if (!req.files?.['cedula_posterior']?.[0]) {
            return res.status(400).json({
                msg: 'La foto del reverso de la cédula es obligatoria.',
                campo: 'cedula_posterior'
            });
        }

        // ── Registrar archivos temporales ─────────────────────────────────
        const frontalPath  = req.files['cedula_frontal'][0].path;
        const posteriorPath = req.files['cedula_posterior'][0].path;
        temporales.push(frontalPath, posteriorPath);

        // ── OCR ───────────────────────────────────────────────────────────
        console.log('[Verif] Iniciando OCR frontal...');
        const textoFrontal = await extraerTextoImagen(frontalPath);
        console.log('[Verif] Texto frontal (300 chars):', textoFrontal.substring(0, 300));

        console.log('[Verif] Iniciando OCR posterior...');
        const textoPosterior = await extraerTextoImagen(posteriorPath);

        // IMPORTANTE: concatenar frontal + posterior pero guardar el frontal
        // aparte porque la búsqueda de número prioriza el frontal
        const textoCompleto = `${textoFrontal}\n${textoPosterior}`;

        if (!textoCompleto.trim()) {
            return res.status(400).json({
                msg: 'No se pudo extraer texto de la imagen. Sube una foto más nítida y con buena iluminación.',
                campo: 'cedula_frontal'
            });
        }

        // ── CAPA 1: ¿Es una cédula ecuatoriana? ──────────────────────────
        const validDoc = validarEsCedula(textoCompleto);
        console.log('[Verif] Capa 1:', validDoc);

        if (!validDoc.esCedula) {
            return res.status(400).json({
                msg: `La imagen no parece ser una cédula de identidad ecuatoriana. ` +
                     `Se detectaron ${validDoc.puntaje} de ${validDoc.total} marcadores (mínimo 3). ` +
                     `Asegúrate de subir una foto clara del FRENTE de tu cédula.`,
                campo: 'cedula_frontal',
                marcadoresEncontrados: validDoc.encontrados,
                marcadoresFaltantes:  validDoc.faltantes,
            });
        }

        // ── CAPA 2: Número de cédula ──────────────────────────────────────
        // Buscar usando el texto del frontal primero, luego completo
        const docOCR = extraerNumeroCedula(textoFrontal) || extraerNumeroCedula(textoCompleto);
        console.log('[Verif] Capa 2 - número OCR:', docOCR);

        if (!docOCR) {
            return res.status(400).json({
                msg: 'No se pudo leer el número de cédula en la imagen. ' +
                     'Asegúrate de que la foto sea nítida y el número esté visible (junto a NUI o No.).',
                campo: 'cedula_frontal'
            });
        }

        // Comparar con cédula del formulario
        // Tolerancia: el OCR puede leer 9 dígitos en lugar de 10 (pierde 1 dígito)
        const cedulaForm = cedula.trim();
        const cedulaOCR  = docOCR.numero;
        const coincideExacto  = cedulaForm === cedulaOCR;
        // Tolerancia OCR: los primeros 8 dígitos coinciden
        const coincideParcial = cedulaOCR.length >= 9 &&
                                (cedulaForm.startsWith(cedulaOCR.substring(0, 9)) ||
                                 cedulaForm.endsWith(cedulaOCR.substring(1)));

        if (!coincideExacto && !coincideParcial) {
            return res.status(400).json({
                msg: 'Los datos de la cédula no coinciden. Verifica que hayas ingresado correctamente tu número de cédula y que la foto sea del frente de tu cédula.',
                campo: 'cedula',
            });
        }

        // ── CAPA 3: Apellidos en la cédula ────────────────────────────────
        const verifApellido = verificarApellidoEnCedula(apellidos.trim(), textoCompleto);
        console.log('[Verif] Capa 3 - apellidos:', verifApellido);

        if (!verifApellido.ok) {
            return res.status(400).json({
                msg: 'Los datos del formulario no coinciden con la imagen de la cédula. Verifica que hayas ingresado correctamente tus apellidos.',
                campo: 'nombres',
                detalle: verifApellido.detalle
            });
        }

        // ── CAPA 4: Verificar en DSpace ESPOCH ────────────────────────────
        console.log('[Verif] Capa 4 - consultando DSpace:', urlDspace.substring(0, 60));
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
                    msg: 'No se pudo verificar tu autoría en esa tesis. Verifica que la URL corresponda a tu propia tesis publicada en el repositorio ESPOCH.',
                    campo: 'dspace'
                });
            }
        }

        console.log('[Verif] ✅ Verificación completa exitosa - método:', docOCR.metodo);

        res.json({
            verificado:        true,
            tituloEncontrado,
            autoresEncontrados,
            tipoDocumento:     docOCR.tipo,
            metodoDeteccion:   docOCR.metodo,
            capasVerificadas:  4,
            msg:               'Identidad verificada correctamente.'
        });

    } catch (err) {
        console.error('[Verif] Error inesperado:', err.message);
        res.status(500).json({
            msg: 'Error interno al verificar. Intenta nuevamente.',
            campo: 'servidor'
        });
    } finally {
        for (const ruta of temporales) {
            try { if (fs.existsSync(ruta)) fs.unlinkSync(ruta); } catch {}
        }
    }
};