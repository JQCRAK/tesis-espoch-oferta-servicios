// backend/src/services/emailEventoService.js
const { Resend } = require('resend');
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || 'Portal Graduados ESPOCH <onboarding@resend.dev>';

const formatearUbicacion = (modalidad, lugar, urlAcceso) => {
  if (modalidad === 'virtual')    return `🖥️ Virtual — ${urlAcceso || 'Enlace por confirmar'}`;
  if (modalidad === 'presencial') return `📍 Presencial — ${lugar || 'Lugar por confirmar'}`;
  if (modalidad === 'hibrida')    return `🔀 Híbrida — ${lugar || ''}${lugar && urlAcceso ? ' · ' : ''}${urlAcceso || ''}`;
  return lugar || urlAcceso || '—';
};

const formatearFecha = (fecha) =>
  fecha ? new Date(fecha).toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : 'Por confirmar';

const generarHtml = ({ destinatario, tituloEvento, fechaInicio, ubicacion }) => `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <tr><td style="background:#BE1E2D;padding:28px 36px;text-align:center;">
          <h1 style="margin:0;color:white;font-size:1.4rem;font-weight:800;">🎓 Invitación a Evento Institucional</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:0.85rem;">Portal de Graduados · Carrera de Software · ESPOCH</p>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          <p style="margin:0 0 8px;font-size:1rem;color:#2c3e50;font-weight:600;">Hola, ${destinatario} 👋</p>
          <p style="margin:0 0 24px;font-size:0.88rem;color:#6c757d;line-height:1.6;">
            La <strong>Carrera de Software de la ESPOCH</strong> te invita al siguiente evento institucional.
          </p>
          <div style="background:#fff8e1;border:2px solid #f57f17;border-radius:12px;padding:22px 24px;margin-bottom:24px;">
            <p style="margin:0 0 6px;font-size:0.72rem;font-weight:700;color:#f57f17;letter-spacing:0.8px;text-transform:uppercase;">Evento programado</p>
            <p style="margin:0 0 16px;font-size:1.05rem;font-weight:700;color:#2c3e50;">${tituloEvento}</p>
            <p style="margin:0 0 8px;font-size:0.85rem;color:#2c3e50;">📅 <strong>${fechaInicio}</strong></p>
            <p style="margin:0;font-size:0.85rem;color:#2c3e50;">📌 <strong>${ubicacion}</strong></p>
          </div>
        </td></tr>
        <tr><td style="background:#f8f9fa;padding:16px 36px;text-align:center;border-top:1px solid #e9ecef;">
          <p style="margin:0;font-size:0.7rem;color:#adb5bd;">© ${new Date().getFullYear()} Carrera de Software · ESPOCH · Riobamba, Ecuador</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

const enviarNotificacionEventoGraduado = async ({ emailPersonal, nombres, tituloEvento, fechaInicio, modalidad, lugar, urlAcceso }) => {
  console.log(`\n📧 [EmailEvento·Graduado] Enviando a: ${emailPersonal}`);
  try {
    const { data, error } = await resend.emails.send({
      from:    FROM,
      to:      emailPersonal,
      subject: `🎓 Invitación: ${tituloEvento} — Portal Graduados ESPOCH`,
      html:    generarHtml({ destinatario: nombres?.split(' ')[0] || nombres, tituloEvento, fechaInicio: formatearFecha(fechaInicio), ubicacion: formatearUbicacion(modalidad, lugar, urlAcceso) }),
    });
    if (error) throw new Error(error.message);
    console.log('✅ [EmailEvento·Graduado] ENVIADO:', data.id);
    return { exito: true, messageId: data.id };
  } catch (err) {
    console.error('❌ [EmailEvento·Graduado] ERROR:', err.message);
    return { exito: false, error: err.message };
  }
};

const enviarNotificacionEventoEmpleador = async ({ emailOrganizacion, nombreEmpresa, tituloEvento, fechaInicio, modalidad, lugar, urlAcceso }) => {
  console.log(`\n📧 [EmailEvento·Empleador] Enviando a: ${emailOrganizacion}`);
  try {
    const { data, error } = await resend.emails.send({
      from:    FROM,
      to:      emailOrganizacion,
      subject: `🏢 Invitación a evento: ${tituloEvento} — ESPOCH`,
      html:    generarHtml({ destinatario: `representante de ${nombreEmpresa}`, tituloEvento, fechaInicio: formatearFecha(fechaInicio), ubicacion: formatearUbicacion(modalidad, lugar, urlAcceso) }),
    });
    if (error) throw new Error(error.message);
    console.log('✅ [EmailEvento·Empleador] ENVIADO:', data.id);
    return { exito: true, messageId: data.id };
  } catch (err) {
    console.error('❌ [EmailEvento·Empleador] ERROR:', err.message);
    return { exito: false, error: err.message };
  }
};

module.exports = { enviarNotificacionEventoGraduado, enviarNotificacionEventoEmpleador };