'use strict';

/* ── DOM refs ───────────────────────────────────────────────────── */
const loadingEl     = document.getElementById('archive-loading');
const filtersEl     = document.getElementById('archive-filters');
const tagPillsEl    = document.getElementById('archive-tag-pills');
const feedEl        = document.getElementById('archive-feed');
const emptyEl       = document.getElementById('archive-empty');
const emptyReset    = document.getElementById('archive-empty-reset');
const paginationEl  = document.getElementById('archive-pagination');
const blogModal     = document.getElementById('blogModal');
const modalClose    = document.getElementById('modalClose');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalLogo     = document.getElementById('modalLogo');
const modalTags     = document.getElementById('modalTags');
const modalTitle    = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');
const modalDate     = document.getElementById('modalDate');
const modalBody     = document.getElementById('modalBody');

/* ── State ──────────────────────────────────────────────────────── */
const PER_PAGE  = 7;   // 1 featured + 6 grid
let allPosts    = [];
let activeTag   = null;
let currentPage = 1;

/* ── Utils ──────────────────────────────────────────────────────── */
function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'Europe/Rome'
  });
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── Nav shadow ─────────────────────────────────────────────────── */
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 20);
}, { passive: true });

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

/* ── Modal tag cloud ─────────────────────────────────────────────── */
function tagFreq() {
  const f = {};
  allPosts.forEach(p => (p.tags || []).forEach(t => { f[t] = (f[t] || 0) + 1; }));
  return f;
}

function modalTagCloud(tags) {
  const freq = tagFreq();
  const maxFreq = Math.max(1, ...Object.values(freq));
  const items = tags.map(t => {
    const c = tagColor(t);
    const f = freq[t] || 1;
    const tier = f >= maxFreq * .7 ? 'lg' : f >= maxFreq * .35 ? 'md' : 'sm';
    return `<span class="tag-cloud__item tag-cloud__item--${tier}"
      style="background:${c.bg};border-color:${c.bd};color:${c.c}"
    >${esc(t)}</span>`;
  }).join('');
  return `<div class="tag-cloud">${items}</div>`;
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

/* ── Tag filters ────────────────────────────────────────────────── */
function renderFilters() {
  const set = new Set();
  allPosts.forEach(p => (p.tags || []).forEach(t => t && set.add(t)));
  const tags = [...set].sort((a, b) => a.localeCompare(b, 'it'));
  if (!tags.length) { filtersEl.hidden = true; return; }

  const mkBtn = (label, tag) => {
    const btn = document.createElement('button');
    btn.className = 'page-filter-btn' + ((activeTag || '') === tag ? ' is-active' : '');
    btn.textContent = label;
    btn.dataset.tag = tag;
    tagPillsEl.appendChild(btn);
  };
  mkBtn('Tutte', '');
  tags.forEach(t => mkBtn(t, t));
  filtersEl.hidden = false;
}

tagPillsEl.addEventListener('click', e => {
  const btn = e.target.closest('.page-filter-btn');
  if (!btn) return;
  activeTag = btn.dataset.tag || null;
  tagPillsEl.querySelectorAll('.page-filter-btn').forEach(b =>
    b.classList.toggle('is-active', b.dataset.tag === (activeTag || ''))
  );
  currentPage = 1;
  renderFeed();
});

/* ── Card HTML ──────────────────────────────────────────────────── */
function cardHtml(p, issueNum, featured) {
  const tags = tagsHtml(p);
  const cls  = 'blog-card' + (featured ? ' blog-card--featured' : '');
  return `
    <article class="${cls}" data-id="${esc(p.id)}" tabindex="0" role="button"
             aria-label="Edizione #${issueNum}: ${esc(p.title)}">
      <div class="blog-card__cover" style="background:${coverBg(p)}">
        <div class="archive-card__num">#${issueNum}</div>
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

  feedEl.hidden  = total === 0;
  emptyEl.hidden = total > 0;
  if (total === 0) { paginationEl.hidden = true; return; }

  let html = '<div class="blog-grid">';
  page.forEach((p, i) => {
    const issueNum = allPosts.length - allPosts.indexOf(p);
    html += cardHtml(p, issueNum, i === 0 && currentPage === 1);
  });
  html += '</div>';
  feedEl.innerHTML = html;

  feedEl.querySelectorAll('.blog-card').forEach(card => {
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

/* ── Mid-article CTA ────────────────────────────────────────────── */
function buildCtaHtml(issueNum) {
  return `
    <div class="modal-cta">
      <div class="modal-cta__label">Pipeline · Edizione #${issueNum}</div>
      <h3 class="modal-cta__heading">Quella di martedì prossimo arriva direttamente nella tua inbox.</h3>
      <p class="modal-cta__sub">Ogni martedì: una tattica di vendita, uno script pronto e un tool da usare quella stessa mattina. Nessun rumore. Gratis.</p>
      <iframe src="https://subscribe-forms.beehiiv.com/5fd77ece-8a54-4f8e-8f22-47918300a6ca"
              data-test-id="beehiiv-embed"
              width="100%" height="80" frameborder="0" scrolling="no"
              class="modal-cta__iframe" title="Iscriviti a Pipeline"></iframe>
    </div>
    <div class="modal-cta__fade"></div>`;
}

function injectCta(html, issueNum) {
  const half = Math.floor(html.length / 2);
  const cut  = html.indexOf('>', half);
  if (cut === -1) return html + buildCtaHtml(issueNum);
  return html.slice(0, cut + 1) + buildCtaHtml(issueNum) + html.slice(cut + 1);
}

/* ── Dynamic meta (SEO / social sharing) ───────────────────────── */
function setMeta(attr, val, content) {
  let el = document.querySelector(`meta[${attr}="${val}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, val); document.head.appendChild(el); }
  el.setAttribute('content', content);
}
const _defaultTitle = document.title;

/* ── Modal ──────────────────────────────────────────────────────── */
function openModal(post) {
  const issueNum = allPosts.length - allPosts.indexOf(post);

  modalTags.innerHTML       = post.tags && post.tags.length ? modalTagCloud(post.tags) : '';
  modalTitle.textContent    = post.title;
  modalSubtitle.textContent = post.subtitle || post.preview_text || '';
  modalSubtitle.hidden      = !(post.subtitle || post.preview_text);
  modalDate.textContent     = formatDate(post.publish_date);

  let rawHtml = post.content_html && post.content_html.trim()
    ? post.content_html
    : (post.preview_text
        ? `<p>${esc(post.preview_text)}</p>`
        : '<p style="color:var(--gray)">Contenuto non disponibile.</p>');

  const logoRe = /<!--\s*PL_LOGO\s*-->([\s\S]*?)<!--\s*\/PL_LOGO\s*-->/i;
  const logoMatch = rawHtml.match(logoRe);
  if (logoMatch) {
    modalLogo.innerHTML = logoMatch[1];
    modalLogo.hidden = false;
    rawHtml = rawHtml.replace(logoRe, '');
  } else {
    modalLogo.hidden = true;
  }

  modalBody.innerHTML = injectCta(rawHtml, issueNum);

  blogModal.hidden = false;
  document.body.style.overflow = 'hidden';
  blogModal.scrollTop = 0;
  history.replaceState(null, '', '#' + post.id);
  document.title = `${post.title} — Pipeline.news`;
  setMeta('name', 'description', post.subtitle || post.preview_text || '');
  setMeta('property', 'og:title', `${post.title} — Pipeline.news`);
  setMeta('property', 'og:description', post.subtitle || post.preview_text || '');
  setMeta('property', 'og:url', `https://www.pipeline.news/archive.html#${esc(post.id)}`);
}

function closeModal() {
  blogModal.hidden = true;
  document.body.style.overflow = '';
  history.replaceState(null, '', location.pathname);
  document.title = _defaultTitle;
  setMeta('name', 'description', 'Tutte le edizioni di Pipeline, la newsletter italiana per i professionisti della vendita B2B.');
  setMeta('property', 'og:title', 'Archivio Newsletter — Pipeline.news');
  setMeta('property', 'og:description', 'Tutte le edizioni di Pipeline: tattiche di vendita B2B ogni martedì. Gratis.');
  setMeta('property', 'og:url', 'https://www.pipeline.news/archive.html');
}

modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !blogModal.hidden) closeModal();
});

