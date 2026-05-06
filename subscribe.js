/* pipeline.news — subscribe.js */
(function () {
  'use strict';

  var ENDPOINT = 'https://pipeline-agent.onrender.com/public/subscribe';
  var SITEKEY  = '6LfggNUsAAAAAKRLRn8q3T_amYKp9MFGvYtLKB_v';
  var EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  document.querySelectorAll('form[data-type="subscription"]').forEach(function (form) {
    var container = form.closest('.sib-form-container');
    var panels    = container ? container.querySelectorAll('.sib-form-message-panel') : [];
    var errorEl   = panels[0] || null;
    var emailIn   = form.querySelector('input[name="EMAIL"]');
    var btn       = form.querySelector('.sib-form-block__button');

    function showError(msg) {
      if (errorEl) {
        var inner = errorEl.querySelector('.sib-form-message-panel__inner-text');
        if (inner) inner.textContent = msg;
        errorEl.style.display = 'block';
        errorEl.classList.remove('sib-hide');
      }
    }

    function clearError() {
      if (errorEl) {
        errorEl.classList.add('sib-hide');
        errorEl.style.display = '';
      }
    }

    var slowTimer = null;

    function setBtn(loading) {
      if (!btn) return;
      btn.disabled = loading;
      var node = Array.from(btn.childNodes).reverse()
        .find(function (n) { return n.nodeType === 3 && n.textContent.trim(); });
      if (!node) return;
      if (loading) {
        node._orig = node._orig || node.textContent;
        node.textContent = ' Invio in corso…';
        slowTimer = setTimeout(function () {
          node.textContent = ' Quasi fatto, ancora un secondo…';
        }, 6000);
      } else {
        clearTimeout(slowTimer);
        if (node._orig) node.textContent = node._orig;
      }
    }

    function doFetch(token) {
      var email = emailIn ? emailIn.value.trim() : '';
      fetch(ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email, captchaToken: token || '' }),
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
          setBtn(false);
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
          setBtn(false);
          showError('Errore di rete. Controlla la connessione e riprova.');
        });
    }

    function submitWithCaptcha() {
      if (window.grecaptcha) {
        var done = false;
        var fallback = setTimeout(function () {
          if (!done) { done = true; doFetch(''); }
        }, 3000);

        grecaptcha.ready(function () {
          try {
            grecaptcha.execute(SITEKEY, { action: 'subscribe' })
              .then(function (t)  { if (!done) { done = true; clearTimeout(fallback); doFetch(t); } })
              .catch(function ()  { if (!done) { done = true; clearTimeout(fallback); doFetch(''); } });
          } catch (e) {
            if (!done) { done = true; clearTimeout(fallback); doFetch(''); }
          }
        });
      } else {
        doFetch('');
      }
    }

    var hp      = form.querySelector('[name="hp"]');
    var loadedAt = Date.now();

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // honeypot: bot filled the hidden field
      if (hp && hp.value) { window.location.href = '/welcome.html?email='; return; }

      var email = (emailIn ? emailIn.value : '').trim();

      if (!email || !EMAIL_RE.test(email)) {
        showError('Inserisci un indirizzo email valido.');
        return;
      }

      clearError();
      setBtn(true);
      submitWithCaptcha();
    });
  });
})();
