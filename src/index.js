#!/usr/bin/env node

import axios from "axios";
import { createInterface } from "node:readline";
import { stdin as input, stdout as output } from "node:process";

/**
 * 日志工具类
 * @class Logger
 */
class Logger {
  /**
   * 输出信息日志
   * @param {string} message - 日志消息
   * @param {Object} [data] - 附加数据
   */
  static info(message, data) {
    if(!process.env.DEBUG){
        return;
    }
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [INFO] ${message}`);
    if (data) {
      console.error(
        `[${timestamp}] [INFO] 数据:`,
        JSON.stringify(data, null, 2)
      );
    }
  }

  /**
   * 输出错误日志
   * @param {string} message - 错误消息
   * @param {Error|Object} [error] - 错误对象或数据
   */
  static error(message, error) {
    if(!process.env.DEBUG){
        return;
    }
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`);
    if (error) {
      if (error instanceof Error) {
        console.error(`[${timestamp}] [ERROR] 错误详情:`, error.message);
        console.error(`[${timestamp}] [ERROR] 堆栈:`, error.stack);
      } else {
        console.error(
          `[${timestamp}] [ERROR] 错误详情:`,
          JSON.stringify(error, null, 2)
        );
      }
    }
  }

  /**
   * 输出调试日志
   * @param {string} message - 调试消息
   * @param {Object} [data] - 附加数据
   */
  static debug(message, data) {
    if(!process.env.DEBUG){
        return;
    }
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [DEBUG] ${message}`);
    if (data) {
      console.error(
        `[${timestamp}] [DEBUG] 数据:`,
        JSON.stringify(data, null, 2)
      );
    }
  }
}

/**
 * MCP 远程代理类
 * @class McpRemoteProxy
 * @description 用于将 Cursor IDE 的 MCP 请求代理到自定义服务器
 */
class McpRemoteProxy {
  /**
   * 创建 MCP 远程代理实例
   * @param {string} serverUrl - 远程服务器 URL，必须以 http:// 或 https:// 开头
   * @throws {Error} 如果 serverUrl 格式不正确
   */
  constructor(serverUrl) {
    if (!serverUrl.startsWith("http://") && !serverUrl.startsWith("https://")) {
      throw new Error("服务器 URL 必须以 http:// 或 https:// 开头");
    }
    /** @type {string} 远程服务器 URL */
    this.serverUrl = serverUrl;
    /** @type {number} 请求 ID 计数器 */
    this.requestId = 1;
    Logger.info("MCP代理实例已创建", { serverUrl });
  }

  /**
   * 调用远程服务器
   * @param {string} method - 要调用的方法名
   * @param {Object} [params={}] - 方法参数
   * @param {number|null} [id=null] - 请求 ID
   * @returns {Promise<Object>} 远程服务器响应
   * @throws {Error} 如果请求失败
   */
  async callRemoteServer(method, params = {}, id = null) {
    const requestId = id !== null ? id : this.requestId++;

    try {
      // 构建请求URL和请求体
      const requestUrl = `${this.serverUrl}/mcp`;
      const requestBody = {
        jsonrpc: "2.0",
        id: requestId,
        method,
        params,
      };

      // 打印完整的请求信息
      Logger.debug("发送POST请求到远程服务器", {
        url: requestUrl,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json,text/event-stream",
          Connection: "keep-alive",
        },
        body: JSON.stringify(requestBody), // 打印字符串形式的请求体
      });

      const response = await axios.post(requestUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json,text/event-stream",
          Connection: "keep-alive",
        },
        timeout: 10000,
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        },
      });

      // 检查是否是方法未找到错误
      if (response.data.error && response.data.error.code === -32601) {
        Logger.error("方法未找到", {
          requestedMethod: method,
          requestBody: requestBody,
          response: response.data,
        });
      }
      return response.data;
    } catch (error) {
      Logger.error("远程服务器调用失败", {
        error: error.message,
        method,
        params,
        requestId,
        requestBody: {
          jsonrpc: "2.0",
          id: requestId,
          method,
          params,
        },
      });
      return {
        jsonrpc: "2.0",
        id: requestId,
        error: {
          code: -32603,
          message: `远程服务器错误: ${error.message}`,
        },
      };
    }
  }
  /**
   * 处理 MCP 请求
   * @param {Object} request - MCP 请求对象
   * @param {string} request.method - 请求方法
   * @param {Object} request.params - 请求参数
   * @param {number} request.id - 请求 ID
   * @returns {Promise<Object>} 处理响应
   */
  async handleRequest(request) {
    const { method, params, id } = request;
    Logger.info("收到MCP请求", { method, id });

    // 处理特殊的初始化请求
    if (method === "initialize") {
      Logger.debug("处理初始化请求");
      try {
        // 从服务器获取实际支持的能力列表
        const serverResponse = await this.callRemoteServer(
          "initialize",
          params,
          id
        );
        if (serverResponse.error) {
          Logger.error("获取服务器能力列表失败", serverResponse.error);
          return {
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2025-03-26",
              capabilities: {
                tools: {},
                resources: {},
                prompts: {},
              },
              serverInfo: {
                name: "inksnow-mcp-server",
                version: "1.0.0",
              },
            },
          };
        }
        return serverResponse;
      } catch (error) {
        Logger.error("初始化请求处理失败", error);
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32603,
            message: `初始化失败: ${error.message}`,
          },
        };
      }
    }

    // 处理初始化完成通知
    if (method === "notifications/initialized") {
      Logger.debug("收到初始化完成通知", { params });
      return;
    }

    // 处理取消通知
    if (method === "notifications/cancelled") {
      Logger.debug("收到取消通知", { params });
      return {
        jsonrpc: "2.0",
        id,
        result: null,
      };
    }
    // 调用自定义工具，则对数据进行结构化处理
    if (method === "tools/call") {
      const serverResponse = await this.callRemoteServer(method, params, id);
    //   if (serverResponse.result) {
    //     return {
    //       jsonrpc: "2.0",
    //       id,
    //       result: {
    //         content: [
    //           {
    //             type: "text",
    //             text:"示例博客内容",
    //           },
    //         ],
    //         isError: false,
    //       },
    //     };
    //   }
      return serverResponse
    }
    // if(method === "tools/list"){
    //     const serverResponse = await this.callRemoteServer(method, params, id);
    //     serverResponse.result.tools.map(tool => {
    //       tool.outputSchema = {
    //         type: "object",
    //       }
    //     });
    //     return serverResponse;
    // }
    // 转发其他请求到远程服务器
    // Logger.debug('转发请求到远程服务器', { method, id });
    return await this.callRemoteServer(method, params, id);
  }

  /**
   * 启动代理服务
   * 使用readline接口处理标准输入输出
   */
  start() {
    Logger.info("启动MCP代理服务");
    const rl = createInterface({ input, output });

    rl.on("line", async (line) => {
      if (!line.trim()) return;

      try {
        Logger.debug("收到输入行", { line });
        const request = JSON.parse(line);
        const response = await this.handleRequest(request);
        Logger.debug("MCP发送响应", response);
        if (response) {
          output.write(JSON.stringify(response) + "\n");
        }
      } catch (error) {
        Logger.error("处理请求失败", error);
        const errorResponse = {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32700,
            message: `解析错误: ${error.message}`,
          },
        };
        output.write(JSON.stringify(errorResponse) + "\n");
      }
    });

    // 处理进程退出
    const cleanup = () => {
      Logger.info("正在关闭MCP代理服务");
      rl.close();
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    rl.on("close", cleanup);
  }
}

/**
 * 启动代理服务
 * @returns {Promise<void>}
 */
async function startProxy() {
  const serverUrl =
    process.argv[2] || process.env.MCP_SERVER_URL || "http://localhost:3000";

  if (!serverUrl) {
    Logger.error("未指定服务器URL");
    console.info("使用方法: npx inksnow-mcp-server [serverUrl]");
    console.info("或设置环境变量 MCP_SERVER_URL");
    process.exit(1);
  }

  try {
    const proxy = new McpRemoteProxy(serverUrl);
    Logger.info(`MCP代理服务启动成功`, { serverUrl });
    proxy.start();
  } catch (error) {
    Logger.error("启动代理失败", error);
    process.exit(1);
  }
}

// 启动代理
startProxy();
