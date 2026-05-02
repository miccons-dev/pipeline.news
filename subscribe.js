/* pipeline.news — subscribe.js */
(function () {
  'use strict';

  var ENDPOINT = 'https://pipeline-agent.onrender.com/public/subscribe';
  var EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function resetCaptcha(captchaEl) {
    if (!captchaEl || !window.grecaptcha) return;
    try {
      var all = Array.from(document.querySelectorAll('.sib-visible-recaptcha'));
      var idx = all.indexOf(captchaEl);
      grecaptcha.reset(idx >= 0 ? idx : 0);
    } catch (e) {}
  }

  document.querySelectorAll('form[data-type="subscription"]').forEach(function (form) {
    var container = form.closest('.sib-form-container');
    var panels    = container ? container.querySelectorAll('.sib-form-message-panel') : [];
    var errorEl   = panels[0] || null;
    var emailIn   = form.querySelector('input[name="EMAIL"]');
    var btn       = form.querySelector('.sib-form-block__button');
    var captchaEl = form.querySelector('.sib-visible-recaptcha');

    function showError(msg) {
      if (!errorEl) return;
      var inner = errorEl.querySelector('.sib-form-message-panel__inner-text');
      if (inner) inner.textContent = msg;
      errorEl.classList.remove('sib-hide');
    }

    function clearError() {
      if (errorEl) errorEl.classList.add('sib-hide');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (emailIn ? emailIn.value : '').trim();

      if (!email || !EMAIL_RE.test(email)) {
        showError('Inserisci un indirizzo email valido.');
        return;
      }

      var captchaToken = '';
      if (captchaEl) {
        var ta = captchaEl.querySelector('textarea');
        captchaToken = ta ? ta.value : '';
        if (!captchaToken) {
          showError('Completa il CAPTCHA per procedere.');
          return;
        }
      }

      clearError();
      if (btn) btn.disabled = true;

      fetch(ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email, captchaToken: captchaToken }),
      })
        .then(function (r) {
          return r.json()
            .catch(function () { return {}; })
            .then(function (d) { return { status: r.status, data: d }; });
        })
        .then(function (res) {
          if (res.status === 200) {
            if (typeof gtag === 'function') {
              gtag('event', 'generate_lead', { form_location: 'subscribe_form' });
            }
            window.location.href = '/welcome.html?email=' + encodeURIComponent(email);
            return;
          }
          if (btn) btn.disabled = false;
          resetCaptcha(captchaEl);
          if (res.status === 400) {
            showError('Inserisci un indirizzo email valido.');
          } else if (res.status === 502) {
            showError('Errore del server. Riprova tra qualche minuto.');
          } else if (res.status === 503) {
            showError('Servizio non disponibile. Riprova tra qualche ora.');
          } else {
            showError((res.data && res.data.message) || "Errore durante l'iscrizione. Riprova.");
          }
        })
        .catch(function () {
          if (btn) btn.disabled = false;
          resetCaptcha(captchaEl);
          showError('Errore di rete. Controlla la connessione e riprova.');
        });
    });
  });
})();
