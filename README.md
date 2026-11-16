# DeepSeek 网页聊天客户端

一个**单文件、纯前端**的聊天客户端：像 DeepSeek 手机端 / 桌面客户端那样对话，**不内置任何账号或 API**，地址和 Key 由你自己填。

> 在线使用：<https://649767694967.github.io/deepseek-chat-client/>
> 离线使用：下载本仓库的 [`index.html`](index.html)，双击打开（Chrome / Edge / Safari 均可）。

配套的另一个项目：**DeepSeek 聊天记录转换器**（导出数据 → Chatbox / DeepSeek Harness 备份）<https://649767694967.github.io/deepseek-chat-importer/>

---

## 第一次进来

会先弹出三步引导（必须勾选才能进），就三件事：

1. 去 [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) 创建 Key（只显示一次，当场复制）
2. 去 [platform.deepseek.com/top_up](https://platform.deepseek.com/top_up) 充值（按量计费，几块钱能用很久；余额 0 会返回 402）
3. 点右上角 ⚙ 粘贴 Key →「测试连接」→ 出现绿色提示就成功

**这次看完之后不再自动弹**，之后想再看就进 设置 →「? 教程」。

## 界面

顶栏只有 `☰ 会话列表 · 标题 · 连接状态 · ⚙ 设置`。头像、背景、主题、提示词、导入导出这些都收在设置面板和左侧抽屉里，不挡路。

## 功能

- **自填 API**：`baseURL`（默认 `https://api.deepseek.com`，自动补 `/chat/completions`）、`API Key`、模型名（`deepseek-chat` / `deepseek-reasoner` / 自定义）。第三方中转、本地 Ollama、LM Studio 都能填
- **流式对话**：边生成边显示；`reasoning_content` 收进「思考过程」折叠块；随时可「停止」
- **提示词预设（含破甲）**：默认助手 / 极简 / 代码 / 写作 / **破甲·通用** / **破甲·成人向** / **破甲·角色扮演**，改完可直接应用到当前会话
- **回退**：编辑任意一条用户消息（截断其后内容并重新回答）、重新生成、删除单条、清空会话
- **压缩**：一键把较早历史压成一条 system 摘要（保留最近 6 条），提示压缩前后 token 估算
- **背景**：极光 / 网格 / 纸张 / 纯色 四种预设 + 本地图片（自动压到 1600px）+ 图片 URL，另有「暗化 / 模糊」两个滑块
- **头像与名字**：自己和对方各一套，可上传图片或填 emoji
- **导入**：DeepSeek 官方导出 zip、扩展导出的 `.md`、Chatbox `.cbx`、本客户端导出的 json
- **导出**：当前会话导出 Markdown + JSON
- **主题**：深色 / 浅色 / 跟随系统
- **三档设备**：手机（抽屉滑出、输入贴底、软键盘不遮挡）、平板（常驻侧栏）、桌面（主区居中）
- **隐私**：Key 与会话只存在本机 localStorage（明文），不经过任何服务器；设置里有「清除本机数据」

## 与转换器配合

- 客户端导出的 `.md` 首行是 `# AI 对话记录`，可以原样拖进[转换器](https://649767694967.github.io/deepseek-chat-importer/)，再变成 Chatbox / DeepSeek Harness 备份
- 导出的 json 带 `format: "ds-chat-client"`，拖回本客户端可整包恢复

## 连不上接口？

DeepSeek 官方 API 已开启 CORS（预检会回显 `Access-Control-Allow-Origin`），浏览器可以直连。如果换成不支持 CORS 的第三方地址，页面会给出明确提示，教程里也给了反向代理示例。

## 开发

```bash
node src/build-client.mjs     # 把 src/ 下的模块内联成单文件 index.html
node src/prompts.test.mjs     # 提示词与教程的自测（147 项）
```

源码结构：`src/template.html`（骨架 + 样式）、`src/app.mjs`（交互）、`src/core.mjs`（SSE / 压缩 / 导入导出）、`src/prompts.mjs`（破甲预设 + 教程文案）、`src/zipkit.js` 与 `src/core-lib.mjs`（复用转换器的 zip 与导出数据解析）。

## License

[MIT](LICENSE)
