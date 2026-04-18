'use strict';

/* ── DOM refs ───────────────────────────────────────────────────── */
const filterPills  = document.getElementById('filterPills');
const blogFilters  = document.getElementById('blogFilters');
const blogFeed     = document.getElementById('blogFeed');
const blogLoading  = document.getElementById('blogLoading');
const blogEmpty    = document.getElementById('blogEmpty');
const emptyReset   = document.getElementById('emptyReset');
const paginationEl = document.getElementById('blogPagination');

/* ── State ──────────────────────────────────────────────────────── */
const PER_PAGE  = 5;
let allPosts    = [];
let activeTag   = '';
let currentPage = 1;

const MONTHS = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];

/* ── Utils ──────────────────────────────────────────────────────── */
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

/* ── Tag colours ────────────────────────────────────────────────── */
const PALETTE = [
  { bg: 'rgba(30,107,197,.09)',  bd: 'rgba(30,107,197,.22)', c: '#1E6BC5' },
  { bg: 'rgba(0,196,160,.09)',   bd: 'rgba(0,196,160,.28)',  c: '#00A88A' },
  { bg: 'rgba(91,184,245,.12)',  bd: 'rgba(91,184,245,.32)', c: '#1a6fa8' },
  { bg: 'rgba(99,102,241,.09)',  bd: 'rgba(99,102,241,.25)', c: '#4f46e5' },
  { bg: 'rgba(245,158,11,.10)',  bd: 'rgba(245,158,11,.28)', c: '#b45309' },
];
const colorMap = {};
let colorIdx = 0;
function tagColor(tag) {
  if (!colorMap[tag]) colorMap[tag] = PALETTE[colorIdx++ % PALETTE.length];
  return colorMap[tag];
}

/* ── Filters ────────────────────────────────────────────────────── */
function collectTags() {
  const set = new Set();
  allPosts.forEach(p => (p.tags || []).forEach(t => set.add(t)));
  return [...set].sort((a, b) => a.localeCompare(b, 'it'));
}

function renderFilters(tags) {
  filterPills.innerHTML = '';
  blogFilters.hidden = tags.length === 0;
  if (!tags.length) return;
  const mkBtn = (label, tag) => {
    const btn = document.createElement('button');
    btn.className = 'page-filter-btn' + (activeTag === tag ? ' is-active' : '');
    btn.textContent = label;
    btn.dataset.tag = tag;
    filterPills.appendChild(btn);
  };
  mkBtn('Tutti', '');
  tags.forEach(t => mkBtn(t, t));
}

/* ── Article HTML (full content, vertical feed) ─────────────────── */
function postHtml(p) {
  const tagsHtml = (p.tags || []).map(t => {
    const c = tagColor(t);
    return `<span class="post-tag" style="background:${c.bg};border-color:${c.bd};color:${c.c}">${esc(t)}</span>`;
  }).join('');

  const bodyHtml = p.content_html
    ? `<div class="blog-post__content">${p.content_html}</div>`
    : p.preview_text
      ? `<p class="blog-post__excerpt">${esc(p.preview_text)}</p>`
      : '';

  return `
    <article class="blog-post">
      <div class="blog-post__meta">
        ${tagsHtml ? `<div class="blog-post__tags">${tagsHtml}</div>` : ''}
        <time class="blog-post__date">${formatDate(p.publish_date)}</time>
      </div>
      <h2 class="blog-post__title">${esc(p.title)}</h2>
      ${p.subtitle ? `<p class="blog-post__subtitle">${esc(p.subtitle)}</p>` : ''}
      ${bodyHtml}
    </article>`;
}

/* ── Pagination ─────────────────────────────────────────────────── */
function renderPagination(totalPages) {
  if (totalPages <= 1) { paginationEl.hidden = true; return; }
  paginationEl.hidden = false;
  const items = [];
  items.push(`<button class="pag-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>← Precedenti</button>`);
  const delta = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= delta) {
      items.push(`<button class="pag-btn${i === currentPage ? ' is-active' : ''}" data-page="${i}">${i}</button>`);
    } else if (Math.abs(i - currentPage) === delta + 1) {
      items.push(`<span class="pag-ellipsis">…</span>`);
    }
  }
  items.push(`<button class="pag-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Successive →</button>`);
  paginationEl.innerHTML = items.join('');
}

/* ── Feed render ────────────────────────────────────────────────── */
function renderFeed() {
  const filtered = activeTag
    ? allPosts.filter(p => (p.tags || []).includes(activeTag))
    : allPosts;

  const total      = filtered.length;
  const totalPages = Math.ceil(total / PER_PAGE) || 1;
  if (currentPage > totalPages) currentPage = 1;

  const page = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  blogFeed.hidden  = total === 0;
  blogEmpty.hidden = total > 0;
  if (total === 0) { paginationEl.hidden = true; return; }

  blogFeed.innerHTML = '<div class="blog-feed">' + page.map(postHtml).join('') + '</div>';
  renderPagination(totalPages);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Events ─────────────────────────────────────────────────────── */
filterPills.addEventListener('click', e => {
  const btn = e.target.closest('.page-filter-btn');
  if (!btn) return;
  activeTag = btn.dataset.tag;
  currentPage = 1;
  renderFilters(collectTags());
  renderFeed();
  const url = new URL(location.href);
  activeTag ? url.searchParams.set('tag', activeTag) : url.searchParams.delete('tag');
  url.searchParams.delete('p');
  history.replaceState(null, '', url);
});

paginationEl.addEventListener('click', e => {
  const btn = e.target.closest('.pag-btn');
  if (!btn || btn.disabled) return;
  currentPage = parseInt(btn.dataset.page, 10);
  renderFeed();
  const url = new URL(location.href);
  currentPage > 1 ? url.searchParams.set('p', currentPage) : url.searchParams.delete('p');
  history.replaceState(null, '', url);
});

emptyReset.addEventListener('click', () => {
  activeTag = '';
  currentPage = 1;
  const url = new URL(location.href);
  url.searchParams.delete('tag');
  url.searchParams.delete('p');
  history.replaceState(null, '', url);
  renderFilters(collectTags());
  renderFeed();
});

/* ── Init ───────────────────────────────────────────────────────── */
async function loadBlog() {
  try {
    const res = await fetch('blog.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    allPosts = (data.posts || []).filter(p => p.title);

    const params = new URLSearchParams(location.search);
    activeTag   = params.get('tag') || '';
    currentPage = parseInt(params.get('p'), 10) || 1;

    blogLoading.hidden = true;
    collectTags().forEach(t => tagColor(t));
    renderFilters(collectTags());
    renderFeed();
  } catch {
    blogLoading.innerHTML =
      '<span style="color:var(--red,#e53e3e)">Impossibile caricare gli articoli. Riprova più tardi.</span>';
  }
}

loadBlog();
