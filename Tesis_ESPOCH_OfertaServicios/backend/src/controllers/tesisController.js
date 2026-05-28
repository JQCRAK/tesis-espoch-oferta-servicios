// controllers/tesisController.js
const Tesis = require('../models/Tesis');
const Graduado = require('../models/Graduado');
const axios = require('axios');

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

const normalizar = (str = '') =>
    str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const similitudJaccard = (a, b) => {
    const setA = new Set(normalizar(a).split(' ').filter(Boolean));
    const setB = new Set(normalizar(b).split(' ').filter(Boolean));
    if (setA.size === 0 || setB.size === 0) return 0;
    const interseccion = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return interseccion.size / union.size;
};

const apellidoEnAutores = (apellidos = '', autores = []) => {
    const partes = normalizar(apellidos).split(' ').filter(Boolean);
    const autoresNorm = autores.map(a => normalizar(a));
    return partes.some(apellido =>
        autoresNorm.some(autor => autor.includes(apellido))
    );
};

const contarPalabras = (texto = '') =>
    texto.trim() === '' ? 0 : texto.trim().split(/\s+/).length;

// ─────────────────────────────────────────────────────────
// NORMALIZAR FECHA → formato YYYY-MM-DD
// ─────────────────────────────────────────────────────────
const normalizarFecha = (raw = '') => {
    if (!raw || raw.trim() === '') return null;

    const str = raw.trim();

    // 1) ISO completo o con T: 2025-11-19 / 2025-11-19T00:00:00Z
    const isoCompleto = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoCompleto) {
        const [, y, m, d] = isoCompleto;
        return `${y}-${m}-${d}`;
    }

    // 2) Solo año-mes: 2025-11
    const isoMes = str.match(/^(\d{4})-(\d{2})$/);
    if (isoMes) {
        const [, y, m] = isoMes;
        return `${y}-${m}-01`;
    }

    // 3) Solo año: 2025
    const soloAnio = str.match(/^(\d{4})$/);
    if (soloAnio) {
        return `${soloAnio[1]}-01-01`;
    }

    // 4) Formato DD/MM/YYYY o DD-MM-YYYY
    const dmY = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    if (dmY) {
        const [, d, m, y] = dmY;
        return `${y}-${m}-${d}`;
    }

    // 5) Fallback: intentar con Date nativo
    const dt = new Date(str);
    if (!isNaN(dt.getTime())) {
        const y = dt.getUTCFullYear();
        const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
        const d = String(dt.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    console.log('⚠️ No se pudo normalizar la fecha:', raw);
    return null;
};

// ─────────────────────────────────────────────────────────
// SCRAPING del dspace ESPOCH
// ─────────────────────────────────────────────────────────
const extraerDatosDspace = async (url) => {
    let urlObj;
    try { urlObj = new URL(url); } catch {
        throw new Error('La URL ingresada no es válida.');
    }
    if (urlObj.hostname !== 'dspace.espoch.edu.ec') {
        throw new Error('La URL debe pertenecer a dspace.espoch.edu.ec');
    }

    const matchItems = url.match(/\/items\/([a-f0-9-]{36})/i);
    const matchHandle = url.match(/\/handle\/(\d+\/\d+)/i);

    let titulo = '';
    let autores = [];
    let fechaRaw = '';

    // ════════════════════════════════════════════════════
    // ESTRATEGIA A — /server/api/core/items/{UUID}
    // ════════════════════════════════════════════════════
    if (matchItems) {
        const uuid = matchItems[1];
        console.log('🔍 UUID extraído:', uuid);

        // A1: ítem completo con metadata embebida
        try {
            const itemUrl = `https://dspace.espoch.edu.ec/server/api/core/items/${uuid}`;
            console.log('📡 [A1] GET item:', itemUrl);

            const { data } = await axios.get(itemUrl, {
                timeout: 15000,
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'Mozilla/5.0 ESPOCH-Verificador/2.0',
                }
            });

            const meta = data?.metadata || {};
            console.log('📦 [A1] Claves metadata:', Object.keys(meta));

            if (meta['dc.title']?.[0]?.value)
                titulo = meta['dc.title'][0].value.trim();

            if (meta['dc.contributor.author'])
                autores = meta['dc.contributor.author'].map(v => v.value);

            const clavesFecha = ['dc.date.issued', 'dc.date.available', 'dc.date.accessioned'];
            for (const clave of clavesFecha) {
                if (meta[clave]?.[0]?.value) {
                    fechaRaw = meta[clave][0].value;
                    console.log(`📅 [A1] Fecha encontrada en "${clave}":`, fechaRaw);
                    break;
                }
            }
            if (!fechaRaw) {
                const claveDate = Object.keys(meta).find(k => k.toLowerCase().includes('date'));
                if (claveDate) {
                    fechaRaw = meta[claveDate][0]?.value || '';
                    console.log(`📅 [A1] Fecha fallback en "${claveDate}":`, fechaRaw);
                }
            }

            console.log('✅ [A1] título:', titulo, '| autores:', autores, '| fecha raw:', fechaRaw);
        } catch (err) {
            console.log('⚠️ [A1] falló:', err.response?.status, err.message);
        }

        // A2: endpoint /metadata explícito
        if (!titulo) {
            try {
                const metaUrl = `https://dspace.espoch.edu.ec/server/api/core/items/${uuid}/metadata`;
                console.log('📡 [A2] GET metadata:', metaUrl);

                const { data } = await axios.get(metaUrl, {
                    timeout: 15000,
                    headers: { Accept: 'application/json' }
                });

                const entries = Array.isArray(data)
                    ? data
                    : (data?._embedded?.metadatavalues || []);

                console.log('📦 [A2] Entradas:', entries.length);

                for (const entry of entries) {
                    const key = entry.key ||
                        entry.schema + '.' + entry.element +
                        (entry.qualifier ? '.' + entry.qualifier : '');

                    if (key === 'dc.title' && !titulo)
                        titulo = entry.value?.trim() || '';

                    if (key === 'dc.contributor.author')
                        autores.push(entry.value);

                    if (key === 'dc.date.issued' && !fechaRaw)
                        fechaRaw = entry.value || '';
                    else if (key === 'dc.date.available' && !fechaRaw)
                        fechaRaw = entry.value || '';
                    else if (key?.toLowerCase().includes('date') && !fechaRaw)
                        fechaRaw = entry.value || '';
                }

                console.log('✅ [A2] título:', titulo, '| fecha raw:', fechaRaw);
            } catch (err) {
                console.log('⚠️ [A2] falló:', err.response?.status, err.message);
            }
        }
    }

    // ════════════════════════════════════════════════════
    // ESTRATEGIA B — Búsqueda por handle
    // ════════════════════════════════════════════════════
    if (!titulo && matchHandle) {
        const handle = matchHandle[1];
        console.log('🔍 [B] Handle extraído:', handle);
        try {
            const handleUrl = `https://dspace.espoch.edu.ec/server/api/core/handles/${encodeURIComponent(handle)}`;
            console.log('📡 [B] GET handle:', handleUrl);

            const { data: handleData } = await axios.get(handleUrl, {
                timeout: 15000,
                headers: { Accept: 'application/json' }
            });

            const itemUuid = handleData?.id || handleData?.uuid;
            if (itemUuid) {
                console.log('✅ [B] UUID desde handle:', itemUuid);
                const { data } = await axios.get(
                    `https://dspace.espoch.edu.ec/server/api/core/items/${itemUuid}`,
                    { timeout: 15000, headers: { Accept: 'application/json' } }
                );
                const meta = data?.metadata || {};
                if (meta['dc.title']?.[0]?.value)
                    titulo = meta['dc.title'][0].value.trim();
                if (meta['dc.contributor.author'])
                    autores = meta['dc.contributor.author'].map(v => v.value);

                const clavesFecha = ['dc.date.issued', 'dc.date.available', 'dc.date.accessioned'];
                for (const clave of clavesFecha) {
                    if (meta[clave]?.[0]?.value) {
                        fechaRaw = meta[clave][0].value;
                        break;
                    }
                }
            }
        } catch (err) {
            console.log('⚠️ [B] handle falló:', err.response?.status, err.message);
        }
    }

    // ════════════════════════════════════════════════════
    // ESTRATEGIA C — OAI-PMH XML (máxima compatibilidad)
    // ════════════════════════════════════════════════════
    if (!titulo) {
        let identifier = null;

        if (matchHandle) {
            identifier = `oai:dspace.espoch.edu.ec:${matchHandle[1]}`;
        } else if (matchItems) {
            try {
                const { data } = await axios.get(
                    `https://dspace.espoch.edu.ec/server/api/core/items/${matchItems[1]}`,
                    { timeout: 12000, headers: { Accept: 'application/json' } }
                );
                if (data?.handle) {
                    identifier = `oai:dspace.espoch.edu.ec:${data.handle}`;
                    console.log('🔑 [C] Handle obtenido del ítem:', data.handle);
                }
            } catch (err) {
                console.log('⚠️ [C] no se pudo obtener handle:', err.message);
            }
        }

        if (identifier) {
            try {
                const oaiUrl = `https://dspace.espoch.edu.ec/oai/request?verb=GetRecord&metadataPrefix=oai_dc&identifier=${encodeURIComponent(identifier)}`;
                console.log('📡 [C] OAI-PMH:', oaiUrl);

                const { data: xml } = await axios.get(oaiUrl, {
                    timeout: 15000,
                    headers: { Accept: 'application/xml, text/xml' }
                });

                const tituloMatch = xml.match(/<dc:title>([^<]+)<\/dc:title>/i);
                const autoresMatch = [...xml.matchAll(/<dc:creator>([^<]+)<\/dc:creator>/gi)];
                const fechaMatch = xml.match(/<dc:date>([^<]+)<\/dc:date>/i);

                if (tituloMatch?.[1]) titulo = tituloMatch[1].trim();
                if (autoresMatch.length) autores = autoresMatch.map(m => m[1].trim());
                if (fechaMatch?.[1] && !fechaRaw) fechaRaw = fechaMatch[1].trim();

                console.log('✅ [C] OAI título:', titulo, '| fecha raw:', fechaRaw);
            } catch (err) {
                console.log('⚠️ [C] OAI falló:', err.message);
            }
        }
    }

    // ── Normalizar fecha al formato YYYY-MM-DD ───────────
    const fecha = normalizarFecha(fechaRaw);
    console.log('📅 Fecha normalizada:', fecha, '(raw:', fechaRaw, ')');
    console.log('📊 RESULTADO FINAL → título:', titulo, '| autores:', autores, '| fecha:', fecha);

    if (!titulo) {
        throw new Error(
            'No se pudo obtener la información de la tesis desde el repositorio ESPOCH. ' +
            'El servidor puede estar temporalmente no disponible. Intenta nuevamente en unos minutos.'
        );
    }

    return { titulo, autores, fecha };
};


