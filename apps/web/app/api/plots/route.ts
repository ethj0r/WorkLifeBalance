import { NextResponse } from "next/server";
import { plots } from "@/lib/mock-data";
import type { LandType } from "@/lib/types";

const DEFAULT_LAND_TYPE: LandType = "Agroforestri";

export async function GET() {
  return NextResponse.json({ data: plots });
}

export async function POST(request: Request) {
  const body = await request.json();

  return NextResponse.json(
    {
      data: {
        id: "plot-new",
        status: "verifying",
        landType: body.landType ?? DEFAULT_LAND_TYPE,
        ...body,
      },
    },
    { status: 201 }
  );
}