import {
  CopilotRuntime,
  AnthropicAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
  type MCPClient,
} from "@copilotkit/runtime";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { NextRequest } from "next/server";

const BQ_MCP_URL = process.env.BQ_MCP_URL;
const GA4_MCP_URL = process.env.GA4_MCP_URL;

const mcpServers = [
  BQ_MCP_URL ? { endpoint: BQ_MCP_URL } : null,
  GA4_MCP_URL ? { endpoint: GA4_MCP_URL } : null,
].filter(Boolean) as { endpoint: string }[];

async function createMCPClient(config: { endpoint: string }): Promise<MCPClient> {
  const client = new Client({ name: "dynamic-analytics", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(config.endpoint));
  await client.connect(transport);

  return {
    async tools() {
      const { tools } = await client.listTools();
      const toolsMap: Record<string, any> = {};
      for (const tool of tools) {
        toolsMap[tool.name] = {
          description: tool.description,
          schema: {
            parameters: {
              properties: (tool.inputSchema.properties ?? {}) as Record<string, any>,
              required: (tool.inputSchema.required ?? []) as string[],
              jsonSchema: tool.inputSchema,
            },
          },
          execute: async (params: any) => {
            const result = await client.callTool({ name: tool.name, arguments: params });
            return result;
          },
        };
      }
      return toolsMap;
    },
    async close() {
      await client.close();
    },
  };
}

const runtime = new CopilotRuntime({
  ...(mcpServers.length > 0 && { mcpServers, createMCPClient }),
});

const serviceAdapter = new AnthropicAdapter({ model: "claude-sonnet-4-6" });

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
