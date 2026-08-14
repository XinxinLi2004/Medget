# CHANGELOG

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
