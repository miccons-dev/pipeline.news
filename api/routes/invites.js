'use strict';

const express  = require('express');
const crypto   = require('crypto');
const { Resend } = require('resend');
const pool     = require('../db/pool');
const { inviteEmailHtml, inviteEmailText } = require('../emails/templates');

const router = express.Router();
const resend  = new Resend(process.env.RESEND_API_KEY);

/* ── Constants ───────────────────────────────────────────── */
const EMAIL_REGEX       = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PER_BATCH     = 10;
const MAX_PER_DAY       = 20;
const TOKEN_EXPIRY_DAYS = 7;
const BEEHIIV_PUB_ID    = process.env.BEEHIIV_PUBLICATION_ID;
const BEEHIIV_API_KEY   = process.env.BEEHIIV_API_KEY;
const SITE_URL          = process.env.SITE_URL || 'https://www.pipeline.news';
const FROM_EMAIL        = process.env.FROM_EMAIL || 'Pipeline.news <crew@pipeline.news>';

/* ── Helpers ─────────────────────────────────────────────── */
const isValidEmail = (e) => EMAIL_REGEX.test(e) && e.length <= 254;
const generateToken = () => crypto.randomBytes(32).toString('hex');

function sanitizeName(raw) {
  return String(raw ?? '').trim().replace(/\s+/g, ' ').slice(0, 60);
}

