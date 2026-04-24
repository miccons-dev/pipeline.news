'use strict';

const express = require('express');
const https   = require('https');
const router  = express.Router();

const SITE = process.env.SITE_URL || 'https://www.pipeline.news';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

router.get('/share', async (req, res) => {
  const { id, type = 'blog' } = req.query;
  if (!id) return res.redirect(SITE);

  const isNewsletter = type === 'newsletter';
  const jsonUrl  = isNewsletter
    ? `${SITE}/archive.json?_=${Date.now()}`
    : `${SITE}/blog.json?_=${Date.now()}`;
  const destUrl  = isNewsletter
    ? `${SITE}/archive.html?open=${encodeURIComponent(id)}`
    : `${SITE}/post.html?id=${encodeURIComponent(id)}`;

  try {
    const data = await fetchJson(jsonUrl);
    const post = (data.posts || []).find(p => p.id === id);
    if (!post) return res.redirect(isNewsletter ? `${SITE}/archive.html` : `${SITE}/blog.html`);

    const img   = post.thumbnail_url || post.image_url || `${SITE}/logo.png`;
    const title = esc(post.title || 'Pipeline.news');
    const desc  = esc(post.subtitle || post.preview_text || 'La newsletter italiana per i professionisti della vendita.');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(`<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>${title} — Pipeline.news</title>
<meta property="og:type" content="article">
<meta property="og:site_name" content="Pipeline.news">
<meta property="og:title" content="${title} — Pipeline.news">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:url" content="${esc(destUrl)}">
<meta property="og:locale" content="it_IT">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} — Pipeline.news">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${esc(img)}">
<link rel="canonical" href="${esc(destUrl)}">
<meta http-equiv="refresh" content="0;url=${esc(destUrl)}">
<script>window.location.replace(${JSON.stringify(destUrl)})</script>
</head>
<body></body>
</html>`);
  } catch {
    res.redirect(destUrl);
  }
});

module.exports = router;
