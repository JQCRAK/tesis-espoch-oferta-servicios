// backend/src/services/emailVerificacionService.js
// 📧 Servicio para enviar códigos de verificación de email

const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;

    transporter = nodemailer.createTransport({
    host:   'smtp.resend.com',
    port:   465,
    secure: true,
    auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY || '',
    },
});

    return transporter;
};

/**
 * Enviar código de verificación de 6 dígitos
 * @param {string} emailInstitucional - Email de destino (@espoch.edu.ec)
 * @param {string} codigo - Código de 6 dígitos
 * @param {string} nombres - Nombre del graduado
 */
const enviarCodigoVerificacion = async ({ emailInstitucional, codigo, nombres }) => {
    console.log('\n[EmailVerificacion] Enviando código de verificación...');
    console.log(`  📧 Email: ${emailInstitucional}`);
    console.log(`  🔐 Código: ${codigo}`);

    if (!emailInstitucional || !emailInstitucional.includes('@')) {
        throw new Error(`Email inválido: ${emailInstitucional}`);
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
  <title>Código de Verificación - Portal de Graduados ESPOCH</title>
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
                🎓 Verificación de Acceso
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
                Recibimos una solicitud para verificar tu cuenta en el <strong>Portal de Graduados de la ESPOCH</strong>. 
                Utiliza el código que se muestra abajo para completar la verificación.
              </p>

              <!-- CÓDIGO DE VERIFICACIÓN (GRANDE Y DESTACADO) -->
              <div style="background:#f0f7ff;border:2px solid #1565c0;border-radius:12px;padding:28px 24px;margin-bottom:24px;text-align:center;">
                <p style="margin:0 0 10px;font-size:0.75rem;font-weight:700;color:#1565c0;letter-spacing:0.8px;text-transform:uppercase;">
                  Tu código de verificación
                </p>
                <p style="margin:0;font-size:2.2rem;font-weight:900;color:#1565c0;letter-spacing:8px;font-family:monospace;">
                  ${codigo}
                </p>
                <p style="margin:10px 0 0;font-size:0.72rem;color:#1565c0;">
                  Este código expira en 15 minutos
                </p>
              </div>

              <!-- Instrucciones -->
              <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
                <p style="margin:0;font-size:0.8rem;color:#6d4c00;line-height:1.5;">
                  <strong>Instrucciones:</strong><br/>
                  1. Copia el código de 6 dígitos arriba<br/>
                  2. Regresa a la pantalla de verificación<br/>
                  3. Ingresa el código en el campo correspondiente<br/>
                  4. ¡Acceso completado!
                </p>
              </div>

              <!-- Aviso de seguridad -->
              <div style="background:#ffebee;border:1px solid #ffcdd2;border-radius:8px;padding:12px 14px;margin-bottom:14px;">
                <p style="margin:0;font-size:0.75rem;color:#c62828;line-height:1.4;">
                  🔒 <strong>Por seguridad:</strong> Nunca compartas este código con nadie. 
                  El personal de ESPOCH nunca te pedirá este código por correo o teléfono.
                </p>
              </div>

              <p style="margin:0;font-size:0.78rem;color:#adb5bd;text-align:center;line-height:1.6;">
                Si no solicitaste este código, puedes ignorar este correo con seguridad.<br/>
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
            to:      emailInstitucional,
            subject: '🔐 Código de Verificación - Portal de Graduados ESPOCH',
            html,
        });

        console.log('✅ [EmailVerificacion] CÓDIGO ENVIADO EXITOSAMENTE');
        console.log(`   📬 ID: ${info.messageId}`);
        console.log('');

        return {
            exito: true,
            messageId: info.messageId,
        };

    } catch (error) {
        console.error('❌ [EmailVerificacion] ERROR AL ENVIAR CÓDIGO');
        console.error(`   Mensaje: ${error.message}`);
        
        throw new Error(
            `No se pudo enviar el código de verificación a ${emailInstitucional}: ${error.message}`
        );
    }
};

module.exports = {
    enviarCodigoVerificacion,
};