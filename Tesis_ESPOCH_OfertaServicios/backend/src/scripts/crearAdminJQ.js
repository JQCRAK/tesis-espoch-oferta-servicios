// scripts/crearAdminJQ.js
// ⚠️  Script personal — NO subir a producción ESPOCH
// Uso: node src/scripts/crearAdminJQ.js

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
    rol:       { type: String, default: 'admin' },
    codigoRecuperacion: {
        codigo:    { type: String, default: '' },
        expiresAt: { type: Date,   default: null },
        intentos:  { type: Number, default: 0 },
    },
    intentosFallidos: {
        contador:       { type: Number, default: 0 },
        bloqueadoHasta: { type: Date,   default: null },
        ultimoIntento:  { type: Date,   default: null },
    },
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);

async function crearAdminJQ() {
    console.log('🔌 Conectando a:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('JQ_Admin!2026!.', salt);

    const resultado = await Admin.findOneAndUpdate(
        { email: 'jhostin.quispe@espoch.edu.ec' },
        {
            nombre:    'Jhostin David',
            apellidos: 'Quispe Tubon',
            email:     'jhostin.quispe@espoch.edu.ec',
            password:  hash,
            cargo:     'Super Admin',
            rol:       'admin',
        },
        { upsert: true, new: true }
    );

    console.log(`✅ Admin creado/actualizado: ${resultado.nombre} ${resultado.apellidos} <${resultado.email}> — ${resultado.cargo}`);

    await mongoose.disconnect();
    console.log('✔️  Desconectado. Proceso finalizado.');
}

crearAdminJQ().catch(console.error);