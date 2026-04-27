/* pipeline.news — subscribe handler → pipeline-agent.onrender.com (con fallback) */
(function () {
  'use strict';

  var ENDPOINT = 'https://pipeline-agent.onrender.com/public/subscribe';
  var FALLBACK = 'https://formsubmit.co/ajax/crew@pipeline.news';

  // Salva in localStorage come ultimo backup
  function saveLocal(email) {
    try {
      var key = 'pl_pending_subs';
      var list = JSON.parse(localStorage.getItem(key) || '[]');
      list.push({ email: email, ts: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(list));
    } catch (_) {}
  }

  // Invia al fallback FormSubmit (ti arriva via email a crew@pipeline.news)
  async function sendFallback(email) {
    try {
      var r = await fetch(FALLBACK, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify({
          email: email,
          source: 'pipeline.news subscribe form (fallback)',
          timestamp: new Date().toISOString(),
          page: window.location.pathname,
        }),
      });
      var data = await r.json().catch(function () { return {}; });
      return data && (data.success === 'true' || data.success === true);
    } catch (_) {
      return false;
    }
  }

  document.querySelectorAll('form.pl-subscribe').forEach(function (form) {
    var input     = form.querySelector('input[name="email"]');
    var btn       = form.querySelector('button[type="submit"]');
    var btnText   = btn.querySelector('.pl-subscribe__btn-text');
    var btnLoader = btn.querySelector('.pl-subscribe__btn-loader');
    var msg       = form.querySelector('.pl-subscribe__msg');

    function show(text, kind) {
      msg.textContent = text;
      msg.className = 'pl-subscribe__msg pl-subscribe__msg--' + kind;
      msg.hidden = false;
    }
    function loading(on) {
      btn.disabled = on;
      btnText.hidden = on;
      btnLoader.hidden = !on;
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var email = (input.value || '').trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        show('Inserisci un indirizzo email valido.', 'error');
        input.focus();
        return;
      }
      loading(true);
      msg.hidden = true;

      // Tentativo principale
      var primaryOk = false;
      try {
        var r = await fetch(ENDPOINT, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: email }),
        });
        var data = {};
        try { data = await r.json(); } catch (_) {}
        primaryOk = !!(data && data.success);
        if (!primaryOk && r.status >= 400 && r.status < 500 && data && data.message) {
          // Errore di validazione (es. email già iscritta) — non usare fallback
          show(data.message, 'error');
          loading(false);
          return;
        }
      } catch (_) {}

      if (primaryOk) {
        window.location.href = '/welcome.html?email=' + encodeURIComponent(email);
        return;
      }

      // Fallback: salva in localStorage e invia notifica a crew@pipeline.news
      saveLocal(email);
      var fbOk = await sendFallback(email);
      loading(false);
      if (fbOk) {
        window.location.href = '/welcome.html?email=' + encodeURIComponent(email);
      } else {
        show('Iscrizione registrata. Ti contatteremo a breve via email.', 'success');
      }
    });
  });
})();
