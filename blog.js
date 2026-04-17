'use strict';

const filterPills = document.getElementById('filterPills');
const blogFilters = document.getElementById('blogFilters');
const blogGrid    = document.getElementById('blogGrid');
const blogLoading = document.getElementById('blogLoading');
const blogEmpty   = document.getElementById('blogEmpty');
const emptyReset  = document.getElementById('emptyReset');

let allPosts  = [];
let activeTag = '';

const MONTHS = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── Tag colours (cycling palette) ──────────────────────── */
const TAG_PALETTE = [
  { bg: 'rgba(30,107,197,.09)',  border: 'rgba(30,107,197,.22)',  color: '#1E6BC5' },
  { bg: 'rgba(0,196,160,.09)',   border: 'rgba(0,196,160,.28)',   color: '#00A88A' },
  { bg: 'rgba(91,184,245,.12)',  border: 'rgba(91,184,245,.32)',  color: '#1a6fa8' },
  { bg: 'rgba(99,102,241,.09)',  border: 'rgba(99,102,241,.25)',  color: '#4f46e5' },
  { bg: 'rgba(245,158,11,.10)',  border: 'rgba(245,158,11,.28)',  color: '#b45309' },
];
const tagColorMap = {};
let tagColorIndex = 0;

function tagColor(tag) {
  if (!tagColorMap[tag]) {
    tagColorMap[tag] = TAG_PALETTE[tagColorIndex % TAG_PALETTE.length];
    tagColorIndex++;
  }
  return tagColorMap[tag];
}

/* ── Filters ─────────────────────────────────────────────── */
function collectTags() {
  const set = new Set();
  allPosts.forEach(p => (p.tags || []).forEach(t => set.add(t)));
  return [...set].sort((a, b) => a.localeCompare(b, 'it'));
}

function renderFilters(tags) {
  filterPills.innerHTML = '';
  blogFilters.hidden = tags.length === 0;
  if (tags.length === 0) return;

  const makeBtn = (label, tag) => {
    const btn = document.createElement('button');
    btn.className = 'blog-filter-btn' + (activeTag === tag ? ' is-active' : '');
    btn.textContent = label;
    btn.dataset.tag = tag;
    filterPills.appendChild(btn);
  };

  makeBtn('Tutti', '');
  tags.forEach(t => makeBtn(t, t));
}

/* ── Card rendering ──────────────────────────────────────── */
function cardHtml(p) {
  const tags = (p.tags || []);
  const tagsHtml = tags.map(t => {
    const c = tagColor(t);
    return `<span class="blog-card__tag" style="background:${c.bg};border-color:${c.border};color:${c.color}">${esc(t)}</span>`;
  }).join('');

  const thumb = p.thumbnail_url
    ? `<div class="blog-card__thumb blog-card__thumb--img" style="background-image:url('${esc(p.thumbnail_url)}')" role="img" aria-label="${esc(p.title)}"></div>`
    : `<div class="blog-card__thumb"></div>`;

  const href   = (p.web_url && p.web_url !== '#') ? esc(p.web_url) : null;
  const tag    = href ? 'a' : 'div';
  const attrs  = href ? ` href="${href}" target="_blank" rel="noopener noreferrer"` : '';

  return `
    <${tag}${attrs} class="blog-card">
      ${thumb}
      <div class="blog-card__body">
        ${tagsHtml ? `<div class="blog-card__tags">${tagsHtml}</div>` : ''}
        <h2 class="blog-card__title">${esc(p.title)}</h2>
        ${p.preview_text
          ? `<p class="blog-card__preview">${esc(p.preview_text)}</p>`
          : ''}
        <div class="blog-card__footer">
          <span class="blog-card__date">${formatDate(p.publish_date)}</span>
          ${href ? '<span class="blog-card__cta">Leggi →</span>' : ''}
        </div>
      </div>
    </${tag}>`;
}

/* ── Grid rendering ──────────────────────────────────────── */
function renderGrid() {
  const filtered = activeTag
    ? allPosts.filter(p => (p.tags || []).includes(activeTag))
    : allPosts;

  const empty = filtered.length === 0;
  blogGrid.hidden  = empty;
  blogEmpty.hidden = !empty;

  if (!empty) blogGrid.innerHTML = filtered.map(cardHtml).join('');
}

/* ── Events ──────────────────────────────────────────────── */
filterPills.addEventListener('click', e => {
  const btn = e.target.closest('.blog-filter-btn');
  if (!btn) return;
  activeTag = btn.dataset.tag;
  renderFilters(collectTags());
  renderGrid();
  const url = new URL(location.href);
  activeTag ? url.searchParams.set('tag', activeTag) : url.searchParams.delete('tag');
  history.replaceState(null, '', url);
});

emptyReset.addEventListener('click', () => {
  activeTag = '';
  const url = new URL(location.href);
  url.searchParams.delete('tag');
  history.replaceState(null, '', url);
  renderFilters(collectTags());
  renderGrid();
});

/* ── Init ────────────────────────────────────────────────── */
async function loadBlog() {
  try {
    const res = await fetch('archive.json');
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    allPosts = (data.posts || []).filter(p => p.title);

    activeTag = new URLSearchParams(location.search).get('tag') || '';

    blogLoading.hidden = true;

    /* Pre-assign tag colours in stable order */
    collectTags().forEach(t => tagColor(t));

    renderFilters(collectTags());
    renderGrid();
  } catch {
    blogLoading.innerHTML =
      '<span style="color:var(--red,#e53e3e)">Impossibile caricare gli articoli. Riprova più tardi.</span>';
  }
}

loadBlog();
