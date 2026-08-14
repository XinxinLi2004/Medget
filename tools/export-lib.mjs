// export-lib.mjs —— 把 index.html 内联的 LIB 导出为结构化数据库 db/supplements.json
// 用法: node tools/export-lib.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// 抓取 const LIB = [ ... ]; 块（LIB 之后是 KNOW、再是 INTERACTIONS，中间可能有注释）
const m = html.match(/const LIB\s*=\s*(\[[\s\S]*\]);\s*(?:\/\*[\s\S]*?\*\/\s*)?const INTERACTIONS/);
if (!m) { console.error('未找到 LIB 数组'); process.exit(1); }

let arr;
try {
  arr = (new Function('return ' + m[1]))();
} catch (e) {
  console.error('解析 LIB 失败:', e.message);
  process.exit(1);
}

// 基础清洗：确保每条都有 cat / form / ev 等字段（容错）
const cleaned = arr.map((l, i) => ({
  id: l.id || ('s' + i),
  name: l.name || '',
  fullName: l.fullName || '',
  brand: l.brand || '',
  storage: l.storage || '',
  cat: l.cat || '其他',
  form: l.form || '中',
  ev: l.ev || '中',
  trans: !!l.trans,
  price: l.price || 0,
  serv: l.serv || 1,
  ing: l.ing || { name: l.name, amt: 0, unit: 'mg', min: 0, max: 0 },
  ings: Array.isArray(l.ings) ? l.ings : []
}));

fs.mkdirSync(path.join(root, 'db'), { recursive: true });
fs.writeFileSync(path.join(root, 'db', 'supplements.json'), JSON.stringify(cleaned, null, 2), 'utf8');
console.log(`✅ 已导出 ${cleaned.length} 款补剂 → db/supplements.json`);
