/**
 * subscribe.js — Cloudflare Worker
 *
 * Proxy sicuro tra il sito pipeline.news e l'API Beehiiv.
 * Tiene la chiave API come secret Cloudflare (mai nel codice).
 *
 * Deploy:
 *   1. npm install -g wrangler
 *   2. wrangler login
 *   3. wrangler deploy worker/subscribe.js --name pipeline-subscribe --compatibility-date 2024-01-01
 *   4. wrangler secret put BEEHIIV_API_KEY   ← incolla la tua chiave quando richiesto
 *
 * Dopo il deploy, copia l'URL del Worker (es. https://pipeline-subscribe.tuonome.workers.dev)
 * e sostituisci YOUR_WORKER_URL in index.html.
 */

'use strict';

const PUB_ID = 'pub_502a54b7-6175-4c50-a224-8d244c41a2ed';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    /* Preflight CORS */
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    /* Leggi e valida l'email */
    let email;
    try {
      ({ email } = await request.json());
    } catch {
      return json({ error: 'Richiesta non valida' }, 400);
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Email non valida' }, 400);
    }

    /* Chiama l'API Beehiiv */
    const beehiivRes = await fetch(
      `https://api.beehiiv.com/v2/publications/${PUB_ID}/subscriptions`,
      {
        method: 'POST',
        headers: {
          Authorization:  `Bearer ${env.BEEHIIV_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          reactivate_existing: false,
          send_welcome_email:  true,
          utm_source:          'website',
          utm_medium:          'organic',
        }),
      }
    );

    /* 201 Created o 409 Conflict (già iscritto) → successo */
    const ok = beehiivRes.ok || beehiivRes.status === 409;
    return json({ success: ok }, ok ? 200 : 500);
  },
};
