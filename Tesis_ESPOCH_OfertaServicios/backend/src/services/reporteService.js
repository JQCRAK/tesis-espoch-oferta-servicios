// backend/src/services/reporteService.js
const path = require('path');
const fs = require('fs');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const PizZip = require('pizzip');

const PLANTILLA_PATH = path.join(__dirname, '..', 'assets', 'plantilla_anexo19.docx');

const PALETA = [
    '#BE1E2D', '#1565C0', '#2E7D32', '#F57F17', '#6A1B9A',
    '#00695C', '#AD1457', '#4527A0', '#0277BD', '#558B2F',
];
const LIKERT_COLORES = ['#D32F2F', '#EF6C00', '#FBC02D', '#558B2F', '#1565C0'];

const esc = (s) => String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/* ══════════════════════════════════════════════════════════
   GENERAR GRÁFICA PNG
   Ahora recibe opciones = { etiquetaMin, etiquetaMax, escalaMin, escalaMax }
   para mostrar etiquetas en likert y barras_apiladas
══════════════════════════════════════════════════════════ */
const generarGrafica = async (tipoGrafica, datos, total, opciones = {}) => {
    const { etiquetaMin = '', etiquetaMax = '', escalaMin = 1, escalaMax = 5 } = opciones;

    /* ── DONA ── */
    if (tipoGrafica === 'dona') {
        const { createCanvas } = require('canvas');

        const FONT_SZ = 17;
        const LINE_H = FONT_SZ + 5;
        const BOX_SZ = 14;
        const COL1_W = BOX_SZ;
        const COL1_GAP = 8;
        const MAX_TEXT_W = 290;
        const COL2_GAP = 14;
        const DONA_SIZE = 340;
        const LEG_DONA_GAP = 48;
        const PAD_V = 30;
        const PAD_R = 72;

        const tmpC = createCanvas(100, 100);
        const tmpCtx = tmpC.getContext('2d');
        tmpCtx.font = `bold ${FONT_SZ}px "DejaVu Sans", "Liberation Sans", sans-serif`;
        const NUM_COL_W = Math.ceil(
            Math.max(...datos.map(d => tmpCtx.measureText(String(d.cantidad)).width), 20)
        ) + 4;

        const wrapText = (text) => {
            tmpCtx.font = `${FONT_SZ}px "DejaVu Sans", "Liberation Sans", sans-serif`;
            const words = text.split(' ');
            const lines = [];
            let cur = '';
            for (const w of words) {
                const test = cur ? cur + ' ' + w : w;
                if (tmpCtx.measureText(test).width > MAX_TEXT_W && cur) { lines.push(cur); cur = w; }
                else cur = test;
            }
            if (cur) lines.push(cur);
            return lines.length ? lines : [text];
        };

        const itemLines = datos.map(d => wrapText(d.opcion));
        const itemHeights = itemLines.map(lines => Math.max(BOX_SZ + 6, lines.length * LINE_H + 6));
        const legendH = itemHeights.reduce((s, h) => s + h + 8, 0);

        const xBox = 0;
        const xTxt = COL1_W + COL1_GAP;
        const xNum = xTxt + MAX_TEXT_W + COL2_GAP;
        const legendW = xNum + NUM_COL_W + 16;

        const CW = legendW + LEG_DONA_GAP + DONA_SIZE + PAD_R;
        const CH = Math.max(DONA_SIZE + PAD_V * 2, legendH + PAD_V * 2);

        const cv = createCanvas(CW, CH);
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CW, CH);

        const pcts = datos.map(d => total > 0 ? Math.round((d.cantidad / total) * 100) : 0);
        let curY = Math.max(PAD_V, (CH - legendH) / 2);

        datos.forEach((d, i) => {
            const color = PALETA[i % PALETA.length];
            const lines = itemLines[i];
            const rowH = itemHeights[i];
            const midY = curY + rowH / 2;

            ctx.fillStyle = color;
            ctx.fillRect(xBox, midY - BOX_SZ / 2, BOX_SZ, BOX_SZ);

            ctx.font = `${FONT_SZ}px "DejaVu Sans", "Liberation Sans", sans-serif`;
            ctx.fillStyle = '#2c3e50';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            const textBlockH = lines.length * LINE_H;
            const textStartY = midY - textBlockH / 2 + LINE_H / 2;
            lines.forEach((line, li) => ctx.fillText(line, xTxt, textStartY + li * LINE_H));

            ctx.font = `bold ${FONT_SZ}px "DejaVu Sans", "Liberation Sans", sans-serif`;
            ctx.fillStyle = color;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(d.cantidad), xNum + NUM_COL_W, midY);

            curY += rowH + 8;
        });

        const cx = legendW + LEG_DONA_GAP + DONA_SIZE / 2;
        const cy = CH / 2;
        const outerR = DONA_SIZE / 2 - 30;
        const innerR = outerR * 0.52;
        let startAngle = -Math.PI / 2;

        datos.forEach((d, i) => {
            const slice = (d.cantidad / total) * 2 * Math.PI;
            const endAngle = startAngle + slice;
            const color = PALETA[i % PALETA.length];

            ctx.beginPath();
            ctx.moveTo(cx + innerR * Math.cos(startAngle), cy + innerR * Math.sin(startAngle));
            ctx.arc(cx, cy, outerR, startAngle, endAngle);
            ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();

            const pct = pcts[i];
            if (pct >= 3) {
                const midA = startAngle + slice / 2;
                const labelR = outerR + 22;
                const lx = cx + labelR * Math.cos(midA);
                const ly = cy + labelR * Math.sin(midA);
                ctx.font = 'bold 17px Arial';
                ctx.fillStyle = '#2c3e50';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${pct}%`, lx, ly);
            }
            startAngle = endAngle;
        });

        return { buffer: cv.toBuffer('image/png'), width: CW, height: CH };
    }

    /* ── BARRAS HORIZONTALES ── */
    if (tipoGrafica === 'barras_h') {
        const { createCanvas } = require('canvas');

        const items = datos.length;
        const FONT_SZ = 17;
        const ROW_H = 46;
        const PAD_TOP = 20;
        const PAD_BOT = 36;
        const PAD_R = 28;
        const CW = 1200;
        const CH = PAD_TOP + items * ROW_H + PAD_BOT;

        const tmpC = createCanvas(100, 100);
        const tmpCtx = tmpC.getContext('2d');
        tmpCtx.font = `${FONT_SZ}px "DejaVu Sans", "Liberation Sans", sans-serif`;
        const truncLabels = datos.map(d => d.opcion.length > 55 ? d.opcion.substring(0, 55) + '\u2026' : d.opcion);
        const maxTextW = Math.max(...truncLabels.map(l => tmpCtx.measureText(l).width), 80);
        const numW = 36;
        const boxW = 14;
        const GAP = 8;
        const legendW = boxW + GAP + maxTextW + GAP + numW + 16;
        const barAreaW = CW - legendW - PAD_R;

        const cv = createCanvas(CW, CH);
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CW, CH);

        const maxCant = Math.max(...datos.map(d => d.cantidad), 1);
        const gridTicks = [0, Math.round(maxCant / 2), maxCant];

        gridTicks.forEach((v, gi) => {
            const gx = legendW + Math.round((v / maxCant) * barAreaW);
            ctx.beginPath();
            ctx.moveTo(gx, PAD_TOP);
            ctx.lineTo(gx, PAD_TOP + items * ROW_H);
            ctx.strokeStyle = gi === 0 ? '#adb5bd' : '#e0e0e0';
            ctx.lineWidth = gi === 0 ? 2 : 1;
            ctx.stroke();
        });

        ctx.beginPath();
        ctx.moveTo(legendW, PAD_TOP + items * ROW_H);
        ctx.lineTo(CW - PAD_R, PAD_TOP + items * ROW_H);
        ctx.strokeStyle = '#adb5bd';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = `${FONT_SZ - 2}px "DejaVu Sans", "Liberation Sans", sans-serif`;
        ctx.fillStyle = '#6c757d';
        ctx.textAlign = 'center';
        gridTicks.forEach((v, gi) => {
            const gx = legendW + Math.round((v / maxCant) * barAreaW);
            ctx.fillText(String(v), gx, PAD_TOP + items * ROW_H + 22);
        });

        datos.forEach((d, i) => {
            const rowY = PAD_TOP + i * ROW_H;
            const midY = rowY + ROW_H / 2;
            const color = PALETA[i % PALETA.length];
            const label = truncLabels[i];
            const barW = maxCant > 0 ? Math.max((d.cantidad / maxCant) * barAreaW, d.cantidad > 0 ? 4 : 0) : 0;

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(0, midY - boxW / 2, boxW, boxW, 2) : ctx.rect(0, midY - boxW / 2, boxW, boxW);
            ctx.fill();

            ctx.font = `${FONT_SZ}px "DejaVu Sans", "Liberation Sans", sans-serif`;
            ctx.fillStyle = '#2c3e50';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, boxW + GAP, midY);

            ctx.font = `bold ${FONT_SZ}px "DejaVu Sans", "Liberation Sans", sans-serif`;
            ctx.fillStyle = '#2c3e50';
            ctx.textAlign = 'right';
            ctx.fillText(String(d.cantidad), legendW - 16, midY);

            ctx.fillStyle = color;
            const barY = midY - 10;
            const barH = 20;
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(legendW, barY, barW, barH, [0, 4, 4, 0]);
                ctx.fill();
            } else {
                ctx.fillRect(legendW, barY, barW, barH);
            }
        });

        return { buffer: cv.toBuffer('image/png'), width: CW, height: CH };
    }

    /* ── BARRAS VERTICALES ── */
    if (tipoGrafica === 'barras_v') {
        const canvas = new ChartJSNodeCanvas({ width: 960, height: 480, backgroundColour: 'white' });
        const bvBuf = await canvas.renderToBuffer({
            type: 'bar',
            data: {
                labels: datos.map(d => d.opcion),
                datasets: [{
                    label: 'Respuestas',
                    data: datos.map(d => d.cantidad),
                    backgroundColor: PALETA[1],
                    borderRadius: 6,
                    barThickness: 52,
                }],
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 17, family: 'Arial' }, color: '#6c757d' }, grid: { color: '#e0e0e0' } },
                    x: { ticks: { font: { size: 17, family: 'Arial' }, color: '#2c3e50' }, grid: { display: false } },
                },
                layout: { padding: { top: 20, right: 24, bottom: 10, left: 8 } },
            },
        });
        return { buffer: bvBuf, width: 960, height: 480 };
    }

    /* ── BARRAS APILADAS HORIZONTALES (MATRIZ) ──
       Ahora incluye etiquetaMin y etiquetaMax en la leyenda inferior
    ── */
    if (tipoGrafica === 'barras_apiladas') {
        const { createCanvas: ccAp } = require('canvas');
        const columnas = [...new Set(datos.flatMap(d => Object.keys(d.valores)))].sort((a, b) => {
            const na = Number(a), nb = Number(b);
            if (!isNaN(na) && !isNaN(nb)) return na - nb;
            return a.localeCompare(b);
        });

        const FONT_SZ = 14;
        const LINE_H = FONT_SZ + 5;
        const TEXT_MAX_W = 280;
        const PAD_L = 8;
        const GAP = 10;
        const BAR_W = 580;
        const PAD_R = 20;
        const PAD_TOP = 14;
        const BAR_MIN_H = 28;
        const legendW = PAD_L + TEXT_MAX_W + GAP;
        const CW = legendW + BAR_W + PAD_R;

        // ── Altura de leyenda inferior (considera línea de etiquetas si las hay) ──
        const hayEtiquetas = etiquetaMin || etiquetaMax;
        const LEG_H = 26;
        const legsPerRow = Math.floor(BAR_W / 100) || 1;
        const legRows = Math.ceil(columnas.length / legsPerRow);
        // Espacio extra si hay etiquetas: una fila adicional
        const etiqRowH = hayEtiquetas ? 22 : 0;
        const PAD_BOT = legRows * LEG_H + 40 + etiqRowH;

        const tmpC4 = ccAp(100, 100);
        const tmpCtx4 = tmpC4.getContext('2d');
        tmpCtx4.font = `${FONT_SZ}px "DejaVu Sans", "Liberation Sans", sans-serif`;
        const wrapAp = (text) => {
            const words = text.split(' ');
            const lines = [];
            let cur = '';
            for (const w of words) {
                const test = cur ? cur + ' ' + w : w;
                if (tmpCtx4.measureText(test).width > TEXT_MAX_W && cur) { lines.push(cur); cur = w; }
                else cur = test;
            }
            if (cur) lines.push(cur);
            return lines.length ? lines : [text];
        };

        const itemWrapped = datos.map(d => wrapAp(d.item));
        const itemRowH = itemWrapped.map(lines => Math.max(BAR_MIN_H + 14, lines.length * LINE_H + 16));
        const totalBarsH = itemRowH.reduce((s, h) => s + h, 0);
        const CH = PAD_TOP + totalBarsH + PAD_BOT;

        const cv = ccAp(CW, CH);
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CW, CH);

        const maxTotal = Math.max(...datos.map(d => Object.values(d.valores).reduce((s, v) => s + v, 0)), 1);
        const nTicks = Math.min(maxTotal, 6);

        // Líneas de cuadrícula
        for (let t = 0; t <= nTicks; t++) {
            const gx = legendW + Math.round((t / nTicks) * BAR_W);
            ctx.beginPath();
            ctx.moveTo(gx, PAD_TOP);
            ctx.lineTo(gx, PAD_TOP + totalBarsH);
            ctx.strokeStyle = t === 0 ? '#adb5bd' : '#e0e0e0';
            ctx.lineWidth = t === 0 ? 2 : 1;
            ctx.stroke();
        }

        // Eje X inferior
        ctx.beginPath();
        ctx.moveTo(legendW, PAD_TOP + totalBarsH);
        ctx.lineTo(legendW + BAR_W, PAD_TOP + totalBarsH);
        ctx.strokeStyle = '#adb5bd';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Etiquetas eje X
        ctx.font = '12px Arial';
        ctx.fillStyle = '#6c757d';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let t = 0; t <= nTicks; t++) {
            const gx = legendW + Math.round((t / nTicks) * BAR_W);
            ctx.fillText(String(Math.round((t / nTicks) * maxTotal)), gx, PAD_TOP + totalBarsH + 8);
        }

        // Filas de barras
        let curY = PAD_TOP;
        datos.forEach((d, ri) => {
            const rh = itemRowH[ri];
            const midY = curY + rh / 2;
            const lines = itemWrapped[ri];

            // Texto ítem + total a la derecha
            const totalFila = Object.values(d.valores).reduce((s, v) => s + v, 0);
            ctx.font = `${FONT_SZ}px "DejaVu Sans", "Liberation Sans", sans-serif`;
            ctx.fillStyle = '#2c3e50';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            const textBlockH = lines.length * LINE_H;
            const textStartY = midY - textBlockH / 2 + LINE_H / 2;
            lines.forEach((line, li) => ctx.fillText(line, PAD_L, textStartY + li * LINE_H));

            // Total de la fila (bold, alineado a derecha antes de las barras)
            ctx.font = `bold ${FONT_SZ}px "DejaVu Sans", "Liberation Sans", sans-serif`;
            ctx.fillStyle = '#2c3e50';
            ctx.textAlign = 'right';
            ctx.fillText(String(totalFila), legendW - 4, midY);

            // Barras apiladas
            const barH = Math.max(BAR_MIN_H, rh * 0.52);
            const barY = midY - barH / 2;
            let stackX = legendW;

            columnas.forEach((col, ci) => {
                const val = d.valores[col] || 0;
                if (val === 0) return;
                const segW = Math.max(Math.round((val / maxTotal) * BAR_W), 1);
                ctx.fillStyle = PALETA[ci % PALETA.length];
                ctx.fillRect(stackX, barY, segW, barH);
                stackX += segW;
            });

            curY += rh;
        });

        // ── Leyenda inferior: cuadro + columna + etiqueta si aplica ──
        const legBaseY = PAD_TOP + totalBarsH + 30;
        const legStartX = legendW;

        columnas.forEach((col, ci) => {
            const colNum = ci % legsPerRow;
            const rowNum = Math.floor(ci / legsPerRow);
            const lx = legStartX + colNum * (BAR_W / legsPerRow);
            const ly = legBaseY + rowNum * LEG_H;

            // Cuadro de color
            ctx.fillStyle = PALETA[ci % PALETA.length];
            ctx.fillRect(lx, ly - 6, 12, 12);

            // Texto: "columna = etiqueta" si es el primer o último y hay etiqueta
            let textoLeg = col;
            if (hayEtiquetas) {
                if (col === String(escalaMin) && etiquetaMin) textoLeg = `${col} = ${etiquetaMin}`;
                else if (col === String(escalaMax) && etiquetaMax) textoLeg = `${col} = ${etiquetaMax}`;
            }

            ctx.font = '13px Arial';
            ctx.fillStyle = '#2c3e50';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(textoLeg, lx + 16, ly);
        });

        return { buffer: cv.toBuffer('image/png'), width: CW, height: CH };
    }

    /* ── LIKERT / ESCALA ──
       Canvas 2D puro (igual estética que el modal):
       - Leyenda superior: cuadro + opción + cantidad en color
       - Etiquetas min/max encima de la barra (si existen)
       - Barra apilada con % dentro de cada segmento
       - Conteos debajo de cada segmento
    ── */
    if (tipoGrafica === 'likert' || tipoGrafica === 'escala_likert') {
        const { createCanvas } = require('canvas');

        const totalResp = datos.reduce((s, d) => s + d.cantidad, 0) || 1;
        const segmentos = datos.map((d, i) => ({
            ...d,
            pct: Math.round((d.cantidad / totalResp) * 100),
            color: LIKERT_COLORES[i % LIKERT_COLORES.length],
        }));

        const hayEtiquetas = etiquetaMin || etiquetaMax;

        // ── Dimensiones ──
        const CW = 960;
        const FONT_SZ = 16;
        const LEG_LINE_H = 24;          // alto por línea de leyenda
        const LEG_COLS = Math.min(segmentos.length, 5);
        const LEG_ROWS = Math.ceil(segmentos.length / LEG_COLS);
        const LEG_H = LEG_ROWS * LEG_LINE_H + 10;
        const ETIQ_H = hayEtiquetas ? 22 : 0;  // espacio para etiquetas min/max
        const BAR_H = 40;               // alto de la barra apilada
        const COUNTS_H = 24;            // alto para los conteos debajo
        const PAD_V = 16;
        const PAD_H = 24;
        const CH = PAD_V + LEG_H + ETIQ_H + BAR_H + COUNTS_H + PAD_V;

        const cv = createCanvas(CW, CH);
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CW, CH);

        const BAR_X = PAD_H;
        const BAR_W = CW - PAD_H * 2;

        // ── Leyenda superior ──
        const legColW = BAR_W / LEG_COLS;
        segmentos.forEach((s, i) => {
            const col = i % LEG_COLS;
            const row = Math.floor(i / LEG_COLS);
            const lx = BAR_X + col * legColW;
            const ly = PAD_V + row * LEG_LINE_H + LEG_LINE_H / 2;

            // Cuadro de color
            ctx.fillStyle = s.color;
            ctx.fillRect(lx, ly - 5, 11, 11);

            // Texto opción
            ctx.font = `${FONT_SZ - 2}px "DejaVu Sans", "Liberation Sans", sans-serif`;
            ctx.fillStyle = '#495057';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(s.opcion, lx + 15, ly);

            // Cantidad en color
            ctx.font = `bold ${FONT_SZ - 2}px "DejaVu Sans", "Liberation Sans", sans-serif`;
            ctx.fillStyle = s.color;
            const txtW = ctx.measureText(s.opcion).width;
            ctx.fillText(`(${s.cantidad})`, lx + 15 + txtW + 4, ly);
        });

        // ── Etiquetas min/max ──
        const barTop = PAD_V + LEG_H + ETIQ_H;
        if (hayEtiquetas) {
            const etiqY = PAD_V + LEG_H + ETIQ_H / 2 + 2;
            ctx.font = `italic ${FONT_SZ - 4}px "DejaVu Sans", "Liberation Sans", sans-serif`;
            ctx.fillStyle = '#6c757d';
            ctx.textBaseline = 'middle';
            if (etiquetaMin) {
                ctx.textAlign = 'left';
                ctx.fillText(`${escalaMin} = ${etiquetaMin}`, BAR_X, etiqY);
            }
            if (etiquetaMax) {
                ctx.textAlign = 'right';
                ctx.fillText(`${escalaMax} = ${etiquetaMax}`, BAR_X + BAR_W, etiqY);
            }
        }

        // ── Barra apilada ──
        let stackX = BAR_X;
        segmentos.forEach((s) => {
            if (s.pct === 0) return;
            const segW = Math.round((s.pct / 100) * BAR_W);

            // Fondo de color
            ctx.fillStyle = s.color;
            ctx.fillRect(stackX, barTop, segW, BAR_H);

            // % dentro si hay espacio
            if (s.pct >= 6) {
                ctx.font = `bold ${FONT_SZ - 3}px "DejaVu Sans", "Liberation Sans", sans-serif`;
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${s.pct}%`, stackX + segW / 2, barTop + BAR_H / 2);
            }

            stackX += segW;
        });

        // Borde alrededor de la barra
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 1;
        ctx.strokeRect(BAR_X, barTop, BAR_W, BAR_H);

        // ── Conteos debajo ──
        stackX = BAR_X;
        segmentos.forEach((s) => {
            if (s.pct === 0) return;
            const segW = Math.round((s.pct / 100) * BAR_W);
            ctx.font = `${FONT_SZ - 4}px "DejaVu Sans", "Liberation Sans", sans-serif`;
            ctx.fillStyle = '#6c757d';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(String(s.cantidad), stackX + segW / 2, barTop + BAR_H + 4);
            stackX += segW;
        });

        return { buffer: cv.toBuffer('image/png'), width: CW, height: CH };
    }

    return null;
};

