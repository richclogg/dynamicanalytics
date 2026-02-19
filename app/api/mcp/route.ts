import { NextRequest, NextResponse } from "next/server";
import { callMCPTool } from "../../../lib/mcp-client";

export async function POST(req: NextRequest) {
  try {
    const { tool, params } = await req.json();

    if (!tool || typeof tool !== "string") {
      return NextResponse.json({ error: "Missing tool name" }, { status: 400 });
    }

    const result = await callMCPTool(tool, params ?? {});
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[MCP proxy] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
