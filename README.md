# iWords Svelte App

> ⚠️ 各功能仍在开发中

## 功能亮点

- 多级内容管理：支持课程、章节、课文、音频等
- 课程播放页：逐词高亮、播放速度调节、现代美观样式

## 使用说明

1. 安装依赖
   ```sh
   pnpm install
   ```
2. 启动开发环境
   ```sh
   pnpm dev
   ```
3. 访问课程页面，体验逐词高亮和音频播放

## 配置与环境变量

- 在项目根目录下创建 `.env` 或 `.local.env` 文件，根据实际需求添加相关环境变量。
- 推荐将本地开发和敏感信息配置在 `.local.env`，该文件不会被提交到版本库。
- 配置示例：
  ```env
  SPEECHIFY_API_KEY=你的_speechify_api_key
  MONGODB_URI=你的_mongodb_uri
  DEEPSEEK_API_KEY=你的_deepseek_api_key
  AUDIO_DIR=本地音频文件夹路径
  ```
- 修改后需重启开发环境以生效。

---

如需自定义或反馈问题，请联系开发者。

---