// ─────────────────────────────────────────────────────────
// GET /api/tesis/mi-tesis
// ─────────────────────────────────────────────────────────
exports.obtenerMiTesis = async (req, res) => {
    try {
        const tesis = await Tesis.findOne({ graduado: req.usuario.id });
        if (!tesis) return res.status(404).json({ msg: 'Sin tesis registrada' });
        res.json(tesis);
    } catch (err) {
        console.error('Error obtenerMiTesis:', err);
        res.status(500).json({ msg: 'Error al obtener la tesis.' });
    }
};

// ─────────────────────────────────────────────────────────
// POST /api/tesis/verificar
// ─────────────────────────────────────────────────────────
exports.verificarTesis = async (req, res) => {
    const { titulo, resumen, urlDspace } = req.body;

    if (!titulo || titulo.trim().length < 10)
        return res.status(400).json({ msg: 'El título es obligatorio y debe tener al menos 10 caracteres.' });

    if (!resumen || contarPalabras(resumen) < 30)
        return res.status(400).json({ msg: 'El resumen debe tener al menos 30 palabras.' });

    if (contarPalabras(resumen) > 260)
        return res.status(400).json({ msg: 'El resumen no puede superar las 250 palabras.' });

    if (!urlDspace || urlDspace.trim() === '')
        return res.status(400).json({ msg: 'La URL del repositorio es obligatoria.' });

    const tesisExistente = await Tesis.findOne({ graduado: req.usuario.id });
    if (tesisExistente?.verificada) {
        return res.status(400).json({ msg: 'Tu tesis ya fue verificada. Tu perfil está listo para publicarse.' });
    }

    const graduado = await Graduado.findById(req.usuario.id);
    if (!graduado) return res.status(404).json({ msg: 'Graduado no encontrado.' });

    let datosDspace;
    try {
        datosDspace = await extraerDatosDspace(urlDspace.trim());
    } catch (err) {
        return res.status(400).json({ msg: err.message });
    }

    const { titulo: tituloReal, autores: autoresReal, fecha } = datosDspace;

    const similitud = similitudJaccard(titulo, tituloReal);
    console.log(`📐 Similitud Jaccard: ${Math.round(similitud * 100)}%`);

    if (similitud < 0.75) {
        return res.status(400).json({
            msg: `El título no coincide con el registro del repositorio ESPOCH. ` +
                `Título encontrado: "${tituloReal}". ` +
                `Verifica que lo hayas escrito exactamente igual.`,
            tituloEncontrado: tituloReal,
            similitud: Math.round(similitud * 100)
        });
    }

    if (autoresReal.length > 0 && !apellidoEnAutores(graduado.apellidos, autoresReal)) {
        return res.status(400).json({
            msg: `Tu nombre no aparece como autor en esta tesis del repositorio. ` +
                `Autores encontrados: ${autoresReal.join(', ')}. ` +
                `Verifica que estés usando tu cuenta correcta.`,
            autoresEncontrados: autoresReal
        });
    }

    await Tesis.findOneAndUpdate(
        { graduado: req.usuario.id },
        {
            graduado: req.usuario.id,
            titulo: titulo.trim(),
            resumen: resumen.trim(),
            urlDspace: urlDspace.trim(),
            tituloEncontrado: tituloReal,
            autoresEncontrados: autoresReal,
            fechaPublicacion: fecha,
            verificada: false,
        },
        { upsert: true, new: true }
    );

    res.json({
        msg: 'Tesis verificada correctamente en el repositorio ESPOCH.',
        tituloEncontrado: tituloReal,
        autoresEncontrados: autoresReal,
        fechaPublicacion: fecha,
        similitud: Math.round(similitud * 100)
    });
};

