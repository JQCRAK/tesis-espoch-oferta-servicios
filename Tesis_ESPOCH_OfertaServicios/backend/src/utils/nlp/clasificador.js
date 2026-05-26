/**
 * clasificador.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Orquestador del motor NLP. Expone la función principal:
 *
 *   recalcularHabilidades(graduadoId)
 *
 * Esta función se invoca desde proyectoController.js y certificadoController.js
 * cada vez que el graduado guarda o elimina un proyecto o certificado.
 *
 * Proceso completo:
 *   1. Obtiene todos los proyectos y certificados activos del graduado
 *   2. Construye el texto completo (título + descripción de cada uno)
 *   3. Obtiene textos de otros graduados como corpus para IDF
 *   4. Aplica TF-IDF para ponderar los términos
 *   5. Detecta tecnologías por coincidencia de patrones léxicos
 *   6. Calcula porcentaje de afinidad por categoría usando TF-IDF
 *   7. Detecta habilidades blandas por frases contextuales
 *   8. Actualiza el modelo Graduado en MongoDB
 *
 * Marco teórico: Secciones 2.3.1, 2.3.2 y 2.3.3
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Graduado = require('../../models/Graduado');
const Proyecto = require('../../models/Proyecto');
const Certificado = require('../../models/Certificado');

const { TECNOLOGIAS, CATEGORIAS } = require('./keywords');
const { procesarTexto, contienePatron, puntuacionCategoria } = require('./tfidf');
const { detectarHabilidadesBlandas } = require('./softSkills');

/**
 * Construye el texto completo de un graduado a partir de sus proyectos
 * y certificados. Concatena título y descripción con peso explícito al título
 * (se repite 2 veces para aumentar su TF).
 *
 * @param {Array} proyectos
 * @param {Array} certificados
 * @returns {string}
 */
function construirTexto(proyectos, certificados) {
    const partes = [];

    for (const p of proyectos) {
        // El título se repite para aumentar su peso relativo
        if (p.titulo)      partes.push(p.titulo, p.titulo);
        if (p.descripcion) partes.push(p.descripcion);
    }

    for (const c of certificados) {
        if (c.titulo)      partes.push(c.titulo, c.titulo);
        if (c.descripcion) partes.push(c.descripcion);
        if (c.institucion) partes.push(c.institucion);
    }

    return partes.join(' ');
}

/**
 * Detecta las tecnologías presentes en el texto del graduado.
 * Usa los patrones regex definidos en keywords.js.
 *
 * @param {string} texto Texto normalizado del graduado
 * @returns {string[]} Array de nombres de tecnologías detectadas
 */
function detectarTecnologias(texto) {
    if (!texto) return [];
    const textoNorm = texto.toLowerCase();
    const detectadas = [];

    for (const tec of TECNOLOGIAS) {
        if (contienePatron(textoNorm, tec.patterns)) {
            detectadas.push(tec.label);
        }
    }

    return detectadas;
}

/**
 * Calcula las afinidades (especialidades) del graduado con sus porcentajes.
 *
 * Algoritmo:
 * 1. Para cada categoría, calcula una puntuación usando TF-IDF
 * 2. Multiplica por el peso de la categoría (ajuste fino)
 * 3. Normaliza todas las puntuaciones para que sumen ~100%
 * 4. Filtra categorías con menos del 5% (no significativas)
 * 5. Ordena de mayor a menor
 *
 * @param {Map<string, number>} tfidf Pesos TF-IDF del texto del graduado
 * @param {string[]} tokens Tokens del texto
 * @param {string} textoCompleto Texto raw para fallback de regex
 * @returns {Array<{categoria: string, porcentaje: number}>}
 */
function calcularAfinidades(tfidf, tokens, textoCompleto) {
    const textoNorm = textoCompleto.toLowerCase();
    const scores = [];

    for (const [nombre, config] of Object.entries(CATEGORIAS)) {
        const score = puntuacionCategoria(config.keywords, tfidf, tokens);

        // Fallback: si TF-IDF no detecta nada pero hay coincidencia directa
        // (útil cuando el corpus es pequeño y el IDF no está calibrado)
        let scoreFinal = score;
        if (score === 0) {
            const matchCount = config.keywords.filter(kw => {
                try { return new RegExp(kw, 'i').test(textoNorm); }
                catch { return false; }
            }).length;
            scoreFinal = matchCount * 0.005; // peso mínimo por coincidencia directa
        }

        scoreFinal *= config.peso;

        if (scoreFinal > 0) {
            scores.push({ categoria: nombre, score: scoreFinal });
        }
    }

    if (scores.length === 0) return [];

    // Normalizar a porcentajes
    const total = scores.reduce((sum, s) => sum + s.score, 0);

    const afinidades = scores
        .map(s => ({
            categoria: s.categoria,
            porcentaje: Math.round((s.score / total) * 100),
        }))
        .filter(a => a.porcentaje >= 5) // solo especialidades significativas
        .sort((a, b) => b.porcentaje - a.porcentaje);

    // Ajuste: asegurar que los porcentajes sumen exactamente 100
    // si hay afinidades detectadas
    if (afinidades.length > 0) {
        const sumaActual = afinidades.reduce((s, a) => s + a.porcentaje, 0);
        if (sumaActual !== 100) {
            afinidades[0].porcentaje += (100 - sumaActual);
        }
    }

    return afinidades;
}