/* ══════════════════════════════════════════════════════════
   PROCESAR RESPUESTAS — PREGUNTA PRINCIPAL
   Ahora retorna etiquetaMin, etiquetaMax, escalaMin, escalaMax
   en el objeto resultado para que se pasen a generarGrafica
══════════════════════════════════════════════════════════ */
const procesarPregunta = (pregunta, respuestas) => {
    const pregId = pregunta._id.toString();
    const respVal = respuestas.filter(r => r.estado === 'completada' && r.aceptoConsentimiento);

    if (pregunta.esMatriz) {
        const datos = pregunta.items.map((item, idx) => {
            const valores = {};
            respVal.forEach(r => {
                const rp = r.respuestas.find(x => x.pregunta?.toString() === pregId && !x.esCondicional);
                if (rp && Array.isArray(rp.respuesta)) {
                    const fila = rp.respuesta.find(f => f.indice === idx);
                    if (fila?.valor !== undefined && fila.valor !== '') {
                        const k = String(fila.valor);
                        valores[k] = (valores[k] || 0) + 1;
                    }
                }
            });
            return { item, valores };
        });
        return {
            tipoGrafica: 'barras_apiladas',
            datos,
            total: respVal.length,
            etiquetaMin: pregunta.etiquetaMin || '',
            etiquetaMax: pregunta.etiquetaMax || '',
            escalaMin: pregunta.escalaMin ?? 1,
            escalaMax: pregunta.escalaMax ?? 5,
        };
    }

    if (pregunta.tipo === 'numero') {
        const freq = {};
        respVal.forEach(r => {
            const rp = r.respuestas.find(x => x.pregunta?.toString() === pregId && !x.esCondicional);
            if (rp?.respuesta !== null && rp?.respuesta !== undefined && rp?.respuesta !== '') {
                freq[String(rp.respuesta)] = (freq[String(rp.respuesta)] || 0) + 1;
            }
        });
        if (Object.keys(freq).length === 0) return null;
        return {
            tipoGrafica: 'barras_v',
            datos: Object.entries(freq).sort((a, b) => Number(a[0]) - Number(b[0])).map(([opcion, cantidad]) => ({ opcion, cantidad })),
            total: respVal.length,
        };
    }

    if (pregunta.tipo === 'texto_libre') {
        const freq = {};
        respVal.forEach(r => {
            const rp = r.respuestas.find(x => x.pregunta?.toString() === pregId && !x.esCondicional);
            if (rp && rp.respuesta) {
                const original = String(rp.respuesta).trim();
                if (!original) return;
                const clave = original.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
                if (!freq[clave]) freq[clave] = { textoOriginal: original, cantidad: 0 };
                freq[clave].cantidad += 1;
            }
        });
        return {
            tipoGrafica: 'texto_libre',
            datos: Object.values(freq).sort((a, b) => b.cantidad - a.cantidad).map(({ textoOriginal, cantidad }) => ({ opcion: textoOriginal, cantidad })),
            total: respVal.length,
        };
    }

    if (pregunta.tipo === 'opcion_multiple' || pregunta.tipo === 'si_no') {
        const freq = {};
        respVal.forEach(r => {
            const rp = r.respuestas.find(x => x.pregunta?.toString() === pregId && !x.esCondicional);
            if (rp?.respuesta !== null && rp?.respuesta !== undefined && rp?.respuesta !== '') {
                freq[String(rp.respuesta)] = (freq[String(rp.respuesta)] || 0) + 1;
            }
        });
        return {
            tipoGrafica: 'dona',
            datos: Object.entries(freq).map(([opcion, cantidad]) => ({ opcion, cantidad })),
            total: respVal.length,
        };
    }

    if (pregunta.tipo === 'checkboxes') {
        const freq = {};
        respVal.forEach(r => {
            const rp = r.respuestas.find(x => x.pregunta?.toString() === pregId && !x.esCondicional);
            if (rp?.respuesta) {
                const arr = Array.isArray(rp.respuesta) ? rp.respuesta : [rp.respuesta];
                arr.forEach(v => { if (v) freq[String(v)] = (freq[String(v)] || 0) + 1; });
            }
        });
        return {
            tipoGrafica: 'barras_h',
            datos: Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([opcion, cantidad]) => ({ opcion, cantidad })),
            total: respVal.length,
        };
    }

    if (pregunta.tipo === 'escala') {
        const min = pregunta.escalaMin ?? 1;
        const max = pregunta.escalaMax ?? 5;
        const freq = {};
        for (let i = min; i <= max; i++) freq[String(i)] = 0;
        respVal.forEach(r => {
            const rp = r.respuestas.find(x => x.pregunta?.toString() === pregId && !x.esCondicional);
            if (rp?.respuesta !== null && rp?.respuesta !== undefined) {
                freq[String(rp.respuesta)] = (freq[String(rp.respuesta)] || 0) + 1;
            }
        });
        return {
            tipoGrafica: 'likert',
            datos: Object.entries(freq).map(([opcion, cantidad]) => ({ opcion, cantidad })),
            total: respVal.length,
            etiquetaMin: pregunta.etiquetaMin || '',
            etiquetaMax: pregunta.etiquetaMax || '',
            escalaMin: min,
            escalaMax: max,
        };
    }

    return null;
};

