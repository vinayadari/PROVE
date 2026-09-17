import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { candidates, resumes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { PDFParse } from "pdf-parse";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = session.user.id;
    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.authUserId, authUserId),
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate profile not found. Please save profile details first." },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let parsedText = "";
    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      parsedText = result?.text || "";
      await parser.destroy();
    } catch (parseErr) {
      console.warn("PDF parsing fallback:", parseErr);
      parsedText = buffer.toString("utf-8").slice(0, 5000);
    }

    const storageKey = `resumes/${candidate.id}/${Date.now()}-${file.name}`;

    const [savedResume] = await db
      .insert(resumes)
      .values({
        candidateId: candidate.id,
        filename: file.name,
        storageKey,
        parsedText: parsedText.trim(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      resume: {
        id: savedResume.id,
        filename: savedResume.filename,
        textLength: parsedText.length,
        uploadedAt: savedResume.uploadedAt,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/profile/resume] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process resume." },
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
    const resumeId = searchParams.get("id");

    if (!resumeId) {
      return NextResponse.json({ error: "Resume ID is required" }, { status: 400 });
    }

    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.authUserId, session.user.id),
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    await db
      .delete(resumes)
      .where(and(eq(resumes.id, resumeId), eq(resumes.candidateId, candidate.id)));

    return NextResponse.json({ success: true, message: "Resume deleted successfully" });
  } catch (error: any) {
    console.error("[DELETE /api/profile/resume] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete resume." },
      { status: 500 }
    );
  }
}
