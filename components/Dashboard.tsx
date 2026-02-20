"use client";

import { useEffect } from "react";
import { useCopilotAction } from "@copilotkit/react-core";
import { AreaChart } from "./ui/area-chart";
import { BarChart } from "./ui/bar-chart";
import { DonutChart } from "./ui/pie-chart";
import { useDashboard, DashboardWidget } from "./DashboardContext";
import { PinnableWrapper } from "./PinnableWrapper";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const SEVERITY_STYLES = {
  info:    { bg: "bg-blue-50",   border: "border-blue-200",   icon: "ℹ️",  text: "text-blue-800"  },
  success: { bg: "bg-green-50",  border: "border-green-200",  icon: "✅", text: "text-green-800" },
  warning: { bg: "bg-amber-50",  border: "border-amber-200",  icon: "⚠️", text: "text-amber-800" },
  error:   { bg: "bg-red-50",    border: "border-red-200",    icon: "🚨", text: "text-red-800"   },
} as const;

type Severity = keyof typeof SEVERITY_STYLES;

function changeColor(dir?: string) {
  if (dir === "up")   return "text-green-600";
  if (dir === "down") return "text-red-500";
  return "text-gray-500";
}

// ─── Gauge SVG (semi-circle) ──────────────────────────────────────────────────

function GaugeSVG({ pct }: { pct: number }) {
  const r = 40, cx = 50, cy = 50, sw = 10;
  const clamped = Math.min(1, Math.max(0, pct));
  const va = (1 - clamped) * Math.PI;
  const ex = cx + r * Math.cos(va);
  const ey = cy - r * Math.sin(va);
  const color = clamped > 0.7 ? "#10b981" : clamped > 0.4 ? "#f59e0b" : "#ef4444";
  const track = `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`;
  const arc = clamped >= 1
    ? track
    : clamped > 0
    ? `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${ex} ${ey}`
    : null;

  return (
    <svg viewBox="0 0 100 55" className="w-full max-w-[140px] mx-auto">
      <path d={track} fill="none" stroke="#e5e7eb" strokeWidth={sw} strokeLinecap="round" />
      {arc && <path d={arc} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />}
    </svg>
  );
}

// ─── In-chat previews ─────────────────────────────────────────────────────────

function PreviewShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs font-semibold text-gray-700">{title}</p>
      {children}
    </div>
  );
}

function LineChartPreview({ title, data, series }: { title: string; data: any[]; series?: string[] }) {
  const keys = series?.length ? series : Object.keys(data[0] ?? {}).filter((k) => k !== "label");
  return (
    <PreviewShell title={title}>
      <div className="h-40">
        <AreaChart data={data} index="label" categories={keys} showLegend showGrid showXAxis showYAxis />
      </div>
    </PreviewShell>
  );
}

function BarChartPreview({ title, data }: { title: string; data: any[] }) {
  const categories = Object.keys(data[0] ?? {}).filter((k) => k !== "name");
  return (
    <PreviewShell title={title}>
      <div className="h-40">
        <BarChart data={data} index="name" categories={categories} showGrid layout="horizontal" />
      </div>
    </PreviewShell>
  );
}

function KPIPreview({ title, cards }: { title: string; cards: any[] }) {
  return (
    <PreviewShell title={title}>
      <div className="grid grid-cols-2 gap-2">
        {cards.map((c: any, i: number) => (
          <div key={i} className="rounded-md bg-gray-50 p-2">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-base font-semibold text-gray-900">{c.value}</p>
            {c.change && <p className={`text-xs ${changeColor(c.changeDirection)}`}>{c.change}</p>}
          </div>
        ))}
      </div>
    </PreviewShell>
  );
}

