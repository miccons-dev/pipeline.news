/* pipeline.news — MailerLite subscribe handler (via Cloudflare Worker) */
(function () {
  'use strict';

  /*
   * Dopo il deploy del worker, incolla qui l'URL:
   *   wrangler deploy worker/subscribe.js
   * Esempio: https://pipeline-subscribe.tuonome.workers.dev
   */
  var WORKER_URL = 'https://pipeline-subscribe.miccons.workers.dev';

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

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (input.value || '').trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        show('Inserisci un indirizzo email valido.', 'error');
        input.focus();
        return;
      }
      loading(true);
      msg.hidden = true;

      fetch(WORKER_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email }),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          loading(false);
          if (data && data.success) {
            show('Iscrizione registrata. Controlla la mail per confermare.', 'ok');
            form.reset();
          } else {
            var err = (data && (data.message || data.error)) || 'Riprova fra qualche istante.';
            show('Iscrizione non completata: ' + err, 'error');
          }
        })
        .catch(function () {
          loading(false);
          show('Connessione fallita. Riprova.', 'error');
        });
    });
  });
})();
