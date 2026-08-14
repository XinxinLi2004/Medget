// build-lib.mjs —— 把 db/supplements.json 注入回 index.html 的 LIB（单一数据源闭环）
// 用法: node tools/build-lib.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const db = JSON.parse(fs.readFileSync(path.join(root, 'db', 'supplements.json'), 'utf8'));
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// 只替换 const LIB = [ ... ]; 这一块（惰性匹配到第一个 ]; 即 LIB 结束）
const re = /(const LIB\s*=\s*)\[[\s\S]*?\];/;
if (!re.test(html)) { console.error('未找到 LIB 块'); process.exit(1); }
const replacement = '$1' + JSON.stringify(db, null, 2) + ';';

// 安全校验：替换后仍能找到 LIB 且数量一致
const next = html.replace(re, replacement);
const cnt = (next.match(/id:\s*"/g) || []).length;
if (!/const LIB\s*=/.test(next)) { console.error('注入失败'); process.exit(1); }

fs.writeFileSync(path.join(root, 'index.html'), next, 'utf8');
console.log(`✅ 已将 db/supplements.json（${db.length} 款）注入 index.html 的 LIB`);
console.log('   提示：随后执行  cp index.html www/ && npx cap sync android  并推送构建 APK');
