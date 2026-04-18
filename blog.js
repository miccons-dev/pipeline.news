'use strict';

/* ── DOM refs ───────────────────────────────────────────────────── */
const filterPills   = document.getElementById('filterPills');
const blogFilters   = document.getElementById('blogFilters');
const blogFeed      = document.getElementById('blogFeed');
const blogLoading   = document.getElementById('blogLoading');
const blogEmpty     = document.getElementById('blogEmpty');
const emptyReset    = document.getElementById('emptyReset');
const paginationEl  = document.getElementById('blogPagination');
const blogModal     = document.getElementById('blogModal');
const modalClose    = document.getElementById('modalClose');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalTags     = document.getElementById('modalTags');
const modalDate     = document.getElementById('modalDate');
const modalTitle    = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');
const modalBody     = document.getElementById('modalBody');

/* ── State ──────────────────────────────────────────────────────── */
const PER_PAGE  = 7;   // 1 featured + 6 grid
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

function tagsHtml(post) {
  return (post.tags || []).map(t => {
    const c = tagColor(t);
    return `<span class="post-tag" style="background:${c.bg};border-color:${c.bd};color:${c.c}">${esc(t)}</span>`;
  }).join('');
}

/* ── Cover gradients (stable per post) ──────────────────────────── */
const COVERS = [
  'linear-gradient(135deg,#0D2756 0%,#1E6BC5 100%)',
  'linear-gradient(135deg,#1E6BC5 0%,#5BB8F5 100%)',
  'linear-gradient(135deg,#00C4A0 0%,#0D2756 100%)',
  'linear-gradient(135deg,#0D2756 0%,#00A88A 100%)',
  'linear-gradient(135deg,#5BB8F5 0%,#4f46e5 100%)',
];

function coverBg(post) {
  if (post.thumbnail_url) return `url('${esc(post.thumbnail_url)}') center/cover no-repeat`;
  let h = 0;
  for (const ch of post.id) h = (h * 31 + ch.charCodeAt(0)) & 0x7fffffff;
  return COVERS[h % COVERS.length];
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

/* ── Card HTML ──────────────────────────────────────────────────── */
function cardHtml(p, featured) {
  const tags = tagsHtml(p);
  const cls  = 'blog-card' + (featured ? ' blog-card--featured' : '');
  return `
    <article class="${cls}" data-id="${esc(p.id)}" tabindex="0" role="button"
             aria-label="Leggi: ${esc(p.title)}">
      <div class="blog-card__cover" style="background:${coverBg(p)}">
        ${tags ? `<div class="blog-card__cover-tags">${tags}</div>` : ''}
      </div>
      <div class="blog-card__body">
        <h2 class="blog-card__title">${esc(p.title)}</h2>
        ${p.subtitle ? `<p class="blog-card__subtitle">${esc(p.subtitle)}</p>` : ''}
        <div class="blog-card__meta">
          <time class="blog-card__date">${formatDate(p.publish_date)}</time>
          <span class="blog-card__read">Leggi →</span>
        </div>
      </div>
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

  let html = '<div class="blog-grid">';
  page.forEach((p, i) => {
    html += cardHtml(p, i === 0 && currentPage === 1);
  });
  html += '</div>';
  blogFeed.innerHTML = html;

  blogFeed.querySelectorAll('.blog-card').forEach(card => {
    const open = () => {
      const post = allPosts.find(p => p.id === card.dataset.id);
      if (post) openModal(post);
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  renderPagination(totalPages);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Mid-article subscription CTA ──────────────────────────────── */
function buildCtaHtml(postNum) {
  return `
    <div class="modal-cta">
      <div class="modal-cta__label">Pipeline · Edizione #${postNum}</div>
      <h3 class="modal-cta__heading">Quella di martedì prossimo arriva solo nella tua inbox.</h3>
      <p class="modal-cta__sub">Ogni settimana: tattica pratica, framework testato, nessun rumore. Gratis.</p>
      <iframe src="https://subscribe-forms.beehiiv.com/5fd77ece-8a54-4f8e-8f22-47918300a6ca"
              data-test-id="beehiiv-embed"
              width="100%" height="160" frameborder="0" scrolling="no"
              class="modal-cta__iframe" title="Iscriviti a Pipeline"></iframe>
    </div>`;
}

function injectCta(html, postNum) {
  const half = Math.floor(html.length / 2);
  const cut  = html.indexOf('>', half);
  if (cut === -1) return html + buildCtaHtml(postNum);
  return html.slice(0, cut + 1) + buildCtaHtml(postNum) + html.slice(cut + 1);
}

/* ── Modal ──────────────────────────────────────────────────────── */
function openModal(post) {
  const idx     = allPosts.indexOf(post);
  const postNum = allPosts.length - idx;

  modalTags.innerHTML       = tagsHtml(post);
  modalDate.textContent     = formatDate(post.publish_date);
  modalTitle.textContent    = post.title;
  modalSubtitle.textContent = post.subtitle || '';
  modalSubtitle.hidden      = !post.subtitle;

  const rawHtml = post.content_html && post.content_html.trim()
    ? post.content_html
    : (post.preview_text
        ? `<p>${esc(post.preview_text)}</p>`
        : '<p style="color:var(--gray)">Contenuto non disponibile.</p>');

  modalBody.innerHTML = injectCta(rawHtml, postNum);

  blogModal.hidden = false;
  document.body.style.overflow = 'hidden';
  blogModal.scrollTop = 0;
  history.replaceState(null, '', '#' + post.id);
}

function closeModal() {
  blogModal.hidden = true;
  document.body.style.overflow = '';
  history.replaceState(null, '', location.pathname + (location.search || ''));
}

modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !blogModal.hidden) closeModal();
});

/* ── Filter & pagination events ─────────────────────────────────── */
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

    const hash = location.hash.slice(1);
    if (hash) {
      const post = allPosts.find(p => p.id === hash);
      if (post) openModal(post);
    }
  } catch {
    blogLoading.innerHTML =
      '<span style="color:var(--red,#e53e3e)">Impossibile caricare gli articoli. Riprova più tardi.</span>';
  }
}

loadBlog();