function TablePreview({ title, columns, rows }: { title: string; columns: string[]; rows: any[] }) {
  return (
    <PreviewShell title={title}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((col) => <th key={col} className="py-1 pr-3 text-left font-medium text-gray-600">{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 5).map((row, i) => (
              <tr key={i} className="border-b border-gray-50">
                {columns.map((col) => <td key={col} className="py-1 pr-3 text-gray-700">{row[col] ?? "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 5 && <p className="mt-1 text-xs text-gray-400">+{rows.length - 5} more rows on dashboard</p>}
      </div>
    </PreviewShell>
  );
}

function PiePreview({ title, data }: { title: string; data: any[] }) {
  return (
    <PreviewShell title={title}>
      <div className="h-44">
        <DonutChart data={data} index="name" category="value" />
      </div>
    </PreviewShell>
  );
}

function InsightPreview({ title, message, severity = "info", details }: { title: string; message: string; severity?: Severity; details?: string }) {
  const s = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.info;
  return (
    <div className={`rounded-lg border p-3 ${s.bg} ${s.border}`}>
      <div className="flex items-start gap-2">
        <span className="text-base">{s.icon}</span>
        <div>
          <p className={`text-xs font-semibold ${s.text}`}>{title}</p>
          <p className={`mt-0.5 text-xs ${s.text}`}>{message}</p>
          {details && <p className="mt-1 text-xs text-gray-600">{details}</p>}
        </div>
      </div>
    </div>
  );
}

function GaugePreview({ title, value, max, label, unit = "" }: { title: string; value: number; max: number; label: string; unit?: string }) {
  const pct = value / max;
  const color = pct > 0.7 ? "text-green-600" : pct > 0.4 ? "text-amber-500" : "text-red-500";
  return (
    <PreviewShell title={title}>
      <GaugeSVG pct={pct} />
      <div className="text-center -mt-1">
        <p className={`text-xl font-bold ${color}`}>{value}{unit}</p>
        <p className="text-xs text-gray-500">{label} · max {max}{unit}</p>
      </div>
    </PreviewShell>
  );
}

function ComparisonPreview({ title, metrics }: { title: string; metrics: any[] }) {
  return (
    <PreviewShell title={title}>
      <div className="space-y-2">
        {metrics.map((m: any, i: number) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-gray-600 w-1/3 truncate">{m.label}</span>
            <span className="font-semibold text-gray-900">{m.current}</span>
            <span className="text-gray-400">vs {m.previous}</span>
            <span className={`font-medium ${changeColor(m.changeDirection)}`}>{m.change}</span>
          </div>
        ))}
      </div>
    </PreviewShell>
  );
}

function MapPreview({ title, data, metric }: { title: string; data: any[]; metric: string }) {
  const max = Math.max(...data.map((d: any) => d.value), 1);
  return (
    <PreviewShell title={`${title} — ${metric}`}>
      <div className="space-y-1.5">
        {data.slice(0, 6).map((d: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-24 truncate text-gray-600 shrink-0">🌍 {d.region}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(d.value / max) * 100}%` }} />
            </div>
            <span className="text-gray-700 font-medium w-12 text-right">{d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </PreviewShell>
  );
}

// ─── Dashboard widget renderer ────────────────────────────────────────────────

function WidgetCard({ widget, onRemove }: { widget: DashboardWidget; onRemove: () => void }) {
  const { type, title, data } = widget;
  let content: React.ReactNode;

  if (type === "line") {
    const keys = data.series?.length ? data.series : Object.keys(data.data?.[0] ?? {}).filter((k: string) => k !== "label");
    content = <div className="h-52"><AreaChart data={data.data} index="label" categories={keys} showLegend showGrid showXAxis showYAxis /></div>;
  } else if (type === "bar") {
    const categories = Object.keys(data.data?.[0] ?? {}).filter((k: string) => k !== "name");
    content = <div className="h-52"><BarChart data={data.data} index="name" categories={categories} showGrid layout="horizontal" /></div>;
  } else if (type === "kpi") {
    content = (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(data.cards ?? []).map((c: any, i: number) => (
          <div key={i} className="rounded-md bg-gray-50 p-3">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-xl font-semibold text-gray-900">{c.value}</p>
            {c.change && <p className={`text-xs ${changeColor(c.changeDirection)}`}>{c.change}</p>}
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
              {(columns ?? []).map((col: string) => <th key={col} className="py-2 pr-4 text-left text-xs font-medium text-gray-600">{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row: any, i: number) => (
              <tr key={i} className="border-b border-gray-50">
                {(columns ?? []).map((col: string) => <td key={col} className="py-2 pr-4 text-gray-700">{row[col] ?? "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } else if (type === "pie") {
    content = <div className="h-56"><DonutChart data={data.data} index="name" category="value" /></div>;
  } else if (type === "insight") {
    const s = SEVERITY_STYLES[data.severity as Severity] ?? SEVERITY_STYLES.info;
    content = (
      <div className={`rounded-lg p-4 ${s.bg} border ${s.border}`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{s.icon}</span>
          <div>
            <p className={`font-medium ${s.text}`}>{data.message}</p>
            {data.details && <p className="mt-1 text-sm text-gray-600">{data.details}</p>}
          </div>
        </div>
      </div>
    );
  } else if (type === "gauge") {
    const pct = data.value / data.max;
    const color = pct > 0.7 ? "text-green-600" : pct > 0.4 ? "text-amber-500" : "text-red-500";
    content = (
      <div className="flex flex-col items-center py-2">
        <div className="w-48"><GaugeSVG pct={pct} /></div>
        <p className={`text-3xl font-bold -mt-2 ${color}`}>{data.value}{data.unit ?? ""}</p>
        <p className="text-sm text-gray-500 mt-1">{data.label} · max {data.max}{data.unit ?? ""}</p>
      </div>
    );
  } else if (type === "comparison") {
    content = (
      <div className="divide-y divide-gray-100">
        {(data.metrics ?? []).map((m: any, i: number) => (
          <div key={i} className="flex items-center justify-between py-2 text-sm">
            <span className="text-gray-600 w-1/3">{m.label}</span>
            <span className="font-semibold text-gray-900">{m.current}</span>
            <span className="text-gray-400 text-xs">vs {m.previous}</span>
            <span className={`font-medium ${changeColor(m.changeDirection)}`}>{m.change}</span>
          </div>
        ))}
      </div>
    );
  } else if (type === "map") {
    const max = Math.max(...(data.data ?? []).map((d: any) => d.value), 1);
    content = (
      <div className="space-y-2">
        {(data.data ?? []).map((d: any, i: number) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className="w-32 truncate text-gray-600 shrink-0">🌍 {d.region}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2.5">
              <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(d.value / max) * 100}%` }} />
            </div>
            <span className="text-gray-700 font-medium w-20 text-right">{d.value.toLocaleString()}</span>
          </div>
        ))}
        <p className="text-xs text-gray-400 pt-1">{data.metric}</p>
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

// ─── MCP tool proxy ───────────────────────────────────────────────────────────

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

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function Dashboard() {
  const { widgets, addWidget, removeWidget } = useDashboard();

  // ── BigQuery tools ────────────────────────────────────────────────────────
  useCopilotAction({
    name: "run_query",
    description: "Execute a read-only SQL SELECT query against BigQuery.",
    parameters: [{ name: "sql", type: "string", description: "SQL SELECT or WITH query to execute.", required: true }],
    handler: async ({ sql }) => callMCP("run_query", { sql }),
  });

  // ── GA4 tools ─────────────────────────────────────────────────────────────
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

  // ── Paste query chip handler ───────────────────────────────────────────────
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

  // ── Render tools ──────────────────────────────────────────────────────────

  useCopilotAction({
    name: "renderLineChart",
    description: "Time-series data. Each point needs 'label' (x-axis) + numeric series keys.",
    parameters: [
      { name: "title", type: "string", required: true },
      { name: "data", type: "object[]", description: "[{label:'Jan',revenue:5000}]", required: true },
      { name: "series", type: "string[]", description: "Series key names to plot." },
    ],
    render: ({ args, status }) => status === "complete" && args.data?.length
      ? <PinnableWrapper onPin={() => addWidget({ type: "line", title: args.title, data: args })}><LineChartPreview title={args.title} data={args.data} series={args.series} /></PinnableWrapper>
      : <p className="text-xs text-gray-400">Rendering…</p>,
    handler: async () => "Line chart rendered.",
  });

  useCopilotAction({
    name: "renderBarChart",
    description: "Categorical comparisons. Each point needs 'name' + numeric value keys.",
    parameters: [
      { name: "title", type: "string", required: true },
      { name: "data", type: "object[]", description: "[{name:'Electronics',sales:12000}]", required: true },
    ],
    render: ({ args, status }) => status === "complete" && args.data?.length
      ? <PinnableWrapper onPin={() => addWidget({ type: "bar", title: args.title, data: args })}><BarChartPreview title={args.title} data={args.data} /></PinnableWrapper>
      : <p className="text-xs text-gray-400">Rendering…</p>,
    handler: async () => "Bar chart rendered.",
  });

  useCopilotAction({
    name: "renderKPICards",
    description: "Summary metric cards. Use for headline numbers.",
    parameters: [
      { name: "title", type: "string", required: true },
      { name: "cards", type: "object[]", description: '[{label,value,change?,changeDirection:"up"|"down"|"flat"}]', required: true },
    ],
    render: ({ args, status }) => status === "complete" && args.cards?.length
      ? <PinnableWrapper onPin={() => addWidget({ type: "kpi", title: args.title, data: args })}><KPIPreview title={args.title} cards={args.cards} /></PinnableWrapper>
      : <p className="text-xs text-gray-400">Loading KPIs…</p>,
    handler: async () => "KPI cards rendered.",
  });

  useCopilotAction({
    name: "renderDataTable",
    description: "Tabular results with rows and columns.",
    parameters: [
      { name: "title", type: "string", required: true },
      { name: "columns", type: "string[]", required: true },
      { name: "rows", type: "object[]", required: true },
    ],
    render: ({ args, status }) => status === "complete" && args.rows?.length
      ? <PinnableWrapper onPin={() => addWidget({ type: "table", title: args.title, data: args })}><TablePreview title={args.title} columns={args.columns} rows={args.rows} /></PinnableWrapper>
      : <p className="text-xs text-gray-400">Loading table…</p>,
    handler: async () => "Data table rendered.",
  });

  useCopilotAction({
    name: "renderDonutChart",
    description: "Part-to-whole breakdown. Each slice needs 'name' (STRING) and 'value' (NUMBER).",
    parameters: [
      { name: "title", type: "string", required: true },
      { name: "data", type: "object[]", description: "[{name:'Motor',value:45}]", required: true },
    ],
    render: ({ args, status }) => status === "complete" && args.data?.length
      ? <PinnableWrapper onPin={() => addWidget({ type: "pie", title: args.title, data: args })}><PiePreview title={args.title} data={args.data} /></PinnableWrapper>
      : <p className="text-xs text-gray-400">Rendering…</p>,
    handler: async () => "Donut chart rendered.",
  });

  useCopilotAction({
    name: "renderInsight",
    description: "Highlight a key finding, anomaly, or recommendation as an alert card.",
    parameters: [
      { name: "title", type: "string", required: true },
      { name: "message", type: "string", description: "The main insight or finding.", required: true },
      { name: "severity", type: "string", description: '"info" | "success" | "warning" | "error"', required: true },
      { name: "details", type: "string", description: "Optional supporting detail.", required: false },
    ],
    render: ({ args, status }) => status === "complete"
      ? <PinnableWrapper onPin={() => addWidget({ type: "insight", title: args.title, data: args })}><InsightPreview title={args.title} message={args.message} severity={args.severity as Severity} details={args.details} /></PinnableWrapper>
      : <p className="text-xs text-gray-400">Analysing…</p>,
    handler: async () => "Insight rendered.",
  });

  useCopilotAction({
    name: "renderGauge",
    description: "Show a single metric as a gauge vs its maximum. Good for rates, scores, or targets.",
    parameters: [
      { name: "title", type: "string", required: true },
      { name: "value", type: "number", description: "Current value.", required: true },
      { name: "max", type: "number", description: "Maximum / target value.", required: true },
      { name: "label", type: "string", description: "Metric name label.", required: true },
      { name: "unit", type: "string", description: 'Unit suffix, e.g. "%", "ms", "k".', required: false },
    ],
    render: ({ args, status }) => status === "complete"
      ? <PinnableWrapper onPin={() => addWidget({ type: "gauge", title: args.title, data: args })}><GaugePreview title={args.title} value={args.value} max={args.max} label={args.label} unit={args.unit} /></PinnableWrapper>
      : <p className="text-xs text-gray-400">Rendering…</p>,
    handler: async () => "Gauge rendered.",
  });

  useCopilotAction({
    name: "renderStatComparison",
    description: "Period-over-period comparison of multiple metrics (e.g. this month vs last month).",
    parameters: [
      { name: "title", type: "string", required: true },
      {
        name: "metrics",
        type: "object[]",
        description: '[{label,current,previous,change,changeDirection:"up"|"down"|"flat"}]',
        required: true,
      },
    ],
    render: ({ args, status }) => status === "complete" && args.metrics?.length
      ? <PinnableWrapper onPin={() => addWidget({ type: "comparison", title: args.title, data: args })}><ComparisonPreview title={args.title} metrics={args.metrics} /></PinnableWrapper>
      : <p className="text-xs text-gray-400">Rendering…</p>,
    handler: async () => "Stat comparison rendered.",
  });

  useCopilotAction({
    name: "renderMap",
    description: "Geographic breakdown of a metric by region/country. Use when data has a location dimension.",
    parameters: [
      { name: "title", type: "string", required: true },
      { name: "metric", type: "string", description: "Name of the metric being shown.", required: true },
      { name: "data", type: "object[]", description: "[{region:'UK',value:1200}] — sorted descending.", required: true },
    ],
    render: ({ args, status }) => status === "complete" && args.data?.length
      ? <PinnableWrapper onPin={() => addWidget({ type: "map", title: args.title, data: args })}><MapPreview title={args.title} data={args.data} metric={args.metric} /></PinnableWrapper>
      : <p className="text-xs text-gray-400">Rendering…</p>,
    handler: async () => "Map rendered.",
  });

  // ── Empty state ───────────────────────────────────────────────────────────

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
        <div className="mt-6 flex flex-col gap-3 text-xs text-gray-400 w-full max-w-2xl">
          <p className="font-medium">Try asking:</p>
          {[
            {
              label: "Charts & trends",
              prompts: [
                "Monthly e-commerce revenue trend for this year",
                "Top 5 e-commerce item types by total sales value",
                "Break down insurance claims by claim type as a donut chart",
              ],
            },
            {
              label: "Summaries & tables",
              prompts: [
                "Key insurance metrics: total claims, total value, and average claim amount",
                "Show the top 20 highest value insurance claims in a table",
              ],
            },
            {
              label: "Analysis & insights",
              prompts: [
                "What percentage of customers have filed a claim? Show as a gauge",
                "Compare total premium revenue this year vs last year",
                "Are there any anomalies or unusual patterns in the claims data?",
                "Show website sessions by country as a map",
              ],
            },
          ].map(({ label, prompts }) => (
            <div key={label}>
              <p className="text-gray-400 mb-1">{label}</p>
              <div className="flex flex-wrap gap-2">
                {prompts.map((s) => (
                  <button
                    key={s}
                    onClick={() => window.dispatchEvent(new CustomEvent("paste-query", { detail: s }))}
                    className="rounded-full bg-gray-100 px-3 py-1 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isWide = (type: string) => ["table", "kpi", "insight", "comparison", "map"].includes(type);

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {widgets.map((widget) => (
        <div
          key={widget.id}
          className={isWide(widget.type) ? "col-span-1 md:col-span-2 xl:col-span-3" : ""}
        >
          <WidgetCard widget={widget} onRemove={() => removeWidget(widget.id)} />
        </div>
      ))}
    </div>
  );
}
