import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { candidates, externalProfiles, resumes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = session.user.id;

    // Find or create candidate
    let candidate = await db.query.candidates.findFirst({
      where: eq(candidates.authUserId, authUserId),
      with: {
        externalProfiles: true,
        resumes: true,
      },
    });

    if (!candidate) {
      const [newCandidate] = await db
        .insert(candidates)
        .values({
          authUserId,
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

    return NextResponse.json({ candidate });
  } catch (error: any) {
    console.error("[GET /api/profile] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
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

    const body = await req.json();
    const { name, github, leetcode, portfolio } = body;
    const authUserId = session.user.id;

    // Find candidate or create
    let candidate = await db.query.candidates.findFirst({
      where: eq(candidates.authUserId, authUserId),
    });

    if (!candidate) {
      const [newCandidate] = await db
        .insert(candidates)
        .values({
          authUserId,
          name: name || session.user.name || "Candidate",
          email: session.user.email || "",
          avatarUrl: session.user.image || null,
        })
        .returning();
      candidate = newCandidate;
    } else if (name) {
      const [updated] = await db
        .update(candidates)
        .set({ name, updatedAt: new Date() })
        .where(eq(candidates.id, candidate.id))
        .returning();
      candidate = updated;
    }

    // Upsert or update external profiles
    const profilesToSync: { provider: "github" | "leetcode" | "portfolio"; username: string; profileUrl: string }[] = [];

    if (github) {
      const cleanGithub = github.replace(/https?:\/\/(www\.)?github\.com\/?/, "").replace(/\/.*$/, "").trim();
      if (cleanGithub) {
        profilesToSync.push({
          provider: "github",
          username: cleanGithub,
          profileUrl: `https://github.com/${cleanGithub}`,
        });
      }
    }

    if (leetcode) {
      const cleanLeetcode = leetcode.replace(/https?:\/\/(www\.)?leetcode\.com\/(u\/)?/, "").replace(/\/.*$/, "").trim();
      if (cleanLeetcode) {
        profilesToSync.push({
          provider: "leetcode",
          username: cleanLeetcode,
          profileUrl: `https://leetcode.com/u/${cleanLeetcode}`,
        });
      }
    }

    if (portfolio) {
      const cleanUrl = portfolio.startsWith("http") ? portfolio.trim() : `https://${portfolio.trim()}`;
      profilesToSync.push({
        provider: "portfolio",
        username: "web",
        profileUrl: cleanUrl,
      });
    }

    // Sync profiles in database
    for (const item of profilesToSync) {
      const existing = await db.query.externalProfiles.findFirst({
        where: (ep, { and, eq }) =>
          and(eq(ep.candidateId, candidate.id), eq(ep.provider, item.provider)),
      });

      if (existing) {
        await db
          .update(externalProfiles)
          .set({
            username: item.username,
            profileUrl: item.profileUrl,
            status: "pending",
          })
          .where(eq(externalProfiles.id, existing.id));
      } else {
        await db.insert(externalProfiles).values({
          candidateId: candidate.id,
          provider: item.provider,
          username: item.username,
          profileUrl: item.profileUrl,
          status: "pending",
        });
      }
    }

    const updatedCandidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, candidate.id),
      with: {
        externalProfiles: true,
        resumes: true,
      },
    });

    return NextResponse.json({ candidate: updatedCandidate });
  } catch (error: any) {
    console.error("[POST /api/profile] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export const PUT = POST;
