/* pipeline.news — archive.js */
'use strict';

/* ── Helpers ─────────────────────────────────────────────── */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── DOM refs ────────────────────────────────────────────── */
const loadingEl   = document.getElementById('archive-loading');
const listEl      = document.getElementById('archive-list');
const emptyEl     = document.getElementById('archive-empty');
const articleEl   = document.getElementById('archive-article');
const dateEl      = document.getElementById('reader-date');
const titleEl     = document.getElementById('reader-title');
const subtitleEl  = document.getElementById('reader-subtitle');
const bodyEl      = document.getElementById('reader-body');
const noContentEl = document.getElementById('reader-no-content');
const extLinkEl   = document.getElementById('reader-external-link');
const backBtn     = document.getElementById('reader-back-btn');

/* ── State ───────────────────────────────────────────────── */
let posts    = [];
let activeId = null;

/* ── Nav shadow ──────────────────────────────────────────── */
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 20);
}, { passive: true });

/* ── Select post ─────────────────────────────────────────── */
function selectPost(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return;
  activeId = id;

  /* Aggiorna stato attivo nella sidebar */
  listEl.querySelectorAll('.archive-list__item').forEach(el => {
    el.classList.toggle('is-active', el.dataset.id === id);
    el.setAttribute('aria-selected', el.dataset.id === id ? 'true' : 'false');
  });

  /* Popola il lettore */
  dateEl.textContent    = formatDate(post.publish_date);
  titleEl.textContent   = post.title;
  subtitleEl.textContent = post.subtitle || post.preview_text || '';

  if (post.content_html && post.content_html.trim()) {
    /* Estrae il corpo dal documento HTML completo di Beehiiv */
    const parser = new DOMParser();
    const doc    = parser.parseFromString(post.content_html, 'text/html');
    bodyEl.innerHTML  = doc.body ? doc.body.innerHTML : post.content_html;
    noContentEl.hidden = true;
    bodyEl.hidden      = false;
  } else {
    bodyEl.innerHTML   = '';
    bodyEl.hidden      = true;
    noContentEl.hidden = false;
    extLinkEl.href     = post.web_url;
  }

  /* Mostra l'articolo */
  emptyEl.hidden   = true;
  articleEl.hidden = false;

  /* Su mobile scrolla al lettore */
  if (window.innerWidth < 900) {
    articleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* Aggiorna hash URL per link diretto */
  history.replaceState(null, '', '#' + id);
}

/* ── Torna alla lista (mobile) ───────────────────────────── */
backBtn.addEventListener('click', () => {
  articleEl.hidden = true;
  emptyEl.hidden   = false;
  activeId         = null;
  listEl.querySelectorAll('.archive-list__item').forEach(el => {
    el.classList.remove('is-active');
    el.setAttribute('aria-selected', 'false');
  });
  history.replaceState(null, '', location.pathname);
  /* Su mobile scrolla su alla lista */
  if (window.innerWidth < 900) {
    document.getElementById('archive-sidebar').scrollIntoView({ behavior: 'smooth' });
  }
});

/* ── Render lista ────────────────────────────────────────── */
function renderList(data) {
  posts = data;
  listEl.innerHTML = data.map((p, i) => `
    <li class="archive-list__item"
        data-id="${escapeHtml(p.id)}"
        role="option"
        tabindex="0"
        aria-selected="false"
        aria-label="${escapeHtml(p.title)}">
      <span class="archive-list__num">#${data.length - i}</span>
      <div class="archive-list__info">
        <span class="archive-list__date">${formatDate(p.publish_date)}</span>
        <span class="archive-list__title">${escapeHtml(p.title)}</span>
      </div>
    </li>
  `).join('');

  listEl.querySelectorAll('.archive-list__item').forEach(el => {
    el.addEventListener('click', () => selectPost(el.dataset.id));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectPost(el.dataset.id);
      }
    });
  });
}

/* ── Carica archive.json ─────────────────────────────────── */
async function loadArchive() {
  try {
    const res  = await fetch('archive.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    loadingEl.hidden = true;

    if (!data.posts || data.posts.length === 0) {
      listEl.innerHTML = '<li class="archive-list__empty">Nessuna edizione disponibile.</li>';
      return;
    }

    renderList(data.posts);

    /* Apre il post dall'hash URL (link diretto) */
    const hash = location.hash.slice(1);
    if (hash && data.posts.find(p => p.id === hash)) {
      selectPost(hash);
    }

  } catch {
    loadingEl.hidden = true;
    listEl.innerHTML = '<li class="archive-list__empty">Impossibile caricare l\'archivio.<br>Riprova più tardi.</li>';
  }
}

loadArchive();
