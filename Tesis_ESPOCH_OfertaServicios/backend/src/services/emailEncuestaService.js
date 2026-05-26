// backend/src/services/emailEncuestaService.js
// 📧 Servicio para notificar a graduados sobre encuestas activas

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
 * Enviar notificación de encuesta activa a un graduado
 * @param {string} emailPersonal  - Email de destino
 * @param {string} nombres        - Nombre del graduado
 * @param {string} tituloEncuesta - Título de la encuesta
 * @param {Date}   fechaCierre    - Fecha límite de la encuesta
 */
const enviarNotificacionEncuesta = async ({ emailPersonal, nombres, tituloEncuesta, fechaCierre }) => {
    console.log('\n[EmailEncuesta] Enviando notificación de encuesta...');
    console.log(`  📧 Email: ${emailPersonal}`);
    console.log(`  📋 Encuesta: ${tituloEncuesta}`);

    if (!emailPersonal || !emailPersonal.includes('@')) {
        throw new Error(`Email inválido: ${emailPersonal}`);
    }

    const from = process.env.EMAIL_FROM
        || `"Portal Graduados ESPOCH" <${process.env.EMAIL_USER}>`;

    const fechaLimite = fechaCierre
        ? new Date(fechaCierre).toLocaleDateString('es-EC', {
            day: 'numeric', month: 'long', year: 'numeric'
          })
        : 'próximamente';

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Encuesta Disponible - Portal de Graduados ESPOCH</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

          <!-- Cabecera roja ESPOCH -->
          <tr>
            <td style="background:#BE1E2D;padding:28px 36px;text-align:center;">
              <h1 style="margin:0;color:white;font-size:1.4rem;font-weight:800;letter-spacing:0.5px;">
                📋 Nueva Encuesta Disponible
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
                Hola, ${nombres} 👋
              </p>
              <p style="margin:0 0 24px;font-size:0.88rem;color:#6c757d;line-height:1.6;">
                La <strong>Carrera de Software de la ESPOCH</strong> ha publicado una nueva encuesta
                de seguimiento a graduados. Tu participación es fundamental para mejorar la
                formación académica y el proceso de acreditación institucional.
              </p>

              <!-- TARJETA DE ENCUESTA -->
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

              

              <!-- Por qué es importante -->
              <div style="background:#e8f5e9;border:1px solid #81c784;border-radius:8px;
                          padding:14px 18px;margin-bottom:24px;">
                <p style="margin:0;font-size:0.8rem;color:#2e7d32;line-height:1.6;">
                  <strong>¿Por qué es importante tu participación?</strong><br/>
                  Los datos recopilados en esta encuesta contribuyen al proceso de seguimiento
                  a graduados exigido por el CEAACES/CACES y apoyan la mejora continua del
                  programa académico.
                </p>
              </div>

              <!-- Aviso de confidencialidad -->
              <div style="background:#f3e5f5;border:1px solid #ce93d8;border-radius:8px;
                          padding:12px 14px;margin-bottom:14px;">
                <p style="margin:0;font-size:0.75rem;color:#6a1b9a;line-height:1.4;">
                  🔒 <strong>Confidencialidad:</strong> Tus respuestas serán tratadas de forma
                  anónima y únicamente con fines académicos e institucionales.
                </p>
              </div>

              <p style="margin:0;font-size:0.78rem;color:#adb5bd;text-align:center;line-height:1.6;">
                No respondas a este correo — es enviado automáticamente desde el sistema.<br/>
                Si tienes dudas, escríbenos a
                <a href="mailto:carrera.software@espoch.edu.ec"
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
            to:      emailPersonal,
            subject: `📋 Nueva encuesta disponible: ${tituloEncuesta} — Portal Graduados ESPOCH`,
            html,
        });

        console.log('✅ [EmailEncuesta] NOTIFICACIÓN ENVIADA');
        console.log(`   📬 ID: ${info.messageId}`);

        return { exito: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ [EmailEncuesta] ERROR AL ENVIAR');
        console.error(`   Mensaje: ${error.message}`);
        // No lanzamos — el caller decide si esto es fatal o no
        return { exito: false, error: error.message };
    }
};

module.exports = { enviarNotificacionEncuesta };