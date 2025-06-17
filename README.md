# Inksnow MCP Server

这是一个用于 Cursor IDE 的 MCP (Model Control Protocol) 代理服务器，可以将 Cursor 的 MCP 请求代理到您自己的服务器。

## 安装

```bash
npm install -g inksnow-mcp-server
```

## 使用方法

### 命令行方式

```bash
npx inksnow-mcp-server <server-url>
```

例如：
```bash
npx inksnow-mcp-server http://localhost:3000
```

### 环境变量方式

```bash
MCP_SERVER_URL=http://localhost:3000 npx inksnow-mcp-server
```

## Cursor 配置

在 Cursor IDE 中，您可以通过以下步骤配置 MCP 服务器：

1. 打开 Cursor IDE
2. 点击左下角的设置图标（⚙️）
3. 在设置中找到 "AI" 或 "MCP" 设置部分
4. 在 MCP 配置中添加以下配置：

```json
{
  "mcp": {
    "command": "npx inksnow-mcp-server",
    "args": ["http://your-server.com:3000"],
    "env": {
      "MCP_SERVER_URL": "http://your-server.com:3000"
    }
  }
}
```

### 配置说明

- `command`: 启动命令，使用 `npx inksnow-mcp-server`
- `args`: 命令行参数，指定目标服务器 URL
- `env`: 环境变量配置，可以在这里设置 `MCP_SERVER_URL`

### 完整配置示例

以下是一个完整的 Cursor 配置示例：

```json
{
  "editor": {
    "fontSize": 14,
    "fontFamily": "JetBrains Mono"
  },
  "ai": {
    "enabled": true,
    "mcp": {
      "command": "npx inksnow-mcp-server",
      "args": ["http://localhost:3000"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:3000"
      }
    }
  }
}
```

## 协议说明

本代理服务器支持 MCP 协议版本 `2024-11-05`，主要功能包括：

1. 请求转发：将 Cursor 的 MCP 请求转发到指定的服务器
2. 响应处理：处理并返回服务器的响应
3. 错误处理：处理网络错误和服务器错误

### 支持的请求类型

- `initialize`: 初始化连接
- 其他所有 MCP 协议支持的请求类型

## 故障排除

如果遇到问题，请检查：

1. 目标服务器是否正常运行
2. URL 是否正确（包含 `http://` 或 `https://`）
3. 网络连接是否正常
4. 防火墙设置是否允许连接

## 开发

### 构建

```bash
npm run build
```

### 开发模式

```bash
npm run dev
```

## 许可证

ISC
