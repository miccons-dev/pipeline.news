/**
 * subscribe.js — Cloudflare Worker
 *
 * Proxy sicuro tra pipeline.news e MailerLite.
 * Riceve { email } dal browser via POST, chiama l'endpoint
 * MailerLite lato server (nessuna restrizione di dominio).
 *
 * Deploy:
 *   1. npm install -g wrangler
 *   2. wrangler login
 *   3. wrangler deploy worker/subscribe.js --name pipeline-subscribe --compatibility-date 2024-01-01
 *
 * Non servono secrets: l'endpoint form MailerLite è pubblico.
 */

'use strict';

const ML_ACCOUNT = '2279724';
const ML_FORM    = 'HhXmbp';
const ML_URL     = `https://assets.mailerlite.com/jsonp/${ML_ACCOUNT}/forms/${ML_FORM}/subscribe`;

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
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    let email;
    try {
      ({ email } = await request.json());
    } catch {
      return json({ error: 'Richiesta non valida' }, 400);
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Email non valida' }, 400);
    }

    /* Chiama MailerLite lato server — nessuna restrizione di dominio */
    const body = new URLSearchParams();
    body.set('fields[email]', email);
    body.set('ml-submit', '1');

    const mlRes = await fetch(ML_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    });

    let success = mlRes.ok;
    try {
      const data = await mlRes.json();
      success = data.success === true;
    } catch { /* risposta non JSON — considera successo se status 2xx */ }

    return json({ success }, success ? 200 : 502);
  },
};
