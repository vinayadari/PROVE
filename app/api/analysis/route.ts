import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { candidates, analysisRuns } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { runAnalysisPipeline } from "@/lib/analysis/pipeline";

export async function GET(req: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.authUserId, session.user.id),
    });

    if (!candidate) {
      return NextResponse.json({ runs: [] });
    }

    const runs = await db.query.analysisRuns.findMany({
      where: eq(analysisRuns.candidateId, candidate.id),
      orderBy: [desc(analysisRuns.createdAt)],
      with: {
        skillScores: true,
      },
    });

    return NextResponse.json({ runs });
  } catch (error: any) {
    console.error("[GET /api/analysis] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch runs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let candidate = await db.query.candidates.findFirst({
      where: eq(candidates.authUserId, session.user.id),
      with: {
        externalProfiles: true,
        resumes: true,
      },
    });

    if (!candidate) {
      const [newCandidate] = await db
        .insert(candidates)
        .values({
          authUserId: session.user.id,
          name: session.user.name || "Candidate",
          email: session.user.email || "",
          avatarUrl: session.user.image || null,
        })
        .returning();
      candidate = {
        ...newCandidate,
        externalProfiles: [],
        resumes: [],
      };
    }

    const body = await req.json().catch(() => ({}));
    const targetRole = body.targetRole || "Senior Fullstack Engineer";
    const experienceYears = Number(body.experienceYears) || 4;

    // Create queued analysis run
    const [newRun] = await db
      .insert(analysisRuns)
      .values({
        candidateId: candidate.id,
        targetRole,
        experienceYears,
        status: "queued",
      })
      .returning();

    // Run pipeline synchronously for immediate feedback or background
    const finishedRun = await runAnalysisPipeline(newRun.id);

    return NextResponse.json({
      success: true,
      runId: finishedRun.id,
      status: finishedRun.status,
      overallScore: finishedRun.overallScore,
      fitScore: finishedRun.fitScore,
    });
  } catch (error: any) {
    console.error("[POST /api/analysis] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to trigger analysis run" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const runId = searchParams.get("id");

    if (!runId) {
      return NextResponse.json({ error: "Run ID is required" }, { status: 400 });
    }

    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.authUserId, session.user.id),
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    await db
      .delete(analysisRuns)
      .where(and(eq(analysisRuns.id, runId), eq(analysisRuns.candidateId, candidate.id)));

    return NextResponse.json({ success: true, message: "Analysis run deleted successfully" });
  } catch (error: any) {
    console.error("[DELETE /api/analysis] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete analysis run" },
      { status: 500 }
    );
  }
}
