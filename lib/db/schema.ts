import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  jsonb,
  real,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ──────────────────────────────────────────────────────────

export const providerEnum = pgEnum("provider", [
  "github",
  "leetcode",
  "portfolio",
]);

export const profileStatusEnum = pgEnum("profile_status", [
  "pending",
  "synced",
  "error",
]);

export const evidenceSourceEnum = pgEnum("evidence_source", [
  "github",
  "leetcode",
  "portfolio",
  "resume",
]);

export const analysisStatusEnum = pgEnum("analysis_status", [
  "queued",
  "collecting",
  "analyzing",
  "scoring",
  "completed",
  "failed",
]);

// ─── Candidates ─────────────────────────────────────────────────────

export const candidates = pgTable("candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: text("auth_user_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const candidatesRelations = relations(candidates, ({ many }) => ({
  externalProfiles: many(externalProfiles),
  resumes: many(resumes),
  evidence: many(evidence),
  evidenceSnapshots: many(evidenceSnapshots),
  analysisRuns: many(analysisRuns),
}));

// ─── External Profiles ──────────────────────────────────────────────

export const externalProfiles = pgTable("external_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  provider: providerEnum("provider").notNull(),
  username: text("username").notNull(),
  profileUrl: text("profile_url").notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  status: profileStatusEnum("status").default("pending").notNull(),
});

export const externalProfilesRelations = relations(externalProfiles, ({ one }) => ({
  candidate: one(candidates, {
    fields: [externalProfiles.candidateId],
    references: [candidates.id],
  }),
}));

// ─── Resumes ────────────────────────────────────────────────────────

export const resumes = pgTable("resumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  storageKey: text("storage_key").notNull(),
  storageUrl: text("storage_url"),
  parsedText: text("parsed_text"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const resumesRelations = relations(resumes, ({ one }) => ({
  candidate: one(candidates, {
    fields: [resumes.candidateId],
    references: [candidates.id],
  }),
}));

// ─── Evidence ───────────────────────────────────────────────────────

export const evidence = pgTable("evidence", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  source: evidenceSourceEnum("source").notNull(),
  sourceUrl: text("source_url"),
  evidenceType: text("evidence_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  rawData: jsonb("raw_data"),
  confidence: real("confidence").notNull().default(0),
  collectedAt: timestamp("collected_at", { withTimezone: true }).defaultNow().notNull(),
});

export const evidenceRelations = relations(evidence, ({ one }) => ({
  candidate: one(candidates, {
    fields: [evidence.candidateId],
    references: [candidates.id],
  }),
}));

// ─── Evidence Snapshots ──────────────────────────────────────────────

export const evidenceSnapshots = pgTable("evidence_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  fingerprint: text("fingerprint").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const evidenceSnapshotsRelations = relations(evidenceSnapshots, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [evidenceSnapshots.candidateId],
    references: [candidates.id],
  }),
  items: many(evidenceSnapshotItems),
  analysisRuns: many(analysisRuns),
}));

export const evidenceSnapshotItems = pgTable("evidence_snapshot_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  snapshotId: uuid("snapshot_id")
    .notNull()
    .references(() => evidenceSnapshots.id, { onDelete: "cascade" }),
  evidenceId: uuid("evidence_id")
    .notNull()
    .references(() => evidence.id, { onDelete: "cascade" }),
});

export const evidenceSnapshotItemsRelations = relations(evidenceSnapshotItems, ({ one }) => ({
  snapshot: one(evidenceSnapshots, {
    fields: [evidenceSnapshotItems.snapshotId],
    references: [evidenceSnapshots.id],
  }),
  evidence: one(evidence, {
    fields: [evidenceSnapshotItems.evidenceId],
    references: [evidence.id],
  }),
}));

// ─── Analysis Runs ──────────────────────────────────────────────────

export const analysisRuns = pgTable("analysis_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  targetRole: text("target_role").notNull(),
  experienceYears: integer("experience_years").default(0).notNull(),
  status: analysisStatusEnum("status").default("queued").notNull(),
  progress: jsonb("progress"),
  evidenceSnapshotId: uuid("evidence_snapshot_id").references(() => evidenceSnapshots.id, { onDelete: "set null" }),
  fingerprint: text("fingerprint"),
  scoringVersion: text("scoring_version").default("1.0"),
  promptVersion: text("prompt_version").default("1.0"),
  aiModel: text("ai_model").default("grok-2-latest"),
  overallScore: integer("overall_score"),
  confidence: real("confidence"),
  evidenceCoverage: integer("evidence_coverage"),
  fitScore: integer("fit_score"),
  breakdown: jsonb("breakdown"),
  skills: jsonb("skills"),
  insights: jsonb("insights"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const analysisRunsRelations = relations(analysisRuns, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [analysisRuns.candidateId],
    references: [candidates.id],
  }),
  snapshot: one(evidenceSnapshots, {
    fields: [analysisRuns.evidenceSnapshotId],
    references: [evidenceSnapshots.id],
  }),
  skillScores: many(skillScores),
}));

// ─── Skill Scores ───────────────────────────────────────────────────

export const skillScores = pgTable("skill_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisRunId: uuid("analysis_run_id")
    .notNull()
    .references(() => analysisRuns.id, { onDelete: "cascade" }),
  skill: text("skill").notNull(),
  score: integer("score").notNull(),
  evidenceIds: text("evidence_ids").array(),
});

export const skillScoresRelations = relations(skillScores, ({ one }) => ({
  analysisRun: one(analysisRuns, {
    fields: [skillScores.analysisRunId],
    references: [analysisRuns.id],
  }),
}));
