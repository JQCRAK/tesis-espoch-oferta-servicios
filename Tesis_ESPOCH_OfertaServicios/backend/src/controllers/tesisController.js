const Tesis    = require('../models/Tesis');
const Graduado = require('../models/Graduado');
const axios    = require('axios');

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

const apellidoEnAutores = (apellidos = '', autores = []) => {
    const partes = normalizar(apellidos).split(' ').filter(Boolean);
    const autoresNorm = autores.map(a => normalizar(a));
    return partes.some(ap => autoresNorm.some(au => au.includes(ap)));
};

const normalizarFecha = (raw = '') => {
    if (!raw || raw.trim() === '') return null;
    const str = raw.trim();
    const isoCompleto = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoCompleto) { const [, y, m, d] = isoCompleto; return `${y}-${m}-${d}`; }
    const isoMes = str.match(/^(\d{4})-(\d{2})$/);
    if (isoMes) { const [, y, m] = isoMes; return `${y}-${m}-01`; }
    const soloAnio = str.match(/^(\d{4})$/);
    if (soloAnio) return `${soloAnio[1]}-01-01`;
    const dmY = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    if (dmY) { const [, d, m, y] = dmY; return `${y}-${m}-${d}`; }
    const dt = new Date(str);
    if (!isNaN(dt.getTime())) {
        return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`;
    }
    return null;
};

// ─────────────────────────────────────────────────────────
// VERIFICAR COLECCIÓN — solo Carrera de Software ESPOCH
// ─────────────────────────────────────────────────────────
const COLECCIONES_PERMITIDAS = [
    'ingenieria en sistemas informaticos',
    'ingeniero de software',
    'ingenieria de software',
    'software',
    'sistemas informaticos',
];

const verificarColeccionSoftware = async (uuid) => {
    try {
        const { data } = await axios.get(
            `https://dspace.espoch.edu.ec/server/api/core/items/${uuid}/owningCollection`,
            { timeout: 12000, headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 ESPOCH-Verificador/2.0' } }
        );
        const nombre     = data?.name || '';
        const nombreNorm = normalizar(nombre);
        const permitida  = COLECCIONES_PERMITIDAS.some(c => nombreNorm.includes(normalizar(c)));
        console.log('📚 [Colección]', nombre, '→', permitida ? '✅' : '❌');
        return { permitida, nombre };
    } catch (err) {
        console.log('⚠️ [Colección] Error:', err.message);
        return { permitida: true, nombre: 'no_verificado' };
    }
};

