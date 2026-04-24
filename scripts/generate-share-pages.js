'use strict';

const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function page(post, shareUrl, destUrl) {
  const img   = post.thumbnail_url || post.image_url || 'https://www.pipeline.news/logo.png';
  const title = esc(post.title || 'Pipeline.news');
  const desc  = esc(post.subtitle || post.preview_text || 'La newsletter italiana per i professionisti della vendita.');
  return `<!DOCTYPE html><html lang="it"><head>
<meta charset="UTF-8">
<title>${title} — Pipeline.news</title>
<meta property="og:type" content="article">
<meta property="og:site_name" content="Pipeline.news">
<meta property="og:title" content="${title} — Pipeline.news">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:url" content="${esc(shareUrl)}">
<meta property="og:locale" content="it_IT">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} — Pipeline.news">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${esc(img)}">
<link rel="canonical" href="${esc(shareUrl)}">
<script>window.location.replace(${JSON.stringify(destUrl)})</script>
</head><body></body></html>`;
}

const outDir = path.join(ROOT, 'share');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

let count = 0;

for (const [file, makeUrl] of [
  ['blog.json',    id => `https://www.pipeline.news/post.html?id=${encodeURIComponent(id)}`],
  ['archive.json', id => `https://www.pipeline.news/archive.html?open=${encodeURIComponent(id)}`],
]) {
  const jsonPath = path.join(ROOT, file);
  if (!fs.existsSync(jsonPath)) { console.log(`${file} not found, skipping`); continue; }
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  for (const post of data.posts || []) {
    if (!post.id) continue;
    const safeId   = post.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const shareUrl = `https://www.pipeline.news/share/${safeId}.html`;
    fs.writeFileSync(path.join(outDir, `${safeId}.html`), page(post, shareUrl, makeUrl(post.id)));
    count++;
  }
}

console.log(`✅  Generated ${count} share pages → /share/`);
