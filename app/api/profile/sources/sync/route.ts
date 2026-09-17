import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { candidates, externalProfiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { collectGithubEvidence } from "@/lib/collectors/github";
import { collectLeetcodeEvidence } from "@/lib/collectors/leetcode";
import { collectPortfolioEvidence } from "@/lib/collectors/portfolio";
import { persistNormalizedEvidence } from "@/lib/analysis/normalize";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.authUserId, session.user.id),
      with: {
        externalProfiles: true,
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { provider } = body;

    if (!provider || !["github", "leetcode", "portfolio"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid or missing provider parameter. Expected github, leetcode, or portfolio." },
        { status: 400 }
      );
    }

    const extProfile = candidate.externalProfiles?.find((p) => p.provider === provider);
    if (!extProfile) {
      return NextResponse.json(
        { error: `No linked profile found for provider "${provider}". Please configure username or URL first.` },
        { status: 400 }
      );
    }

    let collectorResult;

    if (provider === "github") {
      if (!extProfile.username) {
        return NextResponse.json({ error: "No GitHub username configured." }, { status: 400 });
      }
      collectorResult = await collectGithubEvidence(extProfile.username);
    } else if (provider === "leetcode") {
      if (!extProfile.username) {
        return NextResponse.json({ error: "No LeetCode username configured." }, { status: 400 });
      }
      collectorResult = await collectLeetcodeEvidence(extProfile.username);
    } else if (provider === "portfolio") {
      if (!extProfile.profileUrl) {
        return NextResponse.json({ error: "No Portfolio URL configured." }, { status: 400 });
      }
      collectorResult = await collectPortfolioEvidence(extProfile.profileUrl);
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

    // Deduplicate and persist real normalized evidence
    const persistResult = await persistNormalizedEvidence(
      candidate.id,
      collectorResult.evidence
    );

    // Update external profile status to synced
    await db
      .update(externalProfiles)
      .set({
        status: "synced",
        lastSyncedAt: new Date(),
      })
      .where(eq(externalProfiles.id, extProfile.id));

    return NextResponse.json({
      success: true,
      status: "completed",
      provider,
      evidenceCount: collectorResult.evidence.length,
      newItemsInserted: persistResult.insertedCount,
      duplicatesSkipped: persistResult.skippedCount,
      meta: collectorResult.meta,
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[POST /api/profile/sources/sync] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during sync." },
      { status: 500 }
    );
  }
}
