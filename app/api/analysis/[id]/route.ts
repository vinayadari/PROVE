import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
  analysisRuns,
  evidence,
  evidenceSnapshots,
  evidenceSnapshotItems,
  candidates,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const run = await db.query.analysisRuns.findFirst({
      where: eq(analysisRuns.id, id),
      with: {
        candidate: {
          with: {
            externalProfiles: true,
            resumes: true,
          },
        },
        skillScores: true,
        snapshot: true,
      },
    });

    if (!run) {
      return NextResponse.json({ error: "Analysis run not found" }, { status: 404 });
    }

    // Fetch associated evidence items for this candidate
    const candidateEvidence = await db.query.evidence.findMany({
      where: eq(evidence.candidateId, run.candidateId),
      limit: 100,
    });

    // If there's a snapshot, fetch its linked evidence item IDs
    let snapshotEvidenceIds: string[] = [];
    if (run.evidenceSnapshotId) {
      const snapshotItems = await db.query.evidenceSnapshotItems.findMany({
        where: eq(evidenceSnapshotItems.snapshotId, run.evidenceSnapshotId),
      });
      snapshotEvidenceIds = snapshotItems.map((si) => si.evidenceId);
    }

    return NextResponse.json({
      run: {
        ...run,
        // Flatten candidate name for display
        candidateName: run.candidate?.name || "Candidate",
      },
      evidence: candidateEvidence,
      snapshotEvidenceIds,
    });
  } catch (error: any) {
    console.error("[GET /api/analysis/[id]] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
