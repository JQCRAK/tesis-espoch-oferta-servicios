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
        tls: { ciphers: 'SSLv3', rejectUnauthorized: false },
        family: 4, 
    });
    return transporter;
};

const FROM = () =>
    process.env.EMAIL_FROM ||
    `"Portal Graduados ESPOCH" <${process.env.EMAIL_USER}>`;

// PLANTILLA BASE
const layout = (contenido) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;
             font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:white;border-radius:12px;overflow:hidden;
                    box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <!-- Cabecera -->
        <tr>
          <td style="background:#BE1E2D;padding:24px 36px;text-align:center;">
            <h1 style="margin:0;color:white;font-size:1.3rem;font-weight:800;">
              🎓 Portal de Graduados
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:0.82rem;">
              Carrera de Software · ESPOCH
            </p>
          </td>
        </tr>
        <!-- Cuerpo -->
        <tr><td style="padding:28px 36px;">${contenido}</td></tr>
        <!-- Pie -->
        <tr>
          <td style="background:#f8f9fa;padding:14px 36px;text-align:center;
                     border-top:1px solid #e9ecef;">
            <p style="margin:0;font-size:0.68rem;color:#adb5bd;">
              © ${new Date().getFullYear()} Carrera de Software · ESPOCH · Riobamba, Ecuador<br>
              Este correo es generado automáticamente — no responder.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// 1. CORREO AL GRADUADO (destino)
const enviarAlGraduado = async ({
    emailPersonal, nombresGraduado,
    nombreRemitente, emailRemitente, empresa, mensaje,
}) => {
    if (!emailPersonal) {
        console.warn('[EmailContacto] Graduado sin emailPersonal — omitido.');
        return { exito: false, razon: 'sin_email' };
    }

    const empresaLine = empresa
        ? `<tr><td style="padding:5px 0;width:120px;">
             <span style="font-size:0.76rem;color:#6c757d;font-weight:600;">Empresa:</span>
           </td><td>
             <span style="font-size:0.88rem;color:#2c3e50;">${empresa}</span>
           </td></tr>`
        : '';

    const cuerpo = `
      <p style="margin:0 0 6px;font-size:1rem;color:#2c3e50;font-weight:600;">
        Hola, ${nombresGraduado} 👋
      </p>
      <p style="margin:0 0 20px;font-size:0.87rem;color:#6c757d;line-height:1.6;">
        Alguien está interesado en tu perfil profesional publicado en el
        <strong>Portal de Graduados de la ESPOCH</strong>.
        Aquí están sus datos de contacto:
      </p>

      <div style="background:#f8f9fa;border:1px solid #e9ecef;
                  border-left:4px solid #BE1E2D;border-radius:8px;
                  padding:18px 22px;margin-bottom:20px;">
        <p style="margin:0 0 10px;font-size:0.72rem;font-weight:700;color:#adb5bd;
                  letter-spacing:0.8px;text-transform:uppercase;">
          Datos del interesado
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:5px 0;width:120px;">
              <span style="font-size:0.76rem;color:#6c757d;font-weight:600;">Nombre:</span>
            </td>
            <td>
              <span style="font-size:0.88rem;color:#2c3e50;font-weight:700;">
                ${nombreRemitente}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:5px 0;">
              <span style="font-size:0.76rem;color:#6c757d;font-weight:600;">Correo:</span>
            </td>
            <td>
              <a href="mailto:${emailRemitente}"
                 style="font-size:0.88rem;color:#BE1E2D;font-weight:700;
                        text-decoration:none;">
                ${emailRemitente}
              </a>
            </td>
          </tr>
          ${empresaLine}
        </table>
      </div>

      <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;
                  padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:0.72rem;font-weight:700;color:#f57f17;
                  letter-spacing:0.6px;text-transform:uppercase;">
          Mensaje
        </p>
        <p style="margin:0;font-size:0.87rem;color:#2c3e50;line-height:1.65;">
          ${mensaje}
        </p>
      </div>

      <div style="background:#e8f5e9;border:1px solid #c8e6c9;border-radius:8px;
                  padding:12px 16px;">
        <p style="margin:0;font-size:0.78rem;color:#1b5e20;line-height:1.5;">
          ✅ Puedes responder directamente a
          <strong>${emailRemitente}</strong>.
          Tu correo personal <strong>nunca</strong> fue compartido públicamente.
        </p>
      </div>`;

    try {
        const info = await getTransporter().sendMail({
            from:    FROM(),
            to:      emailPersonal,
            subject: `💼 Alguien está interesado en tu perfil — Portal ESPOCH`,
            html:    layout(cuerpo),
        });
        console.log(`✅ [EmailContacto→Graduado] ${info.messageId}`);
        return { exito: true, messageId: info.messageId };
    } catch (err) {
        console.error(`❌ [EmailContacto→Graduado] ${err.message}`);
        return { exito: false, error: err.message };
    }
};

