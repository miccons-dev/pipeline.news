/* pipeline.news — main.js */
'use strict';

/* ── Smooth form handling ──────────────────────────────── */
document.querySelectorAll('form[id^="form-"]').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const btn   = form.querySelector('button[type="submit"]');
    const email = input.value.trim();

    if (!email) return;

    const originalText = btn.textContent;
    btn.textContent = 'Un secondo...';
    btn.disabled = true;

    // Simulate async (replace with real API call, e.g. Beehiiv, Mailchimp, ConvertKit)
    setTimeout(() => {
      form.innerHTML = `
        <div class="form-success">
          <span class="form-success__icon">🎉</span>
          <p class="form-success__msg">
            Benvenuto in Pipeline! Controlla la tua inbox per confermare l'iscrizione.
          </p>
        </div>
      `;
    }, 900);
  });
});

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

document.querySelectorAll(
  '.card, .step, .issue, .testimonial, .check-item, .faq-item'
).forEach(el => {
  el.classList.add('fade-up');
  observer.observe(el);
});

/* ── Nav: add shadow on scroll ─────────────────────────── */
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 20);
}, { passive: true });
