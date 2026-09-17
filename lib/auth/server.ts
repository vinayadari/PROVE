import { createNeonAuth } from "@neondatabase/auth/next/server";
import { db } from "@/lib/db";
import { candidates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || "https://auth.neon.tech",
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET || "temporary-development-secret-must-be-at-least-32-chars-long",
  },
});

/**
 * Resolves the authenticated Neon Auth session and its strictly associated Candidate record.
 * Never trusts candidateId from client requests.
 */
export async function getAuthenticatedCandidate() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return { session: null, candidate: null };
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

  return { session, candidate };
}
