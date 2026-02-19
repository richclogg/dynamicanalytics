"use client";

import { useEffect } from "react";
import { useCopilotAction } from "@copilotkit/react-core";
import { AreaChart } from "./ui/area-chart";
import { BarChart } from "./ui/bar-chart";
import { useDashboard, DashboardWidget } from "./DashboardContext";
import { PinnableWrapper } from "./PinnableWrapper";

// ─── In-chat chart previews (rendered inside the sidebar) ───────────────────

function LineChartPreview({ title, data, series }: { title: string; data: any[]; series?: string[] }) {
  const keys = series?.length ? series : Object.keys(data[0] ?? {}).filter((k) => k !== "label");
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs font-semibold text-gray-700">{title}</p>
      <div className="h-40">
        <AreaChart data={data} index="label" categories={keys} showLegend showGrid showXAxis showYAxis />
      </div>
    </div>
  );
}

function BarChartPreview({ title, data }: { title: string; data: any[] }) {
  const categories = Object.keys(data[0] ?? {}).filter((k) => k !== "name");
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs font-semibold text-gray-700">{title}</p>
      <div className="h-40">
        <BarChart data={data} index="name" categories={categories} showGrid layout="horizontal" />
      </div>
    </div>
  );
}

function KPIPreview({ title, cards }: { title: string; cards: any[] }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs font-semibold text-gray-700">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {cards.map((c: any, i: number) => (
          <div key={i} className="rounded-md bg-gray-50 p-2">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-base font-semibold text-gray-900">{c.value}</p>
            {c.change && (
              <p className={`text-xs ${c.changeDirection === "up" ? "text-green-600" : c.changeDirection === "down" ? "text-red-500" : "text-gray-500"}`}>
                {c.change}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TablePreview({ title, columns, rows }: { title: string; columns: string[]; rows: any[] }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs font-semibold text-gray-700">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((col) => (
                <th key={col} className="py-1 pr-3 text-left font-medium text-gray-600">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 5).map((row, i) => (
              <tr key={i} className="border-b border-gray-50">
                {columns.map((col) => (
                  <td key={col} className="py-1 pr-3 text-gray-700">{row[col] ?? "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 5 && (
          <p className="mt-1 text-xs text-gray-400">+{rows.length - 5} more rows on dashboard</p>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard widget renderer ───────────────────────────────────────────────

function WidgetCard({ widget, onRemove }: { widget: DashboardWidget; onRemove: () => void }) {
  const { type, title, data } = widget;

  let content: React.ReactNode;
  if (type === "line") {
    const keys = data.series?.length ? data.series : Object.keys(data.data?.[0] ?? {}).filter((k: string) => k !== "label");
    content = (
      <div className="h-52">
        <AreaChart data={data.data} index="label" categories={keys} showLegend showGrid showXAxis showYAxis />
      </div>
    );
  } else if (type === "bar") {
    const categories = Object.keys(data.data?.[0] ?? {}).filter((k: string) => k !== "name");
    content = (
      <div className="h-52">
        <BarChart data={data.data} index="name" categories={categories} showGrid layout="horizontal" />
      </div>
    );
  } else if (type === "kpi") {
    content = (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(data.cards ?? []).map((c: any, i: number) => (
          <div key={i} className="rounded-md bg-gray-50 p-3">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-xl font-semibold text-gray-900">{c.value}</p>
            {c.change && (
              <p className={`text-xs ${c.changeDirection === "up" ? "text-green-600" : c.changeDirection === "down" ? "text-red-500" : "text-gray-500"}`}>
                {c.change}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  } else if (type === "table") {
    const { columns, rows } = data;
    content = (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {(columns ?? []).map((col: string) => (
                <th key={col} className="py-2 pr-4 text-left text-xs font-medium text-gray-600">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row: any, i: number) => (
              <tr key={i} className="border-b border-gray-50">
                {(columns ?? []).map((col: string) => (
                  <td key={col} className="py-2 pr-4 text-gray-700">{row[col] ?? "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="group relative rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
          title="Remove widget"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {content}
    </div>
  );
}

// ─── MCP tool proxy ──────────────────────────────────────────────────────────

async function callMCP(tool: string, params: Record<string, unknown> = {}): Promise<string> {
  const res = await fetch("/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, params }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "MCP call failed");
  return data.result as string;
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export function Dashboard() {
  const { widgets, addWidget, removeWidget } = useDashboard();

  // ── BigQuery tools ──────────────────────────────────────────────────────────
  useCopilotAction({
    name: "list_tables",
    description: "List all tables in the BigQuery dataset.",
    parameters: [],
    handler: async () => callMCP("list_tables"),
  });

  useCopilotAction({
    name: "describe_table",
    description: "Get the schema of a BigQuery table.",
    parameters: [{ name: "table_name", type: "string", description: "Table name (unqualified or fully-qualified).", required: true }],
    handler: async ({ table_name }) => callMCP("describe_table", { table_name }),
  });

  useCopilotAction({
    name: "run_query",
    description: "Execute a read-only SQL SELECT query against BigQuery.",
    parameters: [{ name: "sql", type: "string", description: "SQL SELECT or WITH query to execute.", required: true }],
    handler: async ({ sql }) => callMCP("run_query", { sql }),
  });

  // ── GA4 tools ───────────────────────────────────────────────────────────────
  useCopilotAction({
    name: "run_report",
    description: "Run a Google Analytics 4 historical report.",
    parameters: [
      { name: "metrics", type: "string[]", description: 'GA4 metric names, e.g. ["sessions","totalUsers"].', required: true },
      { name: "dimensions", type: "string[]", description: 'GA4 dimension names, e.g. ["date","country"].', required: false },
      { name: "start_date", type: "string", description: 'Start date: "YYYY-MM-DD", "NdaysAgo", or "yesterday".', required: false },
      { name: "end_date", type: "string", description: 'End date: "YYYY-MM-DD" or "today".', required: false },
      { name: "limit", type: "number", description: "Max rows (default 100).", required: false },
    ],
    handler: async ({ metrics, dimensions, start_date, end_date, limit }) =>
      callMCP("run_report", { metrics, dimensions, start_date, end_date, limit }),
  });

  useCopilotAction({
    name: "run_realtime_report",
    description: "Run a GA4 realtime report showing currently active users.",
    parameters: [
      { name: "metrics", type: "string[]", description: 'Realtime metric names, e.g. ["activeUsers"].', required: true },
      { name: "dimensions", type: "string[]", description: "Realtime dimension names.", required: false },
      { name: "limit", type: "number", description: "Max rows (default 50).", required: false },
    ],
    handler: async ({ metrics, dimensions, limit }) =>
      callMCP("run_realtime_report", { metrics, dimensions, limit }),
  });

  useCopilotAction({
    name: "get_property_metadata",
    description: "Get available GA4 dimensions and metrics for the property.",
    parameters: [],
    handler: async () => callMCP("get_property_metadata"),
  });

  // Paste a query string into the sidebar textarea when a chip is clicked
  useEffect(() => {
    const handler = (e: Event) => {
      const query = (e as CustomEvent<string>).detail;
      const textarea = document.querySelector<HTMLTextAreaElement>(
        ".copilotKitSidebar textarea, .copilotKitChat textarea"
      );
      if (!textarea) return;
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(textarea, query);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.focus();
    };
    window.addEventListener("paste-query", handler);
    return () => window.removeEventListener("paste-query", handler);
  }, []);

  // Render actions — show chart in chat with a Pin button
  useCopilotAction({
    name: "renderLineChart",
    description: "Display a line/area chart in chat. Use for time-series data. Each data point must have a 'label' key for the x-axis.",
    parameters: [
      { name: "title", type: "string", required: true },
      { name: "data", type: "object[]", description: "Array of objects with 'label' plus one or more numeric series keys.", required: true },
      { name: "series", type: "string[]", description: "Names of the numeric series to plot." },
    ],
    render: ({ args, status }) => {
      if (status === "complete" && args.data?.length) {
        return (
          <PinnableWrapper onPin={() => addWidget({ type: "line", title: args.title, data: args })}>
            <LineChartPreview title={args.title} data={args.data} series={args.series} />
          </PinnableWrapper>
        );
      }
      return <p className="text-xs text-gray-400">Rendering chart…</p>;
    },
    handler: async () => "Line chart rendered.",
  });

  useCopilotAction({
    name: "renderBarChart",
    description: "Display a bar chart in chat. Use for categorical comparisons. Each data point must have a 'name' key.",
    parameters: [
      { name: "title", type: "string", required: true },
      { name: "data", type: "object[]", description: "Array of objects with 'name' plus one or more numeric value keys.", required: true },
    ],
    render: ({ args, status }) => {
      if (status === "complete" && args.data?.length) {
        return (
          <PinnableWrapper onPin={() => addWidget({ type: "bar", title: args.title, data: args })}>
            <BarChartPreview title={args.title} data={args.data} />
          </PinnableWrapper>
        );
      }
      return <p className="text-xs text-gray-400">Rendering chart…</p>;
    },
    handler: async () => "Bar chart rendered.",
  });

  useCopilotAction({
    name: "renderKPICards",
    description: "Display KPI metric cards in chat. Use for summary stats.",
    parameters: [
      { name: "title", type: "string", required: true },
      {
        name: "cards",
        type: "object[]",
        description: 'Array of {label, value, change?, changeDirection?: "up"|"down"|"flat"}.',
        required: true,
      },
    ],
    render: ({ args, status }) => {
      if (status === "complete" && args.cards?.length) {
        return (
          <PinnableWrapper onPin={() => addWidget({ type: "kpi", title: args.title, data: args })}>
            <KPIPreview title={args.title} cards={args.cards} />
          </PinnableWrapper>
        );
      }
      return <p className="text-xs text-gray-400">Loading KPIs…</p>;
    },
    handler: async () => "KPI cards rendered.",
  });

  useCopilotAction({
    name: "renderDataTable",
    description: "Display a data table in chat. Use for tabular results.",
    parameters: [
      { name: "title", type: "string", required: true },
      { name: "columns", type: "string[]", required: true },
      { name: "rows", type: "object[]", required: true },
    ],
    render: ({ args, status }) => {
      if (status === "complete" && args.rows?.length) {
        return (
          <PinnableWrapper onPin={() => addWidget({ type: "table", title: args.title, data: args })}>
            <TablePreview title={args.title} columns={args.columns} rows={args.rows} />
          </PinnableWrapper>
        );
      }
      return <p className="text-xs text-gray-400">Loading table…</p>;
    },
    handler: async () => "Data table rendered.",
  });

  // Empty state
  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 rounded-full bg-blue-50 p-5">
          <svg className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-700">Your dashboard is empty</h2>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Ask the Data Assistant a question — charts and tables will appear here with a <strong>Pin</strong> button so you can add them to the dashboard.
        </p>
        <div className="mt-6 flex flex-col gap-2 text-xs text-gray-400">
          <p>Try asking:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Show total claims by type as a bar chart",
              "Revenue by month as a line chart",
              "KPIs: total customers, avg premium",
            ].map((s) => (
              <button
                key={s}
                onClick={() => window.dispatchEvent(new CustomEvent("paste-query", { detail: s }))}
                className="rounded-full bg-gray-100 px-3 py-1 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {widgets.map((widget) => (
        <div
          key={widget.id}
          className={widget.type === "table" || widget.type === "kpi" ? "col-span-1 md:col-span-2 xl:col-span-3" : ""}
        >
          <WidgetCard widget={widget} onRemove={() => removeWidget(widget.id)} />
        </div>
      ))}
    </div>
  );
}
