# CHANGELOG

2026-08-15 16:05 · 功能 · 拍照识别独立界面 + 滚动锁定 + 补剂库管理增强（复制/空瓶箱/历史补录）
- 文件清单：index.html、www/index.html；已 cp index.html www/ 同步
- 独立识别界面（#57）：`openConfig` 新增 `full` 全屏模式（`.sheet.full` 覆盖全屏、去圆角、避让安全区），拍照识别 / 扫码 AI 结果 / `data-ofedit` 补录均改用全屏，不再浮于底层库界面之上
- 滚动锁定：`refreshScrollLock()` 依据 `sheet/scanWrap/aiLoading` 的 `.on` 状态切换 `<html>.noscroll`（overflow:hidden），`openSheet/closeSheet/openScan/closeScan/showAILoading/hideAILoading` 全量接入，多层浮层叠加也不会误触滚动底层
- AI 多语言鲁棒（#56，上轮已完成代码）：`AI_SCHEMA` 要求严格中文键、品牌原样保留；`normalizeLib` 重写含 `pick/num` 与中英文 `CAT_MAP/FORM_MAP/EV_MAP/UNIT_MAP`，国外全英文牌子正确解析为可用字段
- 复制（#58）：`openStackDetail` 新增「复制」→ `copyStack()` 克隆条目（清 uid/history、份数复位）后 `openConfig` 改后重加，免去重复录入
- 空瓶收集箱（#58）：条目新增 `archived` 字段（`migrate` 默认 false）；`archive/unarchive/removeArchived` + 独立 `viewBox()` 视图；`viewStack/viewToday/viewCost` 均排除 archived；补剂页底部「空瓶箱 (n)」入口
- 历史补录（#58）：`openStackDetail` 新增「历史补录」→ `openBackfill()` 填「已服用总份数 / 当前剩余份数」，`backfill()` 按份数向过去日期回填 `history` 与 `intake` 并设定剩余，保数据连贯
- i18n：新增 zh/en 词条 copyStack / emptyBox / emptyBoxTitle / toBox / fromBox / boxEmpty / boxHint / backfill / backfillTaken / backfillRemain / backfillDesc / backfilled
- 部署标记：[前端]（需 `npx cap sync android` 重新构建 APK；本机无 Android SDK）

2026-08-15 15:56 · 样式 · 补剂库搜索栏+分类标签去白底玻璃化
- 文件清单：index.html、www/index.html（纯 CSS）；已 cp index.html www/ 同步
- 搜索栏 `.lib-search`：`transparent` 在浅色下透出页面白底仍显"白坨" → 改为 `rgba(255,255,255,.35)` 微白半透 + `blur(20px) saturate(200%)` + 白色描边 + 内高光，柔影调轻；暗色 `.08` 半透
- 分类标签 `.chip`：原实心 `var(--card)` 白底 → 玻璃胶囊（`.3` 半透 + `blur(16px) saturate(180%)` + 内高光 + 柔影）；选中态 `.chip.on` 补蓝色内高光+光晕
- 部署标记：[前端]（需 `npx cap sync android` 重新构建 APK；本机无 Android SDK）

2026-08-15 15:51 · 修复 · 成分区"真材实料"评分条与总体评分条对齐
- 文件清单：index.html、www/index.html（仅 ingMaterialHTML 卡片内距）；已 cp index.html www/ 同步
- 根因：`formQual`("真材实料")评分条所在的成分区 `.card` 无横向内距（贴左 0px），而下方"评分构成"卡片有 `padding:4px 16px 14px`（缩进 16px），两条评分条左缘差 16px 未对齐
- 修法：成分区 `.card` 加 `padding:4px 16px 14px`，表头内距改 `14px 0 8px`（避免卡片内距二次缩进）；现表头/真材实料条/成分卡/总体评分条统一对齐在 16px
- 部署标记：[前端]（需 `npx cap sync android` 重新构建 APK；本机无 Android SDK）

2026-08-15 15:45 · 样式 · 补剂库搜索栏去白底 + 成分胶囊 tag 单列 + 成分区表头对齐修复
- 文件清单：index.html、www/index.html（纯 CSS + ingMaterialHTML 微调）；已 cp index.html www/ 同步
- 补剂库搜索栏 `.lib-search`：去掉 `background:var(--card)` 白底 → `transparent`，仅留毛玻璃模糊+边框+内高光+聚焦蓝环，去掉"白块"压抑感（暗色同样透明）
- 成分胶囊 tag：`.ing-d-f` 内的 matChip（吸收/代谢负担）拆到独立 `.ing-d-chips` 行（flex 换行 + gap:6px），不再和真实原料名挤一行
- 成分区表头：section 标题"成分 · 真实原料 · 好处"原先左右 padding 为 0、与下方玻璃卡 14px 内距不对齐且被压成灰色小标签 → 改为 `padding:14px 14px 8px`、14px/600/`var(--text)`、取消 uppercase/letter-spacing，与卡片内容左缘对齐、更舒适
- 部署标记：[前端]（需 `npx cap sync android` 重新构建 APK；本机无 Android SDK）