/* ══════════════════════════════════════════════════════════
   PROCESAR SUBPREGUNTAS CONDICIONALES
══════════════════════════════════════════════════════════ */
const procesarCondicionales = (pregunta, respuestas) => {
    const pregId = pregunta._id.toString();
    const respVal = respuestas.filter(r => r.estado === 'completada' && r.aceptoConsentimiento);
    const resultado = [];
    const lados = [];
    if (pregunta.preguntasCondicionalSi?.length > 0) lados.push('si');
    if (pregunta.preguntasCondicionalNo?.length > 0) lados.push('no');

    for (const lado of lados) {
        const listaTxtPregs = lado === 'si' ? pregunta.preguntasCondicionalSi : pregunta.preguntasCondicionalNo;
        const listaTipos = lado === 'si' ? (pregunta.tiposCondicionalSi || []) : (pregunta.tiposCondicionalNo || []);
        const listaOpciones = lado === 'si' ? (pregunta.opcionesCondicionalSi || []) : (pregunta.opcionesCondicionalNo || []);

        listaTxtPregs.forEach((textoPregSub, idx) => {
            const tipoSub = listaTipos[idx] || 'texto_libre';
            const opcionesSub = listaOpciones[idx] || [];

            const respsSub = respVal
                .map(r => r.respuestas.find(x =>
                    x.pregunta?.toString() === pregId &&
                    x.esCondicional === true &&
                    x.ladoCondicional === lado &&
                    x.indiceCondicional === idx
                ))
                .filter(Boolean)
                .map(x => x.respuesta)
                .filter(v => v !== null && v !== undefined && v !== '' && v !== false);

            if (respsSub.length === 0) return;

            let tipoGrafica = 'dona';
            let datosGrafica = [];
            let etqMin = '', etqMax = '', escMin = 1, escMax = 5;

            if (tipoSub === 'texto_libre') {
                const freq = {};
                respsSub.forEach(r => {
                    const original = String(r).trim();
                    if (!original) return;
                    const clave = original.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
                    if (!freq[clave]) freq[clave] = { textoOriginal: original, cantidad: 0 };
                    freq[clave].cantidad += 1;
                });
                datosGrafica = Object.values(freq).sort((a, b) => b.cantidad - a.cantidad).map(({ textoOriginal, cantidad }) => ({ opcion: textoOriginal, cantidad }));
                tipoGrafica = 'texto_libre';

            } else if (tipoSub === 'opcion_multiple') {
                const freq = {};
                respsSub.forEach(r => { freq[String(r)] = (freq[String(r)] || 0) + 1; });
                datosGrafica = Object.entries(freq).map(([opcion, cantidad]) => ({ opcion, cantidad }));
                tipoGrafica = 'dona';

            } else if (tipoSub === 'checkboxes') {
                const freq = {};
                respsSub.forEach(r => {
                    const arr = Array.isArray(r) ? r : [r];
                    arr.forEach(v => { if (v) freq[String(v)] = (freq[String(v)] || 0) + 1; });
                });
                datosGrafica = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([opcion, cantidad]) => ({ opcion, cantidad }));
                tipoGrafica = 'barras_h';

            } else if (tipoSub === 'escala') {
                escMin = 1;
                escMax = opcionesSub.length > 0 ? opcionesSub.length : 5;
                const freq = {};
                for (let i = escMin; i <= escMax; i++) freq[String(i)] = 0;
                respsSub.forEach(r => { freq[String(r)] = (freq[String(r)] || 0) + 1; });
                datosGrafica = Object.entries(freq).map(([opcion, cantidad]) => ({ opcion, cantidad }));
                tipoGrafica = 'likert';
                // Las etiquetas de escala condicional no están en el modelo, se dejan vacías

            } else if (tipoSub === 'numero') {
                const freq = {};
                respsSub.forEach(r => { freq[String(r)] = (freq[String(r)] || 0) + 1; });
                datosGrafica = Object.entries(freq).sort((a, b) => Number(a[0]) - Number(b[0])).map(([opcion, cantidad]) => ({ opcion, cantidad }));
                tipoGrafica = 'barras_v';
            }

            if (datosGrafica.length === 0) return;
            resultado.push({
                textoPregSub, lado, tipoGrafica,
                datos: datosGrafica, total: respsSub.length,
                etiquetaMin: etqMin, etiquetaMax: etqMax,
                escalaMin: escMin, escalaMax: escMax,
            });
        });
    }
    return resultado;
};

