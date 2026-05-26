// backend/src/services/emailService.js
// ✨ VERSIÓN FUNCIONAL CON LOGS DETALLADOS - SIN BOTÓN

const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  console.log('RESEND KEY:', process.env.RESEND_API_KEY ? '[OK]' : '[VACÍA]');
  console.log('[EmailService] Inicializando transporter SMTP...');
  console.log(`  Host: ${process.env.EMAIL_HOST}`);
  console.log(`  Puerto: ${process.env.EMAIL_PORT}`);
  console.log(`  Usuario: ${process.env.EMAIL_USER}`);
  console.log(`  Contraseña: ${process.env.EMAIL_PASS ? '[CONFIGURADA]' : '[NO CONFIGURADA]'}`);


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

const enviarCredenciales = async ({ nombres, apellidos, emailPersonal, password }) => {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║ [EmailService] ENVIANDO CREDENCIALES                           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`  📧 Destinatario: ${emailPersonal}`);
  console.log(`  👤 Nombre: ${nombres} ${apellidos}`);
  console.log(`  🔑 Contraseña: ${password}`);
  console.log('');

  if (!emailPersonal || !emailPersonal.includes('@')) {
    const err = new Error(`Email inválido: ${emailPersonal}`);
    console.error('❌ [EmailService]', err.message);
    throw err;
  }

  if (!password) {
    const err = new Error('Contraseña vacía');
    console.error('❌ [EmailService]', err.message);
    throw err;
  }

  const from = process.env.EMAIL_FROM
    || `"Portal Graduados ESPOCH" <${process.env.EMAIL_USER}>`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido al Portal de Graduados ESPOCH</title>
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
                🎓 Portal de Graduados
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
                Hola, ${nombres} ${apellidos} 👋
              </p>
              <p style="margin:0 0 24px;font-size:0.88rem;color:#6c757d;line-height:1.6;">
                Tu cuenta ha sido creada en el <strong>Portal de Graduados de la Carrera de Software de la ESPOCH</strong>. 
                A continuación están tus credenciales de acceso:
              </p>

              <!-- Caja de credenciales -->
              <div style="background:#f8f9fa;border:1px solid #e9ecef;border-left:4px solid #BE1E2D;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                <p style="margin:0 0 12px;font-size:0.75rem;font-weight:700;color:#adb5bd;letter-spacing:0.8px;text-transform:uppercase;">
                  Tus credenciales
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;width:120px;">
                      <span style="font-size:0.78rem;color:#6c757d;font-weight:600;">Correo:</span>
                    </td>
                    <td>
                      <span style="font-size:0.9rem;color:#2c3e50;font-weight:700;">${emailPersonal}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;">
                      <span style="font-size:0.78rem;color:#6c757d;font-weight:600;">Contraseña:</span>
                    </td>
                    <td>
                      <span style="font-size:1.1rem;color:#BE1E2D;font-weight:800;font-family:monospace;letter-spacing:1px;">${password}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Alerta cambio de contraseña -->
              <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
                <p style="margin:0;font-size:0.8rem;color:#6d4c00;line-height:1.5;">
                  ⚠️ <strong>Importante:</strong> Esta es una contraseña temporal generada automáticamente. 
                  Te recomendamos cambiarla desde tu perfil una vez que ingreses al sistema.
                </p>
              </div>

              <p style="margin:0;font-size:0.78rem;color:#adb5bd;text-align:center;line-height:1.6;">
                Si tienes problemas para acceder, comunícate con el administrador de la carrera.<br>
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

    console.log('  ⏳ Conectando al servidor SMTP y enviando...');
    const info = await trans.sendMail({
      from,
      to: emailPersonal,
      subject: '🎓 Bienvenido al Portal de Graduados ESPOCH — Tus credenciales de acceso',
      html,
    });

    console.log('✅ [EmailService] EMAIL ENVIADO EXITOSAMENTE');
    console.log(`   📬 ID: ${info.messageId}`);
    console.log(`   📝 Response: ${info.response}`);
    console.log('');

    return {
      exito: true,
      messageId: info.messageId,
    };

  } catch (error) {
    console.error('');
    console.error('❌ [EmailService] ERROR AL ENVIAR EMAIL');
    console.error(`   Código: ${error.code}`);
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Detalles: ${JSON.stringify(error, null, 2)}`);
    console.error('');

    // Re-lanzar el error con contexto
    const errorConContexto = new Error(
      `No se pudo enviar credenciales a ${emailPersonal}: ${error.message}`
    );
    throw errorConContexto;
  }
};

const verificarConexion = async () => {
  try {
    console.log('\n[EmailService] Verificando conexión SMTP...');
    const trans = getTransporter();
    await trans.verify();
    console.log('✅ [EmailService] Conexión SMTP verificada\n');
    return true;
  } catch (error) {
    console.error('\n❌ [EmailService] Error en conexión SMTP:');
    console.error(`   ${error.message}\n`);
    return false;
  }
};

module.exports = {
  enviarCredenciales,
  verificarConexion,
};