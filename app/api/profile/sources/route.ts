import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCandidate } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { externalProfiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateSourceSchema = z.object({
  provider: z.enum(["github", "leetcode", "portfolio"]),
  username: z.string().optional(),
  profileUrl: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { candidate } = await getAuthenticatedCandidate();
    if (!candidate) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sources = await db.query.externalProfiles.findMany({
      where: eq(externalProfiles.candidateId, candidate.id),
    });

    return NextResponse.json({ sources });
  } catch (err: any) {
    console.error("[GET /api/profile/sources] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { candidate } = await getAuthenticatedCandidate();
    if (!candidate) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateSourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid source input", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { provider, username, profileUrl } = parsed.data;

    let cleanUsername = username?.trim() || "";
    let cleanUrl = profileUrl?.trim() || "";

    if (provider === "github") {
      if (cleanUrl && !cleanUsername) {
        cleanUsername = cleanUrl.replace(/https?:\/\/(www\.)?github\.com\/?/, "").replace(/\/.*$/, "").trim();
      }
      if (cleanUsername && !cleanUrl) {
        cleanUrl = `https://github.com/${cleanUsername}`;
      }
      if (!cleanUsername) {
        return NextResponse.json({ error: "GitHub username is required." }, { status: 400 });
      }
    } else if (provider === "leetcode") {
      if (cleanUrl && !cleanUsername) {
        cleanUsername = cleanUrl.replace(/https?:\/\/(www\.)?leetcode\.com\/(u\/)?/, "").replace(/\/.*$/, "").trim();
      }
      if (cleanUsername && !cleanUrl) {
        cleanUrl = `https://leetcode.com/u/${cleanUsername}`;
      }
      if (!cleanUsername) {
        return NextResponse.json({ error: "LeetCode username is required." }, { status: 400 });
      }
    } else if (provider === "portfolio") {
      if (!cleanUrl) {
        return NextResponse.json({ error: "Portfolio URL is required." }, { status: 400 });
      }
      if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        cleanUrl = `https://${cleanUrl}`;
      }
      cleanUsername = "web";
    }

    // Check if provider profile already exists for this candidate
    const existing = await db.query.externalProfiles.findFirst({
      where: and(
        eq(externalProfiles.candidateId, candidate.id),
        eq(externalProfiles.provider, provider)
      ),
    });

    let savedProfile;
    if (existing) {
      const [updated] = await db
        .update(externalProfiles)
        .set({
          username: cleanUsername,
          profileUrl: cleanUrl,
          status: "pending",
        })
        .where(eq(externalProfiles.id, existing.id))
        .returning();
      savedProfile = updated;
    } else {
      const [inserted] = await db
        .insert(externalProfiles)
        .values({
          candidateId: candidate.id,
          provider,
          username: cleanUsername,
          profileUrl: cleanUrl,
          status: "pending",
        })
        .returning();
      savedProfile = inserted;
    }

    return NextResponse.json({ success: true, source: savedProfile });
  } catch (err: any) {
    console.error("[POST /api/profile/sources] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
