/* pipeline.news — MailerLite subscribe handler */
(function () {
  'use strict';
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

      var account = form.dataset.account;
      var formId  = form.dataset.form;
      var cbName  = 'plSub_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      var url = 'https://assets.mailerlite.com/jsonp/' + account
              + '/forms/' + formId + '/subscribe'
              + '?callback=' + cbName
              + '&fields%5Bemail%5D=' + encodeURIComponent(email)
              + '&ml-submit=1&anticsrf=true';

      var s = document.createElement('script');
      window[cbName] = function (resp) {
        loading(false);
        delete window[cbName];
        if (s && s.parentNode) s.parentNode.removeChild(s);
        if (resp && resp.success) {
          show('Iscrizione registrata. Controlla la mail per confermare.', 'ok');
          form.reset();
        } else {
          var err = (resp && (resp.message || resp.error)) || 'Riprova fra qualche istante.';
          show('Iscrizione non completata: ' + err, 'error');
        }
      };
      s.onerror = function () {
        loading(false);
        show('Connessione fallita. Riprova.', 'error');
        delete window[cbName];
      };
      s.src = url;
      document.head.appendChild(s);
    });
  });
})();