/**
 * FUNCIÓN PRINCIPAL
 * ─────────────────────────────────────────────────────────────────────────────
 * Recalcula y persiste en MongoDB las habilidades del graduado:
 *   - tecnologias: string[]
 *   - afinidades:  { categoria: string, porcentaje: number }[]
 *   - habilidadesBlandas: string[]
 *
 * Se llama desde:
 *   - proyectoController.js → después de crear, editar o eliminar un proyecto
 *   - certificadoController.js → después de crear o eliminar un certificado
 *
 * @param {string} graduadoId ObjectId del graduado en MongoDB
 * @returns {Promise<void>}
 */
async function recalcularHabilidades(graduadoId) {
    try {
        // 1. Obtener proyectos y certificados del graduado
        const [proyectos, certificados] = await Promise.all([
            Proyecto.find({ graduado: graduadoId, activo: true }),
            Certificado.find({ graduado: graduadoId }),
        ]);

        // 2. Si no tiene contenido aún, limpiar habilidades y salir
        if (proyectos.length === 0 && certificados.length === 0) {
            await Graduado.findByIdAndUpdate(graduadoId, {
                tecnologias: [],
                afinidades: [],
                habilidadesBlandas: [],
            });
            return;
        }

        // 3. Construir texto del graduado actual
        const textoGraduado = construirTexto(proyectos, certificados);

        // 4. Obtener corpus: textos de OTROS graduados para calibrar IDF
        //    Solo tomamos hasta 50 graduados para no sobrecargar la BD
        const otrosGraduados = await Graduado.find(
            { _id: { $ne: graduadoId } },
            { _id: 1 }
        ).limit(50);

        const textoCorpus = [];
        if (otrosGraduados.length > 0) {
            const otrosIds = otrosGraduados.map(g => g._id);
            const [otrosProys, otrosCerts] = await Promise.all([
                Proyecto.find({ graduado: { $in: otrosIds }, activo: true }),
                Certificado.find({ graduado: { $in: otrosIds } }),
            ]);

            // Agrupar por graduado para construir un documento por graduado
            const textoPorGraduado = {};
            for (const p of otrosProys) {
                const id = p.graduado.toString();
                textoPorGraduado[id] = (textoPorGraduado[id] || '') + ' ' +
                    [p.titulo, p.titulo, p.descripcion].filter(Boolean).join(' ');
            }
            for (const c of otrosCerts) {
                const id = c.graduado.toString();
                textoPorGraduado[id] = (textoPorGraduado[id] || '') + ' ' +
                    [c.titulo, c.titulo, c.descripcion].filter(Boolean).join(' ');
            }

            textoCorpus.push(...Object.values(textoPorGraduado));
        }

        // 5. Calcular TF-IDF
        const { tfidf, tokens } = procesarTexto(textoGraduado, textoCorpus);

        // 6. Detectar tecnologías
        const tecnologias = detectarTecnologias(textoGraduado);

        // 7. Calcular afinidades por categoría
        const afinidades = calcularAfinidades(tfidf, tokens, textoGraduado);

        // 8. Detectar habilidades blandas
        const habilidadesBlandas = detectarHabilidadesBlandas(textoGraduado);

        // 9. Persistir en MongoDB
        await Graduado.findByIdAndUpdate(graduadoId, {
            tecnologias,
            afinidades,
            habilidadesBlandas,
        });

        console.log(`[NLP] Graduado ${graduadoId} recalculado → ` +
            `${tecnologias.length} tecn. | ` +
            `${afinidades.length} afinidades | ` +
            `${habilidadesBlandas.length} h.blandas`);

    } catch (err) {
        // El error NO debe interrumpir la respuesta al cliente.
        // Se loguea y se continúa. El recálculo fallido no borra habilidades previas.
        console.error(`[NLP] Error al recalcular habilidades para ${graduadoId}:`, err.message);
    }
}

module.exports = { recalcularHabilidades };