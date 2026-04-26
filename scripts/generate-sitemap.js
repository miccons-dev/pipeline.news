'use strict';
const fs   = require('fs');
const path = require('path');

const BASE  = 'https://www.pipeline.news';
const ROOT  = path.join(__dirname, '..');

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
}

function isoDate(ts) {
  return new Date(ts * 1000).toISOString().split('T')[0];
}

function url(loc, lastmod, changefreq, priority) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    lastmod      ? `    <lastmod>${lastmod}</lastmod>`           : '',
    changefreq   ? `    <changefreq>${changefreq}</changefreq>` : '',
    priority     ? `    <priority>${priority}</priority>`       : '',
    '  </url>',
  ].filter(Boolean).join('\n');
}

const entries = [];

// Static pages
entries.push(url(`${BASE}/`,             null, 'weekly', '1.0'));
entries.push(url(`${BASE}/archive.html`, null, 'weekly', '0.9'));
// blog.html added below with lastmod from posts

// Blog posts — each gets its own crawlable URL
let blogAdded = false;
try {
  const blog = readJson('blog.json');
  const posts = (blog.posts || [])
    .filter(p => p.id && p.title && p.publish_date)
    .sort((a, b) => b.publish_date - a.publish_date);
  entries.push(url(`${BASE}/blog.html`, posts.length ? isoDate(posts[0].publish_date) : null, 'weekly', '0.9'));
  blogAdded = true;
  posts.forEach(p => {
    entries.push(url(
      `${BASE}/post.html?id=${encodeURIComponent(p.id)}`,
      isoDate(p.publish_date),
      'monthly',
      '0.7'
    ));
  });
} catch (e) { console.warn('blog.json not found:', e.message); }
if (!blogAdded) entries.push(url(`${BASE}/blog.html`, null, 'weekly', '0.9'));

// Newsletter archive — use ?open= (crawlable) instead of hash fragments
try {
  const archive = readJson('archive.json');
  const posts = (archive.posts || [])
    .filter(p => p.id && p.title && p.publish_date)
    .sort((a, b) => b.publish_date - a.publish_date);
  posts.forEach(p => {
    entries.push(url(
      `${BASE}/archive.html?open=${encodeURIComponent(p.id)}`,
      isoDate(p.publish_date),
      'monthly',
      '0.8'
    ));
  });
} catch (e) { console.warn('archive.json not found:', e.message); }

// Static utility pages
entries.push(url(`${BASE}/invite.html`, null, 'monthly', '0.5'));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${entries.join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`sitemap.xml generated — ${entries.length} URLs`);
