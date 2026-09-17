import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCandidate } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { evidence } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { candidate } = await getAuthenticatedCandidate();
    if (!candidate) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const item = await db.query.evidence.findFirst({
      where: eq(evidence.id, id),
    });

    if (!item) {
      return NextResponse.json({ error: "Evidence artifact not found" }, { status: 404 });
    }

    if (item.candidateId !== candidate.id) {
      return NextResponse.json(
        { error: "Forbidden: Not authorized to access this evidence." },
        { status: 403 }
      );
    }

    return NextResponse.json({ evidence: item });
  } catch (error: any) {
    console.error("[GET /api/evidence/[id]] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
