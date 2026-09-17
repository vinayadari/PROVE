import { z } from "zod";

export const CollectorSourceSchema = z.enum(["github", "leetcode", "portfolio", "resume"]);
export type CollectorSource = z.infer<typeof CollectorSourceSchema>;

export const CollectorErrorCodeSchema = z.enum([
  "NOT_FOUND",
  "RATE_LIMITED",
  "SSRF_BLOCKED",
  "TIMEOUT",
  "PARSING_ERROR",
  "NETWORK_ERROR",
  "INVALID_INPUT",
  "UNAUTHORIZED",
  "UNKNOWN_ERROR",
]);
export type CollectorErrorCode = z.infer<typeof CollectorErrorCodeSchema>;

export const NormalizedEvidenceSchema = z.object({
  id: z.string().optional(),
  candidateId: z.string().optional(),
  source: CollectorSourceSchema,
  evidenceType: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  sourceUrl: z.string().url().optional().nullable(),
  rawData: z.record(z.string(), z.any()).default({}),
  confidence: z.number().min(0).max(1).default(1.0),
  collectedAt: z.string().optional(),
  dedupHash: z.string().optional(),
});
export type NormalizedEvidence = z.infer<typeof NormalizedEvidenceSchema>;

// Backward compatibility alias
export type RawEvidenceItem = NormalizedEvidence;

export const CollectorInputSchema = z.object({
  candidateId: z.string().min(1),
  username: z.string().optional(),
  profileUrl: z.string().optional(),
  token: z.string().optional(),
  filename: z.string().optional(),
  fileBuffer: z.any().optional(),
  parsedText: z.string().optional(),
});
export type CollectorInput = z.infer<typeof CollectorInputSchema>;

export interface CollectorResult {
  source: CollectorSource;
  success: boolean;
  evidence: NormalizedEvidence[];
  error?: string;
  errorCode?: CollectorErrorCode;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
  meta?: Record<string, any>;
}

export interface EvidenceCollector {
  provider: CollectorSource;
  collect(input: CollectorInput): Promise<CollectorResult>;
}
