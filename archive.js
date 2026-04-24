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
const modalTags       = document.getElementById('modalTags');
const modalTitle      = document.getElementById('modalTitle');
const modalSubtitle   = document.getElementById('modalSubtitle');
const modalDate       = document.getElementById('modalDate');
const modalBody       = document.getElementById('modalBody');
const modalHeroImg    = document.getElementById('modalHeroImg');
const modalCtaOverlay = document.getElementById('modalCtaOverlay');
const modalCtaLabel   = document.getElementById('modalCtaLabel');
const modalCtaDismiss = document.getElementById('modalCtaDismiss');

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
  'linear-gradient(135deg,#4f46e5 0%,#0D2756 100%)',
  'linear-gradient(135deg,#00A88A 0%,#1E6BC5 100%)',
  'linear-gradient(135deg,#0D2756 0%,#5BB8F5 100%)',
  'linear-gradient(135deg,#1E6BC5 0%,#00C4A0 100%)',
  'linear-gradient(135deg,#4f46e5 0%,#5BB8F5 100%)',
  'linear-gradient(135deg,#00C4A0 0%,#4f46e5 100%)',
  'linear-gradient(135deg,#5BB8F5 0%,#0D2756 100%)',
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
  tagPillsEl.innerHTML = '';
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
             aria-label="Edizione #${issueNum}: ${esc(decodeHtml(p.title))}">
      <div class="blog-card__cover" style="background:${coverBg(p)}">
        <div class="archive-card__num"><img class="archive-card__logo" src="logo.png" alt="Pipeline"><span class="archive-card__issue">#${issueNum}</span></div>
        ${tags ? `<div class="blog-card__cover-tags">${tags}</div>` : ''}
      </div>
      <div class="blog-card__body">
        <h2 class="blog-card__title">${esc(decodeHtml(p.title))}</h2>
        ${p.subtitle ? `<p class="blog-card__subtitle">${esc(decodeHtml(p.subtitle))}</p>` : ''}
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

/* ── Strip Beehiiv boilerplate footer from newsletter body ──────── */
function stripNewsletterFooter(html) {
  const root = document.createElement('div');
  root.innerHTML = html;
  const MARKERS = ['Hai trovato utile', 'Mandala a un collega', 'Disdici', 'Leggi le edizioni precedenti'];
  const container = (root.children.length === 1) ? root.children[0] : root;
  for (const child of [...container.children]) {
    if (MARKERS.some(m => child.textContent.includes(m))) {
      let node = child;
      while (node) { const next = node.nextElementSibling; node.remove(); node = next; }
      break;
    }
  }
  return root.innerHTML;
}

/* ── Dynamic meta (SEO / social sharing) ───────────────────────── */
function setMeta(attr, val, content) {
  let el = document.querySelector(`meta[${attr}="${val}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, val); document.head.appendChild(el); }
  el.setAttribute('content', content);
}
const _defaultTitle = document.title;

/* ── Share bar ──────────────────────────────────────────────────── */
const LI_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;
const X_SVG  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;

function shareBarHtml(url, title) {
  const eu = encodeURIComponent(url);
  const et = encodeURIComponent(title);
  return `<div class="share-bar">
    <span class="share-bar__label">Condividi</span>
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${eu}" target="_blank" rel="noopener" class="share-btn">${LI_SVG} LinkedIn</a>
    <a href="https://twitter.com/intent/tweet?url=${eu}&text=${et}" target="_blank" rel="noopener" class="share-btn">${X_SVG} X</a>
    <button class="share-btn share-btn--copy" data-url="${esc(url)}">Copia link</button>
  </div>`;
}

document.addEventListener('click', e => {
  const btn = e.target.closest('.share-btn--copy');
  if (!btn) return;
  navigator.clipboard.writeText(btn.dataset.url).then(() => {
    const prev = btn.textContent;
    btn.textContent = 'Copiato ✓';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = prev; btn.classList.remove('copied'); }, 2000);
  });
});

/* ── Modal ──────────────────────────────────────────────────────── */
function openModal(post) {
  const issueNum = allPosts.length - allPosts.indexOf(post);

  modalTags.innerHTML       = post.tags && post.tags.length ? modalTagCloud(post.tags) : '';
  modalTitle.textContent    = decodeHtml(post.title);
  modalSubtitle.textContent = decodeHtml(post.subtitle || post.preview_text || '');
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

  modalBody.innerHTML = stripNewsletterFooter(rawHtml);

  const heroUrl = post.thumbnail_url || post.image_url || '';
  const heroInContent = heroUrl && modalBody.querySelector(`img[src*="${heroUrl.split('/').pop().split('?')[0]}"]`);
  if (heroUrl && !heroInContent) {
    modalHeroImg.innerHTML = `<img src="${esc(heroUrl)}" alt="${esc(decodeHtml(post.image_alt || post.title || ''))}" class="modal-hero-img__img">`;
    modalHeroImg.hidden = false;
  } else {
    modalHeroImg.hidden = true;
  }

  const safeId   = post.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const shareUrl = `https://www.pipeline.news/share/${safeId}.html`;
  document.getElementById('modalShare').innerHTML = shareBarHtml(shareUrl, decodeHtml(post.title));

  modalCtaLabel.textContent = `Pipeline · Edizione #${issueNum}`;
  modalCtaOverlay.hidden = sessionStorage.getItem('ctaSeen') === '1';

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
  modalHeroImg.hidden = true;
  modalCtaOverlay.hidden = sessionStorage.getItem('ctaSeen') === '1';
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

modalCtaDismiss.addEventListener('click', () => {
  modalCtaOverlay.hidden = true;
  sessionStorage.setItem('ctaSeen', '1');
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

    const openId = new URLSearchParams(location.search).get('open') || location.hash.slice(1);
    if (openId) {
      const post = allPosts.find(p => p.id === openId);
      if (post) openModal(post);
    }
  } catch {
    loadingEl.hidden = true;
    feedEl.innerHTML = '<p style="text-align:center;color:var(--gray);padding:80px 0">Impossibile caricare l\'archivio. Riprova più tardi.</p>';
  }
}

loadArchive();
