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
    return body + '\n\n' + hashtags.join(' ');
  }

  /* ── 100 Italian sales post templates ──────────────────────────── */
  var T = [
    /* 0-9  Discovery */
    function (t, h, u) { return 'Ho trovato un articolo che mi ha fatto fermare a riflettere:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Se lavori nelle vendite, vale la lettura.\n➡️ ' + u; },
    function (t, h, u) { return 'Stavo scorrendo Pipeline.news e questo mi ha colpito:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '📖 ' + u; },
    function (t, h, u) { return 'Ho smesso di scorrere per leggere questo. Vale il tuo tempo:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Questo articolo merita più di uno scroll veloce:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Lo condivido perché mi ha cambiato prospettiva:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '📌 ' + u; },
    function (t, h, u) { return 'Ho trovato questo su Pipeline.news e non riuscivo a smettere di leggerlo:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Ogni tanto si trovano articoli che dicono quello che pensi da anni. Questo è uno:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Questo me lo segno per rileggerlo:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Da Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Quando un articolo ti fa dire “finalmente qualcuno lo ha scritto”:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Ho trovato uno spunto pratico che vale la pena condividere:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },

    /* 10-19  Quante volte */
    function (t, h, u) { return 'Quante volte ci siamo trovati in questa situazione?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Lo condivido da Pipeline.news.\n➡️ ' + u; },
    function (t, h, u) { return 'Quante volte te lo sei chiesto anche tu?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Quante volte hai vissuto questa scena?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Quante volte abbiamo fatto esattamente questo errore?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Quante volte ci siamo trovati a corto di risposte?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Da leggere ➡️ ' + u; },
    function (t, h, u) { return 'Quante volte hai rimandato di affrontare questo?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Quante volte ti è successo e hai pensato fosse solo sfortuna?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Quante volte ci siamo detti “la prossima volta faccio diversamente”?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Quante volte abbiamo perso un deal per questo motivo?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Quante volte abbiamo usato l’approccio sbagliato senza accorgercene?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Riflessione utile ➡️ ' + u; },

    /* 20-29  Questa settimana */
    function (t, h, u) { return 'Questa settimana mi è rimasto in testa questo:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news — lo consiglio.\n➡️ ' + u; },
    function (t, h, u) { return 'Questa settimana ho letto qualcosa che vale la pena condividere:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Questa mattina ho trovato un articolo che mi ha messo in moto la testa:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '📖 Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Negli ultimi giorni mi sono ritrovato a pensare a questo:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'La lettura di questa settimana che consiglio:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Stamattina ho letto questo e mi è rimasto:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Questa settimana un articolo mi ha fatto cambiare idea su qualcosa:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Lettura del weekend che consiglio a chi lavora nelle vendite:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Questa è la cosa più utile che ho letto di recente:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Inizio settimana con un articolo che vale:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },

    /* 30-39  Esperienza personale */
    function (t, h, u) { return 'Lo confesso: ho fatto questo errore per anni:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '📌 Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Una cosa che ho capito tardi nelle vendite:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Se potessi tornare indietro, avrei letto questo prima:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Un errore che ho smesso di fare dopo aver capito questo:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Ho impiegato troppo tempo a capirlo. Forse questo articolo ti risparmia del tempo:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Ci ho messo anni a capirlo. L’articolo lo spiega meglio di quanto farei io:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Una delle lezioni più importanti che ho imparato nelle vendite:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Questo me lo avrei voluto sentire dire all’inizio della mia carriera:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Ho cambiato approccio su questo dopo aver letto qualcosa di simile. Lo condivido:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Ci ho sbattuto la testa abbastanza volte da capire che questo è importante:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },

    /* 40-49  Audience callout */
    function (t, h, u) { return 'Se lavori nelle vendite, questo articolo parla di te:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Se gestisci un team commerciale, leggilo:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'A chi è nel sales: questo vale il tuo tempo:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Per chi fa vendite ogni giorno — e sa quanto può essere difficile:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Se ti riconosci in questo, vale la lettura:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Per i commerciali che vogliono migliorare davvero:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Se il tuo lavoro dipende dal closing, questo fa per te:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Per chi lavora in B2B e vuole alzare il proprio livello:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Ogni account manager dovrebbe leggere questo:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Se fai sales development, questo ti riguarda direttamente:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },

    /* 50-59  Domande e riflessioni */
    function (t, h, u) { return 'Ti sei mai chiesto perché alcune cose in vendita sembrano ovvie solo a posteriori?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Cosa distingue chi chiude da chi perde?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Una prospettiva interessante ➡️ ' + u; },
    function (t, h, u) { return 'Hai mai avuto la sensazione di stare facendo la cosa giusta nel modo sbagliato?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Qual è la differenza tra un buon venditore e un grande venditore?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Qualcosa su cui riflettere ➡️ ' + u; },
    function (t, h, u) { return 'Mi sono chiesto: quante opportunità perdiamo per cose che potremmo correggere?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Cosa succederebbe se cambiassimo questa abitudine?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Perché alcuni approcci funzionano e altri no? Questo articolo ha una risposta:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Stai davvero ascoltando il cliente o stai aspettando il tuo turno?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Quanto tempo stiamo spendendo nelle attività che davvero contano?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Cosa stiamo dando per scontato che forse non lo è affatto?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },

    /* 60-69  Spunti pratici */
    function (t, h, u) { return 'Uno spunto pratico per chi lavora nelle vendite:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Fonte: Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Un’idea che vale la pena sperimentare:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Piccolo cambio di prospettiva, grande differenza:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Non è un consiglio scontato. È qualcosa di concreto:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Una cosa che mi ha fatto cambiare approccio:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Tre minuti di lettura che valgono tre ore di riflessione:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Il tipo di consiglio che sembra ovvio ma non lo applica quasi nessuno:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'La differenza tra sapere e fare — e come colmare il gap:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Un framework semplice che cambia il modo di lavorare:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Qualcosa di concreto da provare subito:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },

    /* 70-74  Team e colleghi */
    function (t, h, u) { return 'L’ho condiviso con il mio team. Lo condivido anche qui:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Ne ho parlato con dei colleghi e la discussione si è accesa:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Questo dovrebbe leggerlo ogni commerciale prima di iniziare la giornata:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Ne abbiamo parlato in team e ognuno ci ha visto qualcosa di diverso:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Uno di quei contenuti che condivido con chi voglio bene nel sales:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },

    /* 75-79  Onestà */
    function (t, h, u) { return 'Essere onesti: quante volte preferiamo evitare certi argomenti?\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Vale leggerlo ➡️ ' + u; },
    function (t, h, u) { return 'Non è sempre facile ammetterlo, ma questo articolo ha ragione:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Ci vuole coraggio per fare certe cose in vendita. Questo lo spiega bene:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'L’onestà nel sales è sottovalutata. Questo articolo lo dice chiaramente:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Alcune verità fanno male ma servono. Questo è uno di quegli articoli:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },

    /* 80-84  Pipeline.news promo */
    function (t, h, u) { return 'Pipeline.news è la newsletter che leggo per tenere il ritmo. Questo è uno dei migliori articoli:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Seguo Pipeline.news da un po’. Questo è tra gli articoli che mi sono rimasti:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Se non conosci Pipeline.news, questo articolo è un buon punto di partenza:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Una newsletter sul sales che vale davvero. Questo articolo ne è la prova:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Pipeline.news continua a pubblicare contenuti che fanno pensare. Come questo:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },

    /* 85-89  Corti e diretti */
    function (t, h, u) { return '"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Articolo interessante da Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Vale il click:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Da leggere:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Articolo da tenere:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Condivido perché vale:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },

    /* 90-99  Narrativi */
    function (t, h, u) { return 'Ho una lista mentale di articoli che mi hanno cambiato il modo di lavorare. Questo ci entra:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Non condivido spesso, ma questo vale:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Alcune cose le sai già. Altre le scopri leggendo articoli come questo:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Il sales è fatto di dettagli. Questo articolo ne illumina uno importante:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Non tutto quello che leggi online vale il tuo tempo. Questo sì:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Mi piace quando un articolo mi fa dire “ecco, è esattamente così”:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Ho condiviso questo in DM con tre persone prima di postarlo. Vale:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Ogni settimana cerco qualcosa che mi faccia crescere. Questa settimana è questo:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
    function (t, h, u) { return 'Il modo in cui si affronta questo tema fa la differenza tra chi cresce e chi stagna:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + 'Pipeline.news ➡️ ' + u; },
    function (t, h, u) { return 'Tra tutto quello che ho letto questa settimana, questo è l’articolo che ti consiglio:\n\n"' + t + '"\n\n' + (h ? h + '\n\n' : '') + '➡️ ' + u; },
  ];

  function generateText(title, hook, url, tags) {
    var hash = 0;
    for (var i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) | 0;
    var body = T[Math.abs(hash) % T.length](title, hook, url);
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
        '<span class="li-bar-msg">Bonus! C’è un testo pronto negli appunti,' +
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
    var text = cached || generateText(title, shortHook(excerpt, subtitle), url, tags);
    if (!cached) setCached(url, text);

    /* Clipboard called synchronously inside user gesture — works on iOS */
    tryCopy(text);

    var bar = createBar();
    setBarReady(bar, url);
  });
})();
