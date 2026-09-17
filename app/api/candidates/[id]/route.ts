import { NextResponse } from "next/server";
import { candidatesStore } from "@/lib/server/demo-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const candidate = candidatesStore.find((c) => c.id === id);

  if (!candidate) {
    return NextResponse.json(
      { success: false, error: "Candidate not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: candidate });
}
