// DoorGo 文章服务端渲染（SSR）
//
// 目的：单页应用（SPA）的文章藏在 #guide=xxx 锚点里，搜索引擎收录极差。
// 本接口为每篇文章生成一份完整的 HTML（含 title / meta / JSON-LD / 正文），
// 让 Google 能直接抓取并收录。
//
// 路由（由 vercel.json rewrites 转发）：
//   /guide/<id>  →  /api/guide?id=<id>
//
// 普通用户访问 /guide/<id> 时也会拿到完整 HTML，再被前端 JS 接管（渐进增强）。

const fs = require('fs');
const path = require('path');

const SITE = 'https://getdoorgo.vercel.app';
const SITE_NAME = 'DoorGo';
const CAT_NAME = { account: '港澳开户', card: '香港信用卡', refund: '返款优惠', other: '攻略' };

let GUIDES = null;

function loadGuides() {
  if (GUIDES) return GUIDES;
  try {
    // 读基础内容库
    const src = fs.readFileSync(path.join(process.cwd(), 'guides-data.js'), 'utf8');
    const m = src.match(/var GUIDES = (\[[\s\S]*\]);/);
    if (!m) throw new Error('no GUIDES');
    // eslint-disable-next-line no-eval
    const base = eval(m[1]);
    const ids = {};
    base.forEach(function (g) { ids[g.id] = true; });
    // 叠加 2026 更新层
    try {
      const rev = fs.readFileSync(path.join(process.cwd(), 'content-revisions.js'), 'utf8');
      const win = { GUIDES: base };
      // eslint-disable-next-line no-new-func
      new Function('window', rev)(win);
      GUIDES = win.GUIDES;
    } catch (e) {
      GUIDES = base;
    }
    return GUIDES;
  } catch (e) {
    return [];
  }
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// 把 content 数组渲染成 HTML
function renderBlocks(content) {
  if (!Array.isArray(content)) return '';
  let out = '';
  content.forEach(function (b) {
    if (!b || !b.type) return;
    if (b.type === 'h2') out += '<h2>' + esc(b.text) + '</h2>';
    else if (b.type === 'h3') out += '<h3>' + esc(b.text) + '</h3>';
    else if (b.type === 'p') out += '<p>' + esc(b.text) + '</p>';
    else if (b.type === 'info') out += '<p class="note">' + esc(b.text) + '</p>';
    else if (b.type === 'tip') out += '<p class="tip">💡 ' + esc(b.text) + '</p>';
    else if (b.type === 'warn') out += '<p class="warn">⚠️ ' + esc(b.text) + '</p>';
    else if (b.type === 'ul' && Array.isArray(b.items)) {
      out += '<ul>' + b.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
    } else if (b.type === 'ol' && Array.isArray(b.items)) {
      out += '<ol>' + b.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ol>';
    } else if (b.type === 'table' && b.rows) {
      const head = b.head || (b.rows[0] || []);
      out += '<table><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
        '</tr></thead><tbody>' + b.rows.map(function (r) {
          return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table>';
    }
    // buy / referral 等交互型区块在 SSR 页里忽略（由前端 JS 处理）
  });
  return out;
}

module.exports = function (req, res) {
  const id = String((req.query && (req.query.id || req.query.g)) || '').trim();
  const guides = loadGuides();
  const g = guides.filter(function (x) { return x.id === id; })[0];

  if (!g) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).send(
      '<!DOCTYPE html><html lang="zh-Hans"><head><meta charset="utf-8">' +
      '<title>文章不存在｜' + SITE_NAME + '</title>' +
      '<meta name="robots" content="noindex">' +
      '<meta http-equiv="refresh" content="2;url=' + SITE + '/"></head>' +
      '<body style="font-family:-apple-system,sans-serif;padding:60px;text-align:center">' +
      '<h1>文章不存在</h1><p><a href="' + SITE + '/">返回首页</a></p></body></html>'
    );
  }

  const url = SITE + '/guide/' + encodeURIComponent(g.id);
  const title = g.title + '｜' + SITE_NAME;
  const desc = (g.desc || '').slice(0, 155);
  const tags = Array.isArray(g.tags) ? g.tags : [];
  const bodyHtml = renderBlocks(g.content);

  // JSON-LD 结构化数据（Google 富摘要）
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: g.title,
    description: desc,
    image: SITE + '/assets/og-cover.png',
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: {
      '@type': 'Organization', name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: SITE + '/assets/logo.png' }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: g.updated || '2026-08-18',
    dateModified: g.updated || '2026-08-18',
    articleSection: CAT_NAME[g.cat] || '攻略',
    keywords: tags.join(', ')
  });

  // 面包屑
  const crumbs = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '首页', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: CAT_NAME[g.cat] || '攻略', item: SITE + '/#cat=' + (g.cat || '') },
      { '@type': 'ListItem', position: 3, name: g.title, item: url }
    ]
  });

  const html = '<!DOCTYPE html>\n<html lang="zh-Hans">\n<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<meta name="theme-color" content="#0B6E5C">\n' +
    '<title>' + esc(title) + '</title>\n' +
    '<meta name="description" content="' + esc(desc) + '">\n' +
    '<meta name="keywords" content="' + esc(tags.join(',')) + '">\n' +
    '<link rel="canonical" href="' + esc(url) + '">\n' +
    '<meta property="og:type" content="article">\n' +
    '<meta property="og:title" content="' + esc(title) + '">\n' +
    '<meta property="og:description" content="' + esc(desc) + '">\n' +
    '<meta property="og:url" content="' + esc(url) + '">\n' +
    '<meta property="og:site_name" content="' + SITE_NAME + '">\n' +
    '<meta property="og:image" content="' + SITE + '/assets/og-cover.png">\n' +
    '<meta property="og:locale" content="zh_CN">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="twitter:title" content="' + esc(title) + '">\n' +
    '<meta name="twitter:description" content="' + esc(desc) + '">\n' +
    '<meta name="twitter:image" content="' + SITE + '/assets/og-cover.png">\n' +
    '<link rel="icon" href="/assets/favicon.png">\n' +
    '<script type="application/ld+json">' + jsonLd + '</script>\n' +
    '<script type="application/ld+json">' + crumbs + '</script>\n' +
    '<style>' +
    'body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;' +
    'color:#20323A;line-height:1.85;margin:0;background:#fff}' +
    '.wrap{width:min(760px,calc(100% - 40px));margin:0 auto;padding:32px 0 80px}' +
    'header.site{border-bottom:1px solid #D8E5E1;padding:14px 0;margin-bottom:26px}' +
    'header.site a{color:#064D40;font-weight:800;text-decoration:none;font-size:1.1rem}' +
    'h1{color:#064D40;font-size:clamp(1.7rem,4vw,2.3rem);line-height:1.3;margin:10px 0 14px}' +
    '.meta{color:#64747D;font-size:.85rem;margin-bottom:24px}' +
    '.tag{display:inline-block;background:#E7F2EF;color:#0B6E5C;border-radius:999px;' +
    'padding:3px 11px;font-size:.78rem;margin:0 6px 6px 0}' +
    'h2{color:#064D40;font-size:1.3rem;margin:30px 0 12px}' +
    'h3{color:#0B6E5C;font-size:1.08rem;margin:22px 0 10px}' +
    'p{margin:12px 0}' +
    'ul,ol{margin:12px 0;padding-left:24px}li{margin:7px 0}' +
    'table{width:100%;border-collapse:collapse;margin:18px 0;font-size:.9rem}' +
    'th,td{border:1px solid #D8E5E1;padding:9px 11px;text-align:left}' +
    'th{background:#F3FAF8;color:#064D40}' +
    '.note{background:#F3FAF8;border-left:3px solid #0B6E5C;padding:11px 14px;border-radius:8px;font-size:.92rem}' +
    '.tip{background:#F7F0DE;border-left:3px solid #C8A24B;padding:11px 14px;border-radius:8px;font-size:.92rem}' +
    '.warn{background:#FDF0EE;border-left:3px solid #C75A4B;padding:11px 14px;border-radius:8px;font-size:.92rem}' +
    '.cta{display:inline-block;background:#0B6E5C;color:#fff;padding:12px 24px;border-radius:999px;' +
    'text-decoration:none;font-weight:750;margin:22px 0}' +
    'footer{border-top:1px solid #D8E5E1;margin-top:50px;padding-top:20px;color:#64747D;font-size:.85rem}' +
    'footer a{color:#0B6E5C}' +
    '</style>\n</head>\n<body>\n' +
    '<div class="wrap">\n' +
    '<header class="site"><a href="/">DoorGo</a></header>\n' +
    '<nav style="font-size:.85rem;color:#64747D;margin-bottom:8px">' +
    '<a href="/" style="color:#0B6E5C;text-decoration:none">首页</a> › ' +
    esc(CAT_NAME[g.cat] || '攻略') + '</nav>\n' +
    '<h1>' + esc(g.title) + '</h1>\n' +
    '<div class="meta">' + esc(g.desc || '') + '</div>\n' +
    (tags.length ? '<div>' + tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div>\n' : '') +
    '<article>\n' + bodyHtml + '\n</article>\n' +
    '<a class="cta" href="/#guide=' + encodeURIComponent(g.id) + '">在 DoorGo 打开完整版 →</a>\n' +
    '<footer>本站内容为流程科普与攻略整理，仅供参考，政策以各银行官方为准。' +
    ' <a href="/">返回首页</a></footer>\n' +
    '</div>\n</body>\n</html>';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800');
  return res.status(200).send(html);
};
