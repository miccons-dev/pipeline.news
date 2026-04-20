/* pipeline.news — subscribe handler → pipeline-agent.onrender.com */
(function () {
  'use strict';

  var ENDPOINT = 'https://pipeline-agent.onrender.com/public/subscribe';

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
      try {
        var r = await fetch(ENDPOINT, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: email }),
        });
        var data = {};
        try { data = await r.json(); } catch (_) {}
        if (data && data.success) {
          show(data.message || 'Iscrizione registrata.', 'ok');
          form.reset();
        } else {
          show((data && data.message) || 'Iscrizione non riuscita. Riprova.', 'error');
        }
      } catch (_) {
        show('Connessione fallita. Riprova.', 'error');
      } finally {
        loading(false);
      }
    });
  });
})();
