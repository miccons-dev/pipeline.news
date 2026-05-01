/* pipeline.news — invite.js */
'use strict';

/* ── Config ──────────────────────────────────────────────── */
const API_BASE  = 'https://pipeline-news.onrender.com';
const MAX_CHIPS = 10;
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── Warm-up: pinga il backend appena la pagina si carica ─── */
fetch(`${API_BASE}/health`, { method: 'GET', cache: 'no-store' }).catch(() => {});

/* ── DOM refs ────────────────────────────────────────────── */
const nameInput     = document.getElementById('nameInput');
const referrerInput = document.getElementById('referrerInput');
const chipsWrap     = document.getElementById('chipsWrap');
const chipInput     = document.getElementById('chipInput');
const chipCounter   = document.getElementById('chipCounter');
const sendBtn       = document.getElementById('sendBtn');
const statusMsg     = document.getElementById('statusMsg');
const cardInvite    = document.getElementById('card-invite');
const cardSuccess   = document.getElementById('card-success');
const successDetail = document.getElementById('successDetail');

/* ── State ───────────────────────────────────────────────── */
let chips = [];  // Array<{ email: string, valid: boolean }>

/* ── Validation ──────────────────────────────────────────── */
function isValidEmail(email) {
  return EMAIL_RE.test(email) && email.length <= 254;
}

function isValidName(name) {
  return name.trim().length > 0 && name.trim().length <= 60;
}

/* ── Chip management ─────────────────────────────────────── */
function addEmail(raw) {
  const email = raw.toLowerCase().trim();
  if (!email) return;
  if (chips.length >= MAX_CHIPS) return;
  if (chips.some(c => c.email === email)) return;

  chips.push({ email, valid: isValidEmail(email) });
  renderChips();
}

function removeChip(index) {
  chips.splice(index, 1);
  renderChips();
}

function parseAndAdd(text) {
  const parts = text.split(/[\s,;\n]+/);
  for (const part of parts) {
    if (chips.length >= MAX_CHIPS) break;
    addEmail(part);
  }
}

function renderChips() {
  chipsWrap.querySelectorAll('.chip').forEach(el => el.remove());

  chips.forEach((c, i) => {
    const chip = document.createElement('span');
    chip.className = `chip chip--${c.valid ? 'valid' : 'invalid'}`;
    chip.innerHTML = `
      <span class="chip__text" title="${escapeHtml(c.email)}">${escapeHtml(c.email)}</span>
      <button type="button" class="chip__remove" aria-label="Rimuovi ${escapeHtml(c.email)}" data-index="${i}">&times;</button>
    `;
    chipsWrap.insertBefore(chip, chipInput);
  });

  updateCounter();
  updateSubmit();
  clearStatus();
}

function updateCounter() {
  const total = chips.length;
  chipCounter.textContent = `${total}/${MAX_CHIPS}`;
  chipCounter.classList.toggle('is-full', total >= MAX_CHIPS);

  if (total >= MAX_CHIPS) {
    chipInput.placeholder = 'Limite raggiunto';
    chipInput.disabled    = true;
  } else {
    chipInput.placeholder = total === 0 ? 'mario@azienda.com, luca@email.it…' : "Aggiungi un'altra…";
    chipInput.disabled    = false;
  }
}

function updateSubmit() {
  const validChips = chips.filter(c => c.valid).length;
  const nameOk     = isValidName(nameInput.value);
  const emailOk    = isValidEmail(referrerInput.value.trim());
  sendBtn.disabled = validChips === 0 || !nameOk || !emailOk;
}

/* ── Chip input events ───────────────────────────────────── */
chipInput.addEventListener('keydown', (e) => {
  if ([',', ' ', 'Enter', 'Tab'].includes(e.key)) {
    e.preventDefault();
    const val = chipInput.value.trim();
    if (val) { addEmail(val); chipInput.value = ''; }
    return;
  }
  if (e.key === 'Backspace' && chipInput.value === '' && chips.length > 0) {
    removeChip(chips.length - 1);
  }
});

chipInput.addEventListener('paste', (e) => {
  e.preventDefault();
  parseAndAdd(e.clipboardData.getData('text'));
  chipInput.value = '';
});

