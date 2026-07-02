// backend/src/services/emailRecuperacionService.js
const { Resend } = require('resend');
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || 'Portal Graduados ESPOCH <onboarding@resend.dev>';

const enviarCodigoRecuperacion = async ({ emailPersonal, codigo, nombres }) => {
  console.log(`\n📧 [EmailRecuperacion] Enviando a: ${emailPersonal}`);

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <tr><td style="background:#BE1E2D;padding:28px 36px;text-align:center;">
          <h1 style="margin:0;color:white;font-size:1.5rem;font-weight:800;">🔐 Recuperación de Contraseña</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:0.85rem;">Portal de Graduados · ESPOCH</p>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          <p style="margin:0 0 8px;font-size:1rem;color:#2c3e50;font-weight:600;">Hola, ${nombres} 👋</p>
          <p style="margin:0 0 24px;font-size:0.88rem;color:#6c757d;line-height:1.6;">
            Usa el siguiente código para restablecer tu contraseña en el <strong>Portal de Graduados de la ESPOCH</strong>.
          </p>
          <div style="background:#fff3e0;border:2px solid #e65100;border-radius:12px;padding:28px 24px;margin-bottom:24px;text-align:center;">
            <p style="margin:0 0 10px;font-size:0.75rem;font-weight:700;color:#e65100;letter-spacing:0.8px;text-transform:uppercase;">Tu código de recuperación</p>
            <p style="margin:0;font-size:2.2rem;font-weight:900;color:#e65100;letter-spacing:8px;font-family:monospace;">${codigo}</p>
            <p style="margin:10px 0 0;font-size:0.72rem;color:#e65100;">Este código expira en 15 minutos</p>
          </div>
          <div style="background:#ffebee;border:1px solid #ffcdd2;border-radius:8px;padding:12px 14px;">
            <p style="margin:0;font-size:0.75rem;color:#c62828;line-height:1.4;">
              🔒 <strong>Por tu seguridad:</strong> Si no solicitaste esto, ignora este correo. Nunca compartas este código.
            </p>
          </div>
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
      subject: '🔐 Código de Recuperación de Contraseña - Portal de Graduados ESPOCH',
      html,
    });
    if (error) throw new Error(error.message);
    console.log('✅ [EmailRecuperacion] ENVIADO:', data.id);
    return { exito: true, messageId: data.id };
  } catch (err) {
    console.error('❌ [EmailRecuperacion] ERROR:', err.message);
    throw new Error(`No se pudo enviar el código de recuperación a ${emailPersonal}: ${err.message}`);
  }
};

module.exports = { enviarCodigoRecuperacion };