2026-08-15 15:34 · 功能 · 品牌升级为独立字段 + 国内外常见品牌库备选 + 输入自动匹配/自定义 + 性能优化
- 文件清单：index.html、www/index.html（新增数据字段与常量、表单加品牌输入、列表/详情展示品牌）；已 cp index.html www/ 同步
- 品牌独立字段：补剂条目原仅靠 `s.lib.brand` 携带品牌（自定义/AI 添加项无独立品牌），现新增 `s.brand` 一级字段——`openConfig` 基础信息组加「品牌」输入框，`saveStack` 编辑/新增两分支均写入 `brand`，`viewStack` 与详情页（自定义块）优先显示 `s.brand`
- 品牌库 + 自动匹配：新增 `BRAND_LIB`（约 90 个国内外常见品牌，含 国内/美国/澳洲/日本/欧洲 地区标签）与 `brandDatalistHTML()`；输入框 `list="branddatalist"` 实现输入时下拉自动匹配，未命中可自由输入自定义品牌（option 带 `label` 显示地区）
- i18n：新增 fBrand（品牌）/fBrandPh（可输入或选择常用品牌），导出结构说明补「品牌」
- 性能优化：① `libHay(l)` 记忆化知识库检索串（避免每次按键重复拼接+解析成分）；② `scoreOf` 默认剂量结果记忆化（列表渲染不再重复算分）；③ `libSearch`/`pickSearch` 输入加 120ms 防抖，避免逐键重渲列表
- 部署标记：[前端]（需 `npx cap sync android` 重新构建 APK；本机无 Android SDK；CI 需 GitHub Secrets 注入签名）

2026-08-15 15:33 · 样式 · 详细信息成分卡玻璃化 + 弹窗列宽加宽
- 文件清单：index.html、www/index.html（纯 CSS）；已 cp index.html www/ 同步
- 成分-真实原料-好处 `.ing-d`：原平铺文本+细分割线（老土、与全站玻璃风脱节）→ 改为玻璃小卡（blur+saturate+内高光+柔影+白边），成分名与剂量左右分布；补 `.dark` 与 reduced-transparency 降级
- 弹窗 `.sheet` 列宽 `max-width:560px → 600px`，宽屏预览下更舒展不局促
- 部署标记：[前端]（需 `npx cap sync android` 重新构建 APK；本机无 Android SDK）

2026-08-15 15:29 · 修复 · 自定义添加成分行截断（改成分/剂量-单位/形态三排式）+ 补剂库搜索栏 Liquid Glass 化
- 文件清单：index.html、www/index.html（CSS+DOM 结构微调）；已 cp index.html www/ 同步
- 成分行截断：原 `ingRowHTML` 把 成分名/剂量/单位/删除 全挤在一行，窄屏下成分名 input 被压到截断；改为三排式——行1 成分名+删除、行2 剂量+单位、行3 形态，成分名独占整行不再截断
- 补剂库搜索栏 `.lib-search`：原仅 `blur(12px)` 无内高光/柔影/聚焦态，相对其它玻璃输入框显旧；补 saturate(180%)+内高光+柔影+ `:focus-within` 蓝色光环，并加 `.dark` 与 `prefers-reduced-transparency` 降级
- 部署标记：[前端]（需 `npx cap sync android` 重新构建 APK；本机无 Android SDK）

2026-08-15 15:12 · 样式 · 全站 Liquid Glass 精细化（表单分组/空状态/光斑视差/微光/标签玻璃化）
- 文件清单：index.html、www/index.html（CSS/JS 调整，DOM 仅 openConfig 做了分组包裹）；已 cp index.html www/ 同步
- 表单分组玻璃卡 `.form-group`：openConfig 按"基础信息/药丸外观/瓶身照片/成分/服用"分组为圆角磨砂玻璃卡（自带 blur+内高光+柔影），内部 `.field` 外距归零避免双重内缩；新增 i18n grpBasic/grpDose
- 空状态玻璃插画：`.empty .glyph` 由灰圆改为圆角磨砂玻璃 squircle（blur+内高光+柔影），花费页空状态补"去添加"引导
- 背景光斑滚动视差：新增 scroll 监听对 `.bg-orbs i` 做 translate3d 视差（多因子 depth），rAF 节流 + prefers-reduced-motion 跳过
- 关键动效微光：`.check.done` 打卡完成涟漪光环（checkGlow）、`.tag.red` 低库存轻柔脉冲光（tagPulse）
- 功能标签胶囊玻璃化：`.ftag` 加 backdrop-blur + 内高光，与 `.tag` 视觉统一
- 部署标记：[前端]（需 `npx cap sync android` 重新构建 APK；本机无 Android SDK）

2026-08-15 15:10 · 安全 · 钥匙库移出公开仓库 + CI 改由 secret 注入签名（密钥不再明文入库）
2026-08-15 15:05 · 样式 · 自定义添加表单（openConfig）Liquid Glass 化 + 输入框统一
- 文件清单：index.html、www/index.html（CSS 仅调整，DOM 结构不变）；已 cp index.html www/ 同步
- 表单输入框 `.field input` / `.ing-row input,select` / `.ing-form`：下划线平涂 → 圆角磨砂玻璃单元格（blur+saturate、内高光、聚焦蓝环），消除"老土"观感
- 成分列表 `#ingList` 升级为玻璃面板（毛玻璃背景 + 内高光 + 柔影）；删除按钮 `.ing-del` 加内高光、按下变红
- 选中态增强：`.shape-opt.on` 加蓝环柔光、`.color-opt.on` 加蓝色光晕
- 副作用：设置页 / AI 服务商页共用的 `.field` 输入框随之统一为玻璃风（整体一致性提升）
- 部署标记：[前端]（需 `npx cap sync android` 重新构建 APK；本机无 Android SDK）

