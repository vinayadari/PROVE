/**
 * PROVE Evidence Snapshot Manager
 *
 * Creates immutable evidence snapshots that freeze the state of all collected
 * evidence at analysis time. Each snapshot gets a content-based fingerprint
 * so the same evidence set always maps to the same snapshot identity.
 */

import { db } from "@/lib/db";
import {
  evidence,
  evidenceSnapshots,
  evidenceSnapshotItems,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { computeEvidenceContentHash } from "./fingerprint";

export interface SnapshotResult {
  snapshotId: string;
  fingerprint: string;
  evidenceCount: number;
}

/**
 * Create an immutable evidence snapshot for a candidate.
 * Freezes all current evidence rows and links them to a new snapshot record.
 */
export async function createEvidenceSnapshot(
  candidateId: string
): Promise<SnapshotResult> {
  // 1. Fetch all evidence for the candidate
  const evidenceItems = await db.query.evidence.findMany({
    where: eq(evidence.candidateId, candidateId),
  });

  if (evidenceItems.length === 0) {
    throw new Error("No evidence items found to snapshot.");
  }

  // 2. Compute content-based fingerprint
  const fingerprint = await computeEvidenceContentHash(
    evidenceItems.map((e) => ({
      source: e.source,
      evidenceType: e.evidenceType,
      rawData: e.rawData,
    }))
  );

  // 3. Create the snapshot record
  const [snapshot] = await db
    .insert(evidenceSnapshots)
    .values({
      candidateId,
      fingerprint,
    })
    .returning();

  // 4. Link all evidence items to the snapshot
  for (const item of evidenceItems) {
    await db.insert(evidenceSnapshotItems).values({
      snapshotId: snapshot.id,
      evidenceId: item.id,
    });
  }

  return {
    snapshotId: snapshot.id,
    fingerprint,
    evidenceCount: evidenceItems.length,
  };
}
