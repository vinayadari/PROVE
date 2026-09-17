import { createHash } from "crypto";
import { db } from "@/lib/db";
import { evidence } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NormalizedEvidence, NormalizedEvidenceSchema } from "@/lib/collectors/types";

function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(stableStringify).join(",")}]`;
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  return `{${pairs.join(",")}}`;
}

/**
 * Computes a deterministic content hash for an evidence item.
 * NOTE: Timestamps, random IDs, and generated dates are explicitly EXCLUDED
 * so identical facts collected at different times produce the exact same hash.
 */
export function computeEvidenceDedupHash(item: Partial<NormalizedEvidence>): string {
  const canonicalData = {
    source: item.source,
    evidenceType: item.evidenceType,
    sourceUrl: item.sourceUrl || "",
    title: item.title,
    rawData: item.rawData || {},
  };

  const str = stableStringify(canonicalData);
  return createHash("sha256").update(str).digest("hex");
}

/**
 * Validates, deduplicates, and saves evidence items to Neon PostgreSQL.
 * If an evidence item with the same stable content hash already exists for the candidate,
 * it is skipped to avoid redundant duplicate rows in the database.
 */
export async function persistNormalizedEvidence(
  candidateId: string,
  items: NormalizedEvidence[]
): Promise<{
  insertedCount: number;
  skippedCount: number;
  evidenceItems: any[];
}> {
  let insertedCount = 0;
  let skippedCount = 0;
  const persistedList: any[] = [];

  // Fetch existing evidence for this candidate
  const existingRows = await db.query.evidence.findMany({
    where: eq(evidence.candidateId, candidateId),
  });

  // Build a set of existing dedup hashes
  const existingHashes = new Set(
    existingRows.map((r) =>
      computeEvidenceDedupHash({
        source: r.source as any,
        evidenceType: r.evidenceType,
        sourceUrl: r.sourceUrl,
        title: r.title,
        rawData: (r.rawData as Record<string, any>) || {},
      })
    )
  );

  for (const rawItem of items) {
    // Validate with Zod
    const parsed = NormalizedEvidenceSchema.safeParse(rawItem);
    if (!parsed.success) {
      console.warn("Invalid evidence item dropped:", parsed.error.format());
      continue;
    }

    const item = parsed.data;
    const hash = computeEvidenceDedupHash(item);

    if (existingHashes.has(hash)) {
      skippedCount++;
      // Locate existing row
      const existing = existingRows.find(
        (r) =>
          computeEvidenceDedupHash({
            source: r.source as any,
            evidenceType: r.evidenceType,
            sourceUrl: r.sourceUrl,
            title: r.title,
            rawData: (r.rawData as Record<string, any>) || {},
          }) === hash
      );
      if (existing) persistedList.push(existing);
      continue;
    }

    // Insert new evidence row
    const [inserted] = await db
      .insert(evidence)
      .values({
        candidateId,
        source: item.source,
        sourceUrl: item.sourceUrl,
        evidenceType: item.evidenceType,
        title: item.title,
        description: item.description,
        rawData: item.rawData,
        confidence: item.confidence,
        collectedAt: new Date(),
      })
      .returning();

    existingHashes.add(hash);
    insertedCount++;
    persistedList.push(inserted);
  }

  return {
    insertedCount,
    skippedCount,
    evidenceItems: persistedList,
  };
}
