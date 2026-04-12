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
    '.card, .step, .issue, .testimonial, .check-item, .faq-item'
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
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
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

    container.innerHTML = data.posts.map(post => `
      <article class="issue">
        <div class="issue__meta">
          <span class="issue__date">${formatDate(post.publish_date)}</span>
        </div>
        <h3 class="issue__title">${escapeHtml(post.title)}</h3>
        <p class="issue__excerpt">${escapeHtml(post.subtitle || post.preview_text || '')}</p>
        <a href="${escapeHtml(post.web_url)}" class="issue__link" target="_blank" rel="noopener noreferrer">
          Leggi l'anteprima →
        </a>
      </article>
    `).join('');

    observeAnimatable();

  } catch {
    // Fallback: mostra messaggio neutro senza esporre dettagli tecnici
    container.innerHTML = `
      <p class="issues__empty">
        Le edizioni saranno caricate a breve.
        <br><a href="#iscriviti">Iscriviti per riceverle direttamente in inbox →</a>
      </p>`;
  }
}

loadPosts();
