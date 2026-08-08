#!/usr/bin/env node
/**
 * 自動產生 sitemap.xml
 *
 * 掃描專案內所有 HTML 頁面，按 vercel.json 嘅 cleanUrls 規則轉成乾淨網址，
 * 並用 git 最後修改日期作為 lastmod。
 *
 * 用法：node tools/generate-sitemap.js
 *      node tools/generate-sitemap.js --check   （只檢查，唔寫入；有差異回傳 exit 1）
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE = 'https://zpaintcar.com';
const ROOT = path.resolve(__dirname, '..');
const CHECK_ONLY = process.argv.includes('--check');

// 唔應該收錄嘅檔案
const EXCLUDE = new Set(['404.html', '500.html']);

function gitDate(file) {
  try {
    const out = execSync(`git log -1 --format=%cs -- "${file}"`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) return out;
  } catch (_) {}
  return new Date(fs.statSync(path.join(ROOT, file)).mtime)
    .toISOString()
    .slice(0, 10);
}

function collect() {
  const files = [];
  for (const f of fs.readdirSync(ROOT)) {
    if (f.endsWith('.html') && !EXCLUDE.has(f)) files.push(f);
  }
  const blogDir = path.join(ROOT, 'blog');
  if (fs.existsSync(blogDir)) {
    for (const f of fs.readdirSync(blogDir)) {
      if (f.endsWith('.html') && !EXCLUDE.has(f)) files.push(`blog/${f}`);
    }
  }
  return files;
}

function entryFor(file) {
  if (file === 'index.html') {
    return { loc: `${BASE}/`, priority: '1.0', changefreq: 'weekly', sort: 0 };
  }
  if (file === 'blog/index.html') {
    return { loc: `${BASE}/blog`, priority: '0.9', changefreq: 'weekly', sort: 1 };
  }
  const slug = file.replace(/\.html$/, '');
  const isArticle = file.startsWith('blog/');
  return {
    loc: `${BASE}/${slug}`,
    priority: isArticle ? '0.8' : '0.7',
    changefreq: 'monthly',
    sort: isArticle ? 2 : 3,
  };
}

const entries = collect()
  .map((file) => ({ ...entryFor(file), lastmod: gitDate(file), file }))
  .sort((a, b) => a.sort - b.sort || (a.lastmod < b.lastmod ? 1 : -1));

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entries
    .map(
      (e) =>
        '  <url>\n' +
        `    <loc>${e.loc}</loc>\n` +
        `    <lastmod>${e.lastmod}</lastmod>\n` +
        `    <changefreq>${e.changefreq}</changefreq>\n` +
        `    <priority>${e.priority}</priority>\n` +
        '  </url>'
    )
    .join('\n') +
  '\n</urlset>\n';

const target = path.join(ROOT, 'sitemap.xml');
const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';

if (CHECK_ONLY) {
  if (current !== xml) {
    console.error('sitemap.xml 已過期，需要重新產生');
    process.exit(1);
  }
  console.log(`sitemap.xml 最新，共 ${entries.length} 條網址`);
  process.exit(0);
}

if (current === xml) {
  console.log(`sitemap.xml 無變化，共 ${entries.length} 條網址`);
} else {
  fs.writeFileSync(target, xml);
  console.log(`已更新 sitemap.xml，共 ${entries.length} 條網址`);
}
