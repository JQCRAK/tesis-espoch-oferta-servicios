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
    // res.setHeader('Content-Security-Policy', ...   ← comentado
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

// ── NUEVO: rutas de tendencia semanal ──
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
   Se ejecuta cada lunes a las 00:05 (America/Guayaquil).
   Actualiza la tendencia activa según el catálogo rotatorio.
   Si el admin fijó una tendencia manual, la respeta.
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en modo ${process.env.NODE_ENV} en el puerto ${PORT}`);
    console.log(`🔗 Url local: http://localhost:4000`);
    console.log(`⏰ Cron activo — eventos cada hora | tendencias cada lunes 00:05 (America/Guayaquil)`);
    console.log('Buscando uploads en:', path.join(__dirname, 'uploads'));
});

module.exports = app;