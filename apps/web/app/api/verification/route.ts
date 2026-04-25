import { NextResponse } from "next/server";
import { estimateCarbonIncome } from "@/lib/carbon-estimate";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const estimate = estimateCarbonIncome({ areaHa: Number(body.areaHa ?? 1.8), treeDensityScore: Number(body.treeDensityScore ?? 0.8), ndvi: Number(body.ndvi ?? 0.68) });
  return NextResponse.json({ status: "verified", confidence: 89, ndvi: 0.68, treesDetected: 32, ...estimate });
}
