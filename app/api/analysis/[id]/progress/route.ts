import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { analysisRuns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/analysis/[id]/progress
 * Lightweight polling endpoint for pipeline progress.
 * Returns only status + progress steps.
 */
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
      columns: {
        id: true,
        status: true,
        progress: true,
        overallScore: true,
        fitScore: true,
        error: true,
      },
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: run.id,
      status: run.status,
      progress: run.progress || [],
      overallScore: run.overallScore,
      fitScore: run.fitScore,
      error: run.error,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
