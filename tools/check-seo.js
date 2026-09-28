#!/usr/bin/env node
// URL rule: canonical/og:url/sitemap use clean, fragment-free URLs.
// In-page #anchors remain usable; case-card links use the article URL.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://zpaintcar.com';
const files = [
  ...fs.readdirSync(ROOT).filter(f => f.endsWith('.html')),
  ...fs.readdirSync(path.join(ROOT, 'blog')).filter(f => f.endsWith('.html')).map(f => `blog/${f}`),
].filter(f => !['404.html', '500.html'].includes(f));
const issues = [];
const assert = (ok, message) => { if (!ok) issues.push(message); };
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
const text = html => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const targets = new Set(['spray-paint-price-hk.html', 'car-wrap-price-hk.html', 'scratch-repair-price-hk.html']);
const anchorArticles = new Set(['/blog/bmw-c400gt-scooter-wrap', '/blog/tesla-model-y-matte-grey-wrap']);
const canonicalByFile = new Map();
for (const file of files) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const slug = file === 'index.html' ? '/' : file === 'blog/index.html' ? '/blog' : '/' + file.replace(/\.html$/, '');
  const canonical = BASE + slug;
  canonicalByFile.set(file, canonical);
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map(m => attrs(m[0]));
  const canonicals = links.filter(t => t.rel === 'canonical');
  assert(canonicals.length === 1 && canonicals[0].href === canonical, `${file}: canonical must be ${canonical}`);
  const metas = [...html.matchAll(/<meta\b[^>]*>/g)].map(m => attrs(m[0]));
  assert(metas.find(t => t.property === 'og:url')?.content === canonical, `${file}: og:url mismatch`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { issues.push(`${file}: JSON-LD ${e.message}`); }
  }
  for (const m of html.matchAll(/<a\b[^>]*>/g)) {
    const href = attrs(m[0]).href;
    if (!href) continue;
    const url = new URL(href, canonical);
    if (url.origin !== BASE) continue;
    assert(!url.pathname.endsWith('.html') && (url.pathname === '/' || !url.pathname.endsWith('/')), `${file}: noncanonical internal link ${href}`);
    if (anchorArticles.has(url.pathname) && url.hash) {
      assert(url.pathname === slug && href.startsWith('#'), `${file}: article cards should link to clean URL: ${href}`);
      const id = decodeURIComponent(url.hash.slice(1));
      assert(html.includes(`id="${id}"`), `${file}: missing anchor ${href}`);
    }
  }
  if (!targets.has(file)) continue;
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  for (const key of ['og:title', 'twitter:title']) {
    assert(metas.find(t => (t.name || t.property) === key)?.content === title, `${file}: ${key} mismatch`);
  }
  const description = metas.find(t => t.name === 'description')?.content;
  for (const key of ['og:description', 'twitter:description']) {
    assert(metas.find(t => (t.name || t.property) === key)?.content === description, `${file}: ${key} mismatch`);
  }
  const visibleFaqs = [...html.matchAll(/<div class="faq-item">\s*<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>\s*<\/div>/g)]
    .map(m => ({q: text(m[1]), a: text(m[2])}));
  const graph = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => {
    const json = JSON.parse(m[1]); return json['@graph'] || [json];
  });
  const schemaFaqs = graph.find(n => n['@type'] === 'FAQPage')?.mainEntity || [];
  assert(schemaFaqs.length === visibleFaqs.length && visibleFaqs.length > 0, `${file}: FAQ count mismatch`);
  visibleFaqs.forEach((f, i) => assert(f.q === schemaFaqs[i]?.name && f.a === schemaFaqs[i]?.acceptedAnswer?.text, `${file}: FAQ ${i + 1} mismatch`));
  for (const position of ['hero', 'footer', 'floating']) {
    assert(html.includes(`data-cta-location="${position}"`), `${file}: missing ${position} CTA`);
  }
  assert(html.includes("cta_location: a.getAttribute('data-cta-location')"), `${file}: missing CTA tracking`);
}
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const listed = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
for (const url of listed) assert([...canonicalByFile.values()].includes(url), `Sitemap noncanonical URL: ${url}`);
assert(listed.length === new Set(listed).size, 'Duplicate sitemap URLs');
if (issues.length) {
  console.error(issues.join('\n'));
  process.exit(1);
}
console.log(`SEO checks passed: ${files.length} page URLs; metadata, FAQ parity and CTA tracking on ${targets.size} price pages; article anchors preserved.`);
