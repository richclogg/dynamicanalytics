import { BigQuery } from "@google-cloud/bigquery";
import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID = process.env.GCP_PROJECT ?? "adg-internal-tech-sandbox";
const DATASET = process.env.BQ_DATASET ?? "data_demos";

const bigquery = new BigQuery({ projectId: PROJECT_ID });

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // Basic safety: only allow SELECT statements
    const trimmed = query.trim().toUpperCase();
    if (!trimmed.startsWith("SELECT") && !trimmed.startsWith("WITH")) {
      return NextResponse.json(
        { error: "Only SELECT queries are allowed" },
        { status: 400 }
      );
    }

    const [rows] = await bigquery.query({
      query,
      location: "europe-west1",
      maximumBytesBilled: "1000000000", // 1GB limit
    });

    return NextResponse.json({ rows, rowCount: rows.length });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "BigQuery query failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
