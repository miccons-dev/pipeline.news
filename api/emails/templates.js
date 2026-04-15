'use strict';

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * HTML invite email — light theme.
 * @param {{ referrerName: string, referrerEmail: string, inviteUrl: string }} opts
 */
function inviteEmailHtml({ referrerName, referrerEmail, inviteUrl }) {
  const name = esc(referrerName);

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${name} ti ha riservato un posto in Pipeline.</title>
</head>
<body style="margin:0;padding:0;background:#E8F0FC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#E8F0FC;padding:40px 16px;">
  <tr><td align="center">

    <table width="600" cellpadding="0" cellspacing="0"
           style="max-width:600px;width:100%;background:#ffffff;
                  border-radius:20px;overflow:hidden;
                  box-shadow:0 8px 48px rgba(13,39,86,.10);">

      <!-- ── LOGO ─────────────────────────────────────────── -->
      <tr>
        <td align="center"
            style="background:#ffffff;padding:36px 48px 28px;
                   border-bottom:3px solid #F0F6FF;">
          <img src="https://www.pipeline.news/logo.png"
               alt="pipeline.news"
               width="180"
               style="display:block;margin:0 auto;max-width:180px;height:auto;border:0;" />
        </td>
      </tr>

      <!-- ── BODY ─────────────────────────────────────────── -->
      <tr>
        <td style="background:#ffffff;padding:44px 52px 40px;">

          <!-- Headline -->
          <h1 style="margin:0 0 10px;font-size:28px;font-weight:900;
                     color:#0D2756;line-height:1.2;letter-spacing:-.5px;
                     text-align:center;">
            ${name} ti ha riservato
          </h1>
          <h1 style="margin:0 0 28px;font-size:28px;font-weight:900;
                     color:#00C4A0;line-height:1.2;letter-spacing:-.5px;
                     text-align:center;">
            un posto in Pipeline.
          </h1>

          <!-- Divider -->
          <div style="width:40px;height:3px;
                      background:linear-gradient(90deg,#00C4A0,#5BB8F5);
                      border-radius:2px;margin:0 auto 32px;"></div>

          <!-- Body copy -->
          <p style="margin:0 0 24px;font-size:16px;line-height:1.75;
                    color:#4a5568;text-align:center;">
            Ogni martedì mattina, Pipeline consegna nella tua inbox una tattica
            di vendita B2B concreta&nbsp;&mdash; con lo script pronto, il template
            email da copiare e il tool gratuito per applicarla quella stessa mattina.
          </p>

          <!-- Callout card -->
          <table cellpadding="0" cellspacing="0" width="100%"
                 style="margin-bottom:24px;">
            <tr>
              <td style="background:#F0F6FF;
                         border:1px solid #D1DCF0;
                         border-left:4px solid #00C4A0;
                         border-radius:0 12px 12px 0;
                         padding:16px 22px;">
                <p style="margin:0;font-size:15px;font-weight:700;
                           color:#0D2756;line-height:1.5;">
                  Niente teoria. Niente motivazione.<br/>Solo cose che funzionano.
                </p>
              </td>
            </tr>
          </table>

          <!-- Endorsement -->
          <p style="margin:0 0 36px;font-size:15px;line-height:1.7;
                    color:#6B7A99;text-align:center;font-style:italic;">
            ${name} pensa che valga il tuo tempo.
            <span style="color:#0D2756;font-style:normal;font-weight:700;">Ha ragione.</span>
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" width="100%"
                 style="margin-bottom:28px;">
            <tr>
              <td align="center">
                <a href="${esc(inviteUrl)}"
                   style="display:inline-block;
                          background:linear-gradient(135deg,#00C4A0,#00A88A);
                          color:#ffffff;font-size:17px;font-weight:800;
                          text-decoration:none;padding:18px 48px;
                          border-radius:12px;letter-spacing:.1px;
                          box-shadow:0 4px 20px rgba(0,196,160,.35);">
                  → Iscriviti gratis a Pipeline
                </a>
              </td>
            </tr>
          </table>

          <!-- Fine print -->
          <p style="margin:0;font-size:12px;color:#a0aec0;
                    text-align:center;line-height:1.8;">
            Il link è valido 7 giorni. Cancellazione in un click, sempre.<br/>
            Hai ricevuto questa email perché ${esc(referrerEmail)} ha inserito il tuo indirizzo.
          </p>

        </td>
      </tr>

      <!-- ── FOOTER ────────────────────────────────────────── -->
      <tr>
        <td style="background:#F7FAFF;border-top:1px solid #E2EAF8;
                   padding:20px 52px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#a0aec0;">
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
 * @param {{ referrerName: string, referrerEmail: string, inviteUrl: string }} opts
 */
function inviteEmailText({ referrerName, referrerEmail, inviteUrl }) {
  return `${referrerName} ti ha riservato un posto in Pipeline.

Ogni martedì mattina, Pipeline consegna nella tua inbox una tattica di vendita B2B concreta — con lo script pronto, il template email da copiare e il tool gratuito per applicarla quella stessa mattina.

Niente teoria. Niente motivazione. Solo cose che funzionano.

${referrerName} pensa che valga il tuo tempo. Ha ragione.

→ Iscriviti gratis a Pipeline
${inviteUrl}

Il link è valido 7 giorni. Cancellazione in un click, sempre.

---
Hai ricevuto questa email perché ${referrerEmail} ha inserito il tuo indirizzo.
Se non conosci questa persona, ignora semplicemente questa email.
Pipeline.news — La newsletter per i professionisti della vendita
`;
}

module.exports = { inviteEmailHtml, inviteEmailText };
