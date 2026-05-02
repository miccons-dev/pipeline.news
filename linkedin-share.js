/* pipeline.news — linkedin-share.js */
(function () {
  'use strict';

  var FIXED_TAGS = ['#pipelinenewsletter', '#vendite', '#sales'];

  /* ── Extract first 1-2 sentences from article HTML ─────────────── */
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
    return body + '\n\n' + hashtags.join(' ') + '\n';
  }

  /* ── 100 Italian sales post templates (no URL — appended once by generateText) */
  var T = [
    /* 0-9  Discovery */
    function (t, h) { return 'Ho trovato un articolo che mi ha fatto fermare a riflettere.\nSe lavori nelle vendite, vale la lettura.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Stavo scorrendo e questo mi ha colpito.\nNon me lo aspettavo, ma vale i cinque minuti.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Ho smesso di scorrere per leggere questo fino in fondo.\nNon capita spesso. Vale il tuo tempo.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Questo merita più di uno scroll veloce.\nPrenditi un momento e leggilo per bene.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Lo condivido perché mi ha davvero cambiato prospettiva\nsu qualcosa che davo per scontato.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Ho iniziato a leggerlo e non riuscivo a smettere.\nSuccede raramente — ecco perché lo condivido.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Ogni tanto trovi un articolo che dice quello che pensi da anni\nma non hai mai saputo come spiegare. Questo è uno.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Questo me lo segno per rileggerlo con calma.\nNel frattempo lo condivido con chi potrebbe trovarlo utile.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Quando un articolo ti fa dire "finalmente qualcuno lo ha scritto" —\necco, questo è uno di quelli.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Uno spunto pratico che vale la pena condividere.\nNiente teoria, roba che si usa davvero.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },

    /* 10-19  Quante volte */
    function (t, h) { return 'Quante volte ci siamo trovati in questa situazione\nsenza sapere esattamente come uscirne?\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Quante volte te lo sei chiesto anche tu?\nQuesto articolo ha una risposta concreta.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Quante volte hai vissuto questa scena e hai pensato\ndi essere l\'unico? Non lo sei.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Quante volte abbiamo fatto esattamente questo errore\nsenza accorgercene sul momento?\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Quante volte ci siamo trovati a corto di risposte\nproprio quando servivano di più?\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Quante volte hai rimandato di affrontare questo\nsperando che si risolvesse da solo?\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Quante volte ti è successo e hai pensato\nfosse solo sfortuna? Non era sfortuna.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Quante volte ci siamo detti "la prossima volta\nfaccio diversamente" — e poi abbiamo fatto uguale?\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Quante volte abbiamo perso una trattativa per questo motivo\nsenza capirlo fino in fondo?\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Quante volte abbiamo usato l\'approccio sbagliato\nsenza accorgercene fino alla fine?\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },

    /* 20-29  Questa settimana */
    function (t, h) { return 'Questa settimana mi è rimasto in testa questo.\nNon riuscivo a non condividerlo.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Questa settimana ho letto qualcosa che vale la pena condividere.\nEcco qui — cinque minuti ben spesi.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Stamattina un articolo mi ha messo in moto la testa\nprima ancora del secondo caffè.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Negli ultimi giorni mi sono ritrovato a pensare a questo.\nSegno che vale qualcosa.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'La lettura di questa settimana che consiglio senza esitare\na chi lavora nelle vendite.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Stamattina ho letto questo e mi è rimasto.\nLo condivido prima di dimenticarmi di farlo.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Questa settimana un articolo mi ha fatto cambiare idea\nsu qualcosa che credevo di aver già capito.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Lettura del weekend per chi lavora nelle vendite\ne vuole arrivare lunedì con qualcosa in più.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'La cosa più utile che ho letto di recente.\nSemplice, concreto, applicabile subito.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Inizio settimana con un articolo che vale davvero.\nCinque minuti e poi si parte.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },

    /* 30-39  Esperienza personale */
    function (t, h) { return 'Lo confesso: ho fatto questo errore per anni\nconvinto di stare facendo la cosa giusta.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Una cosa che ho capito tardi nelle vendite.\nMeglio leggerla adesso che scoprirla sulla propria pelle.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Se potessi tornare indietro, avrei letto questo\nmolto prima di impararlo nel modo difficile.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Un errore che ho smesso di fare solo dopo\naver capito davvero perché non funzionava.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Ho impiegato troppo tempo a capirlo.\nForse questo articolo ti risparmia qualche anno.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Ci ho messo anni a capirlo davvero.\nL\'articolo lo spiega meglio di quanto farei io.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Una delle lezioni più importanti che ho imparato nelle vendite.\nMeglio leggerla che viverla.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Me lo sarei voluto sentire dire all\'inizio della carriera.\nLo condivido sperando sia utile a qualcuno.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Ho cambiato approccio su questo dopo aver capito\nuna cosa che sembra banale ma non lo è affatto.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Ci ho sbattuto la testa abbastanza volte\nda capire che questo non si può ignorare.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },

    /* 40-49  Audience callout */
    function (t, h) { return 'Se lavori nelle vendite, questo articolo parla di te.\nO almeno, parla di una versione di te che probabilmente conosci.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Se gestisci un team commerciale, leggilo.\nE poi mandalo a qualcuno del tuo team.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'A chi è nelle vendite e sa quanto può essere\nfrustrante fare le cose bene senza risultati.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Per chi fa vendite ogni giorno e sa quanto può essere\ndifficile mantenere il metodo quando la pressione sale.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Se ti riconosci in questo, vale la lettura.\nSe non ti riconosci, vale ancora di più.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Per i commerciali che vogliono migliorare davvero\nsenza perdere tempo con consigli generici.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Se il tuo lavoro dipende dalla chiusura delle trattative,\nquesto articolo fa esattamente per te.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Per chi lavora in B2B e vuole alzare il proprio livello\nsu qualcosa di concreto e misurabile.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Ogni account manager dovrebbe leggere questo almeno una volta.\nMeglio due.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Se fai sviluppo commerciale, questo ti riguarda direttamente.\nNon è teoria — è roba che si usa.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },

    /* 50-59  Domande e riflessioni */
    function (t, h) { return 'Ti sei mai chiesto perché certe cose in vendita\nsembrano ovvie solo quando è troppo tardi?\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Cosa distingue davvero chi chiude da chi perde?\nNon è quello che pensi di solito.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Hai mai avuto la sensazione di fare la cosa giusta\nnel modo completamente sbagliato?\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Qual è la differenza tra un buon venditore\ne uno che sale davvero di livello?\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Quante opportunità stiamo perdendo per cose\nche potremmo correggere con poco sforzo?\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Cosa succederebbe se cambiassimo questa abitudine\nche diamo per scontata da anni?\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Perché certi approcci funzionano e altri no?\nQuesto articolo ha una risposta che mi ha convinto.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Stai davvero ascoltando il cliente\no stai solo aspettando il tuo turno per parlare?\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Quanto tempo stiamo spendendo nelle attività\nche davvero spostano i numeri?\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Cosa stiamo dando per scontato nelle vendite\nche forse non lo è affatto?\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },

    /* 60-69  Spunti pratici */
    function (t, h) { return 'Uno spunto pratico per chi lavora nelle vendite.\nNiente teorie, qualcosa da usare subito.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Un\'idea che vale la pena sperimentare questa settimana.\nCosta poco, può cambiare qualcosa.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Piccolo cambio di prospettiva, grande differenza\nsul risultato finale. Vale i cinque minuti.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Non è un consiglio scontato.\nÈ qualcosa di concreto che non avevo considerato.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Una cosa che mi ha fatto cambiare approccio\nsu qualcosa che facevo da sempre nello stesso modo.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Tre minuti di lettura che valgono tre ore di riflessione.\nNon esagero.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Il tipo di consiglio che sembra ovvio\nma che quasi nessuno applica davvero.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'La differenza tra sapere una cosa e farla davvero —\ne come colmare quel gap.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Un approccio semplice che cambia il modo di lavorare\nsenza stravolgere tutto.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Qualcosa di concreto da provare subito.\nNon domani — subito.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },

    /* 70-74  Team e colleghi */
    function (t, h) { return 'L\'ho condiviso con il mio team stamattina.\nLo condivido anche qui perché vale.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Ne ho parlato con dei colleghi e la discussione\nsi è accesa più del previsto.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Questo dovrebbe leggerlo ogni commerciale\nprima di iniziare la giornata. Almeno una volta.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Ne abbiamo parlato in team e ognuno\nci ha visto qualcosa di leggermente diverso.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Uno di quei contenuti che condivido con chi stimo\nnel mondo delle vendite.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },

    /* 75-79  Onestà */
    function (t, h) { return 'Essere onesti: quante volte preferiamo evitare\ncerti argomenti invece di affrontarli?\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Non è sempre facile ammetterlo,\nma questo articolo ha ragione su tutta la linea.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Ci vuole coraggio per fare certe cose nelle vendite.\nQuesto articolo lo spiega senza giri di parole.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'L\'onestà nelle vendite è sottovalutata.\nQuesto lo dice chiaramente e senza filtri.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Alcune verità fanno male ma servono.\nQuesto è uno di quegli articoli necessari.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },

    /* 80-84  Pipeline.news promo */
    function (t, h) { return 'La newsletter che leggo ogni settimana per tenere il ritmo.\nQuesto è uno degli articoli che mi sono rimasti di più.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'La seguo da un po\' e continua a sorprendermi.\nQuesto articolo è uno dei motivi.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Se non la conosci ancora, questo articolo\nè un ottimo punto di partenza per capire di cosa si tratta.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Una newsletter sul sales che vale davvero il tempo.\nQuesto articolo ne è la dimostrazione.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Continuano a pubblicare contenuti che fanno pensare.\nQuesto è l\'ultimo — e uno dei migliori.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },

    /* 85-89  Corti e diretti */
    function (t, h) { return 'Lascia che parli da solo.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Vale il click — te lo dico subito.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Da leggere. Senza troppe spiegazioni.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Articolo da tenere e rileggere ogni tanto.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Lo condivido perché vale davvero.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },

    /* 90-99  Narrativi */
    function (t, h) { return 'Ho una lista mentale di articoli che mi hanno cambiato\nil modo di lavorare. Questo ci entra.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Non condivido spesso roba online.\nQuando lo faccio, è perché vale davvero.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Alcune cose le sai già.\nAltre le scopri leggendo articoli come questo — inaspettatamente.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Il sales è fatto di dettagli.\nQuesto articolo ne illumina uno che spesso si trascura.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Non tutto quello che leggi online vale il tuo tempo.\nQuesto sì — te lo garantisco.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Mi piace quando un articolo mi fa dire\n"ecco, è esattamente così" — raramente capita.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'L\'ho mandato in DM a tre persone prima di postarlo.\nSe è arrivato fino qui, vale.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Ogni settimana cerco qualcosa che mi faccia crescere\nanche di poco. Questa settimana è questo.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Il modo in cui si affronta questo tema\nfa la differenza tra chi cresce e chi rimane fermo.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
    function (t, h) { return 'Tra tutto quello che ho letto questa settimana,\nquesto è l\'articolo che ti consiglio senza esitare.\n\n"' + t + '"' + (h ? '\n\n' + h : ''); },
  ];

  function generateText(title, hook, tags) {
    var hash = 0;
    for (var i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) | 0;
    var body = T[Math.abs(hash) % T.length](title, hook);
    return appendHashtags(body, tags);
  }

  /* ── sessionStorage cache ───────────────────────────────────────── */
  function cacheKey(url) { return 'li_post_' + url; }
  function getCached(url) { try { return sessionStorage.getItem(cacheKey(url)); } catch (_) { return null; } }
  function setCached(url, text) { try { sessionStorage.setItem(cacheKey(url), text); } catch (_) {} }

  /* ── Clipboard — synchronous inside user gesture, works on iOS ─── */
  function tryCopy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
    }
  }

  /* ── Bar ────────────────────────────────────────────────────────── */
  var LI_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>';

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
      '.li-bar-left{display:flex;align-items:center;gap:10px;flex:1;min-width:0;}',
      '.li-bar-icon{font-size:18px;flex-shrink:0;line-height:1;}',
      '.li-bar-msg{font-family:Inter,system-ui,sans-serif;font-size:14px;font-weight:600;line-height:1.4;}',
      '.li-bar-msg small{font-weight:400;font-size:12px;opacity:.7;display:block;margin-top:2px;}',
      '.li-bar-open{display:inline-flex;align-items:center;gap:6px;',
        'background:#0A66C2;color:#fff;text-decoration:none;',
        'font-family:Inter,sans-serif;font-size:14px;font-weight:700;',
        'border-radius:8px;padding:10px 18px;flex-shrink:0;transition:background .15s;white-space:nowrap;}',
      '.li-bar-open:hover,.li-bar-open:active{background:#094fa3;}',
      '.li-bar-close{background:none;border:none;color:rgba(255,255,255,.45);',
        'font-size:22px;cursor:pointer;padding:0 4px;line-height:1;flex-shrink:0;}',
      '.li-bar-close:hover{color:#fff;}',
      '@media(max-width:520px){.li-bar-open{width:100%;justify-content:center;}}',
    ].join('');
    document.head.appendChild(s);
  }

  function createBar() {
    var old = document.getElementById('li-confirm-bar');
    if (old) old.remove();
    injectBarStyles();
    var bar = document.createElement('div');
    bar.id = 'li-confirm-bar';
    document.body.appendChild(bar);
    return bar;
  }

  function setBarReady(bar, articleUrl) {
    if (!bar.parentNode) return;
    var liUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(articleUrl);
    bar.innerHTML =
      '<div class="li-bar-left">' +
        '<span class="li-bar-icon">✓</span>' +
        '<span class="li-bar-msg">Bonus! C\'è un testo pronto negli appunti,' +
          '<small>incollalo nel post dopo aver aperto LinkedIn</small></span>' +
      '</div>' +
      '<a class="li-bar-open" href="' + liUrl + '" target="_blank" rel="noopener">' +
        LI_SVG + '&nbsp;Apri LinkedIn' +
      '</a>' +
      '<button class="li-bar-close" aria-label="Chiudi">×</button>';

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
    bar.style.transform  = 'translateY(100%)';
    setTimeout(function () { if (bar.parentNode) bar.remove(); }, 350);
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

    /* Generate or retrieve cached text — all synchronous */
    var cached = getCached(url);
    var text = cached || generateText(title, shortHook(excerpt, subtitle), tags);
    if (!cached) setCached(url, text);

    /* Clipboard called synchronously inside user gesture — works on iOS */
    tryCopy(text);

    var bar = createBar();
    setBarReady(bar, url);
  });
})();
