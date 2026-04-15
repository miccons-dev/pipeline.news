/* pipeline.news — invite.js */
'use strict';

/* ── Config ──────────────────────────────────────────────── */
// Set this to your deployed API URL before going live
const API_BASE = 'https://pipeline-news.onrender.com';
const MAX_CHIPS = 10;
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── DOM refs ────────────────────────────────────────────── */
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

/* ── Chip management ─────────────────────────────────────── */
function addEmail(raw) {
  const email = raw.toLowerCase().trim();
  if (!email) return;
  if (chips.length >= MAX_CHIPS) return;
  if (chips.some(c => c.email === email)) return;   // deduplicate

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
  /* Remove all existing chip elements */
  chipsWrap.querySelectorAll('.chip').forEach(el => el.remove());

  /* Insert chips before the input */
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
  const validCount = chips.filter(c => c.valid).length;
  const total      = chips.length;
  chipCounter.textContent = `${total}/${MAX_CHIPS}`;
  chipCounter.classList.toggle('is-full', total >= MAX_CHIPS);

  if (total >= MAX_CHIPS) {
    chipInput.placeholder = 'Limite raggiunto';
    chipInput.disabled    = true;
  } else {
    chipInput.placeholder = total === 0 ? 'mario@azienda.com, luca@email.it…' : 'Aggiungi un\'altra…';
    chipInput.disabled    = false;
  }
}

function updateSubmit() {
  const validChips    = chips.filter(c => c.valid).length;
  const referrerOk    = isValidEmail(referrerInput.value.trim());
  sendBtn.disabled    = validChips === 0 || !referrerOk;
}

/* ── Chip input events ───────────────────────────────────── */
chipInput.addEventListener('keydown', (e) => {
  /* Trigger add on comma, space, Enter, Tab */
  if ([',', ' ', 'Enter', 'Tab'].includes(e.key)) {
    e.preventDefault();
    const val = chipInput.value.trim();
    if (val) { addEmail(val); chipInput.value = ''; }
    return;
  }
  /* Backspace on empty input removes last chip */
  if (e.key === 'Backspace' && chipInput.value === '' && chips.length > 0) {
    removeChip(chips.length - 1);
  }
});

chipInput.addEventListener('paste', (e) => {
  e.preventDefault();
  const text = e.clipboardData.getData('text');
  parseAndAdd(text);
  chipInput.value = '';
});

chipInput.addEventListener('blur', () => {
  const val = chipInput.value.trim();
  if (val) { addEmail(val); chipInput.value = ''; }
});

/* Click on chips wrap focuses input */
chipsWrap.addEventListener('click', (e) => {
  const removeBtn = e.target.closest('.chip__remove');
  if (removeBtn) {
    removeChip(parseInt(removeBtn.dataset.index, 10));
    return;
  }
  chipInput.focus();
});

/* Referrer input: re-validate submit on each change */
referrerInput.addEventListener('input', () => {
  const ok = isValidEmail(referrerInput.value.trim());
  referrerInput.classList.toggle('is-invalid', referrerInput.value.length > 0 && !ok);
  updateSubmit();
});

/* ── Form submission ─────────────────────────────────────── */
sendBtn.addEventListener('click', submitInvites);

async function submitInvites() {
  const referrerEmail = referrerInput.value.trim();
  if (!isValidEmail(referrerEmail)) {
    showError('Inserisci la tua email prima di inviare gli inviti.');
    return;
  }

  const validEmails = chips.filter(c => c.valid).map(c => c.email);
  if (validEmails.length === 0) {
    showError('Aggiungi almeno un\'email valida da invitare.');
    return;
  }

  sendBtn.disabled    = true;
  sendBtn.textContent = 'Invio in corso…';
  clearStatus();

  try {
    const res  = await fetch(`${API_BASE}/api/v1/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referrerEmail, emails: validEmails }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Errore durante l\'invio.');
    }

    showSuccess(data.sent, data.skipped);
  } catch (err) {
    showError(err.message || 'Impossibile inviare gli inviti. Riprova tra qualche minuto.');
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

function clearStatus() {
  statusMsg.hidden = true;
  statusMsg.textContent = '';
}

function showSuccess(sent, skipped) {
  cardInvite.hidden  = true;
  cardSuccess.hidden = false;

  let detail = `${sent} invit${sent === 1 ? 'o inviato' : 'i inviati'} con successo.`;
  if (skipped > 0) {
    detail += ` ${skipped} email già invitat${skipped === 1 ? 'a' : 'e'} in precedenza.`;
  }
  successDetail.textContent = detail;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Pre-fill referrer from URL param (?from=email) ─────── */
(function prefillFromUrl() {
  const params = new URLSearchParams(location.search);
  const from   = params.get('from');
  if (from && isValidEmail(from)) {
    referrerInput.value = from;
    updateSubmit();
  }
})();
