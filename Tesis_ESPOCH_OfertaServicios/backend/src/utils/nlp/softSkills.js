/**
 * softSkills.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Módulo de identificación de habilidades blandas mediante análisis léxico
 * contextual aplicado a descripciones de proyectos y certificados.
 *
 * A diferencia de las habilidades técnicas (que se detectan por términos exactos),
 * las habilidades blandas requieren frases contextuales porque no se expresan
 * mediante nombres unívocos sino mediante descripciones de comportamiento.
 *
 * Ejemplo:
 *   ✅ "trabajé en equipo con 3 personas" → Trabajo en equipo
 *   ❌ "equipo de cómputo" → NO activa "Trabajo en equipo"
 *
 * Marco teórico: Sección 2.3.3 – Identificación de habilidades blandas
 * Referencia: Malinen et al. (2025), Mardiyah y Hayat (2026)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { HABILIDADES_BLANDAS } = require('./keywords');

/**
 * Detecta habilidades blandas en un texto dado.
 *
 * El proceso:
 * 1. Normaliza el texto a minúsculas (preserva tildes para regex en español)
 * 2. Para cada habilidad blanda, evalúa sus frases contextuales
 * 3. Cuenta cuántos patrones distintos activan la habilidad (evidencia)
 * 4. Solo incluye la habilidad si hay al menos 1 coincidencia contextual
 * 5. Ordena por cantidad de evidencias (las más respaldadas primero)
 *
 * @param {string} texto Texto completo del graduado (proyectos + certificados)
 * @returns {string[]} Array de nombres de habilidades blandas detectadas
 */
function detectarHabilidadesBlandas(texto) {
    if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
        return [];
    }

    const textoNorm = texto.toLowerCase();
    const detectadas = [];

    for (const habilidad of HABILIDADES_BLANDAS) {
        let evidencias = 0;

        for (const frase of habilidad.frases) {
            try {
                const regex = new RegExp(frase, 'i');
                if (regex.test(textoNorm)) {
                    evidencias++;
                }
            } catch {
                // Ignorar patrones regex inválidos
            }
        }

        if (evidencias >= 1) {
            detectadas.push({
                label: habilidad.label,
                evidencias,
            });
        }
    }

    // Ordenar por cantidad de evidencias descendente y retornar solo los labels
    return detectadas
        .sort((a, b) => b.evidencias - a.evidencias)
        .map(h => h.label);
}

module.exports = { detectarHabilidadesBlandas };