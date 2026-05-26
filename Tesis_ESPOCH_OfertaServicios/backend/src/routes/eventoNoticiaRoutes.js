// backend/src/routes/eventoNoticiaRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/eventoNoticiaController');
const { protegerRuta, soloRol }          = require('../middleware/auth');
const { uploadEventos, uploadNoticias }  = require('../middleware/upload');

const guard = [protegerRuta, soloRol('admin')];

/* ── Eventos ────────────────────────────────────────────── */
router.get   ('/eventos',     ctrl.getEventos);                                    // público
router.post  ('/eventos',     ...guard, uploadEventos.single('imagen'),  ctrl.crearEvento);
router.put   ('/eventos/:id', ...guard, uploadEventos.single('imagen'),  ctrl.actualizarEvento);
router.delete('/eventos/:id', ...guard, ctrl.eliminarEvento);
router.post('/eventos/:id/notificar', ...guard, ctrl.notificarEvento);

/* ── Noticias ───────────────────────────────────────────── */
router.get   ('/noticias',     ctrl.getNoticias);                                  // público
router.post  ('/noticias',     ...guard, uploadNoticias.single('imagen'), ctrl.crearNoticia);
router.put   ('/noticias/:id', ...guard, uploadNoticias.single('imagen'), ctrl.actualizarNoticia);
router.delete('/noticias/:id', ...guard, ctrl.eliminarNoticia);

module.exports = router;