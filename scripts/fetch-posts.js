/**
 * fetch-posts.js
 * Genera due file JSON da Beehiiv:
 *   posts.json   — ultime 3 edizioni (homepage)
 *   archive.json — tutte le edizioni con contenuto HTML completo (pagina archivio)
 *
 * Variabili d'ambiente richieste:
 *   BEEHIIV_API_KEY         — API key (GitHub Secret)
 *   BEEHIIV_PUBLICATION_ID  — Publication ID (es. pub_xxxxxxxx-...)
 *
 * Uso locale:
 *   BEEHIIV_API_KEY=xxx BEEHIIV_PUBLICATION_ID=pub_xxx node scripts/fetch-posts.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const API_KEY = process.env.BEEHIIV_API_KEY;
const PUB_ID  = process.env.BEEHIIV_PUBLICATION_ID;

if (!API_KEY || !PUB_ID) {
  console.warn('⚠️  BEEHIIV_API_KEY o BEEHIIV_PUBLICATION_ID mancanti — fetch saltato.');
  process.exit(0);
}

const BASE_URL = `https://api.beehiiv.com/v2/publications/${PUB_ID}/posts`;
const HEADERS  = { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' };

async function beehiivGet(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Beehiiv API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

function mapPost(p, includeContent = false) {
  const tags = (p.tags || []).map(t => typeof t === 'string' ? t : (t.name || '')).filter(Boolean);
  const post = {
    id:                p.id,
    kind:              'newsletter',
    title:             p.title             || '',
    subtitle:          p.subtitle          || '',
    preview_text:      p.preview_text      || '',
    web_url:           p.web_url           || '#',
    publish_date:      p.publish_date      || 0,
    thumbnail_url:     p.thumbnail_url     || null,
    image_url:         p.image_url         || null,
    image_alt:         p.image_alt         || '',
    image_attribution: p.image_attribution || '',
    tags,
  };
  if (includeContent) {
    post.content_html = p.content?.free?.web || '';
  }
  return post;
}

function writeJson(filename, data) {
  const dest = path.join(__dirname, '..', filename);
  fs.writeFileSync(dest, JSON.stringify(data, null, 2) + '\n');
}

async function main() {
  // ── 1. posts.json — ultime 3 edizioni per la homepage ──────────
  console.log('📡  Recupero ultime 3 edizioni…');
  const recent = await beehiivGet(
    `${BASE_URL}?status=confirmed&limit=3&order_by=publish_date&direction=desc`
  );
  const recentPosts = (recent.data || []).map(p => mapPost(p));
  writeJson('posts.json', {
    _comment:  'Generato automaticamente da GitHub Actions — non modificare a mano.',
    posts:     recentPosts,
    generated: new Date().toISOString(),
  });
  console.log(`✅  posts.json — ${recentPosts.length} edizioni`);
  recentPosts.forEach(p =>
    console.log(`   • ${new Date(p.publish_date * 1000).toLocaleDateString('it-IT')} — ${p.title}`)
  );

  // ── 2. archive.json — tutte le edizioni con contenuto HTML ──────
  console.log('\n📡  Recupero archivio completo con contenuti…');
  const archive = await beehiivGet(
    `${BASE_URL}?status=confirmed&limit=100&order_by=publish_date&direction=desc&expand%5B%5D=free_web_content`
  );
  const archivePosts = (archive.data || []).map(p => mapPost(p, true));
  writeJson('archive.json', {
    _comment:  'Generato automaticamente da GitHub Actions — non modificare a mano.',
    posts:     archivePosts,
    generated: new Date().toISOString(),
  });
  console.log(`✅  archive.json — ${archivePosts.length} edizioni`);
  archivePosts.forEach(p =>
    console.log(`   • ${new Date(p.publish_date * 1000).toLocaleDateString('it-IT')} — ${p.title}`)
  );
}

main().catch(err => {
  console.error('❌  Errore:', err.message);
  process.exit(1);
});
