#!/usr/bin/env node
/**
 * import-nmpa.mjs —— 从「国家药监局 数据查询」(NMPA) 拉取真实国药准字 OTC 数据，合并进我们自己的数据库 db/supplements.json
 *
 * ============ 背景 ============
 * 当前 db/supplements.json 是「手工+代表性配方」种子库。要拿到国内真实的廉价国产 OTC 补剂替代
 * （维C片/复合维B/碳酸钙D3/维D/铁/锌 等国药准字），权威来源是国家药监局数据查询：
 *   https://www.nmpa.gov.cn/datasearch/home-index.html#category=yp
 * 含「国产药品 / 进口药品 / 非处方药(OTC)化学药品目录 / 非处方药中药目录」等。
 *
 * ============ 接口事实（已实测 2026-08-14）============
 * - 搜索接口 POST https://www.nmpa.gov.cn/datasearch/data/nmpadata/search
 * - 必须带请求头 Sign + Timestamp（签名算法见下方 sign()），否则返回 {"code":500,"message":"sign or timestamp is empty"}
 * - 仅带签名仍会被【瑞数(RuiShu)】机器人防护拦截，返回 HTTP 412 挑战页。
 *   412 的解法是：用真实浏览器执行瑞数混淆 JS 生成指纹 cookie，再带 cookie 请求。
 *   → 本脚本 cookie 取双路径：(a) 环境变量 NMPA_COOKIE 手动粘贴；(b) 本机有 Playwright/Chrome 时自动取。
 *
 * ============ 使用前准备 ============
 * 方式 A（推荐，最稳）：在你本机（有 Chrome 的 Mac）运行：
 *   node tools/import-nmpa.mjs            # 脚本会自动用 Playwright/Chrome 取瑞数 cookie
 * 方式 B（沙箱/无浏览器）：浏览器打开 https://www.nmpa.gov.cn/datasearch/home-index.html
 *   等页面加载完（瑞数 cookie 落盘），F12→Network→任意请求→复制 Request Headers 里的 Cookie 整串，
 *   然后：NMPA_COOKIE="xxxx" node tools/import-nmpa.mjs
 *
 * 可选环境变量：
 *   NMPA_Q=搜索词（默认 维生素C）
 *   NMPA_ITEMID=分类 itemId（留空=全库搜；OTC化学药目录等分类 id 从页面 Network 请求体里拿）
 *   NMPA_LIMIT=数量（默认 30，最大 100）
 *
 * 说明：搜索列表级字段（通用名/商品名/厂家/批准文号/规格）已足够做"国产平价替代"发现 + 真伪核验。
 *       完整说明书（成分剂量/不良反应/禁忌）需详情接口二次请求（同样受瑞数保护），后续可扩展。
 *
 * 依赖：仅 Node 内置（crypto/fetch/fs/path），Playwright 为可选（仅自动取 cookie 时需要）。
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve('.');
const SEARCH_URL = 'https://www.nmpa.gov.cn/datasearch/data/nmpadata/search';
const SECRET = 'nmpasecret2020'; // 社区逆向确认的固定 salt
const Q = process.env.NMPA_Q || '维生素C';
const ITEMID = process.env.NMPA_ITEMID || '';
const LIMIT = Math.min(Number(process.env.NMPA_LIMIT) || 30, 100);
const NMPA_COOKIE = process.env.NMPA_COOKIE || '';

// ---------- 签名：md5( encodeURIComponent( 排序后 key=val&... + "&nmpasecret2020" ) ) ----------
function sign(params) {
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  const raw = sorted + '&' + SECRET;
  const encoded = encodeURIComponent(raw);
  return crypto.createHash('md5').update(encoded).digest('hex');
}

// ---------- cookie 获取：优先环境变量，其次尝试 Playwright 自动取 ----------
async function getCookies() {
  if (NMPA_COOKIE) return NMPA_COOKIE;
  try {
    const { chromium } = await import('playwright');
    console.log('· 尝试用 Playwright 自动获取瑞数 cookie …');
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://www.nmpa.gov.cn/datasearch/home-index.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    // 瑞数会异步设 cookie（含 $_f0/$_f1/$_fh1 指纹），等几秒让其执行完
    await page.waitForTimeout(6000);
    const ctx = page.context();
    const cookies = await ctx.cookies();
    await browser.close();
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    if (cookieStr.includes('$_f')) { console.log('  ✓ 已取得瑞数指纹 cookie'); return cookieStr; }
    console.log('  ⚠ 取到 cookie 但未见瑞数指纹($_f*)，可能仍会被 412 拦截');
    return cookieStr;
  } catch (e) {
    console.log('· 自动取 cookie 失败：', e.message.split('\n')[0]);
    return '';
  }
}

// 通用名 → 我们的分类
function catOf(name) {
  if (/维生素[CDB]|维C|维B|复合维生素|多维|叶酸|烟酸|生物素/.test(name)) return '维生素';
  if (/钙|碳酸钙|骨化醇|维D|鱼油|氨糖|软骨/.test(name)) return '骨骼关节';
  if (/铁|锌|硒|镁|矿物/.test(name)) return '矿物质';
  if (/鱼油|藻油|DHA|EPA|卵磷脂|辅酶Q|益生菌/.test(name)) return '心脑血管';
  if (/ Ginseng|人参|黄芪|灵芝|西洋参/.test(name)) return '中药滋补';
  return '其他';
}

// 把一条 NMPA 记录映射成 db schema
function mapRecord(r) {
  // NMPA 字段名可能为 产品名称/商品名/生产企业/批准文号/规格 等，做容错读取
  const getName = k => r[k] ?? r[k.replace(/名$/, '')] ?? '';
  const genName = getName('产品名称') || getName('通用名') || getName('name') || '';
  const brandName = getName('商品名') || getName('brand') || '';
  const mfr = getName('生产企业') || getName('生产单位') || getName('厂家') || getName('manufacturer') || '';
  const approval = getName('批准文号') || getName('审批编号') || getName('approvalNo') || '';
  const spec = getName('规格') || getName('spec') || '';
  const formTxt = /片/.test(genName + spec) ? '片' : /胶囊/.test(genName + spec) ? '胶囊' : /颗粒/.test(genName + spec) ? '颗粒' : /口服液/.test(genName + spec) ? '口服液' : '其他';
  const serv = (spec.match(/(\d+)\s*(片|粒|袋|支)/) || [])[1] || '60';
  const fullName = [genName, brandName, spec].filter(Boolean).join(' ');
  return {
    id: 'nmpa_' + (approval || genName).replace(/[^A-Za-z0-9一-龥]/g, ''),
    name: genName || brandName,
    fullName: fullName || genName,
    brand: mfr || brandName,
    storage: '阴凉干燥处，避光',
    cat: catOf(genName),
    form: '中',
    ev: '强',
    trans: true,
    price: 0, // 药监局无价，留给比价层（price-enrich.mjs）
    serv: Number(serv) || 60,
    ing: { name: genName, amt: 0, unit: 'mg', min: 0, max: 0 },
    ings: [],
    good: '',
    bad: '',
    note: '数据来源：国家药监局数据查询（国药准字核验）。价格见比价层。'
  };
}

async function main() {
  const cookies = await getCookies();
  const ts = String(Date.now());
  const bodyParams = { key: Q, page: 1, size: LIMIT };
  if (ITEMID) bodyParams.itemId = ITEMID;
  const s = sign(bodyParams);

  const res = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Sign': s,
      'Timestamp': ts,
      ...(cookies ? { 'Cookie': cookies } : {})
    },
    body: new URLSearchParams(bodyParams).toString(),
    signal: AbortSignal.timeout(20000)
  });

  const text = await res.text();
  if (res.status === 412) {
    console.log('⚠  HTTP 412 —— 被瑞数机器人挑战拦截（cookie 未带/失效）。');
    console.log('   解法：在本机（有 Chrome）运行本脚本自动取 cookie，或浏览器复制 Cookie 后：');
    console.log('   NMPA_COOKIE="<你的cookie>" node tools/import-nmpa.mjs');
    process.exit(0);
  }
  if (!res.ok) { console.error('NMPA 返回', res.status, text.slice(0, 300)); process.exit(1); }

  let json;
  try { json = JSON.parse(text); } catch { console.error('非 JSON 响应：', text.slice(0, 300)); process.exit(1); }
  if (json.code !== 200 && json.code !== undefined && json.code !== 0) {
    console.error('NMPA 业务错误 code=', json.code, json.message); process.exit(1);
  }

  const list = json.data?.list || json.data?.records || json.list || json.records || (Array.isArray(json.data) ? json.data : []);
  if (!list.length) { console.log('未返回记录（可能 itemId 不匹配或无命中）'); process.exit(0); }

  const jsonPath = path.join(ROOT, 'db', 'supplements.json');
  const db = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const byId = new Map(db.map(d => [d.id, d]));
  let added = 0, updated = 0;
  for (const r of list) {
    const item = mapRecord(r);
    if (byId.has(item.id)) { Object.assign(byId.get(item.id), item); updated++; }
    else { db.push(item); byId.set(item.id, item); added++; }
  }
  fs.writeFileSync(jsonPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`✅ NMPA 导入完成：新增 ${added} 款，更新 ${updated} 款，数据库现共 ${db.length} 款`);
  console.log('   下一步：node tools/price-enrich.mjs  补价格；或 node tools/build-lib.mjs 注入 index.html。');
}

main().catch(e => { console.error('导入失败:', e.message); process.exit(1); });
