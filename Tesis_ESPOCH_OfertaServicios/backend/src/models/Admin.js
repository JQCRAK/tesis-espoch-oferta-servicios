const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    nombre:    { type: String, required: true, trim: true },
    apellidos: { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true },
    cargo:     { type: String, required: true, trim: true },
    rol:       { type: String, default: 'admin' }
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);