# DynamicAnalytics

AI-powered analytics dashboard. Ask questions in natural language — the assistant queries BigQuery or Google Analytics 4 and renders results as interactive charts pinnable to a dashboard.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, React, Tailwind CSS |
| AI chat | CopilotKit 1.8 + Claude Sonnet 4.6 (Anthropic) |
| BQ data | BigQuery MCP server (Python/FastMCP, port 8001) |
| GA4 data | GA4 MCP server (Python/FastMCP, port 8002) |

## Running locally

```bash
./dev.sh
```

Starts all three services together (Ctrl+C kills all):
- BigQuery MCP server → http://localhost:8001
- GA4 MCP server → http://localhost:8002
- Next.js dev server → http://localhost:3000

### First-time setup

Install MCP server dependencies (one-time):

```bash
python3 -m venv ../mcp-servers/bigquery/.venv
../mcp-servers/bigquery/.venv/bin/pip install -e ../mcp-servers/bigquery

python3 -m venv ../mcp-servers/ga4/.venv
../mcp-servers/ga4/.venv/bin/pip install -e ../mcp-servers/ga4
```

### Environment variables

Copy `.env.local.example` → `.env.local` and fill in:

```
ANTHROPIC_API_KEY=...
GCP_PROJECT=adg-internal-tech-sandbox
BQ_DATASET=data_demos
BQ_MCP_URL=http://localhost:8001/mcp
GA4_MCP_URL=http://localhost:8002/mcp
```

Google Cloud credentials use Application Default Credentials (`gcloud auth application-default login`).

## Architecture

```
Browser
  └── CopilotKit sidebar (React)
        └── POST /api/copilotkit  (CopilotRuntime + AnthropicAdapter)
              └── Claude Sonnet 4.6
                    └── useCopilotAction tools (client-side, results sent to LLM):
                          ├── run_query / list_tables / describe_table
                          │     └── POST /api/mcp → BigQuery MCP server (port 8001)
                          ├── run_report / run_realtime_report / get_property_metadata
                          │     └── POST /api/mcp → GA4 MCP server (port 8002)
                          └── renderLineChart / renderBarChart / renderKPICards / renderDataTable
                                └── Renders in chat sidebar + Pin to dashboard
```

> **Note:** CopilotKit 1.8 executes tools client-side via `useCopilotAction`. Server-side `action.handler` is not invoked in regular chat mode — tools are registered in `Dashboard.tsx` and call `/api/mcp` to reach the MCP servers.

## Data sources

### BigQuery — `adg-internal-tech-sandbox.data_demos`

| Table | Rows | Key fields |
|-------|------|------------|
| `insurance_claims` | 2,000 | `Claim ID`, `Claim Date` (DATE), `Claim Amount` (FLOAT), `Claim Type`, `Customer ID`, `Policy ID` |
| `insurance_policies` | 1,500 | `Policy ID`, `Policy Type`, `Policy Start Date` (DATE), `Premium Amount` (FLOAT) |
| `insurance_customers` | 1,000 | `Customer ID`, `Age`, `Gender`, `Location`, `Customer History` |
| `customers` | 10,000 | `customer_id`, `age`, `gender`, `plan_type`, `income_level` |
| `` `E-commerce dataset` `` | 5,000 | `Customer_key`, `Item_name`, `Item Type`, `Quantity`, `Unit_price`, `Total_price`, `Date` (DATE), `Year`, `Month`, `Quarter`, `Trans_type`, `Store division`, `Supplier` |

**Joins:** `insurance_claims` → `insurance_policies` on `Policy ID` · `insurance_claims` → `insurance_customers` on `Customer ID`

### Google Analytics 4 — property `465604843`

| Tool | Use for |
|------|---------|
| `run_report` | Historical traffic, sessions, users, conversions |
| `run_realtime_report` | Currently active users |
| `get_property_metadata` | Discover available dimensions/metrics |

Common metrics: `sessions`, `totalUsers`, `newUsers`, `screenPageViews`, `bounceRate`, `averageSessionDuration`

Common dimensions: `date`, `sessionSource`, `sessionMedium`, `country`, `deviceCategory`, `pagePath`

## Adding context for new data sources

Edit `lib/prompt.ts` to add table schemas and business rules. For dynamic context (user selections, filters), use `useCopilotReadable` in any React component:

```typescript
import { useCopilotReadable } from "@copilotkit/react-core";

useCopilotReadable({
  description: "Currently selected client",
  value: { client: "Acme Corp", dateRange: "last 30 days" },
});
```
