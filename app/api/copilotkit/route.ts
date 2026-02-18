import {
  CopilotRuntime,
  OpenAIAdapter,
  AnthropicAdapter,
  GoogleGenerativeAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

function createServiceAdapter() {
  const provider = process.env.LLM_PROVIDER ?? "openai";

  switch (provider) {
    case "anthropic":
      return new AnthropicAdapter({ model: "claude-sonnet-4-6" });
    case "google":
      return new GoogleGenerativeAIAdapter({ model: "gemini-3-flash-preview" });
    case "openai":
    default:
      return new OpenAIAdapter({});
  }
}

const serviceAdapter = createServiceAdapter();
const runtime = new CopilotRuntime();

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
