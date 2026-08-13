# 该吃药了 · 项目长期记忆

## 定位
安卓端补剂管理 App「AI 补剂顾问」。参考 **Suppi**（知识/循证评估）、**优补计 SupplePlan**（记录/打卡/花费）、**Stacklog**（成本仪表盘）。

## 形态与架构
- 网页 PWA 原型（`index.html`，纯前端 + localStorage 本地优先，无后端无账号）
- 已搭好 Capacitor 8.5 封装工程：`capacitor.config.json` + `www/`（web 资源）+ `android/`（生成的 gradle 原生工程，appId `com.lixueyou.gaichiyao`）。本机无 Android SDK，APK 需 Android Studio 打开 `android/` 构建。改 `www/index.html` 后 `cp index.html www/ && npx cap sync android` 同步。
- 用户有技术背景（曾开发 MusicFree 插件），可继续在 Android Studio 迭代

## 已实现功能清单（v0.1 网页 MVP）
- 16 款示例补剂知识库（含品牌/全名/储存方式）+ Suppi 式循证评分（质量/循证/透明/价值）
- 扫码（BarcodeDetector）+ Open Food Facts 条码库 + AI 视觉拍照识别（OpenAI/智谱/通义，自填 Key）
- 打卡、余量扣减、低库存提醒、单份/每日/每月花费、每日摄入汇总
- 服用方式（随餐/空腹/睡前/不限）+ 提醒时间（网页版到点提醒）
- 首页人体营养图（补剂摄入 vs RDA 推荐）
- 中英 i18n、深色模式、动效开关、数据导出/清空
- 存储 key `gaichiyao_v5`（v4→v5 迁移）

## 差异化（凭啥赢）
安卓优先 + 中文 + 一体化闭环（识别→评估→记录→花费）+ 本地隐私。填补"国外 iOS 精品 / 国内工具"交叉空白。

## 路线图
v0.1 网页 MVP → v0.2 封壳 APK + 扫码 → v0.3 拍照 OCR 识别中文成分表 → v0.4 联网知识库(自建/接 Labdoor) → v0.5 适老模式 + 家人多档案 + 私域(公众号理学优课)引流

## 关键约束（务必遵守）
- 拍照识别 MVP 阶段为扫码/选库占位，非真·瓶身 OCR
- 评分=信息辅助，非医疗建议；补剂 FDA 不预审，不保证个体有效
- 国内补剂库起步用示例数据，真实数据库需自建/爬取
- 上线需健康类免责声明 + 隐私政策
- **UI 采用 iOS 原生风格（HIG）**：系统蓝 #007AFF + 语义色（绿/红/橙）、大标题导航、毛玻璃 Tab Bar、分组圆角卡片（无阴影）、SF 风格图标。用户否掉过"暖纸处方笺"和"Swiss 冷白"两版，最终锚定 iOS 风格，后续迭代沿用。

## 用户背景
李老师，合肥高中物理老师，公众号「理学优课」；本项目为其产品探索，关注私域引流与获客效率。