/* ══════════════════════════════════════════════════════════
   ANÁLISIS INTELIGENTE
══════════════════════════════════════════════════════════ */
const generarAnalisis = (resultado) => {
    if (!resultado || resultado.datos.length === 0) return null;
    const { tipoGrafica, datos, total } = resultado;
    if (total === 0) return null;

    if (tipoGrafica === 'texto_libre') {
        if (datos.length === 0) return null;
        const top = datos.slice(0, 3).map(d => d.opcion);
        const repetidas = datos.filter(d => d.cantidad > 1);
        let txt = `Las respuestas más frecuentes entre los ${total} encuestados fueron: ${top.join('; ')}.`;
        if (repetidas.length > 0) {
            const pct = Math.round((repetidas[0].cantidad / total) * 100);
            txt += ` La respuesta "${repetidas[0].opcion}" fue mencionada por el ${pct}% de los participantes (${repetidas[0].cantidad} de ${total}).`;
        }
        return txt;
    }

    if (tipoGrafica === 'barras_apiladas') {
        const promedios = datos.map(d => {
            const vals = Object.entries(d.valores);
            const suma = vals.reduce((s, [k, v]) => s + (Number(k) * v), 0);
            const tot = vals.reduce((s, [, v]) => s + v, 0);
            return { item: d.item, promedio: tot > 0 ? (suma / tot).toFixed(2) : '0.00', tot };
        });
        const mayor = [...promedios].sort((a, b) => Number(b.promedio) - Number(a.promedio))[0];
        const menor = [...promedios].sort((a, b) => Number(a.promedio) - Number(b.promedio))[0];
        let txt = `Se presentan los resultados de la evaluación por ítem con ${total} encuestados.`;
        if (mayor && menor && mayor.item !== menor.item) {
            txt += ` El ítem con mayor valoración promedio fue "${mayor.item}" (${mayor.promedio}), mientras que el de menor valoración fue "${menor.item}" (${menor.promedio}).`;
        }
        return txt;
    }

    if (tipoGrafica === 'dona') {
        const ord = [...datos].sort((a, b) => b.cantidad - a.cantidad);
        if (ord.length === 2) {
            const p1 = Math.round((ord[0].cantidad / total) * 100);
            const p2 = Math.round((ord[1].cantidad / total) * 100);
            return `De los ${total} encuestados, el ${p1}% respondió "${ord[0].opcion}" y el ${p2}% respondió "${ord[1].opcion}".`;
        }
        const partes = ord.map(d => `el ${Math.round((d.cantidad / total) * 100)}% ${d.opcion} (${d.cantidad})`);
        return `De los ${total} encuestados: ${partes.join(', ')}.`;
    }

    if (tipoGrafica === 'barras_h') {
        const ord = [...datos].sort((a, b) => b.cantidad - a.cantidad);
        const principal = ord[0];
        if (!principal) return null;
        const pct1 = Math.round((principal.cantidad / total) * 100);
        let txt = `La opción más seleccionada fue "${principal.opcion}" con el ${pct1}% de los ${total} encuestados (${principal.cantidad} respuestas).`;
        if (ord.length >= 2) txt += ` En segundo lugar, "${ord[1].opcion}" con el ${Math.round((ord[1].cantidad / total) * 100)}% (${ord[1].cantidad}).`;
        if (ord.length >= 3) txt += ` La tercera opción más frecuente fue "${ord[2].opcion}" con el ${Math.round((ord[2].cantidad / total) * 100)}% (${ord[2].cantidad}).`;
        return txt;
    }

    if (tipoGrafica === 'barras_v') {
        const ord = [...datos].sort((a, b) => b.cantidad - a.cantidad);
        const principal = ord[0];
        if (!principal) return null;
        const suma = datos.reduce((s, d) => s + (Number(d.opcion) * d.cantidad), 0);
        const tot = datos.reduce((s, d) => s + d.cantidad, 0);
        const prom = tot > 0 ? (suma / tot).toFixed(1) : '0.0';
        const pct1 = Math.round((principal.cantidad / total) * 100);
        return `El valor más frecuente fue ${principal.opcion} con el ${pct1}% de respuestas (${principal.cantidad} de ${total}). El promedio ponderado es ${prom}.`;
    }

    if (tipoGrafica === 'likert' || tipoGrafica === 'escala_likert') {
        const ord = [...datos].sort((a, b) => b.cantidad - a.cantidad);
        // Agrega etiquetas al análisis si existen
        const etiqMin = resultado.etiquetaMin || '';
        const etiqMax = resultado.etiquetaMax || '';
        const escMin = resultado.escalaMin ?? 1;
        const escMax = resultado.escalaMax ?? 5;

        const partes = ord.slice(0, 3).map(d => {
            const pct = Math.round((d.cantidad / total) * 100);
            let label = d.opcion;
            if (etiqMin && d.opcion === String(escMin)) label = `${d.opcion} (${etiqMin})`;
            else if (etiqMax && d.opcion === String(escMax)) label = `${d.opcion} (${etiqMax})`;
            return `${label}: ${pct}% (${d.cantidad})`;
        });

        // Promedio ponderado
        const suma = datos.reduce((s, d) => s + (Number(d.opcion) * d.cantidad), 0);
        const tot = datos.reduce((s, d) => s + d.cantidad, 0);
        const prom = tot > 0 ? (suma / tot).toFixed(2) : '0.00';

        let txt = `La distribución de respuestas de los ${total} encuestados muestra: ${partes.join(', ')}.`;
        txt += ` Promedio ponderado: ${prom}`;
        if (etiqMin || etiqMax) txt += ` (escala ${escMin}${etiqMin ? `=${etiqMin}` : ''} a ${escMax}${etiqMax ? `=${etiqMax}` : ''})`;
        txt += '.';
        return txt;
    }

    return null;
};