2026-08-15 14:57 · 修复 · 导出数据无反应（重写下载逻辑 + 增加导出说明弹窗与复制兜底）
2026-08-15 12:45 · 样式 · 新功能视觉统一为 Liquid Glass（相互作用卡片/日历/趋势图玻璃化）
- 文件清单：index.html、www/index.html（CSS 仅调整，布局结构不变）；已 cp index.html www/ 同步
- 相互作用卡片 `.ia-card`：平涂 12px 色块 → 16px 液态玻璃 callout（saturate+blur、语义色描边、内高光+柔影），消除"彩盒"突兀感；补 `.dark` 深色描边适配
- 趋势图 `.trend-bar .bar`：生硬 6/2px 圆角 → 7/4px 统一圆角 + 顶部内高光，更"液态"
- 日历 `.cal-nav`/`.cal-today` 补内高光描边；`.cal-day.today` 加蓝色柔光外晕聚焦
- token 闭环：`:root`/`.dark` 补全 `--text`/`--purple`/`--indigo`/`*-soft`，修复 `.ing-d-f b` 失效变量与时段点色深色不适配；`.ia-card` 纳入 `prefers-reduced-transparency` 降级
- 部署标记：[前端]（需 `npx cap sync android` 重新构建 APK；本机无 Android SDK）

2026-08-15 12:40 · 功能 · 软件更新机制（轻量版）：固定签名 + 检查更新
- 文件清单：android/app/upload-keystore.jks（新增）、android/app/build.gradle（release 签名）、.github/workflows/android.yml（改打 release + 自动发 latest Release）、version.json（新增）、index.html（检查更新）
- 部署标记：[需部署]（改了 android/ 原生工程 + CI；新 APK 需重装一次）
- 说明：原 debug 包用临时 keystore，朋友无法覆盖升级；现提交固定 keystore（alias=upload）并配 release 签名，每次 push main 自动打 release 包并发到 GitHub `latest` 预发布（稳定下载 URL）。App 内新增「检查更新」（设置页手动 + 启动静默检测），比 versionCode 发现新版弹窗引导去下载。已分发旧包需朋友卸载重装一次新签名壳，之后即可覆盖升级。
- 安全提示：keystore 已提交仓库（含固定密码），若仓库公开建议后续改为 CI secret；国内下载走 GitHub Releases，后续可换 CloudBase/OSS 提速。

2026-08-14 22:55 · 修复 · 打卡日历改为可翻月月份视图（含回到今天、点击看当日明细）
- 文件清单：index.html（calendarHTML 重写为月份网格 + calY/calM 状态 + renderCal + openCalDay + 导航/日详情点击；CSS 新增 .cal-bar/.cal-nav/.cal-title/.cal-today/.cal-day.blank/.cal-daylist；i18n calBackToday/calDayTitle/calTaken/calMiss/calFuture）
- 原问题：日历是固定 35 天窗口、今天被强制排在最后一个格子、无法翻看其它月份。现改为标准月份网格（周一起始），顶部 ‹ 月份 › + 「回到今天」可自由翻月；默认显示当月、今天蓝框高亮、落在网格中部而非边缘；点击任意日期弹出当日打卡明细（已服/未服 + 份数）。
- 日期键与 history 一致：ds 改用 toISOString().slice(0,10)（UTC），避免时区错位。
- [前端]

2026-08-14 22:45 · 修复 · 拍照/扫码 AI 识别增加持久加载动画（替代瞬时 toast）
- 文件清单：index.html（新增 .ai-loading 加载层 + showAILoading/hideAILoading + i18n aiWait）
- 触发点：pickImage（拍照添加）、onCode（扫码→AI）、aiFromCode（条码→AI）全部改用全屏毛玻璃加载层（spinner + 标题 + "通常需要 10–30 秒"副文案），AI 返回后平滑过渡到结果表单；失败才回落 toast。解决"只闪一下识别中、长时间无反馈、结果突然弹窗"的割裂感。
- [前端]

2026-08-14 20:35 · 功能 · 京东联盟开放平台 API 导入器（廉价比价真源）
- 文件清单：tools/import-jd-union.mjs（新增）
- 背景：用户选"替代 API 接入平台"。京东健康网页反爬重需登录态，改用京东联盟开放平台(union.jd.com)正经签名 API：免费开发者账号（需联盟会员+应用+申请 jd.union.open.goods.query 权限），返回商品名/价格/最低价/优惠券/图文/skuId。签名 md5(appSecret+排序kv拼接+appSecret)大写，与 iHerb 同类。
- 实现：批量关键词（默认国产廉价 OTC：维C/维B/钙/铁/锌/叶酸/多维等）循环 jd.union.open.goods.query；解析嵌套响应（queryResult 可能为 JSON 字符串二次 parse）；映射 db schema（id=jd_skuId, price=lowestPrice, cat 按名推断）；合并去重。无 key 打印申请指引+探测。
- 说明：京东联盟给电商数据（价/SKU/品牌）非国药准字说明书；权威成分仍走 import-nmpa / 药智。填补 price-enrich.mjs 的"实时价"真源。
- 部署标记：[前端]（工具脚本；运行后需 node tools/build-lib.mjs 注入 index.html 再构建）