paginationEl.addEventListener('click', e => {
  const btn = e.target.closest('.pag-btn');
  if (!btn || btn.disabled) return;
  currentPage = parseInt(btn.dataset.page, 10);
  renderFeed();
});

emptyReset.addEventListener('click', () => {
  activeTag = null;
  tagPillsEl.querySelectorAll('.page-filter-btn').forEach(b =>
    b.classList.toggle('is-active', b.dataset.tag === '')
  );
  currentPage = 1;
  renderFeed();
});

/* ── Init ───────────────────────────────────────────────────────── */
async function loadArchive() {
  try {
    const res = await fetch(`archive.json?_=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    loadingEl.hidden = true;

    if (!data.posts || data.posts.length === 0) {
      feedEl.innerHTML = '<p style="text-align:center;color:var(--gray);padding:80px 0">Nessuna edizione disponibile.</p>';
      return;
    }

    allPosts = data.posts.slice().sort((a, b) => (b.publish_date || 0) - (a.publish_date || 0));
    allPosts.flatMap(p => p.tags || []).forEach(t => tagColor(t));
    renderFilters();
    renderFeed();

    const hash = location.hash.slice(1);
    if (hash) {
      const post = allPosts.find(p => p.id === hash);
      if (post) openModal(post);
    }
  } catch {
    loadingEl.hidden = true;
    feedEl.innerHTML = '<p style="text-align:center;color:var(--gray);padding:80px 0">Impossibile caricare l\'archivio. Riprova più tardi.</p>';
  }
}

loadArchive();