/* ══════════════════════════════════════════════════════════
   HELPERS XML
══════════════════════════════════════════════════════════ */
const xmlParrafo = (texto, bold = false) => {
    const b = bold ? '<w:b/><w:bCs/>' : '';
    return `<w:p>` +
        `<w:pPr><w:spacing w:after="80"/></w:pPr>` +
        `<w:r><w:rPr>` +
        `<w:rFonts w:ascii="Corbel" w:hAnsi="Corbel"/>` +
        `<w:sz w:val="20"/><w:szCs w:val="20"/>${b}` +
        `</w:rPr><w:t xml:space="preserve">${esc(texto)}</w:t></w:r></w:p>`;
};

const xmlParrafoAnalisis = (analisis) =>
    `<w:p><w:pPr><w:spacing w:after="120"/><w:jc w:val="both"/></w:pPr>` +
    `<w:r><w:rPr><w:rFonts w:ascii="Corbel" w:hAnsi="Corbel"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">Análisis: </w:t></w:r>` +
    `<w:r><w:rPr><w:rFonts w:ascii="Corbel" w:hAnsi="Corbel"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve">${esc(analisis)}</w:t></w:r></w:p>`;

const xmlImagen = (rId, anchoEmu, altoEmu, nombre, idNum) =>
    `<w:p>` +
    `<w:pPr><w:jc w:val="center"/><w:spacing w:after="80"/></w:pPr>` +
    `<w:r><w:drawing>` +
    `<wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">` +
    `<wp:extent cx="${anchoEmu}" cy="${altoEmu}"/>` +
    `<wp:docPr id="${idNum}" name="${nombre}"/>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="${idNum}" name="${nombre}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${anchoEmu}" cy="${altoEmu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;

const xmlTablaTextoLibre = (datos) => {
    const filaHead =
        `<w:tr>` +
        `<w:tc><w:tcPr><w:tcW w:w="8400" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1B3A5C"/></w:tcPr>` +
        `<w:p><w:pPr><w:spacing w:after="60"/></w:pPr>` +
        `<w:r><w:rPr><w:rFonts w:ascii="Corbel" w:hAnsi="Corbel"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:b/><w:bCs/><w:color w:val="FFFFFF"/></w:rPr>` +
        `<w:t xml:space="preserve">Respuestas registradas</w:t></w:r></w:p></w:tc></w:tr>`;

    const filasData = datos.map((d, i) => {
        const fill = i % 2 === 0 ? 'FFFFFF' : 'D6EAF8';
        return `<w:tr>` +
            `<w:tc><w:tcPr><w:tcW w:w="8400" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>` +
            `<w:p><w:pPr><w:spacing w:after="40"/></w:pPr>` +
            `<w:r><w:rPr><w:rFonts w:ascii="Corbel" w:hAnsi="Corbel"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:color w:val="000000"/></w:rPr>` +
            `<w:t xml:space="preserve">${esc(d.opcion)}</w:t></w:r></w:p></w:tc></w:tr>`;
    }).join('');

    return `<w:tbl>` +
        `<w:tblPr><w:tblW w:w="8400" w:type="dxa"/><w:jc w:val="center"/>` +
        `<w:tblBorders>` +
        `<w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>` +
        `<w:left w:val="single" w:sz="6" w:space="0" w:color="000000"/>` +
        `<w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>` +
        `<w:right w:val="single" w:sz="6" w:space="0" w:color="000000"/>` +
        `<w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>` +
        `<w:insideV w:val="none"/>` +
        `</w:tblBorders></w:tblPr>` +
        `<w:tblGrid><w:gridCol w:w="8400"/></w:tblGrid>` +
        `${filaHead}${filasData}</w:tbl>`;
};

