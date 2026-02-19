import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const BQ_MCP_URL = process.env.BQ_MCP_URL;
const GA4_MCP_URL = process.env.GA4_MCP_URL;

// Map tool names to the MCP server endpoint that owns them
const TOOL_ROUTING: Record<string, string> = {
  run_query: BQ_MCP_URL ?? "",
  list_tables: BQ_MCP_URL ?? "",
  describe_table: BQ_MCP_URL ?? "",
  run_report: GA4_MCP_URL ?? "",
  run_realtime_report: GA4_MCP_URL ?? "",
  get_property_metadata: GA4_MCP_URL ?? "",
};

const clientCache = new Map<string, Client>();

async function getClient(endpoint: string): Promise<Client> {
  if (clientCache.has(endpoint)) return clientCache.get(endpoint)!;

  const client = new Client({ name: "dynamic-analytics", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(endpoint));
  await client.connect(transport);
  clientCache.set(endpoint, client);
  console.log(`[MCP] Connected to ${endpoint}`);
  return client;
}

export async function callMCPTool(toolName: string, params: Record<string, unknown>): Promise<string> {
  const endpoint = TOOL_ROUTING[toolName];
  if (!endpoint) throw new Error(`Unknown tool: ${toolName}`);

  let client: Client;
  try {
    client = await getClient(endpoint);
  } catch (err) {
    clientCache.delete(endpoint);
    throw new Error(`MCP connection failed for ${toolName}: ${err instanceof Error ? err.message : String(err)}`);
  }

  console.log(`[MCP] → ${toolName}`, JSON.stringify(params));
  const result = await client.callTool({ name: toolName, arguments: params });
  console.log(`[MCP] ← ${toolName} (${(result.content as any[]).length} items)`);

  // Extract text content — CopilotKit needs a plain string back
  const text = (result.content as any[])
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  const full = text || JSON.stringify(result.content);

  // Cap at 3000 chars to avoid blowing the token budget
  const MAX_CHARS = 3000;
  if (full.length > MAX_CHARS) {
    console.warn(`[MCP] ${toolName} result truncated (${full.length} → ${MAX_CHARS} chars)`);
    return full.slice(0, MAX_CHARS) + "\n[truncated]";
  }
  return full;
}