2026-08-14 20:30 · 功能 · 国内数据源接入工程（NMPA 国药准字 OTC + SAMR 保健食品 + 比价层）
- 文件清单：tools/import-nmpa.mjs（新增）、tools/import-samr.mjs（新增）、tools/price-enrich.mjs（新增）
- 目标：用户要"接入中国药品网做廉价国产 OTC 补剂库"。厘清两套库：NMPA 药监局管【药品】国药准字 OTC（维C/维B/钙/铁/锌等廉价国产替代，在这）；SAMR 市场监管总局管【保健食品/蓝帽子】（真正补剂品牌，按名查）。
- import-nmpa.mjs：逆向签名 sign=md5(encodeURIComponent(排序参数+"&nmpasecret2020")) + Timestamp 头（curl 实测验证过签名关）；cookie 双路径（Playwright 自动 / NMPA_COOKIE 环境变量）。映射字段到 db/supplements.json schema。⚠ 实测被瑞数 412 拦截，需本机浏览器 cookie 才能过（沙箱无浏览器，过不去属环境限制非脚本问题）。
- import-samr.mjs：保健食品查询脚手架（按"产品名+品牌"查，无公开 API，未实测，URL 占位待本机 F12 抓真实接口）。
- price-enrich.mjs：比价层。京东健康/阿里健康反爬极重、需登录态，故采用「国产平价 OTC 参考价表（公开市场常识，如维C片¥1.5-3）+ 失败回退」，按通用名匹配 nmpa_ 条目填价并明确标注"参考价待实时核验"，不冒充实时价。
- 实测约束：NMPA/SAMR 均需在用户本机（有 Chrome 的 Mac）跑一次导入器拿真实数据；本沙箱无浏览器无法实时拉取，故未伪造数据。
- 部署标记：[前端]（工具脚本，不影响已构建 APK；运行导入器后需 node tools/build-lib.mjs 注入 index.html 再构建）

2026-08-14 16:10 · 修复 · 已添加补剂支持重新编辑（自定义/从库均可）
- 文件清单：index.html（前端）
- 新增编辑入口：「我的补剂」详情页新增「编辑」按钮，复用 openConfig 预填该条的名称/价格/份数/每日次数/每次份数/成分（含真实原料形态）/瓶身图/药丸外观
- saveStack 增加更新模式：编辑时按 uid 定位并更新原条目，保留打卡 history；份数变更时 remaining 按「serv - 已服总数」重算，不丢记录
- 新增 i18n：edit「编辑」（中/英）
- 已验证：node --check 语法通过

2026-08-14 15:55 · 功能 · 功能标签 + 真实原料形态 + 成分好处明细 + 两处修复 + 自有数据库工程化
- 文件清单：index.html、db/supplements.json（新增）、tools/export-lib.mjs（新增）、tools/build-lib.mjs（新增）、tools/import-iherb.mjs（新增）
- **功能标签体系 FUNC_TAGS（16 个）**：改善认知/睡眠/骨骼/免疫/心脏/护眼/情绪/精力/抗压/抗炎等；今日页每行、我的补剂卡片自动按成分汇总显示功能标签
- **成分知识库 INGREDIENT_INFO**：覆盖全 B 族、镁/钙/铁/锌形态、鱼油 EPA-DHA、辅酶Q10、叶酸、B12、D3、K2、胆碱等，含真实化学形式（如 B1 的盐酸硫胺/呋喃硫胺/苯磷硫胺）、吸收率、代谢负担、身体益处
- **详情/评分"真实原料·好处"明细**：reportHTML 新增"成分·真实原料·好处"卡片，逐成分显示真实原料形态（产品已标显示"真实原料"，未标显示"推荐形式"）+ 吸收/负担标签 + 益处；并给出"真材实料"评分（活性/高吸收形式加分）
- **添加补剂时可记录真实原料形态**：openConfig 成分行新增"形态"下拉（来自 INGREDIENT_INFO.forms），保存进 ingredient.form
- **修复①**：#ingList 改为独立滚动容器（max-height+overflow），解决"增加成分"面板无法下滑
- **修复②**：添加补剂入口"手动添加/自定义补剂"从列表末尾移至最前
- **iHerb 建库工程化**：导出 LIB→db/supplements.json 为结构化自有数据库；编写 iHerb 官方联盟 API 导入器 import-iherb.mjs（带 HMAC 签名，需 key，拿到即可自动合并建库）；build-lib.mjs 可把 JSON 回注 App。注：iHerb 直连被 Cloudflare 拦截（403/连接失败），必须走官方 API
- 已验证：JS 语法 OK；import-iherb 无 key 分支正常运行并探测确认网络封锁

