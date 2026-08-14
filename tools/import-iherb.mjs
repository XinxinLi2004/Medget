#!/usr/bin/env node
/**
 * import-iherb.mjs —— 从 iHerb 官方联盟 API 拉取真实补剂数据，合并进我们自己的数据库 db/supplements.json
 *
 * ============ 为什么需要它 ============
 * 当前 db/supplements.json 是「手工+代表性配方」种子库（追踪用、非临床精确库）。
 * 要拿到 iHerb 上真实的品牌 / 价格 / 在售商品，需要 iHerb 官方「Affiliate API」（iHerb 用 Cloudflare
 * 防护，纯爬虫会被 403 拦截，必须用带签名的官方 API）。本脚本即官方 API 导入器。
 *
 * ============ 使用前准备 ============
 * 1. 申请 iHerb Affiliate 账号：https://www.iherb.com/affiliate-program （通过后拿到 Public Key / Private Key）
 * 2. 设置环境变量后运行：
 *      IHERB_KEY=你的PublicKey IHERB_SECRET=你的PrivateKey node tools/import-iherb.mjs
 *   可选：IHERB_Q=搜索词（默认 multivitamin）、IHERB_CAT=分类、IHERB_LIMIT=数量（默认 50）
 *
 * ============ 说明 ============
 * - 官方 API 返回 名称 / 品牌 / 价格 / 分类 / 评分 等，但「Supplement Facts（每种成分剂量与化学形态）」
 *   通常不在商品列表 API 里。成分级明细请用 App 内的「拍照识别成分表（AI）」补全，或后续接入标签解析。
 * - 本脚本会尽量用本地 INGREDIENT_INFO 知识库，把已知成分映射成「真实原料形态 + 益处」建议，写入 notes。
 * - 合并策略：以 iHerb 商品 code 为 id 去重；已存在则更新价格/名称，不存在则新增。
 *
 * 依赖：仅 Node 内置（crypto / fetch），无需 npm install。
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve('.');
const API_BASE = 'https://api.iherb.com';
const KEY = process.env.IHERB_KEY || '';
const SECRET = process.env.IHERB_SECRET || '';
const Q = process.env.IHERB_Q || 'multivitamin';
const CAT = process.env.IHERB_CAT || '';
const LIMIT = Math.min(Number(process.env.IHERB_LIMIT) || 50, 200);

// ---------- iHerb 官方 HMAC 签名（按 iHerb Affiliate API v1 规范） ----------
function sign(method, path2, ts) {
  const raw = `${method}\n${path2}\n${ts}`;
  return crypto.createHmac('sha256', SECRET).update(raw).digest('base64');
}
function authHeader(method, path2) {
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = sign(method, path2, ts);
  // iHerb 规范： Authorization: HMAC <publicKey>:<timestamp>:<signature>
  return `HMAC ${KEY}:${ts}:${sig}`;
}

// ---------- 本地知识库（与 index.html 同源，用于补全形态/益处提示） ----------
let INGREDIENT_INFO = {};
try {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const m = html.match(/const INGREDIENT_INFO\s*=\s*(\{[\s\S]*?\n\});\s*\nfunction ingInfo/);
  if (m) INGREDIENT_INFO = (new Function('return ' + m[1]))();
} catch { /* 忽略，无知识库也能跑 */ }

function suggestForms(text) {
  const out = [];
  for (const [name, info] of Object.entries(INGREDIENT_INFO)) {
    if (info.forms && text.includes(name)) out.push(`${name}→建议形态: ${info.forms.map(f => f.name).join(' / ')}`);
  }
  return out;
}

function mapProduct(p) {
  const id = 'ih_' + (p.code || p.id || p.productId || '');
  const name = (p.name || p.title || '').trim();
  const brand = (p.brand && (p.brand.name || p.brand)) || '';
  const price = p.priceInfo?.price ?? p.price ?? 0;
  const serv = Number(p.servingSizeInfo?.servingSize || p.servings || 0) || 60; // 默认估算
  const cat = p.categories?.[0] || p.category || '维生素';
  const form = /软胶囊|softgel/i.test(name) ? '优' : /片|tablet/i.test(name) ? '中' : '中';
  const ev = '中';
  const notes = suggestForms(name + ' ' + (p.description || ''));
  return {
    id,
    name: name || brand,
    fullName: name,
    brand,
    storage: '阴凉干燥处，避光',
    cat,
    form,
    ev,
    trans: !!(price && brand),
    price: Math.round(price * 7.2) || 0, // 美元估值转人民币（粗略）
    serv,
    ing: { name: name || brand, amt: 0, unit: 'mg', min: 0, max: 0 },
    ings: [],
    good: notes.length ? '建议形态: ' + notes.join('；') : '',
    bad: '',
    note: '来自 iHerb 官方 API 导入；成分明细请用 App 拍照识别补全。'
  };
}

async function main() {
  if (!KEY || !SECRET) {
    console.log('⚠️  未检测到 IHERB_KEY / IHERB_SECRET 环境变量。');
    console.log('    这是 iHerb 官方联盟 API 所需的鉴权凭据（Cloudflare 防护，纯爬虫会被 403 拦截）。');
    console.log('    申请: https://www.iherb.com/affiliate-program');
    console.log('    用法: IHERB_KEY=xxx IHERB_SECRET=yyy node tools/import-iherb.mjs');
    console.log('\n（下面用一次无签名探测，验证网络可达性，预期会被 Cloudflare 拦截）');
    try {
      const r = await fetch(`${API_BASE}/v1/products?search=${encodeURIComponent(Q)}&limit=1`, { signal: AbortSignal.timeout(8000) });
      console.log('  探测 HTTP', r.status);
    } catch (e) {
      console.log('  探测失败:', e.message, '（确认被网络/防护拦截，需官方 API Key）');
    }
    process.exit(0);
  }

  const path2 = `/v1/products?search=${encodeURIComponent(Q)}${CAT ? '&categories=' + encodeURIComponent(CAT) : ''}&limit=${LIMIT}`;
  const url = API_BASE + path2;
  const res = await fetch(url, {
    headers: { Authorization: authHeader('GET', path2), Accept: 'application/json' },
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) { console.error('iHerb API 返回', res.status, await res.text().catch(() => '')); process.exit(1); }
  const data = await res.json();
  const products = data.products || data.items || [];
  if (!products.length) { console.log('未返回商品'); process.exit(0); }

  const jsonPath = path.join(ROOT, 'db', 'supplements.json');
  const db = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const byId = new Map(db.map(d => [d.id, d]));
  let added = 0, updated = 0;
  for (const p of products) {
    const item = mapProduct(p);
    if (byId.has(item.id)) { Object.assign(byId.get(item.id), item); updated++; }
    else { db.push(item); byId.set(item.id, item); added++; }
  }
  fs.writeFileSync(jsonPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`✅ iHerb 导入完成：新增 ${added} 款，更新 ${updated} 款，数据库现共 ${db.length} 款`);
  console.log('   下一步: node tools/build-lib.mjs  将数据库注入 index.html，然后构建 APK。');
}

main().catch(e => { console.error('导入失败:', e.message); process.exit(1); });