const calcularEmu = (canvasWidth, canvasHeight) => {
    const MAX_ANCHO = 4500000;
    const ancho = Math.min(canvasWidth * 3780, MAX_ANCHO);
    const alto = Math.round((ancho / canvasWidth) * canvasHeight);
    return { ancho, alto };
};

/* ══════════════════════════════════════════════════════════
   RENDERIZAR resultado
   Ahora pasa opciones (etiquetas) a generarGrafica
══════════════════════════════════════════════════════════ */
const renderizarResultado = async (resultado, partes, zip, relsXml, imgCounter) => {
    if (!resultado || resultado.datos.length === 0) {
        partes.push(xmlParrafo('Sin respuestas registradas para esta pregunta.'));
        return;
    }

    if (resultado.tipoGrafica === 'texto_libre') {
        partes.push(`<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="60"/></w:pPr></w:p>`);
        partes.push(xmlTablaTextoLibre(resultado.datos));
    } else {
        try {
            // Pasar etiquetas y escala a generarGrafica
            const opcionesGrafica = {
                etiquetaMin: resultado.etiquetaMin || '',
                etiquetaMax: resultado.etiquetaMax || '',
                escalaMin:   resultado.escalaMin   ?? 1,
                escalaMax:   resultado.escalaMax   ?? 5,
            };

            const resultado_img = await generarGrafica(
                resultado.tipoGrafica,
                resultado.datos,
                resultado.total,
                opcionesGrafica   // ← NUEVO: se pasan las etiquetas
            );

            if (resultado_img) {
                const imgBuffer = resultado_img.buffer || resultado_img;
                const cw = resultado_img.width || 960;
                const ch = resultado_img.height || 480;
                const { ancho: anchoEmu, alto: altoEmu } = calcularEmu(cw, ch);
                imgCounter.val++;
                const imgNombre = `image${imgCounter.val}.png`;
                const rId = `rId${imgCounter.val}`;
                zip.file(`word/media/${imgNombre}`, imgBuffer);
                relsXml.val = relsXml.val.replace(
                    '</Relationships>',
                    `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${imgNombre}"/></Relationships>`
                );
                partes.push(xmlImagen(rId, anchoEmu, altoEmu, imgNombre, imgCounter.val));
            }
        } catch (e) {
            console.error(`[reporteService] Error gráfica (${resultado.tipoGrafica}):`, e.message);
            partes.push(xmlParrafo('[Error al generar gráfica para esta pregunta]'));
        }
    }

    const analisis = generarAnalisis(resultado);
    if (analisis) partes.push(xmlParrafoAnalisis(analisis));
};

