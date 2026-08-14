#!/usr/bin/env node
/**
 * import-samr.mjs —— 从「国家市场监督管理总局 特殊食品信息查询平台」拉国产保健食品（蓝帽子）补剂
 *
 * ============ 背景 ============
 * 真正的"补剂"品牌（国产蓝帽子）归市场监管总局管，不在药监局药品库。查询平台：
 *   http://ypzsx.gsxt.gov.cn/specialfood/#/food
 * 关键点（已核实）：
 *   - 必须按「产品名称 + 品牌/企业」查，只输批准文号查不到（与药监局不同）。
 *   - 是网页 SPA，无公开文档化 API；真实接口需从浏览器 F12→Network 抓取。
 *   - 同样有反爬/风控，需要浏览器 cookie（瑞数类防护或登录态）。
 *
 * ============ 本脚本定位 ============
 * 结构脚手架：实现「cookie 双路径 + 搜索 + 映射入库」框架，与 import-nmpa.mjs 对齐。
 * ⚠ 未对本环境实测（无浏览器；且真实接口 URL/字段需你在本机用浏览器抓一次 Network 确认后填到下方）。
 *   SAMR_API 占位为常见形态，请按实际抓到的请求修正。
 *
 * ============ 用法 ============
 *   SAMR_Q="汤臣倍健 维生素C" SAMR_COOKIE="<浏览器cookie>" node tools/import-samr.mjs
 * 或本机有 Playwright/Chrome 时直接：node tools/import-samr.mjs
 *
 * 依赖：仅 Node 内置，Playwright 可选（自动取 cookie）。
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const DB = path.join(ROOT, 'db', 'supplements.json');
// TODO: 用本机浏览器 F12 抓「特殊食品信息查询」实际搜索请求，替换为真实 URL 与字段名
const SAMR_API = 'https://ypzsx.gsxt.gov.cn/specialfood/api/query';
const Q = process.env.SAMR_Q || '汤臣倍健 维生素';
const SAMR_COOKIE = process.env.SAMR_COOKIE || '';

async function getCookies() {
  if (SAMR_COOKIE) return SAMR_COOKIE;
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://ypzsx.gsxt.gov.cn/specialfood/#/food', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    const cookies = await page.context().cookies();
    await browser.close();
    return cookies.map(c => `${c.name}=${c.value}`).join('; ');
  } catch (e) {
    console.log('· 自动取 cookie 失败：', e.message.split('\n')[0], '→ 请用 SAMR_COOKIE 手动粘贴');
    return '';
  }
}

function mapRecord(r) {
  const name = r.productName || r.cpMc || r.name || '';
  const brand = r.brand || r.enterpriseName || r.qyMc || '';
  const approval = r.regNo || r.approvalNo || r.bjh || '';
  const func = r.healthFunction || r.bjgn || '';
  return {
    id: 'samr_' + (approval || name).replace(/[^A-Za-z0-9一-龥]/g, ''),
    name,
    fullName: [name, brand].filter(Boolean).join(' '),
    brand,
    storage: '阴凉干燥处，避光',
    cat: '保健食品',
    form: '中',
    ev: '中',
    trans: true,
    price: 0,
    serv: 60,
    ing: { name, amt: 0, unit: 'mg', min: 0, max: 0 },
    ings: [],
    good: func ? '保健功能: ' + func : '',
    bad: '',
    note: '数据来源：市场监管总局特殊食品信息查询平台（保健食品/蓝帽子，待实时核验）。'
  };
}

async function main() {
  const cookies = await getCookies();
  const res = await fetch(SAMR_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookies ? { Cookie: cookies } : {}) },
    body: JSON.stringify({ keyword: Q, page: 1, size: 30 }),
    signal: AbortSignal.timeout(20000)
  });
  const text = await res.text();
  if (!res.ok) {
    console.log(`⚠  SAMR 返回 ${res.status}。常见原因：① 接口 URL 占位需替换（见脚本顶部 TODO）；② 无 cookie 被拦截。`);
    console.log('   请在本机浏览器打开查询页，F12 抓真实搜索请求，把 URL/字段填进脚本后再跑。');
    process.exit(0);
  }
  let json; try { json = JSON.parse(text); } catch { console.log('非 JSON：', text.slice(0, 200)); process.exit(1); }
  const list = json.data?.list || json.list || json.records || (Array.isArray(json) ? json : []);
  if (!list.length) { console.log('未返回记录（接口占位或查询词无命中）'); process.exit(0); }

  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  const byId = new Map(db.map(d => [d.id, d]));
  let added = 0, updated = 0;
  for (const r of list) {
    const item = mapRecord(r);
    if (byId.has(item.id)) { Object.assign(byId.get(item.id), item); updated++; }
    else { db.push(item); byId.set(item.id, item); added++; }
  }
  fs.writeFileSync(DB, JSON.stringify(db, null, 2), 'utf8');
  console.log(`✅ SAMR 导入完成：新增 ${added}，更新 ${updated}，数据库现共 ${db.length} 款`);
}

main().catch(e => { console.error('导入失败:', e.message); process.exit(1); });
