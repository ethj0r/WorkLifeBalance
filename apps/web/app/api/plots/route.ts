import { NextResponse } from "next/server";
import { plots } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ data: plots });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ data: { id: "plot-new", status: "verifying", ...body } }, { status: 201 });
}