2026-08-14 15:30 · 功能 · iHerb 资料库大扩充 + 补剂库检索模式
- 文件清单：index.html、www/index.html
- **补剂库从 16 → 65 款**：以 iHerb 畅销榜真实品牌（California Gold Nutrition / Life Extension / NOW / Doctor's Best / Jarrow / Thorne / 21st Century 等）为种子，覆盖维生素(17)、矿物质(13)、脂肪酸/胆碱(4)、抗氧化(6)、氨基酸(4)、认知(4)、蛋白(2)、肠道(3)、植提(3)、适应原(2)、运动(6)、睡眠(1)、美容(1)
- **成分表全面细化**：复合维生素/B 族做到全成分面板（B1/B2/B3/B5/B6/B7/叶酸/B12 全齐 + 胆碱 + 肌醇 + PABA），可直接对照 lululab 这类全谱产品；胆碱、肌醇、各矿物质单体（钾/硒/碘/铜/锰/铬/硼）补齐
- **RDA 营养表从 8 → 26 项**：新增全 B 族、胆碱、维生素 A/E/K、硒/碘/铜/锰/铬/钾/硼，人体图 now 能详细展示复合维生素摄入
- **补剂库检索模式**：搜索框（按名称/品牌/成分/类别实时过滤）+ 类别筛选 chips（横向滚动）；点击进入详情卡可直接「加入我的补剂」
- **添加入口同步检索**：「添加补剂」里的「从补剂库选择」也加了搜索框
- 说明：iHerb 页面为 JS 渲染，无法直接爬取完整成分明细表，成分数据为基于真实产品典型配方的代表值，供追踪参考，非临床数据库

2026-08-14 12:50 · 功能 · 竞品对标大升级：相互作用警告 + 打卡日历 + 时段分组 + 趋势图 + 数据导入 + 知识个性化
- 文件清单：index.html、www/index.html
- **相互作用警告系统**：构建 10 条补剂相互作用规则（铁+钙竞争、D3+K2 协同、锌铜平衡等），自动检测用户补剂列表中的冲突/协同组合，今日页和知识页均展示彩色警告卡片（⚠️橙/✓绿/ℹ️蓝）
- **打卡日历视图**：今日页新增 35 天日历网格（5 周），绿/橙/灰三色标记每日完成状态，今日高亮蓝框
- **连续打卡天数**：日历上方显示连续打卡天数（streak），全部完成时数字变绿
- **智能时段分组**：根据成分特性自动建议服用时段（晨起/午餐/晚餐/睡前），今日列表按时段分组显示并标注各组完成进度
- **7 天打卡趋势图**：底部柱状图展示近 7 天每日完成率，绿/橙/灰三色
- **数据导入功能**：设置页新增导入按钮，支持从 JSON 备份合并恢复数据（不覆盖现有，仅追加新条目）
- **知识页面升级**：分三层展示——个性化相互作用提醒 + 基于用户补剂的关联知识 + 通用知识库（12 条，新增脂溶性维生素随餐/益生菌空腹/B 族晨服/肌酸饱和/锌铜比/CoQ10 与他汀 6 条），每条标注分类标签
- 部署标记：[前端] 需重新构建 APK

2026-08-14 18:05 · 功能 · 接入 Agnes AI 服务商（推理模型兼容）
- 文件清单：index.html、www/index.html
- 新增 Agnes AI 预设（baseUrl: `https://apihub.agnes-ai.com/v1`，model: `agnes-2.5-flash`），设置页一键选用
- `callAI()` 兼容推理模型响应：自动检测 agnes/deepseek-r/qwq/reasoner 等模型名，注入 `chat_template_kwargs.enable_thinking:false` 关闭推理获取干净 JSON；兜底读取 `reasoning_content` 字段（当 `content` 为空时）
- 已验证：Agnes 2.5 Flash 支持 base64 图片输入 + 图像理解，拍照识别流程可用
- 部署标记：[前端] 需重新构建 APK

2026-08-14 12:20 · 重构 · 药丸 3D 立体选择器（形状+颜色+颗粒）+ 人体图改列表 + 命名修正
- 文件清单：index.html、www/index.html
- 药丸 3D 选择器：完整复刻 iOS 健康药物选择——6 种立体形状（圆片/长片/胶囊/软胶囊/粉剂/滴剂，多层渐变+高光+边缘模拟 3D）、8 种颜色、细节选项（片剂刻痕：无/单刻痕/十字；胶囊颗粒：无/颗粒）；大预览实时更新；`icon` 字段从字符串升级为 `{shape,color,detail}` 对象，migrate 兼容旧字符串
- 人体图：环形圈改为列表形式（名称完整显示 + 摄入值语义着色 + 细进度条），修复营养素名被 ellipsis 截断（如"维生素 D3"只显"维"）
- 命名：tab「知识库」改为「补剂库」（fromLibrary 同步），更贴合内容
- 部署标记：[前端] 需重新构建 APK

