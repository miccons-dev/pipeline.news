/* pipeline.news — linkedin-share.js */
(function () {
  'use strict';

  var API_BASE   = 'https://pipeline-news.onrender.com';
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

  function toHashtag(tag) {
    return '#' + tag.toLowerCase()
      .replace(/[\s-]+/g, '')
      .replace(/[^a-z0-9àèéìòù]/g, '');
  }

  function appendHashtags(body, tags) {
    var hashtags = FIXED_TAGS.slice();
    if (Array.isArray(tags)) {
      tags.slice(0, 3).forEach(function (t) {
        var h = toHashtag(t);
        if (h.length > 1 && hashtags.indexOf(h) === -1) hashtags.push(h);
      });
    }
    return body + '\n\n' + hashtags.join(' ');
  }

  /* ── Static fallback (used only if API fails) ───────────────────── */
  var FALLBACK_TEMPLATES = [
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
      return 'Questa settimana mi è rimasto in testa questo:\n\n'
        + '"' + title + '"\n\n'
        + (hook ? hook + '\n\n' : '')
        + 'Pipeline.news — lo consiglio.\n👉 ' + url;
    },
    function (title, hook, url) {
      return 'Uno spunto pratico per chi lavora nelle vendite:\n\n'
        + '"' + title + '"\n\n'
        + (hook ? hook + '\n\n' : '')
        + 'Fonte: Pipeline.news 👉 ' + url;
    },
  ];

  function fallbackText(title, excerpt, subtitle, tags, url) {
    var hook = shortHook(excerpt, subtitle);
    var hash = 0;
    for (var i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) | 0;
    var body = FALLBACK_TEMPLATES[Math.abs(hash) % FALLBACK_TEMPLATES.length](title, hook, url);
    return appendHashtags(body, tags);
  }

  /* ── sessionStorage cache ───────────────────────────────────────── */
  function cacheKey(url) { return 'li_post_' + url; }

  function getCached(url) {
    try { return sessionStorage.getItem(cacheKey(url)); } catch (_) { return null; }
  }

  function setCached(url, text) {
    try { sessionStorage.setItem(cacheKey(url), text); } catch (_) {}
  }

  /* ── Bar styles (injected once) ─────────────────────────────────── */
  var LI_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>';

  function injectBarStyles() {
    if (document.getElementById('li-bar-style')) return;
    var s = document.createElement('style');
    s.id = 'li-bar-style';
    s.textContent = [
      '@keyframes li-bar-in{from{transform:translateY(100%)}to{transform:translateY(0)}}',
      '@keyframes li-spin{to{transform:rotate(360deg)}}',
      '#li-confirm-bar{position:fixed;bottom:0;left:0;right:0;z-index:9999;',
        'background:#0D2756;color:#fff;padding:14px 16px;',
        'display:flex;align-items:center;gap:12px;flex-wrap:wrap;',
        'box-shadow:0 -4px 24px rgba(0,0,0,.3);animation:li-bar-in .3s ease;}',
      '.li-bar-left{display:flex;align-items:center;gap:10px;flex:1;min-width:0;}',
      '.li-bar-icon{font-size:18px;flex-shrink:0;line-height:1;}',
      '.li-bar-msg{font-family:Inter,system-ui,sans-serif;font-size:14px;font-weight:600;',
        'line-height:1.4;}',
      '.li-bar-spinner{width:18px;height:18px;border:2.5px solid rgba(255,255,255,.25);',
        'border-top-color:#00C4A0;border-radius:50%;flex-shrink:0;',
        'animation:li-spin .7s linear infinite;}',
      '.li-bar-open{display:inline-flex;align-items:center;gap:6px;',
        'background:#0A66C2;color:#fff;border:none;cursor:pointer;',
        'font-family:Inter,sans-serif;font-size:14px;font-weight:700;',
        'border-radius:8px;padding:10px 18px;flex-shrink:0;',
        'transition:background .15s;white-space:nowrap;}',
      '.li-bar-open:hover{background:#094fa3;}',
      '.li-bar-close{background:none;border:none;color:rgba(255,255,255,.45);',
        'font-size:22px;cursor:pointer;padding:0 4px;line-height:1;flex-shrink:0;}',
      '.li-bar-close:hover{color:#fff;}',
      '@media(max-width:520px){.li-bar-open{width:100%;justify-content:center;}}',
    ].join('');
    document.head.appendChild(s);
  }

  function createBar() {
    var existing = document.getElementById('li-confirm-bar');
    if (existing) existing.remove();
    injectBarStyles();
    var bar = document.createElement('div');
    bar.id = 'li-confirm-bar';
    document.body.appendChild(bar);
    return bar;
  }

  function setBarLoading(bar) {
    bar.innerHTML =
      '<div class="li-bar-left">' +
        '<div class="li-bar-spinner"></div>' +
        '<span class="li-bar-msg">Sto generando il testo del post…<br>' +
          '<span style="font-weight:400;font-size:12px;opacity:.7">può richiedere qualche secondo</span></span>' +
      '</div>' +
      '<button class="li-bar-close" aria-label="Chiudi">×</button>';
    bar.querySelector('.li-bar-close').addEventListener('click', function () { dismissBar(bar); });
  }

  /* ── Open LinkedIn app, fall back to web if not installed ──────── */
  function openLinkedIn(articleUrl) {
    var appUrl = 'linkedin://shareArticle?mini=true&url=' + encodeURIComponent(articleUrl);
    var webUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(articleUrl);

    var appOpened = false;
    function onHide() { appOpened = true; }
    document.addEventListener('visibilitychange', onHide, { once: true });

    /* Iframe triggers the URI scheme silently — no error page if app missing */
    var iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;border:none;pointer-events:none;';
    iframe.src = appUrl;
    document.body.appendChild(iframe);
    setTimeout(function () { if (iframe.parentNode) iframe.remove(); }, 300);

    /* If page is still visible after 1.4s → app not installed → open web */
    setTimeout(function () {
      document.removeEventListener('visibilitychange', onHide);
      if (!appOpened) window.open(webUrl, '_blank', 'noopener');
    }, 1400);
  }

  function setBarReady(bar, articleUrl) {
    bar.innerHTML =
      '<div class="li-bar-left">' +
        '<span class="li-bar-icon">✓</span>' +
        '<span class="li-bar-msg">Bonus! C\'è un testo pronto negli appunti,<br>incollalo nel post</span>' +
      '</div>' +
      '<button class="li-bar-open" id="li-bar-open-btn">' +
        LI_SVG + ' Apri LinkedIn' +
      '</button>' +
      '<button class="li-bar-close" aria-label="Chiudi">×</button>';

    var autoHide = setTimeout(function () { dismissBar(bar); }, 20000);
    bar.querySelector('.li-bar-close').addEventListener('click', function () {
      clearTimeout(autoHide); dismissBar(bar);
    });
    bar.querySelector('#li-bar-open-btn').addEventListener('click', function () {
      clearTimeout(autoHide);
      openLinkedIn(articleUrl);
      setTimeout(function () { dismissBar(bar); }, 800);
    });
  }

  function dismissBar(bar) {
    if (!bar || !bar.parentNode) return;
    bar.style.transition = 'transform .35s ease';
    bar.style.transform = 'translateY(100%)';
    setTimeout(function () { if (bar.parentNode) bar.remove(); }, 350);
  }

  /* ── Copy helper (ignores errors — bar always shown) ───────────── */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {});
    }
    return Promise.resolve();
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

    /* Show bar immediately in loading state */
    var bar = createBar();
    setBarLoading(bar);

    /* Check cache first */
    var cached = getCached(url);
    if (cached) {
      copyText(cached).then(function () { setBarReady(bar, url); });
      return;
    }

    /* Fetch from API with 20s timeout */
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeout = setTimeout(function () { if (controller) controller.abort(); }, 20000);

    var fetchOpts = {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: title, subtitle: subtitle, excerpt: excerpt, tags: tags }),
    };
    if (controller) fetchOpts.signal = controller.signal;

    fetch(API_BASE + '/api/v1/linkedin-post', fetchOpts)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        clearTimeout(timeout);
        var body = (data.text || '').trim();
        if (!body) throw new Error('empty');
        var text = appendHashtags(body + '\n\n👉 ' + url, tags);
        setCached(url, text);
        copyText(text).then(function () { setBarReady(bar, url); });
      })
      .catch(function () {
        clearTimeout(timeout);
        var text = fallbackText(title, excerpt, subtitle, tags, url);
        copyText(text).then(function () { setBarReady(bar, url); });
      });
  });
})();
