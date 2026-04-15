'use strict';

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * HTML body for the invite email.
 * @param {{ referrerEmail: string, inviteUrl: string }} opts
 * @returns {string}
 */
function inviteEmailHtml({ referrerEmail, inviteUrl }) {
  const features = [
    '🎯 Strategie di vendita concrete e immediatamente applicabili',
    '⏱ 5 minuti di lettura ogni martedì mattina',
    '📊 Casi reali, metriche e strumenti testati sul campo',
    '🚫 Zero spam — disiscriviti in un click quando vuoi',
  ];

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Sei stato invitato a Pipeline.news</title>
</head>
<body style="margin:0;padding:0;background:#F0F6FF;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F6FF;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0"
           style="max-width:600px;width:100%;background:#0D2756;border-radius:16px;overflow:hidden;">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#0D2756,#1a3d78);padding:36px 48px 28px;text-align:center;">
          <p style="margin:0;font-size:26px;font-weight:800;color:#fff;letter-spacing:-.5px;">
            pipeline<span style="color:#00C4A0;">.news</span>
          </p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:36px 48px 32px;background:#0D2756;">

          <!-- Badge -->
          <p style="margin:0 0 22px;text-align:center;">
            <span style="display:inline-block;background:rgba(0,196,160,.15);border:1px solid rgba(0,196,160,.4);
                         color:#00E4BC;font-size:11px;font-weight:700;letter-spacing:1px;
                         text-transform:uppercase;padding:6px 16px;border-radius:100px;">
              ✉ Invito personale
            </span>
          </p>

          <!-- Headline -->
          <h1 style="margin:0 0 14px;font-size:28px;font-weight:900;color:#fff;line-height:1.2;text-align:center;">
            Sei stato invitato<br/>
            <span style="color:#00C4A0;">a Pipeline.news</span>
          </h1>

          <!-- Referrer note -->
          <p style="margin:0 0 26px;font-size:15px;color:rgba(255,255,255,.65);text-align:center;line-height:1.6;">
            <strong style="color:rgba(255,255,255,.9);">${esc(referrerEmail)}</strong>
            &nbsp;pensa che Pipeline possa esserti utile.
          </p>

          <!-- Divider -->
          <div style="width:40px;height:3px;background:linear-gradient(90deg,#00C4A0,#5BB8F5);
                      border-radius:2px;margin:0 auto 26px;"></div>

          <!-- Value prop box -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
            <tr>
              <td style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.10);
                         border-radius:12px;padding:22px 26px;">
                <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:1px;
                           text-transform:uppercase;color:rgba(255,255,255,.4);">Cosa troverai</p>
                ${features.map(f => `<p style="margin:0 0 10px;font-size:14px;color:rgba(255,255,255,.82);line-height:1.5;">${f}</p>`).join('\n                ')}
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
            <tr>
              <td align="center">
                <a href="${esc(inviteUrl)}"
                   style="display:inline-block;background:linear-gradient(135deg,#00C4A0,#00A88A);
                          color:#fff;font-size:16px;font-weight:700;text-decoration:none;
                          padding:16px 40px;border-radius:10px;">
                  Accetta l'invito &rarr;
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0;font-size:12px;color:rgba(255,255,255,.3);text-align:center;line-height:1.7;">
            Questo link è valido per 7 giorni.<br/>
            Hai ricevuto questa email perché ${esc(referrerEmail)} ha inserito il tuo indirizzo.<br/>
            Se non conosci questa persona, ignora semplicemente questa email.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#080F1F;padding:18px 48px;text-align:center;">
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,.25);">
            &copy; 2026 Pipeline.news &middot; La newsletter per i professionisti della vendita
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/**
 * Plain-text fallback.
 * @param {{ referrerEmail: string, inviteUrl: string }} opts
 * @returns {string}
 */
function inviteEmailText({ referrerEmail, inviteUrl }) {
  return `Sei stato invitato a Pipeline.news

${referrerEmail} pensa che Pipeline possa esserti utile.

Pipeline è la newsletter italiana per i professionisti della vendita.
Ogni martedì: strategie, casi reali e strumenti per chiudere più trattative.

Accetta l'invito: ${inviteUrl}

Il link è valido per 7 giorni.
Hai ricevuto questa email perché ${referrerEmail} ha inserito il tuo indirizzo.
Se non hai richiesto l'invito, ignora questa email.

Pipeline.news — La newsletter per i professionisti della vendita
`;
}

module.exports = { inviteEmailHtml, inviteEmailText };
