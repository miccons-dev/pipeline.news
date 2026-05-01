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

    /* Keep first 1-2 sentences, max 160 chars */
    var m = src.match(/^[^.!?]+[.!?](\s[^.!?]+[.!?])?/);
    var s = m ? m[0].trim() : src.slice(0, 160);
    return s.length > 160 ? s.slice(0, 157) + '…' : s;
  }

  /* ── Personal-sounding templates ────────────────────────────────── */
  var TEMPLATES = [
    function (title, hook, url) {   /* discovery */
      return 'Ho trovato un articolo su Pipeline.news che mi ha fatto riflettere:\n\n'
        + '"' + title + '"\n\n'
        + (hook ? hook + '\n\n' : '')
        + 'Se lavori nelle vendite, potrebbe interessarti.\n👉 ' + url;
    },
    function (title, hook, url) {   /* quante volte */
      return 'Quante volte ci siamo trovati in questa situazione?\n\n'
        + '"' + title + '"\n\n'
        + (hook ? hook + '\n\n' : '')
        + 'Lo condivido da Pipeline.news — ne vale la pena.\n👉 ' + url;
    },
    function (title, hook, url) {   /* reflection */
      return 'Una lettura che mi ha fatto tornare sui miei passi:\n\n'
        + '"' + title + '"\n\n'
        + (hook ? hook + '\n\n' : '')
        + '📬 Pipeline.news → ' + url;
    },
    function (title, hook, url) {   /* question */
      var q = title.slice(-1) === '?' ? title : title + '?';
      return 'Ti sei mai chiesto/a:\n"' + q + '"\n\n'
        + (hook ? hook + '\n\n' : '')
        + 'Pipeline.news ne parla in modo concreto.\n👉 ' + url;
    },
    function (title, hook, url) {   /* practical tip */
      return 'Uno spunto pratico per chi lavora nelle vendite:\n\n'
        + '"' + title + '"\n\n'
        + (hook ? hook + '\n\n' : '')
        + 'Fonte: Pipeline.news 👉 ' + url;
    },
    function (title, hook, url) {   /* stuck in my head */
      return 'Questa settimana mi è rimasto in testa questo:\n\n'
        + '"' + title + '"\n\n'
        + (hook ? hook + '\n\n' : '')
        + 'Pipeline.news — lo consiglio.\n👉 ' + url;
    },
    function (title, hook, url) {   /* tool found */
      return 'Ho trovato uno strumento interessante per chi si occupa di vendite:\n\n'
        + '"' + title + '"\n\n'
        + (hook ? hook + '\n\n' : '')
        + 'Lo condivido — da Pipeline.news 👉 ' + url;
    },
    function (title, hook, url) {   /* worth-it */
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
    var hook = shortHook(excerpt, subtitle);
    var idx  = pickTemplate(title);
    var body = TEMPLATES[idx](title, hook, url);

    var hashtags = FIXED_TAGS.slice();
    if (Array.isArray(tags)) {
      tags.slice(0, 3).forEach(function (t) {
        var h = toHashtag(t);
        if (h.length > 1 && hashtags.indexOf(h) === -1) hashtags.push(h);
      });
    }
    return body + '\n\n' + hashtags.join(' ');
  }

  /* ── Toast ──────────────────────────────────────────────────────── */
  function showToast(msg) {
    var existing = document.getElementById('li-share-toast');
    if (existing) existing.remove();

    if (!document.getElementById('li-toast-style')) {
      var s = document.createElement('style');
      s.id = 'li-toast-style';
      s.textContent = [
        '@keyframes li-toast-in{from{opacity:0;transform:translateX(-50%) translateY(10px)}',
        'to{opacity:1;transform:translateX(-50%) translateY(0)}}',
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
        '#li-fallback-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;',
        'justify-content:center;padding:16px;background:rgba(13,39,86,.72);backdrop-filter:blur(4px);}',
        '#li-fallback-modal{background:#fff;border-radius:16px;padding:28px;max-width:500px;',
        'width:100%;box-shadow:0 20px 60px rgba(0,0,0,.2);position:relative;}',
        '#li-fallback-modal h3{font-family:Inter,system-ui,sans-serif;font-size:16px;font-weight:700;',
        'color:#0D2756;margin:0 0 6px;}',
        '#li-fallback-modal p{font-size:13px;color:#6b7280;margin:0 0 14px;}',
        '#li-fallback-ta{width:100%;box-sizing:border-box;font-family:Inter,system-ui,sans-serif;',
        'font-size:13px;color:#1f2937;background:#f9fafb;border:1.5px solid #e5e7eb;',
        'border-radius:8px;padding:12px;line-height:1.65;resize:vertical;min-height:160px;outline:none;}',
        '#li-fallback-ta:focus{border-color:#00C4A0;}',
        '.li-fb-close{position:absolute;top:12px;right:14px;background:none;border:none;',
        'font-size:20px;color:#9ca3af;cursor:pointer;line-height:1;padding:4px 8px;}',
        '.li-fb-close:hover{color:#374151;}',
      ].join('');
      document.head.appendChild(s);
    }

    var safe = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    var el = document.createElement('div');
    el.id = 'li-fallback-overlay';
    el.innerHTML =
      '<div id="li-fallback-modal">' +
      '<button class="li-fb-close" aria-label="Chiudi">&times;</button>' +
      '<h3>Copia il testo del post</h3>' +
      '<p>Seleziona tutto (Ctrl+A / ⌘A) e copia, poi incollalo su LinkedIn.</p>' +
      '<textarea id="li-fallback-ta" readonly>' + safe + '</textarea>' +
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

    var url      = btn.dataset.url      || location.href;
    var title    = btn.dataset.title    || '';
    var excerpt  = btn.dataset.excerpt  || '';
    var subtitle = btn.dataset.subtitle || '';

    var text  = buildPostText(title, excerpt, subtitle, tags, url);
    var liUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);

    /* Open LinkedIn immediately (sync — avoids popup blockers) */
    window.open(liUrl, '_blank', 'noopener');

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
