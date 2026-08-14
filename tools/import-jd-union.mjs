#!/usr/bin/env node
/**
 * import-jd-union.mjs —— 从「京东联盟开放平台」拉取真实商品价格，补全"国产平价替代"比价
 *
 * ============ 为什么是它 ============
 * 京东健康网页反爬重、需登录态，纯爬拿不到价。京东联盟开放平台(union.jd.com)提供【正经签名 API】：
 *   - 免费开发者账号（需先成为联盟会员、创建应用、申请 jd.union.open.goods.query 权限）
 *   - 返回 商品名 / 价格 / 最低价 / 优惠券 / 图文 / skuId —— 正好是"廉价"对比要的
 *   - 签名规范：md5(appSecret + 排序后 参数名+参数值 拼接 + appSecret) 转大写（与 iHerb 同类思路）
 * 这是爬京东健康的最干净替代，也是 price-enrich.mjs 的"实时价"真源。
 *
 * ============ 用法 ============
 *   JD_APPKEY=xxx JD_APPSECRET=yyy node tools/import-jd-union.mjs
 *   可选：JD_Q=维生素C片 （单关键词）；JD_QS=维生素C片,复合维生素B,碳酸钙D3 （批量）；JD_LIMIT=每词条数
 *   无 key 时打印申请指引并做一次无签名探测（预期鉴权失败）。
 *
 * ============ 说明 ============
 * - 京东联盟给的是电商数据（价格/SKU/品牌），不是国药准字说明书；权威成分仍走 import-nmpa / 药智。
 * - 合并策略：以 jd_<skuId> 去重；已存在则更新价格，不存在则新增。
 *
 * 依赖：仅 Node 内置（crypto / fetch）。
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve('.');
const API = 'https://api.jd.com/routerjson';
const APPKEY = process.env.JD_APPKEY || '';
const APPSECRET = process.env.JD_APPSECRET || '';
const Q = process.env.JD_Q || '';
const QS = process.env.JD_QS || '维生素C片,复合维生素B片,碳酸钙D3片,维生素D3,叶酸片,葡萄糖酸锌,多维元素片,维生素B1片,维生素B2片,维生素B6片';
const LIMIT = Math.min(Number(process.env.JD_LIMIT) || 20, 50);
const TERMS = (Q || QS).split(',').map(s => s.trim()).filter(Boolean);

// ---------- 京东联盟签名：md5(secret + 排序kv拼接 + secret) 大写 ----------
function sign(params, secret) {
  const sorted = Object.keys(params).sort();
  let raw = secret;
  for (const k of sorted) raw += k + params[k];
  raw += secret;
  return crypto.createHash('md5').update(raw, 'utf8').digest('hex').toUpperCase();
}

// GMT+8 时间戳 yyyy-MM-dd HH:mm:ss
function ts8() {
  const d = new Date(Date.now() + 8 * 3600 * 1000);
  const p = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

function catOf(name) {
  if (/维生素[CDB]|维C|维B|复合维生素|多维|叶酸/.test(name)) return '维生素';
  if (/钙|碳酸钙|维D|氨糖/.test(name)) return '骨骼关节';
  if (/铁|锌|硒|镁|矿物/.test(name)) return '矿物质';
  return '其他';
}

function mapGoods(g) {
  const skuId = g.skuId || g.skuIdStr || '';
  const name = g.skuName || g.title || g.name || '';
  const priceInfo = g.priceInfo || {};
  const price = priceInfo.lowestPrice ?? priceInfo.price ?? g.price ?? 0;
  const brand = g.brandName || g.brand || (g.materialInfo && g.materialInfo.brandName) || '';
  return {
    id: 'jd_' + skuId,
    name,
    fullName: name,
    brand: brand || '京东',
    storage: '阴凉干燥处，避光',
    cat: catOf(name),
    form: '中',
    ev: '中',
    trans: true,
    price: Math.round(Number(price) * 100) / 100 || 0,
    serv: 60,
    ing: { name, amt: 0, unit: 'mg', min: 0, max: 0 },
    ings: [],
    good: '',
    bad: '',
    note: '数据来源：京东联盟开放平台 API（商品价格，非国药准字说明书）。'
  };
}

async function searchOnce(term) {
  const biz = { goodsReqDTO: { keyword: term, pageIndex: 1, pageSize: LIMIT } };
  const params = {
    app_key: APPKEY,
    method: 'jd.union.open.goods.query',
    timestamp: ts8(),
    v: '1.0',
    sign_method: 'md5',
    format: 'json',
    '360buy_param_json': JSON.stringify(biz)
  };
  params.sign = sign(params, APPSECRET);
  const body = new URLSearchParams(params).toString();
  const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(20000) });
  const json = await res.json();
  // 京东联盟返回嵌套：jd_union_open_goods_query_responce.queryResult 常为 JSON 字符串
  const resp = json.jd_union_open_goods_query_responce || json;
  let qr = resp.queryResult;
  if (typeof qr === 'string') { try { qr = JSON.parse(qr); } catch { return []; } }
  const list = qr?.data || qr?.list || (Array.isArray(qr) ? qr : []);
  return list;
}

async function main() {
  if (!APPKEY || !APPSECRET) {
    console.log('⚠  未检测到 JD_APPKEY / JD_APPSECRET。');
    console.log('    京东联盟开放平台(union.jd.com)：注册→创建应用→申请 jd.union.open.goods.query 权限→拿到 appKey/appSecret。');
    console.log('    用法: JD_APPKEY=xxx JD_APPSECRET=yyy node tools/import-jd-union.mjs');
    console.log('\n（无签名探测，预期鉴权失败）');
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'method=jd.union.open.goods.query&app_key=demo', signal: AbortSignal.timeout(8000) });
      console.log('  探测 HTTP', r.status);
    } catch (e) { console.log('  探测失败:', e.message); }
    process.exit(0);
  }

  const jsonPath = path.join(ROOT, 'db', 'supplements.json');
  const db = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const byId = new Map(db.map(d => [d.id, d]));
  let added = 0, updated = 0;
  for (const term of TERMS) {
    console.log(`· 搜索「${term}」…`);
    let list = [];
    try { list = await searchOnce(term); } catch (e) { console.log('  失败:', e.message); continue; }
    for (const g of list) {
      const item = mapGoods(g);
      if (!item.id || !item.name) continue;
      if (byId.has(item.id)) { Object.assign(byId.get(item.id), item); updated++; }
      else { db.push(item); byId.set(item.id, item); added++; }
    }
    console.log(`  本词 ${list.length} 条`);
  }
  fs.writeFileSync(jsonPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`✅ 京东联盟导入完成：新增 ${added} 款，更新 ${updated} 款，数据库现共 ${db.length} 款`);
  console.log('   下一步：node tools/build-lib.mjs 注入 index.html → 构建 APK，即可见"国产平价替代（含实时价）"。');
}

main().catch(e => { console.error('导入失败:', e.message); process.exit(1); });
