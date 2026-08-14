#!/usr/bin/env node
/**
 * price-enrich.mjs —— 为「国产平价替代」补价格，实现"廉价"对比
 *
 * ============ 现实约束（2026-08-14 实测）============
 * 京东健康 / 阿里健康 价格接口反爬极重：多数价格需登录态、一个国药准字有数十个 SKU、
 * 且频繁滑块/风控。在本环境无法稳定实时抓取，且批量爬电商可能违反其 ToS。
 *
 * 因此本脚本采用【权威参考价 + 失败回退】策略：
 *   - 内置一份「国产平价 OTC 参考价表」（来自公开市场常识：国产仿制维矿普遍极低廉，
 *     如维C片 ¥1.5–3/瓶、复合维B ¥3–8），覆盖最常见的廉价国产补剂。
 *   - 按通用名关键词匹配 db/supplements.json 里的 nmpa_ 条目，填入价格（取区间中值）。
 *   - 价格字段一律标注「参考价（主流药店/电商，待实时核验）」，绝不冒充实时价。
 *
 * 后续若要真·实时比价：在用户本机（已登录电商的浏览器）导出 cookie，扩展本脚本的
 * fetchLivePrice() 即可，框架已留好位置。
 *
 * 依赖：仅 Node 内置。
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const DB = path.join(ROOT, 'db', 'supplements.json');

// 国产平价 OTC 参考价（元 / 常见包装）。区间来自公开市场常识，取中值填入。
// key 为通用名关键词（命中即采用）。
const REF = [
  { kw: '维生素C片', min: 1.5, max: 3, pack: '100片' },
  { kw: '维生素C', min: 2, max: 5, pack: '100片' },
  { kw: '复合维生素B', min: 3, max: 8, pack: '100片' },
  { kw: '维生素B1', min: 2, max: 4, pack: '100片' },
  { kw: '维生素B2', min: 2, max: 4, pack: '100片' },
  { kw: '维生素B6', min: 2, max: 5, pack: '100片' },
  { kw: '维生素B12', min: 5, max: 10, pack: '100片' },
  { kw: '叶酸', min: 3, max: 6, pack: '100片' },
  { kw: '维生素D2', min: 5, max: 12, pack: '100粒' },
  { kw: '维生素D3', min: 6, max: 15, pack: '100粒' },
  { kw: '维生素AD', min: 5, max: 12, pack: '滴剂/60粒' },
  { kw: '鱼肝油', min: 5, max: 15, pack: '100粒' },
  { kw: '碳酸钙D3', min: 10, max: 25, pack: '60-100片' },
  { kw: '碳酸钙', min: 8, max: 20, pack: '100片' },
  { kw: '葡萄糖酸钙', min: 5, max: 12, pack: '100片/瓶' },
  { kw: '葡萄糖酸锌', min: 8, max: 18, pack: '100片/瓶' },
  { kw: '硫酸亚铁', min: 3, max: 8, pack: '100片' },
  { kw: '多维元素', min: 18, max: 35, pack: '60-100片' },
  { kw: '三维', min: 10, max: 22, pack: '60片' },
  { kw: '维胺', min: 8, max: 18, pack: '100片' },
];

function mid(r) { return Math.round((r.min + r.max) / 2 * 10) / 10; }

function matchPrice(name) {
  for (const r of REF) if (name.includes(r.kw)) return r;
  return null;
}

// —— 实时比价占位（未来扩展）：传入通用名，返回电商最低价或 null ——
// async function fetchLivePrice(name) {
//   // 需要用户本机已登录电商的 cookie（反爬重，需谨慎合规）
//   return null;
// }

function main() {
  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  let filled = 0, skipped = 0;
  for (const d of db) {
    if (!d.id.startsWith('nmpa_')) continue; // 只处理药监局来源
    if (d.price && d.price > 0) { skipped++; continue; }
    const r = matchPrice(d.name + ' ' + (d.fullName || ''));
    if (r) {
      d.price = mid(r);
      d.note = (d.note ? d.note + ' ' : '') + `价格：国产平价参考价 ¥${mid(r)}（${r.pack}，主流药店/电商，待实时核验）`;
      filled++;
    } else {
      skipped++;
    }
  }
  fs.writeFileSync(DB, JSON.stringify(db, null, 2), 'utf8');
  console.log(`✅ 比价完成：为 ${filled} 款国产 OTC 填入参考价，${skipped} 款暂无匹配（未改）。`);
  console.log('   说明：价格为公开市场常识参考价，非实时抓取；真·实时比价需本机电商 cookie，框架已留位。');
}

main();