/* ══════════════════════════════════════════════════════════
   PROCESAR SECCIÓN
══════════════════════════════════════════════════════════ */
const procesarSeccion = async (preguntas, respuestas, zip, relsXml, imgCounter) => {
    const partes = [];
    const pregsFiltradas = preguntas.filter(p => p.tipo !== 'titulo');

    for (const preg of pregsFiltradas) {
        partes.push(xmlParrafo(preg.texto, true));

        const resultado = procesarPregunta(preg, respuestas);
        if (!resultado) {
            partes.push(xmlParrafo('Sin respuestas registradas para esta pregunta.'));
        } else {
            await renderizarResultado(resultado, partes, zip, relsXml, imgCounter);
        }

        if (preg.tipo === 'si_no' && preg.tieneCondicional) {
            const subs = procesarCondicionales(preg, respuestas);
            if (subs.length > 0) {
                partes.push('<w:p><w:pPr><w:spacing w:after="40"/></w:pPr></w:p>');
                for (const sub of subs) {
                    const etiquetaLado = sub.lado === 'si' ? 'Si respondió Sí:' : 'Si respondió No:';
                    partes.push(
                        `<w:p><w:pPr><w:spacing w:after="40"/><w:ind w:left="360"/></w:pPr>` +
                        `<w:r><w:rPr><w:rFonts w:ascii="Corbel" w:hAnsi="Corbel"/><w:sz w:val="18"/><w:szCs w:val="18"/>` +
                        `<w:i/><w:iCs/><w:color w:val="ADB5BD"/></w:rPr>` +
                        `<w:t xml:space="preserve">${esc(etiquetaLado)}</w:t></w:r></w:p>`
                    );
                    partes.push(
                        `<w:p><w:pPr><w:spacing w:after="60"/><w:ind w:left="360"/></w:pPr>` +
                        `<w:r><w:rPr><w:rFonts w:ascii="Corbel" w:hAnsi="Corbel"/><w:sz w:val="20"/><w:szCs w:val="20"/>` +
                        `<w:b/><w:bCs/></w:rPr>` +
                        `<w:t xml:space="preserve">${esc(sub.textoPregSub)}</w:t></w:r></w:p>`
                    );
                    await renderizarResultado(sub, partes, zip, relsXml, imgCounter);
                }
            }
        }

        partes.push('<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>');
    }

    return partes.join('\n');
};

