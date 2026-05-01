/* pipeline.news — linkedin-share.js */
(function () {
  'use strict';

  var FIXED_TAGS = ['#pipelinenewsletter', '#vendite', '#sales'];

  /* ── Extract first 1-2 sentences from HTML content ─────────────── */
  function shortHook(html, subtitle) {
    var src = '';
    if (html) {
      var tmp = document.createElement('div');
      tmp.innerHTML = html;
      for (var i = 0, els = tmp.querySelectorAll('p, li, blockquote'); i < els.length; i++) {
        var t = els[i].textContent.trim();
        if (t.length > 60) { src = t; break; }
      }
      if (!src) src = tmp.textContent.trim();
    }
    if (!src) src = subtitle || '';
    if (!src) return '';

    var m = src.match(/^[^.!?]+[.!?](\s[^.!?]+[.!?])?/);
    var s = m ? m[0].trim() : src.slice(0, 160);
    return s.length > 160 ? s.slice(0, 157) + '…' : s;
  }

  /* ── Personal-sounding templates ────────────────────────────────── */
  var TEMPLATES = [
    function (title, hook, url) {
      return 'Ho trovato un articolo su Pipeline.news che mi ha fatto riflettere:\n\n'
        + '"' + title + '"\n\n'
        + (hook ? hook + '\n\n' : '')
        + 'Se lavori nelle vendite, potrebbe interessarti.\n👉 ' + url;
    },
    function (title, hook, url) {
      return 'Quante volte ci siamo trovati in questa situazione?\n\n'
        + '"' + title + '"\n\n'
        + (hook ? hook + '\n\n' : '')
        + 'Lo condivido da Pipeline.news — ne vale la pena.\n👉 ' + url;
    },
    function (title, hook, url) {
      return 'Una lettura che mi ha fatto tornare sui miei passi:\n\n'
        + '"' + title + '"\n\n'
        + (hook ? hook + '\n\n' : '')
        + '📬 Pipeline.news → ' + url;
    },
    function (title, hook, url) {
      var q = title.slice(-1) === '?' ? title : title + '?';
      return 'Ti sei mai chiesto/a:\n"' + q + '"\n\n'
        + (hook ? hook + '\n\n' : '')
        + 'Pipeline.news ne parla in modo concreto.\n👉 ' + url;
    },
    function (title, hook, url) {
      return 'Uno spunto pratico per chi lavora nelle vendite:\n\n'
        + '"' + title + '"\n\n'
        + (hook ? hook + '\n\n' : '')
        + 'Fonte: Pipeline.news 👉 ' + url;
    },
    function (title, hook, url) {
      return 'Questa settimana mi è rimasto in testa questo:\n\n'
        + '"' + title + '"\n\n'
        + (hook ? hook + '\n\n' : '')
        + 'Pipeline.news — lo consiglio.\n👉 ' + url;
    },
    function (title, hook, url) {
      return 'Ho trovato uno strumento interessante per chi si occupa di vendite:\n\n'
        + '"' + title + '"\n\n'
        + (hook ? hook + '\n\n' : '')
        + 'Lo condivido — da Pipeline.news 👉 ' + url;
    },
    function (title, hook, url) {
      return 'Se hai 5 minuti questa settimana, leggi questo:\n\n'
        + '"' + title + '"\n\n'
        + (hook ? hook + '\n\n' : '')
        + '→ ' + url + '\n\n(Da Pipeline.news — la newsletter per chi vive di vendita)';
    },
  ];

  function pickTemplate(title) {
    var hash = 0;
    for (var i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) | 0;
    return Math.abs(hash) % TEMPLATES.length;
  }

  function toHashtag(tag) {
    return '#' + tag.toLowerCase()
      .replace(/[\s-]+/g, '')
      .replace(/[^a-z0-9àèéìòù]/g, '');
  }

  function buildPostText(title, excerpt, subtitle, tags, url) {
    var hook     = shortHook(excerpt, subtitle);
    var idx      = pickTemplate(title);
    var body     = TEMPLATES[idx](title, hook, url);
    var hashtags = FIXED_TAGS.slice();
    if (Array.isArray(tags)) {
      tags.slice(0, 3).forEach(function (t) {
        var h = toHashtag(t);
        if (h.length > 1 && hashtags.indexOf(h) === -1) hashtags.push(h);
      });
    }
    return body + '\n\n' + hashtags.join(' ');
  }

  /* ── Confirmation bar (shown after copy, with LinkedIn link) ──── */
  function injectBarStyles() {
    if (document.getElementById('li-bar-style')) return;
    var s = document.createElement('style');
    s.id = 'li-bar-style';
    s.textContent = [
      '@keyframes li-bar-in{from{transform:translateY(100%)}to{transform:translateY(0)}}',
      '#li-confirm-bar{position:fixed;bottom:0;left:0;right:0;z-index:9999;',
      'background:#0D2756;color:#fff;padding:14px 16px;',
      'display:flex;align-items:center;gap:12px;flex-wrap:wrap;',
      'box-shadow:0 -4px 24px rgba(0,0,0,.3);animation:li-bar-in .3s ease;}',
      '.li-bar-check{color:#00C4A0;font-size:20px;flex-shrink:0;line-height:1;}',
      '.li-bar-msg{flex:1;font-family:Inter,system-ui,sans-serif;font-size:14px;',
      'font-weight:500;min-width:160px;}',
      '.li-bar-msg small{display:block;font-size:12px;font-weight:400;',
      'color:rgba(255,255,255,.6);margin-top:2px;}',
      '.li-bar-open{display:inline-flex;align-items:center;gap:6px;',
      'background:#0A66C2;color:#fff;text-decoration:none;',
      'font-family:Inter,sans-serif;font-size:14px;font-weight:700;',
      'border-radius:8px;padding:10px 18px;flex-shrink:0;transition:background .15s;}',
      '.li-bar-open:hover{background:#094fa3;}',
      '.li-bar-close{background:none;border:none;color:rgba(255,255,255,.45);',
      'font-size:22px;cursor:pointer;padding:0 4px;line-height:1;flex-shrink:0;}',
      '.li-bar-close:hover{color:#fff;}',
      '@media(max-width:480px){.li-bar-open{width:100%;justify-content:center;}}',
    ].join('');
    document.head.appendChild(s);
  }

  var LI_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>';

  function showConfirmBar(liUrl, copied) {
    var existing = document.getElementById('li-confirm-bar');
    if (existing) existing.remove();
    injectBarStyles();

    var bar = document.createElement('div');
    bar.id = 'li-confirm-bar';
    bar.innerHTML =
      '<span class="li-bar-check">✓</span>' +
      '<span class="li-bar-msg">' +
        (copied
          ? 'Testo copiato negli appunti<small>Apri LinkedIn e incolla nel post (Incolla / ⌘V)</small>'
          : 'Apri LinkedIn e incolla il testo nel post') +
      '</span>' +
      '<a class="li-bar-open" href="' + liUrl + '" target="_blank" rel="noopener">' +
        LI_SVG + ' Apri LinkedIn' +
      '</a>' +
      '<button class="li-bar-close" aria-label="Chiudi">×</button>';
    document.body.appendChild(bar);

    var autoHide = setTimeout(function () { dismissBar(bar); }, 20000);
    bar.querySelector('.li-bar-close').addEventListener('click', function () {
      clearTimeout(autoHide); dismissBar(bar);
    });
    bar.querySelector('.li-bar-open').addEventListener('click', function () {
      clearTimeout(autoHide);
      setTimeout(function () { dismissBar(bar); }, 800);
    });
  }

  function dismissBar(bar) {
    if (!bar || !bar.parentNode) return;
    bar.style.transition = 'transform .35s ease';
    bar.style.transform = 'translateY(100%)';
    setTimeout(function () { if (bar.parentNode) bar.remove(); }, 350);
  }

  /* ── Fallback: clipboard unavailable — show text in modal ──────── */
  function showFallback(text, liUrl) {
    var existing = document.getElementById('li-fallback-overlay');
    if (existing) existing.remove();

    if (!document.getElementById('li-fallback-style')) {
      var s = document.createElement('style');
      s.id = 'li-fallback-style';
      s.textContent = [
        '#li-fallback-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;',
        'justify-content:center;padding:16px;background:rgba(13,39,86,.72);backdrop-filter:blur(4px);}',
        '#li-fallback-modal{background:#fff;border-radius:16px;padding:28px;max-width:500px;',
        'width:100%;box-shadow:0 20px 60px rgba(0,0,0,.2);position:relative;}',
        '#li-fallback-modal h3{font-family:Inter,system-ui,sans-serif;font-size:16px;font-weight:700;',
        'color:#0D2756;margin:0 0 6px;}',
        '#li-fallback-modal p{font-size:13px;color:#6b7280;margin:0 0 14px;}',
        '#li-fallback-ta{width:100%;box-sizing:border-box;font-family:Inter,system-ui,sans-serif;',
        'font-size:13px;color:#1f2937;background:#f9fafb;border:1.5px solid #e5e7eb;',
        'border-radius:8px;padding:12px;line-height:1.65;resize:vertical;min-height:140px;outline:none;}',
        '#li-fallback-ta:focus{border-color:#00C4A0;}',
        '.li-fb-actions{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;}',
        '.li-fb-btn{display:inline-flex;align-items:center;gap:6px;font-family:Inter,sans-serif;',
        'font-size:14px;font-weight:600;border:none;border-radius:8px;padding:10px 18px;',
        'cursor:pointer;text-decoration:none;transition:background .15s;}',
        '.li-fb-btn--copy{background:#f1f5f9;color:#0D2756;}',
        '.li-fb-btn--copy:hover{background:#e2e8f0;}',
        '.li-fb-btn--open{background:#0A66C2;color:#fff;margin-left:auto;}',
        '.li-fb-btn--open:hover{background:#094fa3;}',
        '.li-fb-close{position:absolute;top:12px;right:14px;background:none;border:none;',
        'font-size:20px;color:#9ca3af;cursor:pointer;line-height:1;padding:4px 8px;}',
        '.li-fb-close:hover{color:#374151;}',
        '@media(max-width:400px){.li-fb-btn--open{margin-left:0;width:100%;justify-content:center;}}',
      ].join('');
      document.head.appendChild(s);
    }

    var safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var el = document.createElement('div');
    el.id = 'li-fallback-overlay';
    el.innerHTML =
      '<div id="li-fallback-modal">' +
        '<button class="li-fb-close" aria-label="Chiudi">×</button>' +
        '<h3>Copia il testo del post</h3>' +
        '<p>Tieni premuto → Seleziona tutto → Copia, poi incollalo su LinkedIn.</p>' +
        '<textarea id="li-fallback-ta" readonly>' + safe + '</textarea>' +
        '<div class="li-fb-actions">' +
          '<button class="li-fb-btn li-fb-btn--copy" id="li-fb-copy">Copia testo</button>' +
          '<a class="li-fb-btn li-fb-btn--open" href="' + liUrl + '" target="_blank" rel="noopener">' +
            LI_SVG + ' Apri LinkedIn' +
          '</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);

    el.querySelector('.li-fb-close').addEventListener('click', function () { el.remove(); });
    el.addEventListener('click', function (e) { if (e.target === el) el.remove(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { el.remove(); document.removeEventListener('keydown', esc); }
    });

    var ta = el.querySelector('#li-fallback-ta');
    el.querySelector('#li-fb-copy').addEventListener('click', function () {
      ta.select();
      var btn = el.querySelector('#li-fb-copy');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = 'Copiato ✓';
        }).catch(function () {
          document.execCommand('copy');
          btn.textContent = 'Copiato ✓';
        });
      } else {
        document.execCommand('copy');
        btn.textContent = 'Copiato ✓';
      }
    });

    setTimeout(function () { ta.focus(); ta.setSelectionRange(0, ta.value.length); }, 50);
  }

  /* ── Main click handler ─────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.share-btn--linkedin');
    if (!btn) return;
    e.preventDefault();

    var tags = [];
    try { tags = JSON.parse(btn.dataset.tags || '[]'); } catch (_) {}

    var url      = btn.dataset.url      || location.href;
    var title    = btn.dataset.title    || '';
    var excerpt  = btn.dataset.excerpt  || '';
    var subtitle = btn.dataset.subtitle || '';
    var text     = buildPostText(title, excerpt, subtitle, tags, url);
    var liUrl    = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);

    /*
     * Copy FIRST (sync-adjacent, still within the user gesture on iOS),
     * then show the confirmation bar with the LinkedIn link as a real tap.
     * Never call window.open() — that consumes the gesture and breaks
     * clipboard on iOS Safari.
     */
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(function ()  { showConfirmBar(liUrl, true);  })
        .catch(function () { showFallback(text, liUrl); });
    } else {
      showFallback(text, liUrl);
    }
  });
})();
