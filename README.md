# Inksnow MCP Proxy

这是一个用于 Cursor IDE 的 MCP (Model Control Protocol) 代理服务器，可以将 Cursor 的 MCP 请求代理到您自己的服务器。

## 特性
- 支持将 Cursor IDE 的所有 MCP 请求代理到自定义 HTTP 服务器
- 支持日志调试（设置环境变量 DEBUG=1 可输出详细日志）
- 自动处理初始化、通知、工具调用等 MCP 协议请求
- 详细的错误处理与日志输出，便于排查问题

## 安装

```bash
npm install -g inksnow-mcp-proxy
```

## 使用方法

### 命令行方式

```bash
npx inksnow-mcp-proxy <server-url>
```

例如：
```bash
npx inksnow-mcp-proxy http://localhost:3000
```

### 环境变量方式

```bash
MCP_SERVER_URL=http://localhost:3000 npx inksnow-mcp-proxy
```

### 日志调试

如需查看详细日志，请设置环境变量：
```bash
export DEBUG=1  # Linux/Mac
```

## 启动参数说明
- `<server-url>`：目标 MCP 服务端地址，必须以 http:// 或 https:// 开头。
- 也可通过环境变量 MCP_SERVER_URL 指定。

## Cursor 配置

在 Cursor IDE 中，您可以通过以下步骤配置 MCP 服务器：

1. 打开 Cursor IDE
2. 点击左下角的设置图标（⚙️）
3. 在设置中找到 "AI" 或 "MCP" 设置部分
4. 在 MCP 配置中添加以下配置：

```json
{
  "mcp": {
    "command": "npx inksnow-mcp-proxy",
    "args": ["http://your-server.com"],
    "env": {
      "MCP_SERVER_URL": "http://your-server.com",
      "DEBUG": "1"
    }
  }
}
```

### 配置说明
- `command`: 启动命令，使用 `npx inksnow-mcp-proxy`
- `args`: 命令行参数，指定目标服务器 URL
- `env`: 环境变量配置，可以在这里设置 `MCP_SERVER_URL`

### 完整配置示例

```json
 "mcpServers": {
      "HLMcp": {
        "command": "npx",
        "args": ["inksnow-mcp-proxy"],
        "env": {}
      }
 }
```

## 协议说明

本代理服务器支持 MCP 协议，主要功能包括：

1. **请求转发**：将 Cursor 的 MCP 请求（如 initialize、tools/call 等）转发到指定的 HTTP 服务器。
2. **响应处理**：处理并返回服务器的响应，支持结构化内容。
3. **错误处理**：详细日志与错误输出，便于排查。
4. **通知与取消**：自动处理 notifications/initialized、notifications/cancelled 等通知类请求。

### 支持的请求类型
- `initialize`: 初始化连接
- `tools/call`: 工具调用请求
- 其他所有 MCP 协议支持的请求类型

## 故障排除

如果遇到问题，请检查：

1. 目标服务器是否正常运行
2. URL 是否正确（包含 `http://` 或 `https://`）
3. 网络连接是否正常
4. 防火墙设置是否允许连接
5. 如需调试详细日志，设置环境变量 `DEBUG=1`


## 许可证

ISC
