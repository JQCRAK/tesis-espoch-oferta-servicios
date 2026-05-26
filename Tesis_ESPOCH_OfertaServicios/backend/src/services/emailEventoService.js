// backend/src/services/emailEventoService.js
// 📧 Servicio unificado para notificar eventos a graduados y empleadores

const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;
    transporter = nodemailer.createTransport({
        host:   process.env.EMAIL_HOST   || 'smtp.office365.com',
        port:   parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER || '',
            pass: process.env.EMAIL_PASS || '',
        },
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false,
        },
    });
    return transporter;
};

/* ── Helper: formatear modalidad + lugar/URL ───────────────── */
const formatearUbicacion = (modalidad, lugar, urlAcceso) => {
    if (modalidad === 'virtual')    return `🖥️ Virtual — ${urlAcceso || 'Enlace por confirmar'}`;
    if (modalidad === 'presencial') return `📍 Presencial — ${lugar || 'Lugar por confirmar'}`;
    if (modalidad === 'hibrida')    return `🔀 Híbrida — ${lugar || ''}${lugar && urlAcceso ? ' · ' : ''}${urlAcceso || ''}`;
    return lugar || urlAcceso || '—';
};

/* ── Helper: formatear fecha ───────────────────────────────── */
const formatearFecha = (fecha) =>
    fecha
        ? new Date(fecha).toLocaleDateString('es-EC', {
              weekday: 'long', day: 'numeric', month: 'long',
              year: 'numeric', hour: '2-digit', minute: '2-digit',
          })
        : 'Por confirmar';

