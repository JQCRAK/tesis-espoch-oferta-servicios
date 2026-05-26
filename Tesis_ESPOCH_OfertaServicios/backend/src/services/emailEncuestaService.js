// backend/src/services/emailEncuestaService.js
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'Portal Graduados ESPOCH <onboarding@resend.dev>';

const enviarNotificacionEncuesta = async ({ emailPersonal, nombres, tituloEncuesta, fechaCierre }) => {
  console.log(`\n📧 [EmailEncuesta] Enviando a: ${emailPersonal}`);

  const fechaLimite = fechaCierre
    ? new Date(fechaCierre).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'próximamente';

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <tr><td style="background:#BE1E2D;padding:28px 36px;text-align:center;">
          <h1 style="margin:0;color:white;font-size:1.4rem;font-weight:800;">📋 Nueva Encuesta Disponible</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:0.85rem;">Portal de Graduados · Carrera de Software · ESPOCH</p>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          <p style="margin:0 0 8px;font-size:1rem;color:#2c3e50;font-weight:600;">Hola, ${nombres} 👋</p>
          <p style="margin:0 0 24px;font-size:0.88rem;color:#6c757d;line-height:1.6;">
            La <strong>Carrera de Software de la ESPOCH</strong> ha publicado una nueva encuesta de seguimiento a graduados.
          </p>
          <div style="background:#fff8e1;border:2px solid #f57f17;border-radius:12px;padding:22px 24px;margin-bottom:24px;">
            <p style="margin:0 0 6px;font-size:0.72rem;font-weight:700;color:#f57f17;letter-spacing:0.8px;text-transform:uppercase;">Encuesta pendiente</p>
            <p style="margin:0 0 12px;font-size:1rem;font-weight:700;color:#2c3e50;">${tituloEncuesta}</p>
            <p style="margin:0;font-size:0.8rem;color:#e65100;">📅 Fecha límite: <strong>${fechaLimite}</strong></p>
          </div>
          <div style="background:#e8f5e9;border:1px solid #81c784;border-radius:8px;padding:14px 18px;">
            <p style="margin:0;font-size:0.8rem;color:#2e7d32;line-height:1.6;">
              🔒 <strong>Confidencialidad:</strong> Tus respuestas serán tratadas de forma anónima y únicamente con fines académicos.
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
      subject: `📋 Nueva encuesta disponible: ${tituloEncuesta} — Portal Graduados ESPOCH`,
      html,
    });
    if (error) throw new Error(error.message);
    console.log('✅ [EmailEncuesta] ENVIADO:', data.id);
    return { exito: true, messageId: data.id };
  } catch (err) {
    console.error('❌ [EmailEncuesta] ERROR:', err.message);
    return { exito: false, error: err.message };
  }
};

module.exports = { enviarNotificacionEncuesta };