/* ══════════════════════════════════════════════════════════
   FUNCIÓN PRINCIPAL: generarWord
══════════════════════════════════════════════════════════ */
const generarWord = async ({
    evento,
    preguntasGraduados,
    preguntasEmpleadores,
    respuestasGraduados,
    respuestasEmpleadores,
    admins,
    anio,
}) => {
    if (!fs.existsSync(PLANTILLA_PATH)) throw new Error(`Plantilla no encontrada en: ${PLANTILLA_PATH}`);

    const plantillaBuffer = fs.readFileSync(PLANTILLA_PATH);
    const zip = new PizZip(plantillaBuffer);
    let xml = zip.files['word/document.xml'].asText();
    const relsPath = 'word/_rels/document.xml.rels';
    const relsXml = { val: zip.files[relsPath].asText() };
    const imgCounter = { val: 100 };

    const marcadores = ['{{ANIO}}', '{{NOMBRE_EVENTO}}', '{{FECHA_EVENTO}}', '{{FECHA_INFORME}}', '{{ADMINS}}', '{{CONTENIDO_GRADUADOS}}', '{{CONTENIDO_EMPLEADORES}}', '{{FIRMAS}}'];
    for (const m of marcadores) {
        if (!xml.includes(m)) throw new Error(`Marcador ${m} no encontrado en la plantilla.`);
    }

    xml = xml.replace('{{ANIO}}', esc(String(anio)));
    xml = xml.replace('{{NOMBRE_EVENTO}}', esc(evento.titulo || ''));

    const fechaEvento = evento.fechaInicio
        ? new Date(evento.fechaInicio).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '—';
    xml = xml.replace('{{FECHA_EVENTO}}', esc(fechaEvento));
    xml = xml.replace('{{FECHA_INFORME}}', esc(new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })));

    const cellText = (txt) =>
        `<w:p><w:r><w:rPr><w:rFonts w:ascii="Corbel" w:hAnsi="Corbel"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve">${txt}</w:t></w:r></w:p>`;

    const filaAdminXml = admins.map(a => {
        const nombre = esc(`${a.apellidos || ''} ${a.nombre || ''}`.trim());
        const cargo = esc(a.cargo || 'Docente');
        const email = esc(a.email || '');
        return `<w:tr>` +
            `<w:tc><w:tcPr><w:tcW w:w="3077" w:type="dxa"/></w:tcPr>${cellText(nombre)}</w:tc>` +
            `<w:tc><w:tcPr><w:tcW w:w="3057" w:type="dxa"/></w:tcPr>${cellText(cargo)}</w:tc>` +
            `<w:tc><w:tcPr><w:tcW w:w="2793" w:type="dxa"/></w:tcPr>${cellText(email)}</w:tc>` +
            `</w:tr>`;
    }).join('\n');

    const adminRowStart = xml.lastIndexOf('<w:tr>', xml.indexOf('{{ADMINS}}'));
    const adminRowEnd = xml.indexOf('</w:tr>', xml.indexOf('{{ADMINS}}')) + '</w:tr>'.length;
    xml = xml.slice(0, adminRowStart) + filaAdminXml + xml.slice(adminRowEnd);

    const contenidoGrad = await procesarSeccion(preguntasGraduados, respuestasGraduados, zip, relsXml, imgCounter);
    const gradPStart = xml.lastIndexOf('<w:p>', xml.indexOf('{{CONTENIDO_GRADUADOS}}'));
    const gradPEnd = xml.indexOf('</w:p>', xml.indexOf('{{CONTENIDO_GRADUADOS}}')) + '</w:p>'.length;
    xml = xml.slice(0, gradPStart) + (contenidoGrad || '<w:p><w:r><w:t>Sin respuestas registradas.</w:t></w:r></w:p>') + xml.slice(gradPEnd);

    const contenidoEmp = await procesarSeccion(preguntasEmpleadores, respuestasEmpleadores, zip, relsXml, imgCounter);
    const empPStart = xml.lastIndexOf('<w:p>', xml.indexOf('{{CONTENIDO_EMPLEADORES}}'));
    const empPEnd = xml.indexOf('</w:p>', xml.indexOf('{{CONTENIDO_EMPLEADORES}}')) + '</w:p>'.length;
    xml = xml.slice(0, empPStart) + (contenidoEmp || '<w:p><w:r><w:t>Sin respuestas registradas.</w:t></w:r></w:p>') + xml.slice(empPEnd);

    const rp = (txt, bold = false) => {
        const b = bold ? '<w:b/><w:bCs/>' : '';
        return `<w:rPr><w:rFonts w:ascii="Corbel" w:hAnsi="Corbel"/><w:sz w:val="20"/><w:szCs w:val="20"/>${b}</w:rPr>`;
    };

    const xmlFirmaAdmin = (admin, idx) => {
        const nombreCompleto = `${admin.nombre || ''} ${admin.apellidos || ''}`.trim();
        const etiqueta = `Firma ${idx + 1}: Representante de la Comisión de Carrera o sus delegados`;
        const lineaFirma =
            `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="480" w:after="60"/>` +
            `<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="000000"/></w:pBdr>` +
            `</w:pPr></w:p>`;
        const parNombre =
            `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>` +
            `<w:r>${rp(nombreCompleto)}<w:t xml:space="preserve">${esc(nombreCompleto)}</w:t></w:r></w:p>`;
        const parEtiqueta =
            `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="200"/></w:pPr>` +
            `<w:r>${rp(etiqueta)}<w:t xml:space="preserve">${esc(etiqueta)}</w:t></w:r></w:p>`;
        return lineaFirma + parNombre + parEtiqueta;
    };

    const firmasXml = admins.map((a, i) => xmlFirmaAdmin(a, i)).join('\n');
    const firmasPStart = xml.lastIndexOf('<w:p>', xml.indexOf('{{FIRMAS}}'));
    const firmasPEnd = xml.indexOf('</w:p>', xml.indexOf('{{FIRMAS}}')) + '</w:p>'.length;
    xml = xml.slice(0, firmasPStart) + (firmasXml || '<w:p><w:r><w:t></w:t></w:r></w:p>') + xml.slice(firmasPEnd);

    zip.file('word/document.xml', xml);
    zip.file(relsPath, relsXml.val);

    return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
};

module.exports = { generarWord };