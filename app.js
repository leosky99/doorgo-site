// DoorGo 攻略站渲染逻辑
(function () {
  var grid = document.getElementById('guideGrid');
  var catNav = document.getElementById('catNav');
  var searchInput = document.getElementById('searchInput');
  var currentCat = 'all';
  var currentQuery = '';

  var CAT_LABEL = { account: '港澳开户', card: '香港信用卡', refund: '付费服务' };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function matches(g) {
    var categoryMatch = currentCat === 'all'
      || (currentCat === 'paid' ? !!g.paid : g.cat === currentCat);
    if (!categoryMatch) return false;
    if (!currentQuery) return true;
    var q = currentQuery.toLowerCase();
    var hay = (g.title + ' ' + g.desc + ' ' + (g.tags || []).join(' ')).toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function cardHtml(g) {
    return '<article class="guide" tabindex="0" role="link" aria-label="查看攻略：' + escapeHtml(g.title) + '" onclick="openGuide(\'' + g.id + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openGuide(\'' + g.id + '\')}" data-guide-id="' + escapeHtml(g.id) + '">' 
      + '<div class="thumb ' + escapeHtml(g.thumb) + '">' + escapeHtml(g.icon)
      + '<span class="cat">' + escapeHtml(CAT_LABEL[g.cat] || '攻略') + '</span>'
      + (g.hot ? '<span class="soon" style="background:#E0524D">热门</span>' : '')
      + (g.paid ? '<span class="soon" style="background:var(--gold)">' + escapeHtml(g.price || '付费') + '</span>' : '')
      + '</div><div class="g-body"><h3>' + escapeHtml(g.title) + '</h3>'
      + '<p>' + escapeHtml(g.desc) + '</p><div class="g-more">查看攻略 →</div></div></article>';
  }

  function renderGuides() {
    var list = GUIDES.filter(matches);
    if (!list.length) {
      grid.innerHTML = '<p style="text-align:center;color:var(--muted);grid-column:1/-1">没有找到相关内容，换个关键词试试。</p>';
      return;
    }

    if (currentCat === 'all') {
      var groups = [
        { key: 'account', label: '🏦 港澳开户' },
        { key: 'card', label: '💳 香港信用卡' },
        { key: 'paid', label: '💎 付费服务' }
      ];
      var html = '';
      groups.forEach(function (grp) {
        var items = list.filter(function (g) { return grp.key === 'paid' ? !!g.paid : g.cat === grp.key; });
        if (!items.length) return;
        html += '<div class="acc-group"><button class="group-title" type="button" onclick="toggleGroup(this)" aria-expanded="false">'
          + '<span>' + grp.label + '</span><span class="acc-count">' + items.length + ' 篇</span><span class="acc-arrow" aria-hidden="true">▾</span></button>'
          + '<div class="group-cards acc-body" style="display:none">' + items.map(cardHtml).join('') + '</div></div>';
      });
      grid.innerHTML = html;
    } else {
      grid.innerHTML = list.map(cardHtml).join('');
    }
  }

  window.toggleGroup = function (btn) {
    var body = btn.nextElementSibling;
    var arrow = btn.querySelector('.acc-arrow');
    if (!body) return;
    var isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'grid';
    btn.setAttribute('aria-expanded', String(!isOpen));
    if (arrow) arrow.textContent = isOpen ? '▾' : '▴';
  };

  if (catNav) {
    catNav.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      currentCat = btn.getAttribute('data-cat') || 'all';
      catNav.querySelectorAll('button').forEach(function (b) { b.classList.toggle('active', b === btn); });
      renderGuides();
    });
  }

  if (searchInput) searchInput.addEventListener('input', function () {
    currentQuery = searchInput.value.trim();
    renderGuides();
  });

  renderGuides();

  function openHashGuide() {
    var match = (window.location.hash || '').match(/^#guide=([^&]+)/);
    if (match) openGuide(decodeURIComponent(match[1]));
  }
  window.addEventListener('hashchange', openHashGuide);
  openHashGuide();
})();

function openGuide(id) {
  var guide = GUIDES.find(function (g) { return g.id === id; });
  if (!guide) return;

  var CAT_LABEL = { account: '港澳开户', card: '香港信用卡', refund: '付费服务' };
  function renderBlock(b) {
    switch (b.type) {
      case 'h2': return '<h2>' + b.text + '</h2>';
      case 'h3': return '<h3>' + b.text + '</h3>';
      case 'p': return '<p>' + b.text + '</p>';
      case 'ul': return '<ul>' + b.items.map(function (it) { return '<li>' + it + '</li>'; }).join('') + '</ul>';
      case 'ol': return '<ol>' + b.items.map(function (it) { return '<li>' + it + '</li>'; }).join('') + '</ol>';
      case 'tip': return '<div class="tip-box"><b>💡 实用 Tips：</b>' + b.text + '</div>';
      case 'warn': return '<div class="warn-box"><b>⚠️ 注意：</b>' + b.text + '</div>';
      case 'info': return '<div class="info-box"><b>ℹ️ 说明：</b>' + b.text + '</div>';
      case 'referral': return '<div class="referral-box"><div class="ref-title">' + (b.title || '🎁 我的推荐 / 邀请') + '</div><p>' + b.text + '</p><div class="ref-links">' + (b.links ? b.links.map(function(l){ return '<a href="'+l.url+'" target="_blank" rel="noopener noreferrer">'+l.label+'</a>'; }).join('') : '<span class="ref-soon">邀请链接待更新</span>') + '</div></div>';
      case 'buy': return '<div class="buy-box"><a class="btn buy-btn" href="' + b.url + '" target="_blank" rel="noopener noreferrer">💳 ' + b.text + '</a></div>';
      case 'table':
        return '<div class="table-wrap"><table><thead><tr>' + b.head.map(function(h){ return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + b.rows.map(function(r){ return '<tr>' + r.map(function(c){ return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
      default: return '';
    }
  }

  var tagHtml = (guide.tags || []).map(function (t) { return '<span class="tag-chip">' + t + '</span>'; }).join('');
  var metaParts = ['分类：' + (CAT_LABEL[guide.cat] || '攻略')];
  if (guide.updated) metaParts.push('更新：' + guide.updated);

  var html = '<section class="article-hero"><div class="wrap"><div class="cat">' + (CAT_LABEL[guide.cat] || '攻略') + '</div><h1>' + guide.title + '</h1><div class="meta">' + metaParts.join(' · ') + '</div>' + (tagHtml ? '<div class="meta-tags">' + tagHtml + '</div>' : '') + '</div></section>'
    + '<main class="wrap"><div class="article-body"><nav class="article-tools" aria-label="文章操作"><a class="back-link" href="' + location.pathname + location.search + '">← 返回攻略列表</a><button class="share-btn" type="button" onclick="copyGuideLink(\'' + guide.id + '\')">🔗 复制文章链接</button></nav>'
    + guide.content.map(renderBlock).join('')
    + '<div class="article-end"><p>以上内容仅供信息参考，银行政策、费率及审批结果请以官方最新信息为准。</p><a class="btn" href="' + location.pathname + location.search + '">← 返回攻略列表</a></div></div></main>';

  document.body.innerHTML = html;
  document.title = guide.title + '｜DoorGo 港澳开户与信用卡攻略';
  var meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', guide.desc || 'DoorGo 港澳开户与香港信用卡实用攻略。');
  window.history.replaceState(null, '', location.pathname + location.search + '#guide=' + encodeURIComponent(guide.id));
  window.scrollTo(0, 0);
}

function copyGuideLink(id) {
  var url = location.origin + location.pathname + location.search + '#guide=' + encodeURIComponent(id);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function () { alert('文章链接已复制'); }).catch(function () { window.prompt('复制文章链接：', url); });
  } else window.prompt('复制文章链接：', url);
}

function showHome() { window.location.href = location.pathname + location.search; }
