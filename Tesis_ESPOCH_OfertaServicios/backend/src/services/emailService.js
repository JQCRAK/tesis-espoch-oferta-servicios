// backend/src/services/emailService.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || 'Portal Graduados ESPOCH <onboarding@resend.dev>';

const enviarCredenciales = async ({ nombres, apellidos, emailPersonal, password }) => {
  console.log(`\n📧 [EmailService] Enviando credenciales a: ${emailPersonal}`);

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <tr><td style="background:#BE1E2D;padding:28px 36px;text-align:center;">
          <h1 style="margin:0;color:white;font-size:1.5rem;font-weight:800;">🎓 Portal de Graduados</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:0.85rem;">Carrera de Software · ESPOCH</p>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          <p style="margin:0 0 8px;font-size:1rem;color:#2c3e50;font-weight:600;">Hola, ${nombres} ${apellidos} 👋</p>
          <p style="margin:0 0 24px;font-size:0.88rem;color:#6c757d;line-height:1.6;">
            Tu cuenta ha sido creada en el <strong>Portal de Graduados de la Carrera de Software de la ESPOCH</strong>.
            A continuación están tus credenciales de acceso:
          </p>
          <div style="background:#f8f9fa;border:1px solid #e9ecef;border-left:4px solid #BE1E2D;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0 0 12px;font-size:0.75rem;font-weight:700;color:#adb5bd;letter-spacing:0.8px;text-transform:uppercase;">Tus credenciales</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;width:120px;"><span style="font-size:0.78rem;color:#6c757d;font-weight:600;">Correo:</span></td>
                <td><span style="font-size:0.9rem;color:#2c3e50;font-weight:700;">${emailPersonal}</span></td>
              </tr>
              <tr>
                <td style="padding:6px 0;"><span style="font-size:0.78rem;color:#6c757d;font-weight:600;">Contraseña:</span></td>
                <td><span style="font-size:1.1rem;color:#BE1E2D;font-weight:800;font-family:monospace;letter-spacing:1px;">${password}</span></td>
              </tr>
            </table>
          </div>
          <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
            <p style="margin:0;font-size:0.8rem;color:#6d4c00;line-height:1.5;">
              ⚠️ <strong>Importante:</strong> Esta es una contraseña temporal. Te recomendamos cambiarla desde tu perfil.
            </p>
          </div>
          <p style="margin:0;font-size:0.78rem;color:#adb5bd;text-align:center;">No respondas a este correo — es enviado automáticamente.</p>
        </td></tr>
        <tr><td style="background:#f8f9fa;padding:16px 36px;text-align:center;border-top:1px solid #e9ecef;">
          <p style="margin:0;font-size:0.7rem;color:#adb5bd;">© ${new Date().getFullYear()} Carrera de Software · ESPOCH · Riobamba, Ecuador</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const { data, error } = await resend.emails.send({
      from:    FROM,
      to:      emailPersonal,
      subject: '🎓 Bienvenido al Portal de Graduados ESPOCH — Tus credenciales de acceso',
      html,
    });

    if (error) throw new Error(error.message);

    console.log('✅ [EmailService] ENVIADO:', data.id);
    return { exito: true, messageId: data.id };

  } catch (err) {
    console.error('❌ [EmailService] ERROR:', err.message);
    throw new Error(`No se pudo enviar credenciales a ${emailPersonal}: ${err.message}`);
  }
};

const verificarConexion = async () => {
  console.log('[EmailService] Resend no requiere verificación SMTP');
  return true;
};

module.exports = { enviarCredenciales, verificarConexion };