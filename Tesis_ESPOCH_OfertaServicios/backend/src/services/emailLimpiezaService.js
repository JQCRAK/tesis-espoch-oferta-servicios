// backend/src/services/emailLimpiezaService.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'Portal Graduados ESPOCH <onboarding@resend.dev>';

/**
 * Envía advertencia al graduado: su cuenta será eliminada en 30 días
 * si no verifica su tesis.
 *
 * @param {object} params
 * @param {string} params.nombres
 * @param {string} params.apellidos
 * @param {string} params.emailPersonal
 * @param {number} params.diasRestantes      - días que tiene antes de la eliminación (30)
 * @param {string} params.fechaEliminacion   - fecha legible en hora Ecuador
 *                                             ej: "lunes, 03 de junio de 2026"
 */
const enviarAdvertenciaSinTesis = async ({
    nombres,
    apellidos,
    emailPersonal,
    diasRestantes,
    fechaEliminacion,
}) => {
    console.log(`\n⚠️  [EmailLimpieza] Enviando advertencia a: ${emailPersonal}`);

    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- CABECERA -->
        <tr><td style="background:#BE1E2D;padding:28px 36px;text-align:center;">
          <h1 style="margin:0;color:white;font-size:1.5rem;font-weight:800;">🎓 Portal de Graduados</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:0.85rem;">Carrera de Software · ESPOCH</p>
        </td></tr>

        <!-- CUERPO -->
        <tr><td style="padding:32px 36px;">

          <p style="margin:0 0 8px;font-size:1rem;color:#2c3e50;font-weight:600;">
            Estimado/a ${nombres} ${apellidos},
          </p>

          <p style="margin:0 0 20px;font-size:0.88rem;color:#6c757d;line-height:1.7;">
            Hemos detectado que tu cuenta en el <strong>Portal de Graduados de la Carrera de Software
            de la ESPOCH</strong> lleva <strong>más de un año registrada</strong> sin tener la
            <strong>tesis de grado verificada</strong>.
          </p>

          <!-- ALERTA ROJA -->
          <div style="background:#ffebee;border:1px solid #ffcdd2;border-left:4px solid #c62828;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:0.8rem;font-weight:700;color:#c62828;letter-spacing:0.5px;text-transform:uppercase;">
              ⚠️ Aviso importante — Cuenta programada para eliminar
            </p>
            <p style="margin:0 0 12px;font-size:0.88rem;color:#6c757d;line-height:1.7;">
              Si no verificas tu tesis antes del:
            </p>
            <p style="margin:0 0 12px;font-size:1.1rem;font-weight:800;color:#c62828;text-align:center;padding:10px;background:#fff5f5;border-radius:6px;border:1px solid #ffcdd2;">
              📅 ${fechaEliminacion}
            </p>
            <p style="margin:0;font-size:0.88rem;color:#6c757d;line-height:1.7;">
              tu cuenta y <strong>todos tus datos</strong> serán eliminados permanentemente del sistema.
            </p>
            <p style="margin:12px 0 0;font-size:0.95rem;font-weight:700;color:#c62828;text-align:center;">
              Tienes ${diasRestantes} días para regularizar tu situación.
            </p>
          </div>

          <!-- QUÉ SE ELIMINA -->
          <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0 0 10px;font-size:0.78rem;font-weight:700;color:#adb5bd;letter-spacing:0.5px;text-transform:uppercase;">
              Datos que serán eliminados
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:4px 0;font-size:0.82rem;color:#495057;">❌ &nbsp;Información personal y de contacto</td></tr>
              <tr><td style="padding:4px 0;font-size:0.82rem;color:#495057;">❌ &nbsp;Foto de perfil</td></tr>
              <tr><td style="padding:4px 0;font-size:0.82rem;color:#495057;">❌ &nbsp;Todos tus proyectos registrados</td></tr>
              <tr><td style="padding:4px 0;font-size:0.82rem;color:#495057;">❌ &nbsp;Todos tus certificados</td></tr>
              <tr><td style="padding:4px 0;font-size:0.82rem;color:#495057;">❌ &nbsp;Tu perfil profesional completo</td></tr>
            </table>
          </div>

          <!-- QUÉ HACER -->
          <div style="background:#e8f5e9;border:1px solid #c8e6c9;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:0.78rem;font-weight:700;color:#2e7d32;letter-spacing:0.5px;text-transform:uppercase;">
              ✅ ¿Cómo evitar la eliminación?
            </p>
            <p style="margin:0;font-size:0.85rem;color:#1b5e20;line-height:1.7;">
              Comunícate con la <strong>Secretaría de la Carrera de Software de la ESPOCH</strong>
              para que el administrador del portal verifique tu tesis de grado.<br><br>
              Una vez verificada, tu cuenta queda <strong>activa de forma permanente</strong> y
              no recibirás más avisos de este tipo.
            </p>
          </div>

          <p style="margin:0;font-size:0.78rem;color:#adb5bd;text-align:center;line-height:1.6;">
            Este es un mensaje automático — No respondas a este correo.<br>
            Si crees que esto es un error, contacta directamente a la Carrera de Software de la ESPOCH.
          </p>

        </td></tr>

        <!-- PIE -->
        <tr><td style="background:#f8f9fa;padding:16px 36px;text-align:center;border-top:1px solid #e9ecef;">
          <p style="margin:0;font-size:0.7rem;color:#adb5bd;">
            © ${new Date().getFullYear()} Carrera de Software · ESPOCH · Riobamba, Ecuador
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;

    try {
        const { data, error } = await resend.emails.send({
            from:    FROM,
            to:      emailPersonal,
            subject: `⚠️ Aviso: tu cuenta será eliminada el ${fechaEliminacion} — Portal Graduados ESPOCH`,
            html,
        });

        if (error) throw new Error(error.message);

        console.log(`✅ [EmailLimpieza] Advertencia enviada a ${emailPersonal} — ID: ${data.id}`);
        return { exito: true, messageId: data.id };

    } catch (err) {
        console.error(`❌ [EmailLimpieza] ERROR enviando a ${emailPersonal}:`, err.message);
        throw new Error(`No se pudo enviar advertencia a ${emailPersonal}: ${err.message}`);
    }
};

module.exports = { enviarAdvertenciaSinTesis };