2026-08-14 12:05 · 功能 · 药丸图标 + 补给库卡片化（原瓶图）+ 成分自动匹配 + 人体图视觉优化
- 文件清单：index.html、www/index.html
- 药丸图标：预设 6 种剂型 SVG 图标（胶囊/圆片/软胶囊/长片/粉剂/滴剂），补剂加 icon 字段；今日打卡列表项前显示图标；添加表单加图标选择器（点选高亮）
- 补给库卡片化：从文字列表改为卡片布局，显示瓶身图（用户上传拍照压缩 / Open Food Facts 远程图 / 占位药瓶 SVG+品牌首字母）+ 品牌 + 余量花费；添加表单加「瓶身照片」上传（canvas 压缩到 480px JPEG 存 localStorage）；扫码查到 OF 产品自动带入 image_front_url；详情页也显示瓶身图
- 成分自动匹配：新增 COMPONENT_DB 成分元数据字典（从 LIB 提取），成分名 input 加 datalist 联想；输入已知成分名自动切换单位
- 人体图视觉优化：环形进度圈 36→46px、营养素名称/数值字号上调、摄入数字语义化着色（达标绿/不足橙/超标红）
- 部署标记：[前端] 需 `cp index.html www/ && npx cap sync android` 后重新构建 APK

2026-08-14 11:30 · 重构 · 数据模型升级为多成分（鱼油拆 EPA/DHA）+ 人体图用 AI 重绘
- 文件清单：index.html、www/index.html、assets/human_clean.png
- 数据模型：补剂从单成分 `ing` 升级为 `ings[]` 多成分数组；鱼油示例拆为 EPA 550mg + DHA 450mg；RDA 加 `parts` 字段合成 EPA+DHA；migrate 自动重建旧数据
- 自定义添加表单：动态成分行（成分名 + 每份剂量 + 单位），可增删；从知识库添加时预填所有成分
- 摄入累加（take）、今日汇总、人体图、详情报告全部按多成分分别显示
- 人体图：用 ImageGen 生成透明背景人体 PNG，裁掉 AI 水印，阈值化分离线条，base64 内嵌到 CSS mask-image，线条颜色随主题自适应（浅/深色模式都精致）
- AI_SCHEMA 升级：识别结果支持 `ings` 数组（多成分），鱼油等可由 AI 自动拆 EPA/DHA
- 部署标记：[前端] 需 `cp index.html www/ && npx cap sync android` 后重新构建 APK

2026-08-14 00:40 · 功能 · AI 接入重构为多服务商 + 自定义系统提示词
- 文件清单：index.html、www/index.html
- AI 配置由单组（baseUrl/apiKey/model）改为多服务商数组 profiles + active 启用项 + sysPrompt 系统提示词；旧单对象格式自动迁移
- 设置页：服务商列表支持「使用/编辑/删除」一键切换，新增「添加服务商」表单；预设（OpenAI/智谱/通义）点选后填入表单
- 新增自定义识别提示词（系统角色）编辑框，默认值为原 AI_SCHEMA；callAI 将提示词放入 system 角色、用户指令放入 user 角色
- 三处 callAI 调用（拍照/Open Food Facts/条码）去掉硬编码 AI_SCHEMA 前缀，改用 aiPhotoPrompt/aiOffPrompt/aiCodePrompt 文案键
- 部署标记：[前端]（改代码 push 后云端重构建出 APK）

2026-08-14 00:50 · 功能 · 人体图重绘 + 接入扫码/后台提醒原生插件
- 文件清单：index.html、www/index.html、package.json、package-lock.json、android/app/capacitor.build.gradle、android/capacitor.settings.gradle、android/app/src/main/AndroidManifest.xml
- 人体图：SVG 人体轮廓重绘（渐变填充+圆润线条），营养素改为环形进度圈展示（达标绿/不足橙/超标红）
- 扫码：接入 @capacitor-mlkit/barcode-scanning@8.1.0（ML Kit，本地识别、国产机可用），原生走 startScan+barcodesScanned 监听，网页保留 BarcodeDetector 兜底；AndroidManifest 加 CAMERA 权限 + ML Kit meta-data
- 提醒：接入 @capacitor/local-notifications@8.2.1，原生用本地通知每天重复调度（后台/锁屏可提醒），网页保留 setInterval 兜底；纯 HTML 通过 window.Capacitor.Plugins 访问
- 部署标记：[前端]（改代码 push 后云端重构建出 APK）

2026-08-14 00:23 · 功能 · 首个安卓 APK 云端构建成功
- 结果：GitHub Actions 成功构建 app-debug.apk（Medget 仓库），用户已下载安装包
- 过程修复：Node 20→22（Capacitor 8.5 要求≥22）、Java 17→21（invalid source release）、交互式 rebase 卡死（--abort）、GitHub 密码认证改 PAT、去掉重复的 cap add android
- 部署标记：[云端资源] 已构建

2026-08-14 00:16 · 修复 · workflow Java 版本 17 → 21
- 文件清单：.github/workflows/android.yml
- 原因：Capacitor 8.5 android 库用 Java 21 编译，此前 setup-java 用 17 导致 `invalid source release: 21`
- 部署标记：[云端资源] 已推送，重新触发构建

2026-08-14 00:13 · 修复 · workflow Node 版本 20 → 22
- 文件清单：.github/workflows/android.yml
- 原因：Capacitor 8.5 CLI 要求 NodeJS >=22，此前 setup-node 用 node-version:20 导致 `npx cap sync android` 报 fatal
- 部署标记：[云端资源] 已推送，重新触发构建