chipInput.addEventListener('blur', () => {
  const val = chipInput.value.trim();
  if (val) { addEmail(val); chipInput.value = ''; }
});

chipsWrap.addEventListener('click', (e) => {
  const removeBtn = e.target.closest('.chip__remove');
  if (removeBtn) { removeChip(parseInt(removeBtn.dataset.index, 10)); return; }
  chipInput.focus();
});

/* ── Name / email field validation ──────────────────────── */
nameInput.addEventListener('input', () => {
  const pos = nameInput.selectionStart;
  const val = nameInput.value.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  if (nameInput.value !== val) {
    nameInput.value = val;
    nameInput.setSelectionRange(pos, pos);
  }
  updateSubmit();
});

referrerInput.addEventListener('input', () => {
  const ok = isValidEmail(referrerInput.value.trim());
  referrerInput.classList.toggle('is-invalid', referrerInput.value.length > 0 && !ok);
  updateSubmit();
});

/* ── Form submission ─────────────────────────────────────── */
sendBtn.addEventListener('click', submitInvites);

async function submitInvites() {
  const referrerName  = nameInput.value.trim();
  const referrerEmail = referrerInput.value.trim();

  if (!isValidName(referrerName)) {
    showError('Inserisci il tuo nome prima di inviare gli inviti.');
    return;
  }
  if (!isValidEmail(referrerEmail)) {
    showError('Inserisci la tua email prima di inviare gli inviti.');
    return;
  }

  const validEmails = chips.filter(c => c.valid).map(c => c.email);
  if (validEmails.length === 0) {
    showError("Aggiungi almeno un'email valida da invitare.");
    return;
  }

  sendBtn.disabled    = true;
  sendBtn.textContent = 'Invio in corso…';
  clearStatus();

  // Messaggio progressivo se il server è lento ad avviarsi
  const slowTimer = setTimeout(() => {
    if (sendBtn.textContent === 'Invio in corso…') {
      sendBtn.textContent = 'Avvio server…';
      showInfo('Il server si sta avviando, ci vogliono circa 30 secondi. Attendi…');
    }
  }, 4000);

  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 90_000); // 90s max

    const res  = await fetch(`${API_BASE}/api/v1/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referrerName, referrerEmail, emails: validEmails }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    clearTimeout(slowTimer);

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Errore durante l'invio.");

    if (data.sent === 0 && data.failed > 0) {
      throw new Error(`Impossibile inviare gli inviti (${data.failed} error${data.failed === 1 ? 'e' : 'i'}). Riprova tra qualche minuto.`);
    }

    showSuccess(data.sent, data.skipped);
  } catch (err) {
    clearTimeout(slowTimer);
    const msg = err.name === 'AbortError'
      ? 'Il server ha impiegato troppo. Riprova tra qualche istante.'
      : (err.message || 'Impossibile inviare gli inviti. Riprova tra qualche minuto.');
    showError(msg);
    sendBtn.disabled    = false;
    sendBtn.textContent = 'Invia inviti →';
  }
}

/* ── UI helpers ──────────────────────────────────────────── */
function showError(msg) {
  statusMsg.className   = 'status-msg status-msg--error';
  statusMsg.textContent = msg;
  statusMsg.hidden      = false;
}

function showInfo(msg) {
  statusMsg.className   = 'status-msg status-msg--info';
  statusMsg.textContent = msg;
  statusMsg.hidden      = false;
}

function clearStatus() {
  statusMsg.hidden      = true;
  statusMsg.textContent = '';
}

function showSuccess(sent, skipped) {
  if (typeof gtag === 'function') {
    gtag('event', 'invite_sent', { invite_count: sent });
  }
  cardInvite.hidden  = true;
  cardSuccess.hidden = false;

  const total = sent + skipped;
  successDetail.textContent = `${total} invit${total === 1 ? 'o inviato' : 'i inviati'} con successo.`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Pre-fill da URL (?from=email&name=Mario) ────────────── */
(function prefillFromUrl() {
  const params = new URLSearchParams(location.search);
  const from   = params.get('from');
  const name   = params.get('name');
  if (from && isValidEmail(from)) {
    referrerInput.value = from;
  }
  if (name) {
    nameInput.value = decodeURIComponent(name).trim().slice(0, 60);
  }
  updateSubmit();
})();
