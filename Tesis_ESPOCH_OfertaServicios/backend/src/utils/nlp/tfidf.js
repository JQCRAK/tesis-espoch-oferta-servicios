/**
 * tfidf.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Implementación propia de TF-IDF (Term Frequency – Inverse Document Frequency)
 * en Node.js puro, sin dependencias externas.
 *
 * Rol en el sistema: ponderador léxico.
 * NO clasifica con un modelo supervisado (no es TF-IDF + SVM).
 * Su función es asignar pesos matemáticos a los términos técnicos para que:
 *   - Términos especializados y poco frecuentes → peso ALTO
 *   - Términos genéricos y muy frecuentes → peso BAJO (filtro de "ruido")
 *
 * Esto mejora la precisión al calcular las especialidades del graduado
 * en comparación con un simple conteo de ocurrencias (Bag of Words).
 *
 * Marco teórico: Sección 2.3.2 – Modelo TF-IDF para ponderación de términos
 * Referencia: Ali et al. (2022), Guleria et al. (2025)
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Normaliza y tokeniza un texto en español/inglés técnico.
 * Elimina signos de puntuación y convierte a minúsculas.
 * Conserva guiones y puntos dentro de términos técnicos (e.g. "node.js", "ci/cd").
 *
 * @param {string} texto
 * @returns {string[]} Array de tokens limpios
 */
function tokenizar(texto) {
    if (!texto || typeof texto !== 'string') return [];

    return texto
        .toLowerCase()
        // Conservar puntos entre letras (node.js, react.js) y barras (ci/cd)
        .replace(/([a-z])\.([a-z])/g, '$1___PUNTO___$2')
        .replace(/([a-z])\/([a-z])/g, '$1___BARRA___$2')
        // Eliminar caracteres especiales excepto letras, números y espacios
        .replace(/[^a-záéíóúñü0-9\s_]/g, ' ')
        // Restaurar puntos y barras técnicas
        .replace(/___PUNTO___/g, '.')
        .replace(/___BARRA___/g, '/')
        // Normalizar espacios múltiples
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .filter(t => t.length > 1); // eliminar tokens de un solo carácter
}

/**
 * Calcula la frecuencia de término (TF) para cada token en un documento.
 * TF(t, d) = cantidad de veces que aparece t en d / total de tokens en d
 *
 * @param {string[]} tokens Array de tokens del documento
 * @returns {Map<string, number>} Mapa token → frecuencia normalizada
 */
function calcularTF(tokens) {
    const tf = new Map();
    if (tokens.length === 0) return tf;

    const total = tokens.length;
    for (const token of tokens) {
        tf.set(token, (tf.get(token) || 0) + 1);
    }

    // Normalizar por total de tokens
    for (const [token, count] of tf) {
        tf.set(token, count / total);
    }

    return tf;
}

/**
 * Construye el IDF (Inverse Document Frequency) a partir de una colección
 * de documentos (corpus).
 *
 * IDF(t, D) = log( (N + 1) / (df(t) + 1) ) + 1
 *
 * Donde:
 *   N    = número total de documentos en el corpus
 *   df(t) = número de documentos que contienen el término t
 *
 * La versión suavizada (+1 en numerador y denominador) evita división por cero
 * y da un piso de relevancia incluso a términos nuevos.
 *
 * @param {string[][]} corpus Array de arrays de tokens (un array por documento)
 * @returns {Map<string, number>} Mapa token → valor IDF
 */
function construirIDF(corpus) {
    const idf = new Map();
    const N = corpus.length;
    if (N === 0) return idf;

    // Contar en cuántos documentos aparece cada término
    const dfCount = new Map();
    for (const tokens of corpus) {
        const tokenSet = new Set(tokens); // contar solo una vez por documento
        for (const token of tokenSet) {
            dfCount.set(token, (dfCount.get(token) || 0) + 1);
        }
    }

    // Calcular IDF con suavizado
    for (const [token, df] of dfCount) {
        idf.set(token, Math.log((N + 1) / (df + 1)) + 1);
    }

    return idf;
}

/**
 * Calcula el vector TF-IDF para un documento dado el IDF del corpus.
 *
 * TF-IDF(t, d, D) = TF(t, d) × IDF(t, D)
 *
 * @param {string[]} tokens Tokens del documento a analizar
 * @param {Map<string, number>} idf Mapa IDF del corpus
 * @returns {Map<string, number>} Mapa token → peso TF-IDF
 */
function calcularTFIDF(tokens, idf) {
    const tf = calcularTF(tokens);
    const tfidf = new Map();

    for (const [token, tfVal] of tf) {
        const idfVal = idf.get(token) || Math.log(2) + 1; // IDF por defecto para tokens nuevos
        tfidf.set(token, tfVal * idfVal);
    }

    return tfidf;
}

/**
 * Función principal: dado el texto del graduado (todos sus proyectos y
 * certificados concatenados), calcula los pesos TF-IDF de sus términos.
 *
 * En el contexto de este sistema, el "corpus" se construye a partir de
 * los textos de TODOS los graduados registrados en la BD para que el IDF
 * sea representativo. Si el corpus está vacío (primer graduado), se usa
 * un IDF por defecto basado en frecuencias esperadas del dominio técnico.
 *
 * @param {string} textoGraduado Texto completo del graduado actual
 * @param {string[]} textoCorpus Array de textos de otros graduados (puede estar vacío)
 * @returns {{ tfidf: Map<string, number>, tokens: string[] }}
 */
function procesarTexto(textoGraduado, textoCorpus = []) {
    const tokensGraduado = tokenizar(textoGraduado);

    // Construir corpus: incluir al graduado actual + corpus externo
    const allDocs = [tokensGraduado, ...textoCorpus.map(t => tokenizar(t))];
    const idf = construirIDF(allDocs);

    const tfidf = calcularTFIDF(tokensGraduado, idf);

    return { tfidf, tokens: tokensGraduado };
}

/**
 * Verifica si un texto contiene algún patrón de los dados.
 * Usado tanto para detección de tecnologías como de categorías.
 *
 * @param {string} texto Texto normalizado (minúsculas)
 * @param {string[]} patterns Array de strings regex
 * @returns {boolean}
 */
function contienePatron(texto, patterns) {
    return patterns.some(p => {
        try {
            return new RegExp(p, 'i').test(texto);
        } catch {
            return false;
        }
    });
}

/**
 * Calcula cuántas veces aparecen los keywords de una categoría en el texto,
 * ponderado por sus pesos TF-IDF.
 *
 * @param {string[]} keywords Keywords de la categoría
 * @param {Map<string, number>} tfidf Pesos TF-IDF del texto
 * @param {string[]} tokens Tokens del texto
 * @returns {number} Puntuación ponderada de la categoría
 */
function puntuacionCategoria(keywords, tfidf, tokens) {
    let score = 0;

    for (const kw of keywords) {
        // Buscar el keyword en los tokens
        const regex = new RegExp(kw, 'i');
        const textoCompleto = tokens.join(' ');
        if (regex.test(textoCompleto)) {
            // Si el token existe en el mapa TF-IDF, usar su peso; si no, peso base
            let pesoKw = 0;
            for (const [token, peso] of tfidf) {
                if (regex.test(token)) {
                    pesoKw = Math.max(pesoKw, peso);
                }
            }
            // Si no se encontró en el mapa, asignar peso base por coincidencia
            score += pesoKw > 0 ? pesoKw : 0.01;
        }
    }

    return score;
}

module.exports = {
    tokenizar,
    calcularTF,
    construirIDF,
    calcularTFIDF,
    procesarTexto,
    contienePatron,
    puntuacionCategoria,
};