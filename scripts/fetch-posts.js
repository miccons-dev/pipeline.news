/**
 * fetch-posts.js
 * Scarica le ultime 3 edizioni pubblicate da Beehiiv e le salva in posts.json.
 *
 * Variabili d'ambiente richieste:
 *   BEEHIIV_API_KEY         — API key (GitHub Secret, non metterla mai nel codice)
 *   BEEHIIV_PUBLICATION_ID  — Publication ID (es. pub_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
 *
 * Uso locale (solo per test):
 *   BEEHIIV_API_KEY=xxx BEEHIIV_PUBLICATION_ID=pub_xxx node scripts/fetch-posts.js
 */

'use strict';

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const API_KEY = process.env.BEEHIIV_API_KEY;
const PUB_ID  = process.env.BEEHIIV_PUBLICATION_ID;

if (!API_KEY) {
  console.error('❌  BEEHIIV_API_KEY non trovata. Imposta la variabile d\'ambiente.');
  process.exit(1);
}
if (!PUB_ID) {
  console.error('❌  BEEHIIV_PUBLICATION_ID non trovata. Imposta la variabile d\'ambiente.');
  process.exit(1);
}

const endpoint =
  `https://api.beehiiv.com/v2/publications/${PUB_ID}/posts` +
  `?status=confirmed&limit=3&order_by=publish_date&direction=desc`;

console.log(`📡  Recupero ultime 3 edizioni da Beehiiv (${PUB_ID})…`);

const options = {
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
};

https.get(endpoint, options, (res) => {
  let raw = '';
  res.on('data', chunk => { raw += chunk; });
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error(`❌  Beehiiv API ha risposto con ${res.statusCode}:`);
      console.error(raw.slice(0, 400));
      process.exit(1);
    }

    let json;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      console.error('❌  Impossibile parsare la risposta JSON:', e.message);
      process.exit(1);
    }

    const posts = (json.data || []).map(p => ({
      id:           p.id,
      title:        p.title        || '',
      subtitle:     p.subtitle     || '',
      preview_text: p.preview_text || '',
      web_url:      p.web_url      || '#',
      publish_date: p.publish_date || 0,   // Unix timestamp in secondi
      thumbnail_url: p.thumbnail_url || null,
    }));

    const output = {
      _comment:  'Generato automaticamente da GitHub Actions — non modificare a mano.',
      posts,
      generated: new Date().toISOString(),
    };

    const dest = path.join(__dirname, '..', 'posts.json');
    fs.writeFileSync(dest, JSON.stringify(output, null, 2) + '\n');

    console.log(`✅  Salvate ${posts.length} edizioni in posts.json`);
    posts.forEach(p => console.log(`   • ${new Date(p.publish_date * 1000).toLocaleDateString('it-IT')} — ${p.title}`));
  });
}).on('error', (err) => {
  console.error('❌  Errore di rete:', err.message);
  process.exit(1);
});