/* ── HTML del correo ───────────────────────────────────────── */
const generarHtml = ({ destinatario, tituloEvento, fechaInicio, ubicacion }) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a Evento - Portal de Graduados ESPOCH</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:white;border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.10);">

          <!-- Cabecera roja ESPOCH -->
          <tr>
            <td style="background:#BE1E2D;padding:28px 36px;text-align:center;">
              <h1 style="margin:0;color:white;font-size:1.4rem;font-weight:800;letter-spacing:0.5px;">
                🎓 Invitación a Evento Institucional
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:0.85rem;">
                Portal de Graduados · Carrera de Software · ESPOCH
              </p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 8px;font-size:1rem;color:#2c3e50;font-weight:600;">
                Hola, ${destinatario} 👋
              </p>
              <p style="margin:0 0 24px;font-size:0.88rem;color:#6c757d;line-height:1.6;">
                La <strong>Carrera de Software de la ESPOCH</strong> te invita a participar
                en el siguiente evento institucional. Tu asistencia es importante para
                fortalecer el vínculo entre la institución, los graduados y el sector productivo.
              </p>

              <!-- Tarjeta del evento -->
              <div style="background:#fff8e1;border:2px solid #f57f17;border-radius:12px;
                          padding:22px 24px;margin-bottom:24px;">
                <p style="margin:0 0 6px;font-size:0.72rem;font-weight:700;color:#f57f17;
                           letter-spacing:0.8px;text-transform:uppercase;">
                  Evento programado
                </p>
                <p style="margin:0 0 16px;font-size:1.05rem;font-weight:700;color:#2c3e50;
                           line-height:1.4;">
                  ${tituloEvento}
                </p>

                <!-- Fecha -->
                <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
                  <div style="background:#BE1E2D;border-radius:6px;padding:8px 12px;
                               min-width:36px;text-align:center;flex-shrink:0;">
                    <span style="font-size:1.1rem;">📅</span>
                  </div>
                  <div>
                    <p style="margin:0 0 2px;font-size:0.7rem;font-weight:700;color:#adb5bd;
                               text-transform:uppercase;letter-spacing:0.5px;">Fecha y hora</p>
                    <p style="margin:0;font-size:0.85rem;font-weight:600;color:#2c3e50;">
                      ${fechaInicio}
                    </p>
                  </div>
                </div>

                <!-- Ubicación -->
                <div style="display:flex;align-items:flex-start;gap:10px;">
                  <div style="background:#1565c0;border-radius:6px;padding:8px 12px;
                               min-width:36px;text-align:center;flex-shrink:0;">
                    <span style="font-size:1.1rem;">📌</span>
                  </div>
                  <div>
                    <p style="margin:0 0 2px;font-size:0.7rem;font-weight:700;color:#adb5bd;
                               text-transform:uppercase;letter-spacing:0.5px;">Modalidad / Lugar</p>
                    <p style="margin:0;font-size:0.85rem;font-weight:600;color:#2c3e50;">
                      ${ubicacion}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Por qué asistir -->
              <div style="background:#e8f5e9;border:1px solid #81c784;border-radius:8px;
                          padding:14px 18px;margin-bottom:24px;">
                <p style="margin:0;font-size:0.8rem;color:#2e7d32;line-height:1.6;">
                  <strong>¿Por qué participar?</strong><br/>
                  Estos eventos fortalecen la red profesional entre graduados, docentes y empresas,
                  y contribuyen al proceso de seguimiento institucional y mejora continua
                  de la Carrera de Software.
                </p>
              </div>

              <p style="margin:0;font-size:0.78rem;color:#adb5bd;text-align:center;line-height:1.6;">
                Este correo es enviado automáticamente desde el sistema. No responder.<br/>
                Consultas: <a href="mailto:carrera.software@espoch.edu.ec"
                   style="color:#BE1E2D;">carrera.software@espoch.edu.ec</a>
              </p>
            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td style="background:#f8f9fa;padding:16px 36px;text-align:center;
                       border-top:1px solid #e9ecef;">
              <p style="margin:0;font-size:0.7rem;color:#adb5bd;">
                © ${new Date().getFullYear()} Carrera de Software · ESPOCH · Riobamba, Ecuador
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/* ══════════════════════════════════════════════════════════════
   ENVIAR A GRADUADO
   @param {string} emailPersonal  - Email del graduado
   @param {string} nombres        - Nombre del graduado
   @param {string} tituloEvento   - Título del evento
   @param {Date}   fechaInicio    - Fecha y hora de inicio
   @param {string} modalidad      - virtual | presencial | hibrida
   @param {string} lugar          - Lugar físico (si aplica)
   @param {string} urlAcceso      - URL (si aplica)
══════════════════════════════════════════════════════════════ */
const enviarNotificacionEventoGraduado = async ({
    emailPersonal,
    nombres,
    tituloEvento,
    fechaInicio,
    modalidad,
    lugar,
    urlAcceso,
}) => {
    console.log('\n[EmailEvento·Graduado] Enviando notificación...');
    console.log(`  📧 Email: ${emailPersonal}`);
    console.log(`  🎓 Destinatario: ${nombres}`);
    console.log(`  📅 Evento: ${tituloEvento}`);

    if (!emailPersonal || !emailPersonal.includes('@')) {
        return { exito: false, error: `Email inválido: ${emailPersonal}` };
    }

    const from = process.env.EMAIL_FROM
        || `"Portal Graduados ESPOCH" <${process.env.EMAIL_USER}>`;

    try {
        const trans = getTransporter();
        const info  = await trans.sendMail({
            from,
            to:      emailPersonal,
            subject: `🎓 Invitación: ${tituloEvento} — Portal Graduados ESPOCH`,
            html:    generarHtml({
                destinatario: nombres?.split(' ')[0] || nombres,
                tituloEvento,
                fechaInicio:  formatearFecha(fechaInicio),
                ubicacion:    formatearUbicacion(modalidad, lugar, urlAcceso),
            }),
        });
        console.log(`✅ [EmailEvento·Graduado] Enviado — ID: ${info.messageId}`);
        return { exito: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ [EmailEvento·Graduado] ERROR: ${error.message}`);
        return { exito: false, error: error.message };
    }
};

/* ══════════════════════════════════════════════════════════════
   ENVIAR A EMPLEADOR
   @param {string} emailOrganizacion - Email de la empresa
   @param {string} nombreEmpresa     - Nombre de la empresa
   @param {string} tituloEvento      - Título del evento
   @param {Date}   fechaInicio       - Fecha y hora de inicio
   @param {string} modalidad         - virtual | presencial | hibrida
   @param {string} lugar             - Lugar físico (si aplica)
   @param {string} urlAcceso         - URL (si aplica)
══════════════════════════════════════════════════════════════ */
const enviarNotificacionEventoEmpleador = async ({
    emailOrganizacion,
    nombreEmpresa,
    tituloEvento,
    fechaInicio,
    modalidad,
    lugar,
    urlAcceso,
}) => {
    console.log('\n[EmailEvento·Empleador] Enviando notificación...');
    console.log(`  📧 Email: ${emailOrganizacion}`);
    console.log(`  🏢 Empresa: ${nombreEmpresa}`);
    console.log(`  📅 Evento: ${tituloEvento}`);

    if (!emailOrganizacion || !emailOrganizacion.includes('@')) {
        return { exito: false, error: `Email inválido: ${emailOrganizacion}` };
    }

    const from = process.env.EMAIL_FROM
        || `"Portal Graduados ESPOCH" <${process.env.EMAIL_USER}>`;

    try {
        const trans = getTransporter();
        const info  = await trans.sendMail({
            from,
            to:      emailOrganizacion,
            subject: `🏢 Invitación a evento: ${tituloEvento} — ESPOCH`,
            html:    generarHtml({
                destinatario: `representante de ${nombreEmpresa}`,
                tituloEvento,
                fechaInicio:  formatearFecha(fechaInicio),
                ubicacion:    formatearUbicacion(modalidad, lugar, urlAcceso),
            }),
        });
        console.log(`✅ [EmailEvento·Empleador] Enviado — ID: ${info.messageId}`);
        return { exito: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ [EmailEvento·Empleador] ERROR: ${error.message}`);
        return { exito: false, error: error.message };
    }
};

module.exports = {
    enviarNotificacionEventoGraduado,
    enviarNotificacionEventoEmpleador,
};