// ─────────────────────────────────────────────────────────
// SCRAPING DSpace ESPOCH
// ─────────────────────────────────────────────────────────
const extraerDatosDspace = async (url) => {
    let urlObj;
    try { urlObj = new URL(url); } catch { throw new Error('La URL ingresada no es válida.'); }
    if (urlObj.hostname !== 'dspace.espoch.edu.ec')
        throw new Error('La URL debe pertenecer a dspace.espoch.edu.ec');

    const matchItems  = url.match(/\/items\/([a-f0-9-]{36})/i);
    const matchHandle = url.match(/\/handle\/(\d+\/\d+)/i);

    let titulo = '', autores = [], fechaRaw = '', resumen = '', uuidFinal = null;

    // ── Estrategia A — /items/{UUID} ──────────────────────────────────────
    if (matchItems) {
        uuidFinal = matchItems[1];
        try {
            const { data } = await axios.get(
                `https://dspace.espoch.edu.ec/server/api/core/items/${uuidFinal}`,
                { timeout: 15000, headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 ESPOCH-Verificador/2.0' } }
            );
            const meta = data?.metadata || {};
            if (meta['dc.title']?.[0]?.value)       titulo  = meta['dc.title'][0].value.trim();
            if (meta['dc.contributor.author'])        autores = meta['dc.contributor.author'].map(v => v.value);
            // Resumen — puede estar en dc.description.abstract o dc.description
            if (meta['dc.description.abstract']?.[0]?.value)
                resumen = meta['dc.description.abstract'][0].value.trim();
            else if (meta['dc.description']?.[0]?.value)
                resumen = meta['dc.description'][0].value.trim();
            for (const k of ['dc.date.issued','dc.date.available','dc.date.accessioned']) {
                if (meta[k]?.[0]?.value) { fechaRaw = meta[k][0].value; break; }
            }
            console.log('✅ [A1]', titulo, '| resumen chars:', resumen.length);
        } catch (err) { console.log('⚠️ [A1]', err.message); }

        // A2: endpoint /metadata
        if (!titulo) {
            try {
                const { data } = await axios.get(
                    `https://dspace.espoch.edu.ec/server/api/core/items/${uuidFinal}/metadata`,
                    { timeout: 15000, headers: { Accept: 'application/json' } }
                );
                const entries = Array.isArray(data) ? data : (data?._embedded?.metadatavalues || []);
                for (const e of entries) {
                    const k = e.key || `${e.schema}.${e.element}${e.qualifier?'.'+e.qualifier:''}`;
                    if (k === 'dc.title' && !titulo)                           titulo  = e.value?.trim() || '';
                    if (k === 'dc.contributor.author')                          autores.push(e.value);
                    if (k === 'dc.date.issued' && !fechaRaw)                   fechaRaw = e.value || '';
                    if ((k === 'dc.description.abstract' || k === 'dc.description') && !resumen)
                        resumen = e.value?.trim() || '';
                }
                console.log('✅ [A2]', titulo);
            } catch (err) { console.log('⚠️ [A2]', err.message); }
        }
    }

    // ── Estrategia B — handle ─────────────────────────────────────────────
    if (!titulo && matchHandle) {
        try {
            const { data: hd } = await axios.get(
                `https://dspace.espoch.edu.ec/server/api/core/handles/${encodeURIComponent(matchHandle[1])}`,
                { timeout: 15000, headers: { Accept: 'application/json' } }
            );
            const itemUuid = hd?.id || hd?.uuid;
            if (itemUuid) {
                uuidFinal = itemUuid;
                const { data } = await axios.get(
                    `https://dspace.espoch.edu.ec/server/api/core/items/${itemUuid}`,
                    { timeout: 15000, headers: { Accept: 'application/json' } }
                );
                const meta = data?.metadata || {};
                if (meta['dc.title']?.[0]?.value)    titulo  = meta['dc.title'][0].value.trim();
                if (meta['dc.contributor.author'])     autores = meta['dc.contributor.author'].map(v => v.value);
                if (meta['dc.description.abstract']?.[0]?.value && !resumen)
                    resumen = meta['dc.description.abstract'][0].value.trim();
                for (const k of ['dc.date.issued','dc.date.available','dc.date.accessioned']) {
                    if (meta[k]?.[0]?.value) { fechaRaw = meta[k][0].value; break; }
                }
            }
        } catch (err) { console.log('⚠️ [B]', err.message); }
    }

    // ── Estrategia C — OAI-PMH ────────────────────────────────────────────
    if (!titulo) {
        let identifier = matchHandle
            ? `oai:dspace.espoch.edu.ec:${matchHandle[1]}`
            : null;
        if (!identifier && matchItems) {
            try {
                const { data } = await axios.get(
                    `https://dspace.espoch.edu.ec/server/api/core/items/${matchItems[1]}`,
                    { timeout: 12000, headers: { Accept: 'application/json' } }
                );
                if (data?.handle) {
                    identifier = `oai:dspace.espoch.edu.ec:${data.handle}`;
                    if (!uuidFinal) uuidFinal = matchItems[1];
                }
            } catch {}
        }
        if (identifier) {
            try {
                const { data: xml } = await axios.get(
                    `https://dspace.espoch.edu.ec/oai/request?verb=GetRecord&metadataPrefix=oai_dc&identifier=${encodeURIComponent(identifier)}`,
                    { timeout: 15000, headers: { Accept: 'application/xml, text/xml' } }
                );
                const tm  = xml.match(/<dc:title>([^<]+)<\/dc:title>/i);
                const am  = [...xml.matchAll(/<dc:creator>([^<]+)<\/dc:creator>/gi)];
                const fm  = xml.match(/<dc:date>([^<]+)<\/dc:date>/i);
                const rm  = xml.match(/<dc:description>([^<]+)<\/dc:description>/i);
                if (tm?.[1])              titulo  = tm[1].trim();
                if (am.length)            autores = am.map(m => m[1].trim());
                if (fm?.[1] && !fechaRaw) fechaRaw = fm[1].trim();
                if (rm?.[1] && !resumen)  resumen  = rm[1].trim();
                console.log('✅ [C]', titulo);
            } catch (err) { console.log('⚠️ [C]', err.message); }
        }
    }

    if (!titulo)
        throw new Error('No se pudo obtener la información de la tesis desde el repositorio ESPOCH. Intenta nuevamente.');

    // ── Verificar colección — solo Carrera de Software ────────────────────
    if (uuidFinal) {
        const col = await verificarColeccionSoftware(uuidFinal);
        if (!col.permitida)
            throw new Error('Esta tesis no pertenece a la Carrera de Ingeniería de Software de la ESPOCH. Solo pueden registrarse graduados de esa carrera.');
        console.log('✅ [Colección]', col.nombre);
    }

    return { titulo, autores, fecha: normalizarFecha(fechaRaw), resumen };
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
        console.error(err);
        res.status(500).json({ msg: 'Error al obtener la tesis.' });
    }
};

