# API Watch

侧边栏 API 余量监视器（Electron 桌面版）。

## 开发运行

```bash
npm install
npm start
```

托盘图标可退出 / 刷新。首次点击侧边灯条展开，点 `+` 添加 DeepSeek API Key。

## 打包 exe

```bash
npm run dist
```

产物：`dist/API-Watch-1.0.0-portable.exe`（免安装绿色版）

## 已接入

| 提供商 | 余额 |
|--------|------|
| DeepSeek | 官方 `/user/balance` |
| Kimi | 官方 `/v1/users/me/balance` |
| OpenAI | 尝试账单接口；若关闭则校验 Key 并提示控制台 |
| Claude | 无公开余额接口，校验 Key |
| Gemini | 额度制，校验 Key |
| 通义千问 | 尝试 DashScope 费用接口，否则校验 Key |
| 豆包 | 校验 Key，余额看火山控制台 |

UI 侧边栏缩放 `0.75`（添加弹窗保持正常字号）。
