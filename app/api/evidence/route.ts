import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCandidate } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { evidence } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { candidate } = await getAuthenticatedCandidate();
    if (!candidate) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const source = searchParams.get("source");
    const evidenceType = searchParams.get("evidenceType");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;

    const conditions = [eq(evidence.candidateId, candidate.id)];
    if (source && ["github", "leetcode", "portfolio", "resume"].includes(source)) {
      conditions.push(eq(evidence.source, source as any));
    }
    if (evidenceType) {
      conditions.push(eq(evidence.evidenceType, evidenceType));
    }

    const whereClause = and(...conditions);

    const [items, allMatching] = await Promise.all([
      db.query.evidence.findMany({
        where: whereClause,
        orderBy: [desc(evidence.collectedAt)],
        limit,
        offset,
      }),
      db.query.evidence.findMany({
        where: whereClause,
        columns: { id: true },
      }),
    ]);

    return NextResponse.json({
      evidence: items,
      pagination: {
        page,
        limit,
        total: allMatching.length,
        totalPages: Math.ceil(allMatching.length / limit),
      },
    });
  } catch (error: any) {
    console.error("[GET /api/evidence] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load evidence artifacts" },
      { status: 500 }
    );
  }
}
