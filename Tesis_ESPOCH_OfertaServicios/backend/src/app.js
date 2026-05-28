// backend/app.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const connectDB = require('./config/db');
const Evento = require('./models/Evento');

dotenv.config();
connectDB();

const app = express();

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XXS-Protection', '1; mode=block');
    next();
});

app.use(cors());
app.use(express.json());

app.use('/api/empleador', require('./routes/empleadorPublicoRoutes'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('API de Graduados ESPOCH funcionando correctamente 🚀');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/perfil', require('./routes/perfilRoutes'));
app.use('/api/proyectos', require('./routes/proyectoRoutes'));
app.use('/api/certificados', require('./routes/certificadoRoutes'));
app.use('/api/tesis', require('./routes/tesisRoutes'));
app.use('/api/publico', require('./routes/publicoRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api', require('./routes/eventoNoticiaRoutes'));
app.use('/api', require('./routes/encuestaRoutes'));
app.use('/api', require('./routes/tendenciaRoutes'));
app.use('/api/admin/notificaciones', require('./routes/notificacionAdminRoutes'));
app.use('/api/admin/reportes', require('./routes/reporteRoutes'));

/* ══════════════════════════════════════════════════════
   CRON — Actualización automática de estados de eventos
   Se ejecuta cada hora en punto
══════════════════════════════════════════════════════ */
cron.schedule('0 * * * *', async () => {
    try {
        const now = new Date();

        const programados = await Evento.updateMany(
            { estado: 'programado', fechaInicio: { $lte: now }, fechaFin: { $gt: now } },
            { $set: { estado: 'en_curso' } }
        );
        const finalizados = await Evento.updateMany(
            { estado: { $in: ['programado', 'en_curso'] }, fechaFin: { $lte: now } },
            { $set: { estado: 'finalizado' } }
        );

        const Encuesta = require('./models/Encuesta');
        const encuestasCerradas = await Encuesta.updateMany(
            { estado: 'activa', fechaCierre: { $lte: now } },
            { $set: { estado: 'cerrada' } }
        );

        const totalEv = programados.modifiedCount + finalizados.modifiedCount;
        const totalEnc = encuestasCerradas.modifiedCount;

        if (totalEv > 0) console.log(`[Cron-Eventos]   ${new Date().toISOString()} — ${totalEv} evento(s) actualizados`);
        if (totalEnc > 0) console.log(`[Cron-Encuestas] ${new Date().toISOString()} — ${totalEnc} encuesta(s) cerradas`);

    } catch (err) {
        console.error('[Cron-Eventos] Error:', err.message);
    }
}, { timezone: 'America/Guayaquil' });

/* ══════════════════════════════════════════════════════
   CRON — Rotación semanal de tendencias tecnológicas
   Se ejecuta cada lunes a las 00:05 (America/Guayaquil)
══════════════════════════════════════════════════════ */
cron.schedule('5 0 * * 1', async () => {
    try {
        const { rotarTendencia } = require('./controllers/tendenciaController');
        const tendencia = await rotarTendencia();
        if (tendencia) {
            console.log(`[Cron-Tendencia] ${new Date().toISOString()} — Tendencia rotada → "${tendencia.categoria}"`);
        }
    } catch (err) {
        console.error('[Cron-Tendencia] Error:', err.message);
    }
}, { timezone: 'America/Guayaquil' });

/* ══════════════════════════════════════════════════════════════════
   CRON — Limpieza automática de cuentas sin tesis verificada
   ──────────────────────────────────────────────────────────────────

   ╔══════════════════════════════════════════════════════════╗
   ║  MODO PRUEBA  (activo ahora)                             ║
   ║  • 5 min sin tesis  → envía email de advertencia         ║
   ║  • 10 min sin tesis → elimina la cuenta en cascada       ║
   ║  • Cron corre cada minuto: * * * * *                     ║
   ╠══════════════════════════════════════════════════════════╣
   ║  MODO PRODUCCIÓN  (cambiar cuando esté listo)            ║
   ║  • 365 días sin tesis → envía email de advertencia       ║
   ║  • 380 días sin tesis → elimina la cuenta en cascada     ║
   ║  • Cron corre cada día a las 02:00: 0 2 * * *            ║
   ╚══════════════════════════════════════════════════════════╝

   Para pasar a producción cambia SOLO estas 3 líneas:
     MINS_ADVERTENCIA = 365 * 24 * 60
     MINS_ELIMINAR    = 380 * 24 * 60
     cron.schedule('0 2 * * *', ...)

   Solo afecta graduados con tesisVerificada = false.
   Si la tesis se verifica, advertenciaSinTesisEnviada se resetea
   a null en tesisController y este cron los ignora para siempre.
══════════════════════════════════════════════════════════════════ */
cron.schedule('* * * * *', async () => {
    const TAG = '[Cron-Limpieza]';
    const ahora = new Date();

    // ── Tiempos en MINUTOS ────────────────────────────────────────
    // PRUEBA:      5 min advertencia,  10 min eliminar
    // PRODUCCIÓN:  365*24*60 advertencia,  380*24*60 eliminar
    const MINS_ADVERTENCIA = 5;
    const MINS_ELIMINAR    = 10;
    // ─────────────────────────────────────────────────────────────

    const msAdvertencia = MINS_ADVERTENCIA * 60 * 1000;
    const msEliminar    = MINS_ELIMINAR    * 60 * 1000;

    const fechaLimiteRegistro   = new Date(ahora.getTime() - msAdvertencia);
    const msEsperaTrasDaviso    = msEliminar - msAdvertencia;   // 5 min entre aviso y borrado
    const fechaLimiteTrasDaviso = new Date(ahora.getTime() - msEsperaTrasDaviso);

    try {
        const Graduado    = require('./models/Graduado');
        const Proyecto    = require('./models/Proyecto');
        const Certificado = require('./models/Certificado');
        const Tesis       = require('./models/Tesis');
        const { AuditoriaLog } = require('./models/Auditoria');
        const { enviarAdvertenciaSinTesis } = require('./services/emailLimpiezaService');
        const fs   = require('fs');
        const path = require('path');

        /* ── PASO 1: Enviar advertencias ──────────────────────────
           - tesisVerificada = false
           - createdAt <= hace MINS_ADVERTENCIA minutos
           - advertenciaSinTesisEnviada = null  (aún no avisado)
        ──────────────────────────────────────────────────────── */
        const paraAdvertir = await Graduado.find({
            tesisVerificada: false,
            createdAt: { $lte: fechaLimiteRegistro },
            advertenciaSinTesisEnviada: null,
        }).select('_id nombres apellidos emailPersonal createdAt');

        for (const graduado of paraAdvertir) {
            const fechaElim = new Date(graduado.createdAt.getTime() + msEliminar);
            const minsRestantes = Math.max(
                1,
                Math.ceil((fechaElim.getTime() - ahora.getTime()) / (60 * 1000))
            );
            // Texto legible según el modo:
            // Prueba → "X minutos"  |  Producción → "X días"
            const tiempoRestanteTexto = `${minsRestantes} minuto${minsRestantes === 1 ? '' : 's'}`;
            const fechaEliminacionStr = fechaElim.toLocaleTimeString('es-EC', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
            });

            try {
                await enviarAdvertenciaSinTesis({
                    nombres:          graduado.nombres,
                    apellidos:        graduado.apellidos,
                    emailPersonal:    graduado.emailPersonal,
                    diasRestantes:    minsRestantes,           // el template usa esta variable
                    unidad:           'minuto',                // 'minuto' prueba | 'día' producción
                    fechaEliminacion: fechaEliminacionStr,
                });

                await Graduado.findByIdAndUpdate(graduado._id, {
                    advertenciaSinTesisEnviada: ahora,
                });

                await AuditoriaLog.create({
                    usuarioId:         'sistema',
                    usuarioEmail:      'cron@sistema',
                    rol:               'sistema',
                    accion:            'ADVERTENCIA_SIN_TESIS',
                    modulo:            'Limpieza automática',
                    coleccionAfectada: 'graduados',
                    descripcion:       `Advertencia enviada a "${graduado.nombres} ${graduado.apellidos}" (${graduado.emailPersonal}). Eliminación a las ${fechaEliminacionStr}.`,
                    ip:                'cron',
                }).catch(() => {});

                console.log(`${TAG} ⚠️  Advertencia → ${graduado.nombres} ${graduado.apellidos} | eliminar en ${tiempoRestanteTexto}`);

            } catch (emailErr) {
                console.error(`${TAG} ❌ Error enviando advertencia a ${graduado.emailPersonal}:`, emailErr.message);
            }
        }

        /* ── PASO 2: Eliminar cuentas vencidas ────────────────────
           - tesisVerificada = false
           - advertenciaSinTesisEnviada <= hace (msEliminar - msAdvertencia) ms
        ──────────────────────────────────────────────────────── */
        const paraEliminar = await Graduado.find({
            tesisVerificada: false,
            advertenciaSinTesisEnviada: {
                $ne:  null,
                $lte: fechaLimiteTrasDaviso,
            },
        }).select('_id nombres apellidos emailPersonal fotoPerfil');

        for (const graduado of paraEliminar) {
            const id        = graduado._id.toString();
            const nombreLog = `${graduado.nombres} ${graduado.apellidos}`;

            try {
                // 1. Foto de perfil
                if (graduado.fotoPerfil) {
                    try {
                        const rutaFoto = path.join(__dirname, '..', graduado.fotoPerfil);
                        if (fs.existsSync(rutaFoto)) fs.unlinkSync(rutaFoto);
                    } catch (e) { console.error(`${TAG} Error foto:`, e.message); }
                }

                // 2. Proyectos con imágenes
                try {
                    const proyectos = await Proyecto.find({ graduado: id });
                    for (const p of proyectos) {
                        if (p.imagen) {
                            try {
                                const ruta = path.join(__dirname, '..', p.imagen);
                                if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
                            } catch (e) { console.error(`${TAG} Error img:`, e.message); }
                        }
                    }
                    await Proyecto.deleteMany({ graduado: id });
                } catch (e) { console.error(`${TAG} Error proyectos:`, e.message); }

                // 3. Certificados con archivos
                try {
                    const certificados = await Certificado.find({ graduado: id });
                    for (const c of certificados) {
                        if (c.archivo) {
                            try {
                                const ruta = path.join(__dirname, '..', c.archivo);
                                if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
                            } catch (e) { console.error(`${TAG} Error arch:`, e.message); }
                        }
                    }
                    await Certificado.deleteMany({ graduado: id });
                } catch (e) { console.error(`${TAG} Error certificados:`, e.message); }

                // 4. Tesis
                try {
                    await Tesis.deleteMany({ graduado: id });
                } catch (e) { console.error(`${TAG} Error tesis:`, e.message); }

                // 5. Carpeta uploads del graduado
                try {
                    const carpeta = path.join(__dirname, '..', 'uploads', 'graduados', id);
                    if (fs.existsSync(carpeta)) fs.rmSync(carpeta, { recursive: true, force: true });
                } catch (e) { console.error(`${TAG} Error carpeta:`, e.message); }

                // 6. Eliminar documento graduado
                await Graduado.findByIdAndDelete(id);

                await AuditoriaLog.create({
                    usuarioId:         'sistema',
                    usuarioEmail:      'cron@sistema',
                    rol:               'sistema',
                    accion:            'ELIMINACION_AUTOMATICA_SIN_TESIS',
                    modulo:            'Limpieza automática',
                    coleccionAfectada: 'graduados',
                    descripcion:       `Cuenta eliminada automáticamente por falta de tesis: "${nombreLog}" (${graduado.emailPersonal}).`,
                    ip:                'cron',
                }).catch(() => {});

                console.log(`${TAG} 🗑️  Eliminado → ${nombreLog} (${graduado.emailPersonal})`);

            } catch (elErr) {
                console.error(`${TAG} ❌ Error eliminando ${nombreLog}:`, elErr.message);
            }
        }

        // Log silencioso si no hubo nada que hacer
        if (paraAdvertir.length === 0 && paraEliminar.length === 0) return;

        console.log(`${TAG} ✅ Advertencias: ${paraAdvertir.length} | Eliminados: ${paraEliminar.length}`);

    } catch (err) {
        console.error(`${TAG} ❌ Error crítico:`, err.message);
    }

}, { timezone: 'America/Guayaquil' });


const PORT = process.env.PORT || 4000;
app.use((err, req, res, next) => {
    console.error('ERROR GLOBAL:', err?.message || String(err));
    console.error('STACK:', err?.stack);
    res.status(err?.status || 500).json({
        msg: err?.message || 'Error interno del servidor',
        detalle: String(err)
    });
});
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en modo ${process.env.NODE_ENV} en el puerto ${PORT}`);
    console.log(`🔗 Url local: http://localhost:4000`);
    console.log(`⏰ Crons activos:`);
    console.log(`   • Eventos/Encuestas  — cada hora`);
    console.log(`   • Tendencias         — cada lunes 00:05`);
    console.log(`   • Limpieza sin tesis — cada minuto [MODO PRUEBA: 5min aviso / 10min eliminar]`);
    console.log('Buscando uploads en:', path.join(__dirname, 'uploads'));
});

module.exports = app;