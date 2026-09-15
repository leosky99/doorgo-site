// DoorGo 内容校订层：在不破坏原始内容库的情况下，统一修正高风险表述并补充官方核验入口。
(function () {
  function find(id) { return window.GUIDES && window.GUIDES.find(function (g) { return g.id === id; }); }
  function replaceText(guide, oldText, newText) {
    if (!guide || !guide.content) return;
    guide.content.forEach(function (block) {
      if (typeof block.text === 'string' && block.text.indexOf(oldText) !== -1) block.text = block.text.split(oldText).join(newText);
      if (Array.isArray(block.items)) block.items = block.items.map(function (item) { return typeof item === 'string' ? item.split(oldText).join(newText) : item; });
    });
  }
  function prepend(guide, block) { if (guide && Array.isArray(guide.content)) guide.content.unshift(block); }

  var rules = find('account-2026-rules');
  if (rules) {
    rules.title = '2026 香港开户规则变化：开户前应该核对什么';
    rules.desc = '梳理 2026 年与投资账户、文件核验相关的重要监管变化，并把监管要求与银行实务观察分开说明。';
    rules.sourceNote = '监管部分重点参考香港证监会与香港金管局 2026 年 5 月 22 日发布的投资账户相关文件；普通储蓄/往来账户是否受影响，需要按具体银行与产品核对。';
    rules.sourceUrl = 'https://brdr.hkma.gov.hk/eng/doc-ldg/docId/20260522-13-EN';
    replaceText(rules, '监管在 2026 年明显收紧', '2026 年 5 月 22 日发布的重要监管文件：重点看投资账户');
    replaceText(rules, '香港证监会 2026 年 5 月 22 日发出通函，要求所有券商（银行投资账户参照执行）加强开户监控，对伪造文件「零容忍」。香港金管局同日发布监管通函，要求银行采取相同强制措施。', '2026 年 5 月 22 日，香港证监会发布了关于投资账户开户及与客户维持关系的监控措施通函。香港金管局同日向认可机构发布相关文件，并说明认可机构应适当考虑该通函；文件同时列出了与中国内地投资者投资账户有关的额外措施。这里的监管重点不能简单理解为“所有普通银行账户一律执行同一套新规”。');
    replaceText(rules, '三项强制措施', '监管文件中的重点措施');
    replaceText(rules, '资金声明：新开户必须书面确认资金来自内地以外合法来源（具有法律效力，虚假申报后果严重）', '对投资账户进行更严格的开户及持续关系审查，并核实客户身份、资料与资金/活动背景是否合理；具体文件与声明以相关机构要求为准');
    replaceText(rules, '倒查清理：3 个月内核查 2023 年 1 月以来账户，6 个月内强制关闭用虚假文件开设的账户（违规者永久禁入）', '对使用可疑或伪造文件开立的相关投资账户进行风险复核，并按适用要求采取关闭或其他风险控制措施；监管文件并非对所有账户“一刀切”规定固定时限');
    replaceText(rules, '清理僵尸户：关闭资产为零且 12 个月内无任何活动的投资账户', '关注账户长期闲置、资金转移异常、共用地址等风险信号，具体账户处理方式由相关机构按照适用规则及风险评估执行');
    replaceText(rules, '法律后果（务必重视）', '合规风险：不要使用可疑或伪造资料');
    replaceText(rules, '对机构：违反《打击洗钱及恐怖分子资金筹集条例》，最高罚款 1000 万港元（或获利金额的 3 倍）', '具体法律责任取决于适用法律、事实情况及执法决定，不能仅凭一篇开户攻略判断处罚结果');
    replaceText(rules, '对个人：使用虚假文件开户，最高可判监禁 7 年及罚款', '个人若提交虚假或伪造资料，可能产生严重的账户、民事或刑事风险，应直接查阅适用法律或寻求专业意见');
    replaceText(rules, '各大银行最新开户要求（截至 2026 年 6 月）', '银行实务观察（2026 年：请逐家核对官方要求）');
    replaceText(rules, '富途/老虎等：账户已被锁定为「只出不进」，无法买入新股票，仅可卖出或提取资金', '如某家机构对账户采取限制措施，应以该机构发出的具体通知、客服解释及适用规则为准；不要把个别案例当成统一政策');
    replaceText(rules, '工银亚洲：7 月 24 日后大量申请被拒（即使行内资产符合条件），疑似拉闸', '个别时间段或个别产品可能出现审批趋严；此类情况属于实务观察，不应写成统一政策，申请前应直接向发卡行确认');
    replaceText(rules, '中银香港：需提供香港工作/学习证明，旅游签注成功率极低', '具体账户的身份、用途及材料要求以中银香港当前开户页面或分行回复为准；不要把单一时期的个案通过率当成固定门槛');
    replaceText(rules, '工银亚洲/交通银行：明确暂停为内地居民开立投资账户', '部分机构或部分产品可能阶段性调整受理范围；申请前应以该机构当前官方渠道为准');
    prepend(rules, {type:'info', text:'信息分层：本篇涉及的 2026 年 5 月 22 日监管文件，核心对象是投资账户及相关受规管机构。后文涉及具体银行时，请把“监管文件”“银行官方要求”“用户经验”视为三个不同信息层级，不能混为一谈。'});
  }

  var hsbc = find('account-hsbc');
  if (hsbc) {
    hsbc.title = '汇丰香港开户攻略：HSBC One / Premier';
    hsbc.desc = '按汇丰官方资料整理 HSBC One 与 Premier 的账户层级、开户方式、最低理财总值及 2026 年非 HKID 客户费用变化。';
    hsbc.sourceNote = '账户门槛与费用优先参考香港汇丰官方页面；页面当前明确列出 2026 年 1 月 1 日起非 HKID 新开 HSBC One 的 HK$10,000 平均全面理财总值要求及 HK$100/月低额结存服务费。';
    hsbc.sourceUrl = 'https://www.hsbc.com.hk/zh-cn/accounts/products/one/';
    replaceText(hsbc, '汇丰香港开户详细攻略（HKSBC One / Premier）', '汇丰香港开户攻略：HSBC One / Premier');
    replaceText(hsbc, '一定要去任意网点**柜台**（不是自助机）操作', '具体激活方式以 HSBC HK App、银行工作人员及最新官方流程提示为准');
    replaceText(hsbc, '在柜台预存等值 1 万港币及以上现金，同时柜台补签名，即可立即激活卡片', '不要把固定的“柜台现金预存”步骤当成所有申请人的统一要求；实际激活方式应按当前账户类型、申请渠道及银行最新提示执行');
    replaceText(hsbc, '首笔不允许转账激活（必须柜台预存现金 + 补签名）', '具体首笔存入及激活要求以银行当前流程提示为准');
    replaceText(hsbc, '2026 年新开账户若总市值低于 1 万港币，每月收 100 港币管理费（不限存款/理财/股票）', '对于 2026 年 1 月 1 日或之后新开立、非香港身份证持有者的 HSBC One，连续 3 个月平均全面理财总值达到 HK$10,000 可豁免 HK$100/月低额结存服务费；“全面理财总值”的计算口径以汇丰官方说明为准');
    replaceText(hsbc, '2026 年 1 月 1 日之前开通的汇丰账户不受新规影响，终身免管理费、无最低要求', '2026 年 1 月 1 日之前开立的非 HKID 持有人 HSBC One，当前官方页面列示不设该最低全面理财总值要求及相应低额结存服务费；是否适用其他费用仍应查看最新收费表');
    prepend(hsbc, {type:'info', text:'官方核验提醒：汇丰目前明确说明，2026 年 1 月 1 日或之后新开 HSBC One 的非香港身份证持有人，如连续 3 个月平均全面理财总值达到 HK$10,000，可豁免每月 HK$100 的低额结存服务费；指定客户开户后前 6 个月还可能受较低转账及现金提款限额限制。'});
  }
})();
