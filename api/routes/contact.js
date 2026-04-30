'use strict';

const express   = require('express');
const { Resend } = require('resend');

const router = express.Router();
const resend  = new Resend(process.env.RESEND_API_KEY);

const EMAIL_RE   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Pipeline.news <crew@pipeline.news>';
const TO_EMAIL   = 'crew@pipeline.news';

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ─── POST /api/v1/contact ────────────────────────────────────
   Body: { name, email, topic, message }
──────────────────────────────────────────────────────────── */
router.post('/contact', async (req, res) => {
  const { name, email, topic, message } = req.body ?? {};

  const cleanName    = String(name    ?? '').trim().slice(0, 80);
  const cleanEmail   = String(email   ?? '').trim().toLowerCase();
  const cleanTopic   = String(topic   ?? '').trim().slice(0, 120) || 'Nessun argomento';
  const cleanMessage = String(message ?? '').trim().slice(0, 5000);

  if (cleanName.length < 2)
    return res.status(400).json({ error: 'Inserisci il tuo nome (min. 2 caratteri).' });
  if (!EMAIL_RE.test(cleanEmail))
    return res.status(400).json({ error: 'Inserisci un indirizzo email valido.' });
  if (cleanMessage.length < 10)
    return res.status(400).json({ error: 'Il messaggio è troppo breve (min. 10 caratteri).' });

  const html = `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"/></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f4f7fb;margin:0;padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0"
       style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;
              box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden;">
  <tr><td style="background:#0D2756;padding:28px 40px;">
    <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.12em;
              text-transform:uppercase;color:rgba(255,255,255,.55);">
      Pipeline.news — Messaggio dal sito
    </p>
  </td></tr>
  <tr><td style="padding:36px 40px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#6b7280;width:110px;vertical-align:top;">Da</td>
        <td style="padding:8px 0;font-size:15px;color:#0D2756;font-weight:600;">${esc(cleanName)} &lt;${esc(cleanEmail)}&gt;</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#6b7280;vertical-align:top;">Argomento</td>
        <td style="padding:8px 0;font-size:15px;color:#0D2756;">${esc(cleanTopic)}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding-top:24px;">
          <div style="background:#f8fafc;border-left:4px solid #00C4A0;border-radius:0 8px 8px 0;
                      padding:18px 22px;font-size:15px;color:#374151;line-height:1.75;
                      white-space:pre-wrap;">${esc(cleanMessage)}</div>
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:16px 40px;
                 font-size:12px;color:#9ca3af;text-align:center;">
    pipeline.news &middot; ${new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}
  </td></tr>
</table>
</body></html>`;

  const text = `Nuovo messaggio da pipeline.news\n\nDa: ${cleanName} <${cleanEmail}>\nArgomento: ${cleanTopic}\n\n${cleanMessage}`;

  try {
    await resend.emails.send({
      from:     FROM_EMAIL,
      to:       TO_EMAIL,
      reply_to: cleanEmail,
      subject:  `[Feedback] ${cleanTopic} — ${cleanName}`,
      html,
      text,
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err.message);
    return res.status(500).json({ error: "Errore durante l'invio. Riprova tra qualche minuto." });
  }
});

module.exports = router;
