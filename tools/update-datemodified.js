#!/usr/bin/env node
/**
 * 自動更新 JSON-LD 嘅 dateModified（以及 Article 嘅 dateModified）
 *
 * 掃描全部 HTML，攞每個檔嘅最後 git commit 日期（YYYY-MM-DD），
 * 覆寫入 JSON-LD block 內嘅 dateModified 屬性。
 *
 * 邏輯：
 * - Blog 文章（blog/*.html）：Article schema 用 ISO 全時（YYYY-MM-DDTHH:MM:SSZ）
 * - 其他頁面（首頁、價錢頁）：WebPage/LocalBusiness schema 用短日 YYYY-MM-DD
 *
 * 用法：
 *   node tools/update-datemodified.js              （寫入變化）
 *   node tools/update-datemodified.js --check       （只檢查，有變回傳 exit 1）
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHECK_ONLY = process.argv.includes('--check');

const EXCLUDE = new Set(['404.html', '500.html']);

function gitDate(file) {
  // Returns YYYY-MM-DD from last SUBSTANTIVE commit (skip bot auto-commits) to avoid churn.
  // 排除 github-actions[bot] 嘅自動 commit（避免 dateModified 反覆變動）
  try {
    const out = execSync(
      `git log --format=%H%x09%cs --invert-grep --author='github-actions\\[bot\\]' -- "${file}" | head -1`,
      {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        shell: '/bin/bash',
      }
    ).trim();
    const match = out.match(/\t(\d{4}-\d{2}-\d{2})$/);
    if (match) return match[1];
  } catch (_) {}
  // Fallback: any last commit
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

function collectHtml() {
  const files = [];
  // Root-level HTML
  for (const f of fs.readdirSync(ROOT)) {
    if (f.endsWith('.html') && !EXCLUDE.has(f)) files.push(f);
  }
  // Blog HTML
  const blogDir = path.join(ROOT, 'blog');
  if (fs.existsSync(blogDir)) {
    for (const f of fs.readdirSync(blogDir)) {
      if (f.endsWith('.html') && !EXCLUDE.has(f)) files.push(`blog/${f}`);
    }
  }
  return files;
}

// walk JSON tree and replace any `dateModified` value with `newValue`
function walkReplaceDate(node, newDate, newDateTime) {
  if (Array.isArray(node)) {
    for (const item of node) walkReplaceDate(item, newDate, newDateTime);
    return;
  }
  if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      if (key === 'dateModified' && typeof node[key] === 'string') {
        // preserve time-format if original had T (ISO datetime)
        const hasTime = node[key].includes('T');
        node[key] = hasTime ? newDateTime : newDate;
      } else {
        walkReplaceDate(node[key], newDate, newDateTime);
      }
    }
  }
}

function processFile(relPath) {
  const abs = path.join(ROOT, relPath);
  const html = fs.readFileSync(abs, 'utf8');
  const date = gitDate(relPath); // YYYY-MM-DD
  const dateTime = `${date}T04:00:00Z`;

  const regex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let changed = false;
  let newHtml = html.replace(regex, (match, body) => {
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      console.warn(`⚠️  ${relPath}: JSON-LD 解析失敗，跳過此 block`);
      return match;
    }
    const before = JSON.stringify(data);
    walkReplaceDate(data, date, dateTime);
    const after = JSON.stringify(data);
    if (before !== after) {
      changed = true;
      const newBody = JSON.stringify(data, null, 2);
      return `<script type="application/ld+json">\n${newBody}\n</script>`;
    }
    return match;
  });

  if (changed) {
    if (!CHECK_ONLY) fs.writeFileSync(abs, newHtml);
    console.log(`${CHECK_ONLY ? '[check]' : '[update]'} ${relPath} → ${date}`);
    return true;
  }
  return false;
}

const files = collectHtml();
let anyChange = false;
for (const f of files) {
  if (processFile(f)) anyChange = true;
}

if (CHECK_ONLY && anyChange) {
  console.error('\n❌ 有頁面嘅 dateModified 與 git 日期唔一致，請執行：node tools/update-datemodified.js');
  process.exit(1);
}
if (!anyChange) console.log('✅ 全部 dateModified 已同步');
