import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCandidate } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { externalProfiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateSourceSchema = z.object({
  username: z.string().optional(),
  profileUrl: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { candidate } = await getAuthenticatedCandidate();
    if (!candidate) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await db.query.externalProfiles.findFirst({
      where: eq(externalProfiles.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Source not found." }, { status: 404 });
    }

    if (existing.candidateId !== candidate.id) {
      return NextResponse.json({ error: "Forbidden: Not authorized to modify this resource." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = UpdateSourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.format() },
        { status: 400 }
      );
    }

    let cleanUsername = parsed.data.username?.trim() || existing.username;
    let cleanUrl = parsed.data.profileUrl?.trim() || existing.profileUrl;

    if (existing.provider === "github") {
      if (cleanUrl && parsed.data.profileUrl && !parsed.data.username) {
        cleanUsername = cleanUrl.replace(/https?:\/\/(www\.)?github\.com\/?/, "").replace(/\/.*$/, "").trim();
      }
      if (cleanUsername) {
        cleanUrl = `https://github.com/${cleanUsername}`;
      }
    } else if (existing.provider === "leetcode") {
      if (cleanUrl && parsed.data.profileUrl && !parsed.data.username) {
        cleanUsername = cleanUrl.replace(/https?:\/\/(www\.)?leetcode\.com\/(u\/)?/, "").replace(/\/.*$/, "").trim();
      }
      if (cleanUsername) {
        cleanUrl = `https://leetcode.com/u/${cleanUsername}`;
      }
    } else if (existing.provider === "portfolio") {
      if (cleanUrl && !cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        cleanUrl = `https://${cleanUrl}`;
      }
      cleanUsername = "web";
    }

    const [updated] = await db
      .update(externalProfiles)
      .set({
        username: cleanUsername,
        profileUrl: cleanUrl,
        status: "pending",
      })
      .where(eq(externalProfiles.id, id))
      .returning();

    return NextResponse.json({ success: true, source: updated });
  } catch (err: any) {
    console.error("[PUT /api/profile/sources/[id]] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Verify ownership
    const existing = await db.query.externalProfiles.findFirst({
      where: eq(externalProfiles.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Source not found." }, { status: 404 });
    }

    if (existing.candidateId !== candidate.id) {
      return NextResponse.json({ error: "Forbidden: Not authorized to modify this resource." }, { status: 403 });
    }

    await db.delete(externalProfiles).where(eq(externalProfiles.id, id));

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error("[DELETE /api/profile/sources/[id]] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
