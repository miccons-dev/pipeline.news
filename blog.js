'use strict';

/* ── DOM refs ───────────────────────────────────────────────────── */
const loadingEl     = document.getElementById('blog-loading');
const filtersEl     = document.getElementById('blog-filters');
const tagPillsEl    = document.getElementById('blog-tag-pills');
const feedEl        = document.getElementById('blog-feed');
const emptyEl       = document.getElementById('blog-empty');
const emptyReset    = document.getElementById('blog-empty-reset');
const paginationEl  = document.getElementById('blog-pagination');
const blogModal     = document.getElementById('blogModal');
const modalClose    = document.getElementById('modalClose');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalTags     = document.getElementById('modalTags');
const modalTitle    = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');
const modalDate     = document.getElementById('modalDate');
const modalBody     = document.getElementById('modalBody');

/* ── State ──────────────────────────────────────────────────────── */
const PER_PAGE  = 7;
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

function decodeHtml(str) {
  const d = document.createElement('div');
  d.innerHTML = str ?? '';
  return d.textContent || '';
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

function coverGradient(post) {
  let h = 0;
  for (const ch of post.id) h = (h * 31 + ch.charCodeAt(0)) & 0x7fffffff;
  return COVERS[h % COVERS.length];
}

/* ── Extract cover media from content_html ───────────────────────── */
function extractCover(post) {
  if (post.thumbnail_url) return { type: 'img', src: post.thumbnail_url };
  const html = post.content_html || '';
  const imgMatch = html.match(/<img[^>]+src=["'](https?[^"']+)["']/i);
  if (imgMatch) return { type: 'img', src: imgMatch[1] };
  const svgMatch = html.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) return { type: 'svg', markup: svgMatch[0] };
  return { type: 'gradient', bg: coverGradient(post) };
}

/* ── Tag filters ────────────────────────────────────────────────── */
function renderFilters() {
  const set = new Set();
  allPosts.forEach(p => (p.tags || []).forEach(t => t && set.add(t)));
  const tags = [...set].sort((a, b) => a.localeCompare(b, 'it'));
  tagPillsEl.innerHTML = '';
  if (!tags.length) { filtersEl.hidden = true; return; }
  const mkBtn = (label, tag) => {
    const btn = document.createElement('button');
    btn.className = 'page-filter-btn' + ((activeTag || '') === tag ? ' is-active' : '');
    btn.textContent = label;
    btn.dataset.tag = tag;
    tagPillsEl.appendChild(btn);
  };
  mkBtn('Tutti', '');
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
function postHtml(p) {
  const tagsHtml = (p.tags || []).map(t => {
    const c = tagColor(t);
    return `<span class="post-tag" style="background:${c.bg};border-color:${c.bd};color:${c.c}">${esc(t)}</span>`;
  }).join('');

  const href = `/post.html?id=${encodeURIComponent(p.id || '')}`;
  const excerpt = decodeHtml(p.preview_text || '');
  const thumbUrl = p.thumbnail_url || p.image_url || '';
  const thumbHtml = thumbUrl
    ? `<div class="blog-post__thumb"><img src="${esc(thumbUrl)}" alt="${esc(decodeHtml(p.image_alt || p.title || ''))}" loading="lazy"></div>`
    : '';

  return `
    <a href="${href}" class="blog-post${thumbUrl ? ' blog-post--has-thumb' : ''}">
      ${thumbHtml}
      <div class="blog-post__body">
        <div class="blog-post__meta">
          ${tagsHtml ? `<div class="blog-post__tags">${tagsHtml}</div>` : ''}
          <time class="blog-post__date">${formatDate(p.publish_date)}</time>
        </div>
        <h2 class="blog-post__title">${esc(decodeHtml(p.title))}</h2>
        ${p.subtitle ? `<p class="blog-post__subtitle">${esc(decodeHtml(p.subtitle))}</p>` : ''}
        ${excerpt ? `<p class="blog-post__excerpt">${esc(excerpt)}</p>` : ''}
        <span class="blog-post__read-more">Leggi l'articolo →</span>
      </div>
    </a>`;
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

  feedEl.innerHTML = '<div class="blog-feed">' + page.map(postHtml).join('') + '</div>';

  renderPagination(totalPages);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


/* ── Dynamic meta ───────────────────────────────────────────────── */
function setMeta(attr, val, content) {
  let el = document.querySelector(`meta[${attr}="${val}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, val); document.head.appendChild(el); }
  el.setAttribute('content', content);
}
const _defaultTitle = document.title;

/* ── Modal ──────────────────────────────────────────────────────── */
function openModal(post) {
  modalTags.innerHTML       = post.tags && post.tags.length ? modalTagCloud(post.tags) : '';
  modalTitle.textContent    = post.title;
  modalSubtitle.textContent = post.subtitle || post.preview_text || '';
  modalSubtitle.hidden      = !(post.subtitle || post.preview_text);
  modalDate.textContent     = formatDate(post.publish_date);

  const rawHtml = post.content_html && post.content_html.trim()
    ? post.content_html
    : (post.preview_text
        ? `<p>${esc(post.preview_text)}</p>`
        : '<p style="color:var(--gray)">Contenuto non disponibile.</p>');

  modalBody.innerHTML = rawHtml;

  blogModal.hidden = false;
  document.body.style.overflow = 'hidden';
  blogModal.scrollTop = 0;
  history.replaceState(null, '', '#' + post.id);
  document.title = `${post.title} — Pipeline.news`;
  setMeta('name', 'description', post.subtitle || post.preview_text || '');
  setMeta('property', 'og:title', `${post.title} — Pipeline.news`);
  setMeta('property', 'og:description', post.subtitle || post.preview_text || '');
  setMeta('property', 'og:url', `https://www.pipeline.news/blog.html#${esc(post.id)}`);
  const imgUrl = post.thumbnail_url || post.image_url || 'https://www.pipeline.news/logo.png';
  setMeta('property', 'og:image', imgUrl);
  setMeta('name', 'twitter:image', imgUrl);
}

function closeModal() {
  blogModal.hidden = true;
  document.body.style.overflow = '';
  history.replaceState(null, '', location.pathname);
  document.title = _defaultTitle;
  setMeta('name', 'description', 'Approfondimenti su vendita B2B, leadership commerciale e crescita professionale. Articoli esclusivi del team Pipeline.');
  setMeta('property', 'og:title', 'Blog — Pipeline.news');
  setMeta('property', 'og:description', 'Approfondimenti su vendita B2B, leadership commerciale e crescita professionale.');
  setMeta('property', 'og:url', 'https://www.pipeline.news/blog.html');
  setMeta('property', 'og:image', 'https://www.pipeline.news/logo.png');
  setMeta('name', 'twitter:image', 'https://www.pipeline.news/logo.png');
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
async function loadBlog() {
  try {
    const res = await fetch(`blog.json?_=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    loadingEl.hidden = true;

    if (!data.posts || data.posts.length === 0) {
      feedEl.innerHTML = '<p style="text-align:center;color:var(--gray);padding:80px 0">Nessun articolo disponibile.</p>';
      return;
    }

    allPosts = data.posts
      .filter(p => p.title)
      .sort((a, b) => (b.publish_date || 0) - (a.publish_date || 0));

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
    feedEl.innerHTML = '<p style="text-align:center;color:var(--gray);padding:80px 0">Impossibile caricare gli articoli. Riprova più tardi.</p>';
  }
}

loadBlog();
