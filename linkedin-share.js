/* pipeline.news — linkedin-share.js */
(function () {
  'use strict';

  var FIXED_TAGS = ['#pipelinenewsletter', '#vendite', '#sales'];

  function toHashtag(tag) {
    return '#' + tag.toLowerCase()
      .replace(/[\s-]+/g, '')
      .replace(/[^a-z0-9àèéìòù]/g, '');
  }

  function buildPostText(title, subtitle, tags, url) {
    var parts = [];
    parts.push('📰 Ho appena letto questo articolo su Pipeline.news — la newsletter italiana per chi lavora nelle vendite.\n');
    parts.push('"' + title + '"\n');
    if (subtitle && subtitle.trim()) {
      parts.push(subtitle.trim() + '\n');
    }
    parts.push('👉 ' + url);

    var hashtags = FIXED_TAGS.slice();
    if (Array.isArray(tags)) {
      tags.slice(0, 3).forEach(function (t) {
        var h = toHashtag(t);
        if (h.length > 1 && hashtags.indexOf(h) === -1) {
          hashtags.push(h);
        }
      });
    }
    parts.push('\n' + hashtags.join(' '));

    return parts.join('\n');
  }

  function injectStyles() {
    if (document.getElementById('li-share-styles')) return;
    var s = document.createElement('style');
    s.id = 'li-share-styles';
    s.textContent = [
      '#li-share-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(13,39,86,.72);backdrop-filter:blur(4px);}',
      '#li-share-overlay[hidden]{display:none!important;}',
      '#li-share-modal{background:#fff;border-radius:20px;padding:32px;max-width:540px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,.22);position:relative;}',
      '#li-share-modal h3{font-family:Inter,system-ui,sans-serif;font-size:17px;font-weight:700;color:#0D2756;margin:0 0 6px;}',
      '.li-share-sub{font-size:13px;color:#6b7280;margin:0 0 16px;line-height:1.5;}',
      '#li-share-textarea{width:100%;box-sizing:border-box;font-family:Inter,system-ui,sans-serif;font-size:14px;color:#1f2937;background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:10px;padding:14px;line-height:1.7;resize:vertical;min-height:200px;outline:none;transition:border-color .15s,background .15s;}',
      '#li-share-textarea:focus{border-color:#00C4A0;background:#fff;}',
      '.li-share-actions{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;}',
      '.li-share-btn{display:inline-flex;align-items:center;gap:7px;font-family:Inter,sans-serif;font-size:14px;font-weight:600;border:none;border-radius:8px;padding:11px 20px;cursor:pointer;transition:background .15s,transform .1s;text-decoration:none;}',
      '.li-share-btn--copy{background:#f1f5f9;color:#0D2756;}',
      '.li-share-btn--copy:hover{background:#e2e8f0;}',
      '.li-share-btn--open{background:#0A66C2;color:#fff;margin-left:auto;}',
      '.li-share-btn--open:hover{background:#094fa3;transform:translateY(-1px);}',
      '.li-share-close{position:absolute;top:14px;right:16px;background:none;border:none;font-size:22px;color:#9ca3af;cursor:pointer;line-height:1;padding:4px 8px;}',
      '.li-share-close:hover{color:#374151;}',
      '@media(max-width:400px){.li-share-btn--open{margin-left:0;width:100%;justify-content:center;}}',
    ].join('');
    document.head.appendChild(s);
  }

  function injectModal() {
    if (document.getElementById('li-share-overlay')) return;
    var LI_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>';
    var el = document.createElement('div');
    el.id = 'li-share-overlay';
    el.setAttribute('hidden', '');
    el.innerHTML =
      '<div id="li-share-modal" role="dialog" aria-modal="true" aria-labelledby="li-share-title">' +
      '<button class="li-share-close" id="li-share-close" aria-label="Chiudi">&times;</button>' +
      '<h3 id="li-share-title">Condividi su LinkedIn</h3>' +
      '<p class="li-share-sub">Testo suggerito — modificalo liberamente prima di pubblicare.</p>' +
      '<textarea id="li-share-textarea" spellcheck="true"></textarea>' +
      '<div class="li-share-actions">' +
      '<button class="li-share-btn li-share-btn--copy" id="li-share-copy">Copia testo</button>' +
      '<a class="li-share-btn li-share-btn--open" id="li-share-open" target="_blank" rel="noopener">' +
      LI_SVG + ' Apri LinkedIn →' +
      '</a>' +
      '</div>' +
      '</div>';
    document.body.appendChild(el);

    document.getElementById('li-share-close').addEventListener('click', closeModal);
    el.addEventListener('click', function (e) { if (e.target === el) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
    document.getElementById('li-share-copy').addEventListener('click', function () {
      var ta = document.getElementById('li-share-textarea');
      navigator.clipboard.writeText(ta.value).then(function () {
        var btn = document.getElementById('li-share-copy');
        var prev = btn.textContent;
        btn.textContent = 'Copiato ✓';
        setTimeout(function () { btn.textContent = prev; }, 2000);
      });
    });
  }

  function closeModal() {
    var overlay = document.getElementById('li-share-overlay');
    if (overlay) overlay.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  function openShareModal(title, subtitle, tags, url) {
    injectStyles();
    injectModal();
    document.getElementById('li-share-textarea').value = buildPostText(title, subtitle, tags, url);
    document.getElementById('li-share-open').href =
      'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
    document.getElementById('li-share-overlay').removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      var ta = document.getElementById('li-share-textarea');
      ta.focus();
      ta.setSelectionRange(0, 0);
    }, 50);
  }

  /* Intercept clicks on .share-btn--linkedin anywhere in the page */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.share-btn--linkedin');
    if (!btn) return;
    e.preventDefault();
    var tags = [];
    try { tags = JSON.parse(btn.dataset.tags || '[]'); } catch (_) {}
    openShareModal(
      btn.dataset.title    || '',
      btn.dataset.subtitle || '',
      tags,
      btn.dataset.url      || location.href
    );
  });
})();