2026-08-14 00:10 · 配置 · 推送代码到 GitHub 并修复云端构建 workflow
- 文件清单：index.html、package.json、capacitor.config.json、android/、.github/workflows/android.yml 等已推送到 `XinxinLi2004/Medget`（main 分支）
- 处理：中止卡住的交互式 rebase（git 状态混乱）→ merge 远程 LICENSE（--allow-unrelated-histories）→ push 成功；workflow 去掉 `cap add android`（android 工程已在仓库，避免重复添加报错）
- 部署标记：[云端资源]（push 到 main 自动触发 GitHub Actions 构建 APK）；已推送
- 说明：GitHub MCP 连接器仅读权限无法代推，最终由用户本地 git 完成认证与推送

2026-08-13 20:30 · 配置 · git 初始化 + workflow 补 web 资源生成步骤
- 文件清单：git init + 首次提交（64 文件）；workflow 增加 Prepare web assets（云端 cp index.html → www）；.gitignore 增加 .workbuddy/
- 说明：本地已提交到 main 分支（commit d688290），推送到 GitHub 后即可触发云端构建 APK；git 身份用的是临时占位（lixueyou），push 前可自行修改
- 部署标记：[前端]

2026-08-13 20:25 · 配置 · 新增 GitHub Actions 云端构建 APK（免装 Android Studio）
- 文件清单：新增 .github/workflows/android.yml；更新 封装APK说明.md
- 内容：云端构建 debug APK（workflow_dispatch 手动触发 + v* tag 自动触发），云端装 JDK17 + Android SDK + npm ci + cap sync + gradlew assembleDebug + 上传 artifact；本地零依赖
- 说明：调研确认 PakePlus 也可云端打 APK 但为 Tauri2 栈会替换 Capacitor 工程，故保留 Capacitor 方案（不换栈），已在说明文档注明取舍
- 部署标记：[前端]（改代码 push 后重跑 workflow 即出 APK）

2026-08-13 19:50 · 配置 · 搭建 Capacitor 封装（安卓 APK）工程
- 文件清单：新增 capacitor.config.json、package.json、.gitignore、封装APK说明.md、www/index.html、android/（生成的 Android 原生工程）
- 内容：Capacitor 8.5.0（core/cli/android），appId com.lixueyou.gaichiyao，webDir=www；npx cap add android 生成 gradle 工程并同步资源到 android/app/src/main/assets/public
- 注意点：本机无 Android SDK/Gradle，无法命令行出 APK——需 Android Studio 打开 android/ 目录构建；扫码用 BarcodeDetector 在 WebView 可能不支持，需后续加 barcode-scanner 插件；提醒为网页版，后台提醒需 local-notifications 插件；图标/appId 上架前需替换
- 部署标记：[前端]（改动 www/index.html 后执行 cp index.html www/ && npx cap sync android）

2026-08-13 19:45 · 修复 · 分段控件滑块滑动动画 + 语言切换高亮不更新
- 文件清单：index.html
- 修复：分段控件（语言/外观）改为 iOS 式滑动滑块（.seg-thumb，left/width 过渡动画），点击时滑块平滑滑到选中项；此前语言切换后 seg 高亮不更新（setLang 未重渲染 sheet）已修复——点击即时更新选中态 + 滑块位置，主题/动效切换不再重渲染 sheet（保留动画）
- 部署标记：[前端]

2026-08-13 19:40 · 功能 · 服用设置/提醒 + 补剂品牌信息 + 人体营养图
- 文件清单：index.html
- 新增：今日页补剂项点开可设置服用方式（随餐/空腹/睡前/不限）+ 提醒时间（App 打开时到点 Notification + toast，20s 轮询）；知识库与报告显示品牌/全名/储存方式（16 款示例已补全）；首页底部新增人体图（SVG 人体轮廓 + 8 项营养素"补剂摄入 vs 推荐量 RDA"对比，不足橙/达标绿/超标红）
- 数据：stack 项新增 usage/remindAt；LIB 新增 fullName/brand/storage；新增 RDA 参考表；存储 key 升级 v5 并做 v4→v5 迁移（补默认字段）
- 说明：网页版提醒仅 App 打开时生效，后台/锁屏真提醒需 PWA Service Worker + Push（后续）；RDA 为示例参考值
- 部署标记：[前端]

2026-08-13 19:30 · 功能 · 设置扩展（语言切换/深色模式/动效/数据）+ i18n + 动画字体优化
- 文件清单：index.html
- 新增：中英文切换（i18n 字典 + t()，UI 框架文案全量多语言，知识库内容保留中文示例）；深色模式（跟随系统/浅色/深色，.dark 变量 + matchMedia）；动效开关（reduceMotion）；数据导出（JSON 备份）/清空；设置页重构为分组（语言/外观/动效/数据/AI/关于）
- 字体：数字/拉丁改用 Manrope（jsdelivr woff2，font-display swap，离线回退系统字体），大标题 font-weight 800 + 紧字距
- 动画：Tab 切换 fadeUp 过渡、打卡弹簧弹跳、开关/分段控件过渡、主题切换渐变
- 部署标记：[前端]

