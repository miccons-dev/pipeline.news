/* pipeline.news — accept.js */
'use strict';

/* ── Config ──────────────────────────────────────────────── */
const API_BASE = 'https://pipeline-news.onrender.com';

/* ── DOM refs ────────────────────────────────────────────── */
const stateLoading = document.getElementById('state-loading');
const stateInvite  = document.getElementById('state-invite');
const stateSuccess = document.getElementById('state-success');
const stateAlready = document.getElementById('state-already');
const stateExpired = document.getElementById('state-expired');
const stateError   = document.getElementById('state-error');
const referrerNote = document.getElementById('referrerNote');
const acceptBtn    = document.getElementById('acceptBtn');
const errorDetail  = document.getElementById('errorDetail');

/* ── State ───────────────────────────────────────────────── */
let inviteToken = null;

/* ── Show helpers ────────────────────────────────────────── */
function showOnly(el) {
  [stateLoading, stateInvite, stateSuccess, stateAlready, stateExpired, stateError]
    .forEach(s => { s.hidden = s !== el; });
}

/* ── Load invite ─────────────────────────────────────────── */
async function loadInvite(token) {
  try {
    const res  = await fetch(`${API_BASE}/api/v1/invite/${token}`);
    const data = await res.json();

    if (res.status === 404) {
      showError('Il link non è valido o è già stato utilizzato.');
      return;
    }
    if (!res.ok) {
      showError(data.error || "Impossibile caricare l'invito.");
      return;
    }

    if (data.status === 'accepted') {
      showOnly(stateAlready);
      return;
    }
    if (data.status === 'expired') {
      showOnly(stateExpired);
      return;
    }

    /* pending — show invite card */
    referrerNote.innerHTML =
      `<strong>${escapeHtml(data.referrerEmail)}</strong> pensa che Pipeline<br />possa esserti utile.`;

    inviteToken = token;
    showOnly(stateInvite);

  } catch {
    showError('Errore di rete. Controlla la connessione e riprova.');
  }
}

/* ── Accept invite ───────────────────────────────────────── */
async function acceptInvite() {
  if (!inviteToken) return;

  acceptBtn.disabled    = true;
  acceptBtn.textContent = 'Iscrizione in corso…';

  try {
    const res  = await fetch(`${API_BASE}/api/v1/accept-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: inviteToken }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 410) { showOnly(stateExpired); return; }
      throw new Error(data.error || "Errore durante l'iscrizione.");
    }

    if (data.alreadySubscribed) {
      showOnly(stateAlready);
      return;
    }

    showOnly(stateSuccess);

  } catch (err) {
    acceptBtn.disabled    = false;
    acceptBtn.textContent = "Accetta l'invito e iscriviti gratis →";
    /* Show inline error inside the invite card */
    let errEl = document.getElementById('acceptError');
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.id = 'acceptError';
      errEl.style.cssText =
        'margin-top:14px;font-size:13px;color:#ff8f8f;text-align:center;line-height:1.5;';
      acceptBtn.insertAdjacentElement('afterend', errEl);
    }
    errEl.textContent = err.message;
  }
}

/* ── Helpers ─────────────────────────────────────────────── */
function showError(msg) {
  errorDetail.textContent = msg;
  showOnly(stateError);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Init ────────────────────────────────────────────────── */
acceptBtn.addEventListener('click', acceptInvite);

(function init() {
  const token = new URLSearchParams(location.search).get('token');

  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    showError('Token mancante o non valido. Controlla il link che hai ricevuto via email.');
    return;
  }

  loadInvite(token);
})();
