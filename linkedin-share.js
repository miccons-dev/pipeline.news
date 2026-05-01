/* pipeline.news — linkedin-share.js */
(function () {
  'use strict';

  var FIXED_TAGS = ['#pipelinenewsletter', '#vendite', '#sales'];

  /* Extract first meaningful paragraph text from HTML */
  function extractExcerpt(html, maxLen) {
    maxLen = maxLen || 240;
    if (!html) return '';
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    var candidates = tmp.querySelectorAll('p, li, blockquote');
    for (var i = 0; i < candidates.length; i++) {
      var t = candidates[i].textContent.trim();
      if (t.length > 60) {
        return t.length > maxLen ? t.slice(0, maxLen) + '…' : t;
      }
    }
    var fallback = tmp.textContent.trim();
    return fallback.length > maxLen ? fallback.slice(0, maxLen) + '…' : fallback;
  }

  function toHashtag(tag) {
    return '#' + tag.toLowerCase()
      .replace(/[\s-]+/g, '')
      .replace(/[^a-z0-9àèéìòù]/g, '');
  }

  function buildPostText(title, excerpt, subtitle, tags, url) {
    var hook = excerpt || subtitle || '';
    var parts = [];

    if (hook) {
      parts.push(hook + '\n');
    } else {
      parts.push('"' + title + '"\n');
    }

    parts.push('📬 Da Pipeline.news — la newsletter italiana per chi lavora nelle vendite.');
    parts.push('👉 ' + url);

    var hashtags = FIXED_TAGS.slice();
    if (Array.isArray(tags)) {
      tags.slice(0, 3).forEach(function (t) {
        var h = toHashtag(t);
        if (h.length > 1 && hashtags.indexOf(h) === -1) hashtags.push(h);
      });
    }
    parts.push('\n' + hashtags.join(' '));

    return parts.join('\n');
  }

  /* ── Toast ──────────────────────────────────────────────────────── */
  function showToast(msg) {
    var existing = document.getElementById('li-share-toast');
    if (existing) existing.remove();

    if (!document.getElementById('li-toast-style')) {
      var s = document.createElement('style');
      s.id = 'li-toast-style';
      s.textContent = [
        '@keyframes li-toast-in{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}',
        '#li-share-toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);',
        'background:#0D2756;color:#fff;font-family:Inter,system-ui,sans-serif;',
        'font-size:14px;font-weight:500;padding:14px 22px;border-radius:10px;',
        'box-shadow:0 8px 32px rgba(0,0,0,.3);z-index:9999;',
        'display:flex;align-items:center;gap:10px;white-space:nowrap;max-width:90vw;',
        'animation:li-toast-in .25s ease;}',
      ].join('');
      document.head.appendChild(s);
    }

    var toast = document.createElement('div');
    toast.id = 'li-share-toast';
    toast.innerHTML = '<span style="color:#00C4A0;font-size:16px">✓</span> ' + msg;
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.style.transition = 'opacity .4s';
      toast.style.opacity = '0';
      setTimeout(function () { if (toast.parentNode) toast.remove(); }, 400);
    }, 5000);
  }

  /* ── Fallback modal (clipboard unavailable) ─────────────────────── */
  function showFallback(text) {
    var existing = document.getElementById('li-fallback-overlay');
    if (existing) existing.remove();

    if (!document.getElementById('li-fallback-style')) {
      var s = document.createElement('style');
      s.id = 'li-fallback-style';
      s.textContent = [
        '#li-fallback-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(13,39,86,.72);backdrop-filter:blur(4px);}',
        '#li-fallback-modal{background:#fff;border-radius:16px;padding:28px;max-width:500px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.2);position:relative;}',
        '#li-fallback-modal h3{font-family:Inter,system-ui,sans-serif;font-size:16px;font-weight:700;color:#0D2756;margin:0 0 6px;}',
        '#li-fallback-modal p{font-size:13px;color:#6b7280;margin:0 0 14px;}',
        '#li-fallback-ta{width:100%;box-sizing:border-box;font-family:Inter,system-ui,sans-serif;font-size:13px;color:#1f2937;background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:8px;padding:12px;line-height:1.65;resize:vertical;min-height:160px;outline:none;}',
        '#li-fallback-ta:focus{border-color:#00C4A0;}',
        '.li-fb-close{position:absolute;top:12px;right:14px;background:none;border:none;font-size:20px;color:#9ca3af;cursor:pointer;line-height:1;padding:4px 8px;}',
        '.li-fb-close:hover{color:#374151;}',
      ].join('');
      document.head.appendChild(s);
    }

    var el = document.createElement('div');
    el.id = 'li-fallback-overlay';
    el.innerHTML =
      '<div id="li-fallback-modal">' +
      '<button class="li-fb-close" aria-label="Chiudi">&times;</button>' +
      '<h3>Copia il testo del post</h3>' +
      '<p>Seleziona tutto e copia, poi incollalo su LinkedIn.</p>' +
      '<textarea id="li-fallback-ta" readonly>' + text.replace(/</g, '&lt;') + '</textarea>' +
      '</div>';
    document.body.appendChild(el);

    el.querySelector('.li-fb-close').addEventListener('click', function () { el.remove(); });
    el.addEventListener('click', function (e) { if (e.target === el) el.remove(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { el.remove(); document.removeEventListener('keydown', esc); }
    });

    var ta = el.querySelector('#li-fallback-ta');
    setTimeout(function () { ta.focus(); ta.select(); }, 50);
  }

  /* ── Main click handler ─────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.share-btn--linkedin');
    if (!btn) return;
    e.preventDefault();

    var tags = [];
    try { tags = JSON.parse(btn.dataset.tags || '[]'); } catch (_) {}

    var url     = btn.dataset.url      || location.href;
    var title   = btn.dataset.title    || '';
    var excerpt = btn.dataset.excerpt  || '';
    var subtitle= btn.dataset.subtitle || '';

    var text  = buildPostText(title, excerpt, subtitle, tags, url);
    var liUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);

    /* Open LinkedIn immediately (must be in sync click handler to avoid popup blockers) */
    window.open(liUrl, '_blank', 'noopener');

    /* Copy text to clipboard */
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(function () {
          showToast('Testo copiato — incollalo nel post su LinkedIn (Ctrl+V / ⌘V)');
        })
        .catch(function () { showFallback(text); });
    } else {
      showFallback(text);
    }
  });
})();