2026-08-13 19:20 · 样式 · Liquid Glass 玻璃质感 + 图标重绘 + 字体优化
- 文件清单：index.html（视觉/交互层升级，功能不变）
- 视觉：新增背景光斑层让毛玻璃有内容可折射；导航/TabBar/卡片/Sheet 升级为液态玻璃（backdrop-filter blur+saturate、分层边框、内高光、inset shadow）；识别大按钮改蓝渐变+投影
- 图标：Tab 图标重绘（胶囊药丸、圆角日历勾、书、美元圈、灯泡），stroke 统一 1.6，更圆润精致（agnes-image 生成位图不适合矢量 UI 图标，故手写 SVG）
- 字体：SF Pro 栈 + 大标题紧字距(-.03/-.04em) + tabular 数字
- 交互：打卡勾改弹簧弹跳、按钮按压位移+亮度反馈、sheet 滑入更顺滑；新增 prefers-reduced-transparency / reduced-motion 降级
- 修复：鱼油项 trans 字段笔误
- 部署标记：[前端]

2026-08-13 19:10 · 功能 · 接入 Open Food Facts 免费条码库
- 文件清单：index.html
- 新增：扫码拿到条码后先查 Open Food Facts（免费无 Key、ODbL 开放许可），查到则展示真实产品名/品牌/成分表，有 AI 时再叠加生成完整评估，无 AI 则可手动完善剂量保存；查不到则降级 AI/手动
- 修复：queryOpenFoodFacts 的 status 判断错误（v2 找到时无 status 字段，改为判 data.product 是否存在）
- 说明：OF 以食品为主、补剂覆盖一般且欧美为主，国产补剂大概率查不到；已 curl 实测 API 可用
- 部署标记：[前端]

2026-08-13 18:10 · 功能 · 新增扫码录入 + AI API 集成
- 文件清单：index.html
- 新增：扫码识别（BarcodeDetector 相机流扫商品条码）、拍照识别成分表（上传/拍摄图片给视觉模型解析并自动填充表单）、AI 配置（OpenAI/智谱/通义 三套预设 + Base URL / API Key / 模型）、AI 结构化 JSON 返回、toast 提示、导航栏设置入口
- 重构：openConfig/saveStack 改为 currentLib 机制，支持 AI 识别结果与知识库项共用一套表单；补剂档案存 lib 快照，AI 补剂也能出评分报告
- 说明：扫码/拍照依赖视觉模型，需用户在「设置」填 API Key；条码仅能拿到编号，真实反查商品需后续接条码库；BarcodeDetector 仅安卓 Chrome 支持，iOS/桌面会降级提示
- 部署标记：[前端]

2026-08-13 18:00 · 重构 · 三次重设计 UI（iOS 原生风格）
- 文件清单：index.html（视觉层全面重设计，功能不变）
- 视觉：遵循 HIG——系统蓝 #007AFF + 语义色（绿/红/橙），大标题导航（34px bold，毛玻璃 sticky），底部 Tab Bar 毛玻璃，分组白卡片（12px 圆角、无阴影、细分隔线、chevron），圆形打卡按钮（空心→绿勾），iOS 底部 sheet，SF 风格线性图标
- 修复：鱼油项 trans 字段笔误
- 部署标记：[前端]

2026-08-13 17:50 · 重构 · 二次重设计 UI（Swiss 精密仪表风）
- 文件清单：index.html（视觉层全面重设计，功能不变）
- 视觉：冷白 + 墨黑 + 瑞士红三色，严格左对齐网格，非对称留白，方形按钮，tabular 数字，黑色强横线分隔，评分改为 Swiss 网格表格报告；与上一版"暖纸处方笺"形成截然不同的气质
- 部署标记：[前端]

2026-08-13 17:25 · 重构 · 重写 MVP 原型 UI（处方笺美学 + 底部 Tab + 底部弹层）
- 文件清单：index.html（全面重写）
- 视觉：暖纸底 + 墨绿主色 + 朱砂印章，衬线标题，细线分组替代卡片堆，底部 tab bar + SVG 线性图标，底部弹层（bottom sheet），克制动效
- 修复：锌项 trans 字段笔误；事件委托顺序（此前删除按钮会误触发打开详情）
- 部署标记：[前端]

2026-08-13 17:10 · 功能 · 启动「该吃药了」安卓补剂管理 App 网页 MVP 原型
- 文件清单：index.html（PWA 单文件，含知识库/评分/打卡/余量/花费）、产品方案.md（竞品矩阵+差异化+评分框架+路线图）
- 部署标记：[前端]（安卓浏览器直接打开；后续用 Capacitor 封壳 APK）
- 已实现：本地示例知识库(16 款补剂)、Suppi 式成分卡+质量/价值评分(透明可解释)、打卡、余量自动扣减、低库存提醒、每日/单份/每月花费计算、知识科普、每日摄入量汇总、localStorage 本地存储
- 注意点：拍照识别为扫码/选库占位(真 OCR 待 v0.3)；评分基于示例数据，非医疗建议；国内补剂库待 v0.4 接入；后续接安卓需评估 Capacitor 与原生 Room 数据迁移