/* ─── POST /api/v1/invite ─────────────────────────────────────
   Body: { referrerName: string, referrerEmail: string, emails: string[] }
──────────────────────────────────────────────────────────── */
router.post('/invite', async (req, res) => {
  const { referrerName: rawName, referrerEmail, emails } = req.body ?? {};

  const referrerName = sanitizeName(rawName);
  if (!referrerName) {
    return res.status(400).json({ error: 'Inserisci il tuo nome prima di inviare gli inviti.' });
  }
  if (!referrerEmail || !isValidEmail(String(referrerEmail))) {
    return res.status(400).json({ error: 'Email mittente non valida.' });
  }
  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "Fornisci almeno un'email da invitare." });
  }
  if (emails.length > MAX_PER_BATCH) {
    return res.status(400).json({ error: `Puoi inviare al massimo ${MAX_PER_BATCH} inviti alla volta.` });
  }

  const normalRef = referrerEmail.toLowerCase().trim();
  const unique = [...new Set(
    emails
      .map(e => String(e).toLowerCase().trim())
      .filter(e => isValidEmail(e) && e !== normalRef)
  )];

  if (unique.length === 0) {
    return res.status(400).json({ error: 'Nessuna email valida. Non puoi invitare te stesso.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    /* Rate-limit: max 20 inviti per referrer nelle ultime 24h */
    const { rows: [{ cnt }] } = await client.query(
      `SELECT COUNT(*) AS cnt FROM invites
       WHERE referrer_email = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
      [normalRef]
    );
    const sentToday = parseInt(cnt, 10);
    if (sentToday + unique.length > MAX_PER_DAY) {
      const remaining = Math.max(0, MAX_PER_DAY - sentToday);
      await client.query('ROLLBACK');
      return res.status(429).json({
        error: `Limite raggiunto. Puoi inviare altri ${remaining} inviti nelle prossime 24 ore.`,
      });
    }

    let sent = 0, skipped = 0, failed = 0;

    for (const invitedEmail of unique) {
      try {
        const token = generateToken();

        const insert = await client.query(
          `INSERT INTO invites (token, referrer_name, referrer_email, invited_email, expires_at)
           VALUES ($1, $2, $3, $4, NOW() + INTERVAL '${TOKEN_EXPIRY_DAYS} days')
           ON CONFLICT (referrer_email, invited_email) DO NOTHING
           RETURNING id`,
          [token, referrerName, normalRef, invitedEmail]
        );

        if (insert.rowCount === 0) { skipped++; continue; }

        const inviteUrl = `${SITE_URL}/accept.html?token=${token}`;
        await resend.emails.send({
          from:    FROM_EMAIL,
          to:      invitedEmail,
          subject: `${referrerName} ti ha riservato un posto in Pipeline.`,
          html:    inviteEmailHtml({ referrerName, referrerEmail, inviteUrl }),
          text:    inviteEmailText({ referrerName, referrerEmail, inviteUrl }),
        });

        sent++;
      } catch (err) {
        console.error(`Error processing invite for ${invitedEmail}:`, err.message);
        failed++;
      }
    }

    if (sent > 0) {
      await client.query(
        `INSERT INTO referral_stats (email, invites_sent, last_invite_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE
         SET invites_sent   = referral_stats.invites_sent + EXCLUDED.invites_sent,
             last_invite_at = NOW(),
             updated_at     = NOW()`,
        [normalRef, sent]
      );
    }

    await client.query('COMMIT');

    return res.json({
      sent,
      skipped,
      failed,
      message: sent > 0
        ? `${sent} invit${sent === 1 ? 'o inviato' : 'i inviati'} con successo!`
        : 'Nessun nuovo invito da inviare (già tutti invitati in precedenza).',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /invite error:', err);
    return res.status(500).json({ error: 'Errore interno. Riprova tra qualche minuto.' });
  } finally {
    client.release();
  }
});

/* ─── GET /api/v1/invite/:token ───────────────────────────────
   Returns invite details for the accept page.
──────────────────────────────────────────────────────────── */
router.get('/invite/:token', async (req, res) => {
  const { token } = req.params;
  if (!/^[0-9a-f]{64}$/.test(token ?? '')) {
    return res.status(400).json({ error: 'Token non valido.' });
  }

  try {
    await pool.query(
      `UPDATE invites SET status = 'expired'
       WHERE status = 'pending' AND expires_at < NOW()`
    );

    const { rows } = await pool.query(
      `SELECT referrer_name, referrer_email, invited_email, status, created_at, expires_at
       FROM invites WHERE token = $1`,
      [token]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Invito non trovato.' });

    const inv = rows[0];
    return res.json({
      referrerName:  inv.referrer_name,
      referrerEmail: inv.referrer_email,
      invitedEmail:  inv.invited_email,
      status:        inv.status,
      expiresAt:     inv.expires_at,
    });
  } catch (err) {
    console.error('GET /invite/:token error:', err);
    return res.status(500).json({ error: 'Errore interno.' });
  }
});

/* ─── POST /api/v1/accept-invite ─────────────────────────────
   Body: { token: string }
──────────────────────────────────────────────────────────── */
router.post('/accept-invite', async (req, res) => {
  const { token } = req.body ?? {};
  if (!/^[0-9a-f]{64}$/.test(token ?? '')) {
    return res.status(400).json({ error: 'Token non valido.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE invites SET status = 'expired'
       WHERE status = 'pending' AND expires_at < NOW()`
    );

    const { rows } = await client.query(
      `SELECT id, referrer_name, referrer_email, invited_email, status
       FROM invites WHERE token = $1 FOR UPDATE`,
      [token]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Invito non trovato.' });
    }

    const invite = rows[0];

    if (invite.status === 'accepted') {
      await client.query('ROLLBACK');
      return res.json({ success: true, alreadySubscribed: true,
        message: 'Sei già iscritto a Pipeline. Ci vediamo martedì!' });
    }

    if (invite.status === 'expired') {
      await client.query('ROLLBACK');
      return res.status(410).json({
        error: "L'invito è scaduto. Puoi iscriverti direttamente su pipeline.news.",
      });
    }

    /* Subscribe via Beehiiv */
    const beehiivRes = await fetch(
      `https://api.beehiiv.com/v2/publications/${BEEHIIV_PUB_ID}/subscriptions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${BEEHIIV_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email:               invite.invited_email,
          reactivate_existing: false,
          send_welcome_email:  true,
          utm_source:          'user_invite',
          utm_medium:          'referral',
          utm_campaign:        invite.referrer_email,
          custom_fields: [
            { name: 'referral_source', value: 'user_invite' },
            { name: 'referrer_email',  value: invite.referrer_email },
          ],
        }),
      }
    );

    if (!beehiivRes.ok && beehiivRes.status !== 409) {
      const body = await beehiivRes.text();
      console.error('Beehiiv error:', beehiivRes.status, body.slice(0, 200));
      await client.query('ROLLBACK');
      return res.status(502).json({
        error: "Impossibile completare l'iscrizione. Riprova tra qualche minuto.",
      });
    }

    await client.query(
      `UPDATE invites SET status = 'accepted', accepted_at = NOW() WHERE id = $1`,
      [invite.id]
    );

    await client.query(
      `INSERT INTO referral_stats (email, invites_sent, invites_accepted, updated_at)
       VALUES ($1, 0, 1, NOW())
       ON CONFLICT (email) DO UPDATE
       SET invites_accepted = referral_stats.invites_accepted + 1,
           updated_at       = NOW()`,
      [invite.referrer_email]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Benvenuto in Pipeline! Riceverai la prima edizione martedì prossimo.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /accept-invite error:', err);
    return res.status(500).json({ error: 'Errore interno. Riprova tra qualche minuto.' });
  } finally {
    client.release();
  }
});

module.exports = router;
