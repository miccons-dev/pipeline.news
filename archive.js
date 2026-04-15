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
const tagsEl      = document.getElementById('archive-tags');
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
let allPosts = [];
let posts    = [];
let activeId  = null;
let activeTag = null;

/* ── Nav shadow ──────────────────────────────────────────── */
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 20);
}, { passive: true });

/* ── Tag filtering ───────────────────────────────────────── */
function renderTags(allPostsData) {
  const tagSet = new Set();
  allPostsData.forEach(p => (p.tags || []).forEach(t => t && tagSet.add(t)));
  const tags = [...tagSet].sort();
  if (tags.length === 0) return;

  tagsEl.innerHTML =
    `<button class="archive-tag is-active" data-tag="">Tutti</button>` +
    tags.map(t => `<button class="archive-tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join('');

  tagsEl.hidden = false;

  tagsEl.addEventListener('click', e => {
    const btn = e.target.closest('.archive-tag');
    if (!btn) return;
    const tag = btn.dataset.tag;
    activeTag = tag || null;

    tagsEl.querySelectorAll('.archive-tag').forEach(b =>
      b.classList.toggle('is-active', b.dataset.tag === (activeTag || ''))
    );

    filterAndRender();
  });
}

function filterAndRender() {
  const filtered = activeTag
    ? allPosts.filter(p => (p.tags || []).includes(activeTag))
    : allPosts;
  renderList(filtered);

  /* If active post is not in filtered set, reset reader */
  if (activeId && !filtered.find(p => p.id === activeId)) {
    articleEl.hidden = true;
    emptyEl.hidden   = false;
    activeId         = null;
    history.replaceState(null, '', location.pathname);
  }
}

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
  dateEl.textContent     = formatDate(post.publish_date);
  titleEl.textContent    = post.title;
  subtitleEl.textContent = post.subtitle || post.preview_text || '';

  if (post.content_html && post.content_html.trim()) {
    const parser = new DOMParser();
    const doc    = parser.parseFromString(post.content_html, 'text/html');
    bodyEl.innerHTML   = doc.body ? doc.body.innerHTML : post.content_html;
    noContentEl.hidden = true;
    bodyEl.hidden      = false;
  } else {
    bodyEl.innerHTML   = '';
    bodyEl.hidden      = true;
    noContentEl.hidden = false;
    extLinkEl.href     = post.web_url;
  }

  emptyEl.hidden   = true;
  articleEl.hidden = false;

  if (window.innerWidth < 900) {
    articleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

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
  if (window.innerWidth < 900) {
    document.getElementById('archive-sidebar').scrollIntoView({ behavior: 'smooth' });
  }
});

/* ── Render lista ────────────────────────────────────────── */
function renderList(data) {
  posts = data;

  if (data.length === 0) {
    listEl.innerHTML = '<li class="archive-list__empty">Nessuna edizione per questo tag.</li>';
    return;
  }

  listEl.innerHTML = data.map((p, i) => `
    <li class="archive-list__item"
        data-id="${escapeHtml(p.id)}"
        role="option"
        tabindex="0"
        aria-selected="false"
        aria-label="${escapeHtml(p.title)}">
      <span class="archive-list__num">#${allPosts.length - allPosts.findIndex(ap => ap.id === p.id)}</span>
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

    allPosts = data.posts;
    renderTags(allPosts);
    renderList(allPosts);

    /* Apre il post dall'hash URL (link diretto) */
    const hash = location.hash.slice(1);
    if (hash && allPosts.find(p => p.id === hash)) {
      selectPost(hash);
    }

  } catch {
    loadingEl.hidden = true;
    listEl.innerHTML = '<li class="archive-list__empty">Impossibile caricare l\'archivio.<br>Riprova più tardi.</li>';
  }
}

loadArchive();
