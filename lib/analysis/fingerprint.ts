/**
 * PROVE Reproducibility Fingerprint Engine
 *
 * Generates a deterministic SHA-256 fingerprint from canonicalized analysis inputs.
 * Same inputs always produce the same fingerprint — no timestamps, random UUIDs,
 * or request IDs are included.
 *
 * Fingerprint formula:
 *   SHA-256(canonicalize(candidateId, targetRole, experienceYears,
 *     evidenceSnapshotId, scoringVersion, promptVersion, aiModel))
 */

import { createHash } from "crypto";

export interface FingerprintInputs {
  candidateId: string;
  targetRole: string;
  experienceYears: number;
  evidenceSnapshotId: string;
  scoringVersion: string;
  promptVersion: string;
  aiModel: string;
}

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
 * Compute a deterministic SHA-256 fingerprint.
 */
export function computeFingerprint(inputs: FingerprintInputs): string {
  const canonical = stableStringify({
    aiModel: inputs.aiModel,
    candidateId: inputs.candidateId,
    evidenceSnapshotId: inputs.evidenceSnapshotId,
    experienceYears: inputs.experienceYears,
    promptVersion: inputs.promptVersion,
    scoringVersion: inputs.scoringVersion,
    targetRole: inputs.targetRole,
  });

  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Compute a content hash for evidence data — used to fingerprint snapshot contents.
 */
export function computeEvidenceContentHash(
  evidenceItems: { source: string; evidenceType: string; rawData: any }[]
): string {
  const normalized = evidenceItems
    .map((e) => ({
      evidenceType: e.evidenceType,
      rawData: e.rawData || {},
      source: e.source,
    }))
    .sort((a, b) => `${a.source}:${a.evidenceType}`.localeCompare(`${b.source}:${b.evidenceType}`));

  const canonical = stableStringify(normalized);
  return createHash("sha256").update(canonical).digest("hex");
}
