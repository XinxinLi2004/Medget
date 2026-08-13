# 封装 APK 说明

## 当前状态

项目已搭好 Capacitor 结构：

```
该吃药了/
├── index.html              # 开发源（网页原型，浏览器直接打开）
├── www/index.html          # Capacitor 打包用的 web 资源（与上面同步）
├── capacitor.config.json   # Capacitor 配置（appId / appName / webDir）
├── package.json
└── android/                # 生成的 Android 原生工程（gradle，用 Android Studio 打开）
```

> 本机缺 Android SDK / Gradle，无法直接命令行出 APK。推荐用下面的**云端构建**（无需装 Android Studio）。

## 方式一：云端构建（推荐，零本地环境）

已配好 GitHub Actions workflow（`.github/workflows/android.yml`），云端自动出 APK：

1. 把项目推送到 GitHub 仓库（`git init && git add . && git commit && git push`）。
2. GitHub 仓库页 → **Actions** → 左侧 **Build Android APK** → **Run workflow**。
3. 等几分钟构建完，进入该次运行 → 底部 **Artifacts** → 下载 `gaichiyao-debug`（解压得到 `app-debug.apk`）。
4. 以后每次改完代码 `git push` 后重跑 workflow 即可。

> 免费额度：GitHub 公共仓库 Actions 免费，私有仓库每月 2000 分钟（足够）。

## 方式二：本地构建（需装 Android Studio）

1. 安装 [Android Studio](https://developer.android.com/studio)（安装时勾选 Android SDK）。
2. Android Studio → **File → Open** → 选择本项目的 `android/` 目录。
3. 等 Gradle 自动同步下载依赖（首次较慢）。
4. 连手机（开 USB 调试）或启动模拟器，点顶部 **Run ▶**。
5. 或菜单 **Build → Build App Bundle(s) / APK(s) → Build APK(s)**，产物在 `android/app/build/outputs/apk/debug/app-debug.apk`。

## 关于 PakePlus（另一种轻量方案）

PakePlus 也能云端打包安卓 APK 且无需本地环境，但它是 **Rust + Tauri 2** 技术栈，会**替换掉本项目的 Capacitor 工程**（它直接吃静态 HTML，不认 `android/` 目录）。若走 PakePlus，之前搭的 Capacitor 工程和插件（barcode-scanner / local-notifications）都要按 Tauri 生态重做。故本项目保留 Capacitor + 上面的 GitHub Actions 云端构建，不换栈。

## 后续改代码 → 同步到工程

```bash
# 改完 www/index.html 后：
npx cap sync android
# 或直接重新构建：
npx cap copy android
```

> 提示：根目录 `index.html` 是开发源，改完要同步到 `www/index.html`：
> `cp index.html www/index.html && npx cap sync android`

## 上架/发布前的已知事项（务必处理）

1. **App 图标**：目前是 Capacitor 默认图标。用 `npx @capacitor/assets generate` 或 Android Studio 的 Image Asset 替换。
2. **appId**：`capacitor.config.json` 里的 `com.lixueyou.gaichiyao` 是占位，上架前改成你的真实包名。
3. **扫码**：网页用了浏览器 `BarcodeDetector`，Android WebView 可能不支持。真机扫码需加 `@capacitor-community/barcode-scanner` 插件。
4. **提醒**：当前是网页版（App 打开时到点提醒）。锁屏/后台真提醒需 `@capacitor/local-notifications` 插件。
5. **签名**：debug 版可本地装，正式发布需配置签名 + 上架合规（健康类免责声明、隐私政策）。

## 版本

- Capacitor 8.5.0（core / cli / android）
- applicationId：`com.lixueyou.gaichiyao`（上架前改成你的真实包名）