// ─────────────────────────────────────────────────────────
// POST /api/tesis/aceptar-consentimiento
// ─────────────────────────────────────────────────────────
exports.aceptarConsentimiento = async (req, res) => {
    try {
        const tesis = await Tesis.findOne({ graduado: req.usuario.id });

        if (!tesis || !tesis.tituloEncontrado) {
            return res.status(400).json({ msg: 'Primero debes verificar tu tesis.' });
        }
        if (tesis.verificada) {
            return res.status(400).json({ msg: 'El consentimiento ya fue aceptado anteriormente.' });
        }

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

        tesis.verificada = true;
        tesis.fechaVerificacion = new Date();
        tesis.consentimientoAceptado = true;
        tesis.fechaConsentimiento = new Date();
        tesis.ipConsentimiento = ip;
        await tesis.save();

        // ── Extraer el año desde la fechaPublicacion guardada en tesis ──
        // Se usa getUTCFullYear() para evitar desfases por zona horaria.
        const anioGraduacion = tesis.fechaPublicacion
            ? new Date(tesis.fechaPublicacion).getUTCFullYear()
            : null;

        console.log('🎓 Año de graduación detectado:', anioGraduacion, '(fecha raw:', tesis.fechaPublicacion, ')');

        // Construir el objeto de actualización; si no se detectó año,
        // no tocamos el campo para no sobreescribir con null accidentalmente.
        const actualizacion = {
            tesisVerificada: true,
            terminosAceptados: true,
            fechaAceptacion: new Date(),
            ipAceptacion: ip,
            perfilPublico: true,
            advertenciaSinTesisEnviada: null,
        };

        // Siempre sobreescribir anioGraduacion cuando la tesis tiene fecha,
        // ya sea que el campo esté vacío o ya tenga un valor previo.
        if (anioGraduacion && !isNaN(anioGraduacion)) {
            actualizacion.anioGraduacion = anioGraduacion;
        }

        await Graduado.findByIdAndUpdate(
            req.usuario.id,
            actualizacion,
            { new: true }
        );

        res.json({
            msg: 'Consentimiento aceptado. Tu perfil ahora es público.',
            perfilPublico: true,
            tesisVerificada: true,
            anioGraduacion: anioGraduacion,
        });
    } catch (err) {
        console.error('Error aceptarConsentimiento:', err);
        res.status(500).json({ msg: 'Error al procesar el consentimiento.' });
    }
};