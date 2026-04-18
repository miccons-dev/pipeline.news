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
];

function coverBg(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) & 0x7fffffff;
  return COVERS[h % COVERS.length];
}

/* ── Carica edizioni da posts.json ──────────────────────── */
async function loadPosts() {
  const container = document.getElementById('issues-container');
  if (!container) return;

  try {
    const res = await fetch('posts.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data.posts || data.posts.length === 0) {
      container.innerHTML = '<p class="issues__empty">Le prossime edizioni saranno disponibili a breve.</p>';
      return;
    }

    const cards = data.posts.slice(0, 3).map(post => `
      <a class="blog-card" href="/archive.html#${escapeHtml(post.id)}" aria-label="${escapeHtml(post.title)}">
        <div class="blog-card__cover" style="background:${coverBg(post.id)}"></div>
        <div class="blog-card__body">
          <h3 class="blog-card__title">${escapeHtml(post.title)}</h3>
          ${post.subtitle ? `<p class="blog-card__subtitle">${escapeHtml(post.subtitle)}</p>` : ''}
          <div class="blog-card__meta">
            <time class="blog-card__date">${fmtDate(post.publish_date)}</time>
            <span class="blog-card__read">Leggi →</span>
          </div>
        </div>
      </a>
    `).join('');

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
