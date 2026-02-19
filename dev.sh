#!/bin/bash
# Start MCP servers + Next.js dev server together.
# Ctrl+C kills all three.

MCP_ROOT="../mcp-servers"

echo "Starting BigQuery MCP server (port 8001)..."
(cd "$MCP_ROOT/bigquery" && PYTHONPATH=src .venv/bin/python3 -m bq_mcp.server) &
BQ_PID=$!

echo "Starting GA4 MCP server (port 8002)..."
(cd "$MCP_ROOT/ga4" && PYTHONPATH=src .venv/bin/python3 -m ga4_mcp.server) &
GA4_PID=$!

echo "Starting Next.js dev server..."
npm run dev &
NEXT_PID=$!

# Ctrl+C kills all three
trap "kill $BQ_PID $GA4_PID $NEXT_PID 2>/dev/null; exit" INT TERM

wait
