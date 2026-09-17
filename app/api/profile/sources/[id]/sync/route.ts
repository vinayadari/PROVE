import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCandidate } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { externalProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { collectGithubEvidence } from "@/lib/collectors/github";
import { collectLeetcodeEvidence } from "@/lib/collectors/leetcode";
import { collectPortfolioEvidence } from "@/lib/collectors/portfolio";
import { persistNormalizedEvidence } from "@/lib/analysis/normalize";
import { CollectorResult } from "@/lib/collectors/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { candidate } = await getAuthenticatedCandidate();
    if (!candidate) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify candidate ownership of this external profile
    const extProfile = await db.query.externalProfiles.findFirst({
      where: eq(externalProfiles.id, id),
    });

    if (!extProfile) {
      return NextResponse.json({ error: "External source profile not found." }, { status: 404 });
    }

    if (extProfile.candidateId !== candidate.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to sync this source." },
        { status: 403 }
      );
    }

    let collectorResult: CollectorResult;

    if (extProfile.provider === "github") {
      collectorResult = await collectGithubEvidence(extProfile.username, candidate.id);
    } else if (extProfile.provider === "leetcode") {
      collectorResult = await collectLeetcodeEvidence(extProfile.username);
    } else if (extProfile.provider === "portfolio") {
      collectorResult = await collectPortfolioEvidence(extProfile.profileUrl);
    } else {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    if (!collectorResult || !collectorResult.success) {
      await db
        .update(externalProfiles)
        .set({ status: "error" })
        .where(eq(externalProfiles.id, extProfile.id));

      return NextResponse.json(
        {
          success: false,
          status: "error",
          error: collectorResult?.error || "Collector failed",
          errorCode: collectorResult?.errorCode || "UNKNOWN_ERROR",
        },
        { status: 422 }
      );
    }

    // Persist and deduplicate evidence into Neon PostgreSQL
    const persistResult = await persistNormalizedEvidence(
      candidate.id,
      collectorResult.evidence
    );

    // Update status to synced
    const [updatedProfile] = await db
      .update(externalProfiles)
      .set({
        status: "synced",
        lastSyncedAt: new Date(),
      })
      .where(eq(externalProfiles.id, extProfile.id))
      .returning();

    return NextResponse.json({
      success: true,
      status: "synced",
      provider: extProfile.provider,
      profile: updatedProfile,
      evidenceExtracted: collectorResult.evidence.length,
      evidenceInserted: persistResult.insertedCount,
      evidenceDeduplicated: persistResult.skippedCount,
      syncedAt: updatedProfile.lastSyncedAt,
    });
  } catch (err: any) {
    console.error("[POST /api/profile/sources/[id]/sync] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error during source sync" },
      { status: 500 }
    );
  }
}
