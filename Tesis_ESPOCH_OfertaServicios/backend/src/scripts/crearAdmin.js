// scripts/crearAdmin.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
    nombre:    { type: String, required: true },
    apellidos: { type: String, required: true },
    email:     { type: String, required: true, unique: true, lowercase: true },
    password:  { type: String, required: true },
    cargo:     { type: String, required: true },
    rol:       { type: String, default: 'admin' }
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);

async function crearAdmin() {
    console.log('🔌 Conectando a:', process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI);

    const admins = [
        {
            nombre:    'Cristian Oswaldo',
            apellidos: 'Guerra Flores',
            email:     'cguerra@espoch.edu.ec',
            password:  'Cguerra!2026!.',
            cargo:     'Docente'
        },
        {
            nombre:    'Julio Francisco',
            apellidos: 'Guallo Paca',
            email:     'jguallo@espoch.edu.ec',
            password:  'Jguallo!2026!.',
            cargo:     'Docente'
        }
    ];

    for (const adminData of admins) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(adminData.password, salt);

        const resultado = await Admin.findOneAndUpdate(
            { email: adminData.email },
            {
                nombre:    adminData.nombre,
                apellidos: adminData.apellidos,
                email:     adminData.email,
                password:  hash,
                cargo:     adminData.cargo,
                rol:       'admin'
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Admin creado/actualizado: ${resultado.nombre} ${resultado.apellidos} <${resultado.email}> — ${resultado.cargo}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // Inicialización de la TENDENCIA SEMANAL actual
    // Se usa la función rotarTendencia() del controlador — así no
    // duplicamos lógica ni el catálogo de categorías. Crea la tendencia
    // de la semana en curso; el cron semanal se encargará de las
    // siguientes rotaciones automáticamente.
    // ═══════════════════════════════════════════════════════════════
    try {
        const { rotarTendencia } = require('../controllers/tendenciaController');
        const tendencia = await rotarTendencia();
        if (tendencia) {
            console.log(`✅ Tendencia semanal inicializada: S${tendencia.semana}/${tendencia.anio} → "${tendencia.categoria}"`);
        } else {
            console.log('⚠️  rotarTendencia() no devolvió un documento (revisar logs del controller).');
        }
    } catch (err) {
        console.log('⚠️  No se pudo inicializar la tendencia semanal:', err.message);
    }

    await mongoose.disconnect();
    console.log('✔️  Desconectado. Proceso finalizado.');
}

crearAdmin().catch(console.error);