// ─────────────────────────────────────────────────────────
// POST /api/tesis/verificar
// NUEVO: solo recibe urlDspace — título y autores se extraen automáticamente
// ─────────────────────────────────────────────────────────
exports.verificarTesis = async (req, res) => {
    const { urlDspace } = req.body;

    if (!urlDspace || urlDspace.trim() === '')
        return res.status(400).json({ msg: 'La URL del repositorio es obligatoria.' });
    if (!urlDspace.includes('dspace.espoch.edu.ec'))
        return res.status(400).json({ msg: 'La URL debe pertenecer a dspace.espoch.edu.ec' });

    const tesisExistente = await Tesis.findOne({ graduado: req.usuario.id });
    if (tesisExistente?.verificada)
        return res.status(400).json({ msg: 'Tu tesis ya fue verificada.' });

    const graduado = await Graduado.findById(req.usuario.id);
    if (!graduado) return res.status(404).json({ msg: 'Graduado no encontrado.' });

    let datosDspace;
    try {
        datosDspace = await extraerDatosDspace(urlDspace.trim());
    } catch (err) {
        return res.status(400).json({ msg: err.message });
    }

    const { titulo: tituloReal, autores: autoresReal, fecha, resumen: resumenDspace } = datosDspace;

    // Verificar que el apellido del graduado esté entre los autores
    if (autoresReal.length > 0 && !apellidoEnAutores(graduado.apellidos, autoresReal)) {
        return res.status(400).json({
            msg: `Tu nombre no aparece como autor en esta tesis. ` +
                 `Autores encontrados: ${autoresReal.join(', ')}. ` +
                 `Verifica que la URL corresponda a tu tesis.`,
            autoresEncontrados: autoresReal
        });
    }

    await Tesis.findOneAndUpdate(
        { graduado: req.usuario.id },
        {
            graduado:           req.usuario.id,
            titulo:             tituloReal,
            resumen:            resumenDspace || '',
            urlDspace:          urlDspace.trim(),
            tituloEncontrado:   tituloReal,
            autoresEncontrados: autoresReal,
            fechaPublicacion:   fecha,
            verificada:         false,
        },
        { upsert: true, new: true }
    );

    res.json({
        msg:                'Tesis verificada correctamente.',
        tituloEncontrado:   tituloReal,
        autoresEncontrados: autoresReal,
        fechaPublicacion:   fecha,
    });
};

// ─────────────────────────────────────────────────────────
// POST /api/tesis/aceptar-consentimiento
// ─────────────────────────────────────────────────────────
exports.aceptarConsentimiento = async (req, res) => {
    try {
        const tesis = await Tesis.findOne({ graduado: req.usuario.id });
        if (!tesis || !tesis.tituloEncontrado)
            return res.status(400).json({ msg: 'Primero debes verificar tu tesis.' });
        if (tesis.verificada)
            return res.status(400).json({ msg: 'El consentimiento ya fue aceptado.' });

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        tesis.verificada             = true;
        tesis.fechaVerificacion      = new Date();
        tesis.consentimientoAceptado = true;
        tesis.fechaConsentimiento    = new Date();
        tesis.ipConsentimiento       = ip;
        await tesis.save();

        const anioGraduacion = tesis.fechaPublicacion
            ? new Date(tesis.fechaPublicacion).getUTCFullYear() : null;

        const actualizacion = {
            tesisVerificada:    true,
            terminosAceptados:  true,
            fechaAceptacion:    new Date(),
            ipAceptacion:       ip,
            perfilPublico:      true,
            advertenciaSinTesisEnviada: null,
        };
        if (anioGraduacion && !isNaN(anioGraduacion))
            actualizacion.anioGraduacion = anioGraduacion;

        await Graduado.findByIdAndUpdate(req.usuario.id, actualizacion, { new: true });

        res.json({
            msg:             'Consentimiento aceptado. Tu perfil ahora es público.',
            perfilPublico:   true,
            tesisVerificada: true,
            anioGraduacion,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al procesar el consentimiento.' });
    }
};

exports.extraerDatosDspace = extraerDatosDspace;