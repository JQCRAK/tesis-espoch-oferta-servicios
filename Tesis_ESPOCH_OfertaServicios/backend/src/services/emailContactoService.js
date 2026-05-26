// backend/src/services/emailContactoService.js
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'Portal Graduados ESPOCH <onboarding@resend.dev>';

const layout = (contenido) => `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <tr><td style="background:#BE1E2D;padding:24px 36px;text-align:center;">
          <h1 style="margin:0;color:white;font-size:1.3rem;font-weight:800;">🎓 Portal de Graduados</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:0.82rem;">Carrera de Software · ESPOCH</p>
        </td></tr>
        <tr><td style="padding:28px 36px;">${contenido}</td></tr>
        <tr><td style="background:#f8f9fa;padding:14px 36px;text-align:center;border-top:1px solid #e9ecef;">
          <p style="margin:0;font-size:0.68rem;color:#adb5bd;">© ${new Date().getFullYear()} Carrera de Software · ESPOCH · Riobamba, Ecuador</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

const enviarAlGraduado = async ({ emailPersonal, nombresGraduado, nombreRemitente, emailRemitente, empresa, mensaje }) => {
  if (!emailPersonal) return { exito: false, razon: 'sin_email' };
  const cuerpo = `
    <p style="margin:0 0 6px;font-size:1rem;color:#2c3e50;font-weight:600;">Hola, ${nombresGraduado} 👋</p>
    <p style="margin:0 0 20px;font-size:0.87rem;color:#6c757d;">Alguien está interesado en tu perfil profesional publicado en el <strong>Portal de Graduados de la ESPOCH</strong>.</p>
    <div style="background:#f8f9fa;border:1px solid #e9ecef;border-left:4px solid #BE1E2D;border-radius:8px;padding:18px 22px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:0.72rem;font-weight:700;color:#adb5bd;text-transform:uppercase;">Datos del interesado</p>
      <p style="margin:0;font-size:0.88rem;color:#2c3e50;"><strong>${nombreRemitente}</strong> · <a href="mailto:${emailRemitente}" style="color:#BE1E2D;">${emailRemitente}</a>${empresa ? ` · ${empresa}` : ''}</p>
    </div>
    <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:16px 20px;">
      <p style="margin:0;font-size:0.87rem;color:#2c3e50;">${mensaje}</p>
    </div>`;
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to: emailPersonal, subject: '💼 Alguien está interesado en tu perfil — Portal ESPOCH', html: layout(cuerpo) });
    if (error) throw new Error(error.message);
    console.log('✅ [EmailContacto→Graduado] ENVIADO:', data.id);
    return { exito: true, messageId: data.id };
  } catch (err) {
    console.error('❌ [EmailContacto→Graduado] ERROR:', err.message);
    return { exito: false, error: err.message };
  }
};

const enviarCopiaRemitente = async ({ emailRemitente, nombreRemitente, nombresGraduado, apellidosGraduado }) => {
  const cuerpo = `
    <p style="margin:0 0 6px;font-size:1rem;color:#2c3e50;font-weight:600;">Hola, ${nombreRemitente} 👋</p>
    <p style="margin:0 0 20px;font-size:0.87rem;color:#6c757d;">Esta es una copia de tu solicitud de contacto enviada a través del <strong>Portal de Graduados de la ESPOCH</strong>.</p>
    <div style="background:#f8f9fa;border:1px solid #e9ecef;border-left:4px solid #BE1E2D;border-radius:8px;padding:18px 22px;">
      <p style="margin:0 0 6px;font-size:0.72rem;font-weight:700;color:#adb5bd;text-transform:uppercase;">Perfil contactado</p>
      <p style="margin:0;font-size:0.95rem;color:#2c3e50;font-weight:700;">${nombresGraduado} ${apellidosGraduado}</p>
    </div>`;
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to: emailRemitente, subject: '📋 Copia de tu solicitud — Portal Graduados ESPOCH', html: layout(cuerpo) });
    if (error) throw new Error(error.message);
    console.log('✅ [EmailContacto→Remitente] ENVIADO:', data.id);
    return { exito: true, messageId: data.id };
  } catch (err) {
    console.error('❌ [EmailContacto→Remitente] ERROR:', err.message);
    return { exito: false, error: err.message };
  }
};

const enviarCopiaAdmins = async ({ emailsAdmins, nombreRemitente, emailRemitente, empresa, mensaje, nombresGraduado, apellidosGraduado }) => {
  if (!emailsAdmins || emailsAdmins.length === 0) return { exito: false, razon: 'sin_admins' };
  const cuerpo = `
    <p style="margin:0 0 6px;font-size:1rem;color:#2c3e50;font-weight:600;">Nueva solicitud de contacto 📬</p>
    <div style="background:#fff1f2;border:1px solid #fecdd3;border-left:4px solid #BE1E2D;border-radius:8px;padding:16px 20px;margin-bottom:16px;">
      <p style="margin:0 0 4px;font-size:0.7rem;font-weight:700;color:#BE1E2D;text-transform:uppercase;">Graduado contactado</p>
      <p style="margin:0;font-size:0.95rem;color:#2c3e50;font-weight:700;">${nombresGraduado} ${apellidosGraduado}</p>
    </div>
    <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:8px;padding:16px 20px;margin-bottom:16px;">
      <p style="margin:0 0 8px;font-size:0.7rem;font-weight:700;color:#adb5bd;text-transform:uppercase;">Datos del interesado</p>
      <p style="margin:0;font-size:0.85rem;color:#2c3e50;"><strong>${nombreRemitente}</strong> · <a href="mailto:${emailRemitente}" style="color:#BE1E2D;">${emailRemitente}</a>${empresa ? ` · ${empresa}` : ''}</p>
    </div>
    <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:14px 18px;">
      <p style="margin:0;font-size:0.85rem;color:#2c3e50;">${mensaje}</p>
    </div>`;
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to: emailsAdmins.join(', '), subject: `🔔 Nueva solicitud de contacto — ${nombresGraduado} ${apellidosGraduado} · ESPOCH`, html: layout(cuerpo) });
    if (error) throw new Error(error.message);
    console.log('✅ [EmailContacto→Admins] ENVIADO:', data.id);
    return { exito: true, messageId: data.id };
  } catch (err) {
    console.error('❌ [EmailContacto→Admins] ERROR:', err.message);
    return { exito: false, error: err.message };
  }
};

module.exports = { enviarAlGraduado, enviarCopiaRemitente, enviarCopiaAdmins };