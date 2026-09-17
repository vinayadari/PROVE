import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCandidate } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { candidate } = await getAuthenticatedCandidate();
    if (!candidate) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.query.resumes.findFirst({
      where: eq(resumes.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Resume document not found." }, { status: 404 });
    }

    if (existing.candidateId !== candidate.id) {
      return NextResponse.json(
        { error: "Forbidden: Not authorized to delete this resume." },
        { status: 403 }
      );
    }

    await db.delete(resumes).where(eq(resumes.id, id));

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error("[DELETE /api/profile/resume/[id]] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