// 2. COPIA AL REMITENTE
const enviarCopiaRemitente = async ({
    emailRemitente, nombreRemitente,
    nombresGraduado, apellidosGraduado,
}) => {
    const cuerpo = `
      <p style="margin:0 0 6px;font-size:1rem;color:#2c3e50;font-weight:600;">
        Hola, ${nombreRemitente} 👋
      </p>
      <p style="margin:0 0 20px;font-size:0.87rem;color:#6c757d;line-height:1.6;">
        Esta es una copia de la solicitud de contacto que enviaste a través del
        <strong>Portal de Graduados de la ESPOCH</strong>.
      </p>

      <div style="background:#f8f9fa;border:1px solid #e9ecef;
                  border-left:4px solid #BE1E2D;border-radius:8px;
                  padding:18px 22px;margin-bottom:20px;">
        <p style="margin:0 0 10px;font-size:0.72rem;font-weight:700;color:#adb5bd;
                  letter-spacing:0.8px;text-transform:uppercase;">
          Perfil contactado
        </p>
        <p style="margin:0;font-size:0.95rem;color:#2c3e50;font-weight:700;">
          ${nombresGraduado} ${apellidosGraduado}
        </p>
        <p style="margin:4px 0 0;font-size:0.78rem;color:#6c757d;">
          Ing. en Software · ESPOCH
        </p>
      </div>

      <div style="background:#e3f2fd;border:1px solid #90caf9;border-radius:8px;
                  padding:12px 16px;">
        <p style="margin:0;font-size:0.78rem;color:#1565c0;line-height:1.5;">
          ℹ️ El graduado ha recibido tus datos de contacto y se pondrá en comunicación 
          contigo si está interesado. El equipo de la carrera también fue notificado.
        </p>
      </div>`;

    try {
        const info = await getTransporter().sendMail({
            from:    FROM(),
            to:      emailRemitente,
            subject: `📋 Copia de tu solicitud — Portal Graduados ESPOCH`,
            html:    layout(cuerpo),
        });
        console.log(`✅ [EmailContacto→Remitente] ${info.messageId}`);
        return { exito: true, messageId: info.messageId };
    } catch (err) {
        console.error(`❌ [EmailContacto→Remitente] ${err.message}`);
        return { exito: false, error: err.message };
    }
};

// 3. COPIA A TODOS LOS ADMINS
const enviarCopiaAdmins = async ({
    emailsAdmins,
    nombreRemitente, emailRemitente, empresa, mensaje,
    nombresGraduado, apellidosGraduado,
}) => {
    if (!emailsAdmins || emailsAdmins.length === 0) {
        console.warn('[EmailContacto→Admins] Sin admins con email — omitido.');
        return { exito: false, razon: 'sin_admins' };
    }

    const empresaLine = empresa
        ? `<tr><td style="padding:4px 0;width:110px;">
             <span style="font-size:0.74rem;color:#6c757d;font-weight:600;">Empresa:</span>
           </td><td>
             <span style="font-size:0.85rem;color:#2c3e50;">${empresa}</span>
           </td></tr>`
        : '';

    const cuerpo = `
      <p style="margin:0 0 6px;font-size:1rem;color:#2c3e50;font-weight:600;">
        Nueva solicitud de contacto 📬
      </p>
      <p style="margin:0 0 18px;font-size:0.87rem;color:#6c757d;line-height:1.6;">
        Un interesado ha contactado a un graduado del portal. Aquí el resumen:
      </p>

      <div style="background:#fff1f2;border:1px solid #fecdd3;
                  border-left:4px solid #BE1E2D;border-radius:8px;
                  padding:16px 20px;margin-bottom:16px;">
        <p style="margin:0 0 8px;font-size:0.7rem;font-weight:700;color:#BE1E2D;
                  letter-spacing:0.8px;text-transform:uppercase;">
          Graduado contactado
        </p>
        <p style="margin:0;font-size:0.95rem;color:#2c3e50;font-weight:700;">
          ${nombresGraduado} ${apellidosGraduado}
        </p>
      </div>

      <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:8px;
                  padding:16px 20px;margin-bottom:16px;">
        <p style="margin:0 0 10px;font-size:0.7rem;font-weight:700;color:#adb5bd;
                  letter-spacing:0.8px;text-transform:uppercase;">
          Datos del interesado
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:4px 0;width:110px;">
              <span style="font-size:0.74rem;color:#6c757d;font-weight:600;">Nombre:</span>
            </td>
            <td>
              <span style="font-size:0.85rem;color:#2c3e50;font-weight:700;">
                ${nombreRemitente}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 0;">
              <span style="font-size:0.74rem;color:#6c757d;font-weight:600;">Correo:</span>
            </td>
            <td>
              <a href="mailto:${emailRemitente}"
                 style="font-size:0.85rem;color:#BE1E2D;font-weight:700;
                        text-decoration:none;">
                ${emailRemitente}
              </a>
            </td>
          </tr>
          ${empresaLine}
        </table>
      </div>

      <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;
                  padding:14px 18px;margin-bottom:16px;">
        <p style="margin:0 0 6px;font-size:0.7rem;font-weight:700;color:#f57f17;
                  letter-spacing:0.6px;text-transform:uppercase;">Mensaje</p>
        <p style="margin:0;font-size:0.85rem;color:#2c3e50;line-height:1.65;">
          ${mensaje}
        </p>
      </div>

      <div style="background:#f3e8ff;border:1px solid #ddd6fe;border-radius:8px;
                  padding:12px 16px;">
        <p style="margin:0;font-size:0.76rem;color:#4a0080;line-height:1.5;">
          🔔 Esta notificación también aparece en el panel administrativo.
          Una vez que cualquier administrador la marque como leída,
          se considerará atendida para todos.
        </p>
      </div>`;

    try {
        const info = await getTransporter().sendMail({
            from:    FROM(),
            to:      emailsAdmins.join(', '),
            subject: `🔔 Nueva solicitud de contacto — ${nombresGraduado} ${apellidosGraduado} · ESPOCH`,
            html:    layout(cuerpo),
        });
        console.log(`✅ [EmailContacto→Admins] ${info.messageId} → ${emailsAdmins.join(', ')}`);
        return { exito: true, messageId: info.messageId };
    } catch (err) {
        console.error(`❌ [EmailContacto→Admins] ${err.message}`);
        return { exito: false, error: err.message };
    }
};

module.exports = {
    enviarAlGraduado,
    enviarCopiaRemitente,
    enviarCopiaAdmins,
};