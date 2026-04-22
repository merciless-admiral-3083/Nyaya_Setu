import { getLatestAnalysisRecord } from "../../../backend/lib/analysis-db";
export const runtime = "nodejs";
export async function GET() {
  try {
  const analysis = await getLatestAnalysisRecord();
  return Response.json({ analysis });
  } catch (error) {
console.error("Failed to load latest analysis:", error);
  return Response.json({ analysis: null }, { status: 500 });
  }
}
