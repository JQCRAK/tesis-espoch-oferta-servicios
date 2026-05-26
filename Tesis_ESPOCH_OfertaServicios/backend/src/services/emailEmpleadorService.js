// backend/src/services/emailEmpleadorService.js
// 📧 Servicio para notificar a empleadores con link único tokenizado

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

/**
 * Enviar notificación de encuesta a un empleador con link único
 * @param {string} emailOrganizacion - Email de destino
 * @param {string} nombreEmpresa     - Nombre de la empresa
 * @param {string} tituloEncuesta    - Título de la encuesta
 * @param {Date}   fechaCierre       - Fecha límite
 * @param {string} linkEncuesta      - URL única con token
 */
const enviarNotificacionEmpleador = async ({
    emailOrganizacion,
    nombreEmpresa,
    tituloEncuesta,
    fechaCierre,
    linkEncuesta,
}) => {
    console.log('\n[EmailEmpleador] Enviando notificación...');
    console.log(`  📧 Email: ${emailOrganizacion}`);
    console.log(`  🏢 Empresa: ${nombreEmpresa}`);
    console.log(`  🔗 Link: ${linkEncuesta}`);

    if (!emailOrganizacion || !emailOrganizacion.includes('@')) {
        return { exito: false, error: `Email inválido: ${emailOrganizacion}` };
    }

    const from = process.env.EMAIL_FROM
        || `"Portal Graduados ESPOCH" <${process.env.EMAIL_USER}>`;

    const fechaLimite = fechaCierre
        ? new Date(fechaCierre).toLocaleDateString('es-EC', {
            day: 'numeric', month: 'long', year: 'numeric',
          })
        : 'próximamente';

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Encuesta para Empleadores - ESPOCH</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

          <!-- Cabecera -->
          <tr>
            <td style="background:#BE1E2D;padding:28px 36px;text-align:center;">
              <h1 style="margin:0;color:white;font-size:1.4rem;font-weight:800;letter-spacing:0.5px;">
                💼 Encuesta a Empleadores
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:0.85rem;">
                Carrera de Software · ESPOCH
              </p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 8px;font-size:1rem;color:#2c3e50;font-weight:600;">
                Estimado/a representante de <strong>${nombreEmpresa}</strong> 👋
              </p>
              <p style="margin:0 0 24px;font-size:0.88rem;color:#6c757d;line-height:1.6;">
                La <strong>Carrera de Software de la ESPOCH</strong> le solicita amablemente
                completar la siguiente encuesta sobre el desempeño profesional de nuestros graduados
                en su organización. Su opinión es fundamental para mejorar nuestra oferta académica.
              </p>

              <!-- Tarjeta encuesta -->
              <div style="background:#fff8e1;border:2px solid #f57f17;border-radius:12px;
                          padding:22px 24px;margin-bottom:24px;">
                <p style="margin:0 0 6px;font-size:0.72rem;font-weight:700;color:#f57f17;
                           letter-spacing:0.8px;text-transform:uppercase;">
                  Encuesta pendiente
                </p>
                <p style="margin:0 0 12px;font-size:1rem;font-weight:700;color:#2c3e50;
                           line-height:1.4;">
                  ${tituloEncuesta}
                </p>
                <p style="margin:0;font-size:0.8rem;color:#e65100;">
                  📅 Fecha límite: <strong>${fechaLimite}</strong>
                </p>
              </div>

              <!-- Botón -->
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${linkEncuesta}"
                   style="display:inline-block;padding:14px 32px;background:#BE1E2D;
                          color:white;text-decoration:none;border-radius:8px;
                          font-weight:700;font-size:0.95rem;letter-spacing:0.3px;">
                  ✍️ Responder encuesta
                </a>
              </div>

              <!-- Aviso token -->
              <div style="background:#e3f2fd;border:1px solid #90caf9;border-radius:8px;
                          padding:12px 16px;margin-bottom:16px;">
                <p style="margin:0;font-size:0.78rem;color:#1565c0;line-height:1.5;">
                  🔑 <strong>Enlace personalizado:</strong> Este link es único para su organización.
                  Solo puede ser utilizado una vez. Si tiene problemas para acceder,
                  comuníquese con nosotros.
                </p>
              </div>

              <!-- Confidencialidad -->
              <div style="background:#f3e5f5;border:1px solid #ce93d8;border-radius:8px;
                          padding:12px 14px;margin-bottom:14px;">
                <p style="margin:0;font-size:0.75rem;color:#6a1b9a;line-height:1.4;">
                  🔒 <strong>Confidencialidad:</strong> La información proporcionada será tratada
                  de manera confidencial y únicamente con fines de investigación académica.
                </p>
              </div>

              <p style="margin:0;font-size:0.78rem;color:#adb5bd;text-align:center;line-height:1.6;">
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

    try {
        const trans = getTransporter();
        const info = await trans.sendMail({
            from,
            to:      emailOrganizacion,
            subject: `💼 Encuesta de empleadores: ${tituloEncuesta} — ESPOCH`,
            html,
        });
        console.log('✅ [EmailEmpleador] ENVIADO:', info.messageId);
        return { exito: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ [EmailEmpleador] ERROR:', error.message);
        return { exito: false, error: error.message };
    }
};

module.exports = { enviarNotificacionEmpleador };