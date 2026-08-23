// 从 guides-data.js 提取 GUIDES 数组为 JSON，供 PDF 生成使用
const fs = require('fs');
const src = fs.readFileSync('guides-data.js', 'utf8');
const m = src.match(/var GUIDES = (\[[\s\S]*\]);/);
if (!m) { console.error('no GUIDES found'); process.exit(1); }
const GUIDES = eval(m[1]);
console.log(JSON.stringify(GUIDES, null, 1));
