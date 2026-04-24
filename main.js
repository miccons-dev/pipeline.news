/* pipeline.news — main.js */
'use strict';

/* ── Intersection observer: fade-in sections ───────────── */
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

function observeAnimatable() {
  document.querySelectorAll(
    '.card, .step, .issue, .blog-card, .testimonial, .check-item, .faq-item'
  ).forEach(el => {
    if (!el.classList.contains('fade-up')) {
      el.classList.add('fade-up');
      observer.observe(el);
    }
  });
}

observeAnimatable();

/* ── Nav: add shadow on scroll ─────────────────────────── */
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 20);
}, { passive: true });

/* ── Helpers ────────────────────────────────────────────── */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeHtml(str) {
  const d = document.createElement('div');
  d.innerHTML = str ?? '';
  return d.textContent || '';
}

function formatDate(unixSeconds) {
  if (!unixSeconds) return '';
  return new Date(unixSeconds * 1000).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Europe/Rome'
  });
}

function fmtDate(ts) {
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'Europe/Rome'
  });
}
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
  if (post.thumbnail_url) return `url('${escapeHtml(post.thumbnail_url)}') center/cover no-repeat`;
  let h = 0;
  for (const ch of String(post.id)) h = (h * 31 + ch.charCodeAt(0)) & 0x7fffffff;
  return COVERS[h % COVERS.length];
}

/* ── Carica edizioni da posts.json ──────────────────────── */
async function loadPosts() {
  const container = document.getElementById('issues-container');
  if (!container) return;

  try {
    const [postsRes, archiveRes] = await Promise.all([
      fetch(`posts.json?_=${Date.now()}`),
      fetch(`archive.json?_=${Date.now()}`)
    ]);
    if (!postsRes.ok) throw new Error(`HTTP ${postsRes.status}`);
    const data = await postsRes.json();
    const archiveData = archiveRes.ok ? await archiveRes.json() : null;
    const totalIssues = archiveData ? (archiveData.posts || []).filter(p => p.kind === 'newsletter').length : 0;

    if (!data.posts || data.posts.length === 0) {
      container.innerHTML = '<p class="issues__empty">Le prossime edizioni saranno disponibili a breve.</p>';
      return;
    }

    const source = archiveData ? (archiveData.posts || []).filter(p => p.kind === 'newsletter') : data.posts;
    const newsletters = source.sort((a, b) => (b.publish_date || 0) - (a.publish_date || 0)).slice(0, 3);
    const cards = newsletters.map((post, idx) => {
      const issueNum = totalIssues ? totalIssues - idx : '';
      const logoOverlay = `<div class="archive-card__num">
        <img class="archive-card__logo" src="logo.png" alt="Pipeline">
        ${issueNum ? `<span class="archive-card__issue">#${issueNum}</span>` : ''}
      </div>`;
      const coverStyle = coverBg(post);
      return `
      <a class="blog-card" href="/archive.html#${escapeHtml(post.id)}" aria-label="${escapeHtml(decodeHtml(post.title))}">
        <div class="blog-card__cover" style="background:${coverStyle}">${logoOverlay}</div>
        <div class="blog-card__body">
          <h3 class="blog-card__title">${escapeHtml(decodeHtml(post.title))}</h3>
          ${post.subtitle ? `<p class="blog-card__subtitle">${escapeHtml(decodeHtml(post.subtitle))}</p>` : ''}
          <div class="blog-card__meta">
            <time class="blog-card__date">${fmtDate(post.publish_date)}</time>
            <span class="blog-card__read">Leggi →</span>
          </div>
        </div>
      </a>`;
    }).join('');

    container.innerHTML = `<div class="blog-grid blog-grid--home">${cards}</div>`;
    observeAnimatable();

  } catch {
    container.innerHTML = `
      <p class="issues__empty">
        Le edizioni saranno caricate a breve.
        <br><a href="#iscriviti">Iscriviti per riceverle direttamente in inbox →</a>
      </p>`;
  }
}

loadPosts();
