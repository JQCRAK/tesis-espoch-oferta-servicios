// backend/src/services/emailRecuperacionService.js
// 📧 Servicio para enviar códigos de recuperación de contraseña

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
 * Enviar código de recuperación de contraseña
 * @param {string} emailPersonal - Email de destino
 * @param {string} codigo - Código de 6 dígitos
 * @param {string} nombres - Nombre del usuario
 */
const enviarCodigoRecuperacion = async ({ emailPersonal, codigo, nombres }) => {
    console.log('\n[EmailRecuperacion] Enviando código de recuperación...');
    console.log(`  📧 Email: ${emailPersonal}`);
    console.log(`  🔐 Código: ${codigo}`);

    if (!emailPersonal || !emailPersonal.includes('@')) {
        throw new Error(`Email inválido: ${emailPersonal}`);
    }

    if (!codigo || codigo.length !== 6) {
        throw new Error('El código debe tener 6 dígitos');
    }

    const from = process.env.EMAIL_FROM
        || `"Portal Graduados ESPOCH" <${process.env.EMAIL_USER}>`;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperación de Contraseña - Portal de Graduados ESPOCH</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
          
          <!-- Cabecera roja ESPOCH -->
          <tr>
            <td style="background:#BE1E2D;padding:28px 36px;text-align:center;">
              <h1 style="margin:0;color:white;font-size:1.5rem;font-weight:800;letter-spacing:0.5px;">
                🔐 Recuperación de Contraseña
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:0.85rem;">
                Portal de Graduados · ESPOCH
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
                Recibimos una solicitud para recuperar tu contraseña en el <strong>Portal de Graduados de la ESPOCH</strong>. 
                Utiliza el código que se muestra abajo para restablecerla.
              </p>

              <!-- CÓDIGO DE RECUPERACIÓN (GRANDE Y DESTACADO) -->
              <div style="background:#fff3e0;border:2px solid #e65100;border-radius:12px;padding:28px 24px;margin-bottom:24px;text-align:center;">
                <p style="margin:0 0 10px;font-size:0.75rem;font-weight:700;color:#e65100;letter-spacing:0.8px;text-transform:uppercase;">
                  Tu código de recuperación
                </p>
                <p style="margin:0;font-size:2.2rem;font-weight:900;color:#e65100;letter-spacing:8px;font-family:monospace;">
                  ${codigo}
                </p>
                <p style="margin:10px 0 0;font-size:0.72rem;color:#e65100;">
                  Este código expira en 15 minutos
                </p>
              </div>

              <!-- Instrucciones -->
              <div style="background:#e8f5e9;border:1px solid #81c784;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
                <p style="margin:0;font-size:0.8rem;color:#2e7d32;line-height:1.5;">
                  <strong>Instrucciones:</strong><br/>
                  1. Copia el código de 6 dígitos arriba<br/>
                  2. Regresa a la pantalla de recuperación<br/>
                  3. Ingresa el código y tu nueva contraseña<br/>
                  4. ¡Contraseña actualizada!
                </p>
              </div>

              <!-- Aviso de seguridad -->
              <div style="background:#ffebee;border:1px solid #ffcdd2;border-radius:8px;padding:12px 14px;margin-bottom:14px;">
                <p style="margin:0;font-size:0.75rem;color:#c62828;line-height:1.4;">
                  🔒 <strong>Por tu seguridad:</strong> Si no solicitaste recuperar tu contraseña, 
                  ignora este correo. Nunca compartas este código con nadie.
                </p>
              </div>

              <p style="margin:0;font-size:0.78rem;color:#adb5bd;text-align:center;line-height:1.6;">
                No respondas a este correo — es enviado automáticamente.
              </p>
            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td style="background:#f8f9fa;padding:16px 36px;text-align:center;border-top:1px solid #e9ecef;">
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
            subject: '🔐 Código de Recuperación de Contraseña - Portal de Graduados ESPOCH',
            html,
        });

        console.log('✅ [EmailRecuperacion] CÓDIGO ENVIADO EXITOSAMENTE');
        console.log(`   📬 ID: ${info.messageId}`);
        console.log('');

        return {
            exito: true,
            messageId: info.messageId,
        };

    } catch (error) {
        console.error('❌ [EmailRecuperacion] ERROR AL ENVIAR CÓDIGO');
        console.error(`   Mensaje: ${error.message}`);
        
        throw new Error(
            `No se pudo enviar el código de recuperación a ${emailPersonal}: ${error.message}`
        );
    }
};

module.exports = {
    enviarCodigoRecuperacion,
};