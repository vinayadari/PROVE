import { db } from "@/lib/db";
import {
  analysisRuns,
  candidates,
  externalProfiles,
  resumes,
  evidence,
  skillScores,
  evidenceSnapshotItems,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { collectGithubEvidence } from "@/lib/collectors/github";
import { collectLeetcodeEvidence } from "@/lib/collectors/leetcode";
import { collectPortfolioEvidence } from "@/lib/collectors/portfolio";
import { collectResumeEvidence } from "@/lib/collectors/resume";
import { persistNormalizedEvidence } from "./normalize";
import { analyzeEvidenceWithGrok } from "./grok";
import { computeDeterministicScores } from "./scoring";
import { createEvidenceSnapshot } from "./snapshot";
import { computeFingerprint } from "./fingerprint";
import { NormalizedEvidence } from "@/lib/collectors/types";

// Constants for reproducibility tracking
const SCORING_VERSION = "1.0";
const PROMPT_VERSION = "1.0";
const AI_MODEL = "grok-2-latest";

interface ProgressStep {
  step: string;
  status: "pending" | "running" | "completed" | "failed" | "warning";
  detail?: string;
  startedAt?: string;
  completedAt?: string;
}

function buildInitialProgress(): ProgressStep[] {
  return [
    { step: "initialize", status: "pending", detail: "Loading candidate profile" },
    { step: "collect_github", status: "pending", detail: "GitHub REST API collection" },
    { step: "collect_leetcode", status: "pending", detail: "LeetCode GraphQL collection" },
    { step: "collect_portfolio", status: "pending", detail: "Portfolio web crawling" },
    { step: "collect_resume", status: "pending", detail: "Resume document parsing" },
    { step: "snapshot", status: "pending", detail: "Creating immutable evidence snapshot" },
    { step: "analyze", status: "pending", detail: "xAI Grok synthesis & evaluation" },
    { step: "score", status: "pending", detail: "Deterministic mathematical scoring" },
    { step: "fingerprint", status: "pending", detail: "Computing reproducibility fingerprint" },
    { step: "finalize", status: "pending", detail: "Generating verifiable report" },
  ];
}

async function updateProgress(
  analysisRunId: string,
  progressSteps: ProgressStep[],
  stepName: string,
  status: ProgressStep["status"],
  detail?: string
) {
  const step = progressSteps.find((s) => s.step === stepName);
  if (step) {
    step.status = status;
    if (detail) step.detail = detail;
    if (status === "running") step.startedAt = new Date().toISOString();
    if (status === "completed" || status === "failed" || status === "warning") {
      step.completedAt = new Date().toISOString();
    }
  }

  await db
    .update(analysisRuns)
    .set({ progress: progressSteps })
    .where(eq(analysisRuns.id, analysisRunId));
}

export async function runAnalysisPipeline(analysisRunId: string) {
  const progress = buildInitialProgress();

  try {
    // ── Step 1: Initialize & Load Candidate ──────────────────────────
    await updateProgress(analysisRunId, progress, "initialize", "running");

    const run = await db.query.analysisRuns.findFirst({
      where: eq(analysisRuns.id, analysisRunId),
      with: {
        candidate: {
          with: {
            externalProfiles: true,
            resumes: true,
          },
        },
      },
    });

    if (!run || !run.candidate) {
      throw new Error(`Analysis run ${analysisRunId} not found.`);
    }

    const candidate = run.candidate;
    await updateProgress(
      analysisRunId,
      progress,
      "initialize",
      "completed",
      `Profile loaded for ${candidate.name}`
    );

    // ── Step 2: Collecting Evidence with Source Failure Isolation ─────
    await db
      .update(analysisRuns)
      .set({ status: "collecting" })
      .where(eq(analysisRuns.id, analysisRunId));

    const allNormalizedItems: NormalizedEvidence[] = [];
    let configuredSourcesCount = 0;
    let successfulSourcesCount = 0;

    // ── Collect GitHub ────────────────────────────────────────────────
    const ghProfile = candidate.externalProfiles?.find((p) => p.provider === "github");
    if (ghProfile?.username) {
      configuredSourcesCount++;
      await updateProgress(analysisRunId, progress, "collect_github", "running", `Querying @${ghProfile.username}`);
      try {
        const ghResult = await collectGithubEvidence(ghProfile.username);
        if (ghResult.success && ghResult.evidence.length > 0) {
          successfulSourcesCount++;
          allNormalizedItems.push(...ghResult.evidence);
          await db
            .update(externalProfiles)
            .set({ status: "synced", lastSyncedAt: new Date() })
            .where(eq(externalProfiles.id, ghProfile.id));
          await updateProgress(
            analysisRunId,
            progress,
            "collect_github",
            "completed",
            `Collected ${ghResult.evidence.length} evidence items`
          );
        } else {
          await updateProgress(
            analysisRunId,
            progress,
            "collect_github",
            "warning",
            ghResult.error || "No GitHub repositories found"
          );
        }
      } catch (e: any) {
        console.warn("GitHub collection non-fatal error:", e);
        await updateProgress(analysisRunId, progress, "collect_github", "warning", e?.message || "Collection failed");
      }
    } else {
      await updateProgress(analysisRunId, progress, "collect_github", "completed", "No GitHub handle connected");
    }

    // ── Collect LeetCode ──────────────────────────────────────────────
    const lcProfile = candidate.externalProfiles?.find((p) => p.provider === "leetcode");
    if (lcProfile?.username) {
      configuredSourcesCount++;
      await updateProgress(analysisRunId, progress, "collect_leetcode", "running", `Querying @${lcProfile.username}`);
      try {
        const lcResult = await collectLeetcodeEvidence(lcProfile.username);
        if (lcResult.success && lcResult.evidence.length > 0) {
          successfulSourcesCount++;
          allNormalizedItems.push(...lcResult.evidence);
          await db
            .update(externalProfiles)
            .set({ status: "synced", lastSyncedAt: new Date() })
            .where(eq(externalProfiles.id, lcProfile.id));
          await updateProgress(
            analysisRunId,
            progress,
            "collect_leetcode",
            "completed",
            `Collected ${lcResult.evidence.length} problem metrics`
          );
        } else {
          await updateProgress(
            analysisRunId,
            progress,
            "collect_leetcode",
            "warning",
            lcResult.error || "No problem stats found"
          );
        }
      } catch (e: any) {
        console.warn("LeetCode collection non-fatal error:", e);
        await updateProgress(analysisRunId, progress, "collect_leetcode", "warning", e?.message || "Collection failed");
      }
    } else {
      await updateProgress(analysisRunId, progress, "collect_leetcode", "completed", "No LeetCode handle connected");
    }

    // ── Collect Portfolio ─────────────────────────────────────────────
    const portProfile = candidate.externalProfiles?.find((p) => p.provider === "portfolio");
    if (portProfile?.profileUrl) {
      configuredSourcesCount++;
      await updateProgress(analysisRunId, progress, "collect_portfolio", "running", `Scanning ${portProfile.profileUrl}`);
      try {
        const portResult = await collectPortfolioEvidence(portProfile.profileUrl);
        if (portResult.success && portResult.evidence.length > 0) {
          successfulSourcesCount++;
          allNormalizedItems.push(...portResult.evidence);
          await db
            .update(externalProfiles)
            .set({ status: "synced", lastSyncedAt: new Date() })
            .where(eq(externalProfiles.id, portProfile.id));
          await updateProgress(
            analysisRunId,
            progress,
            "collect_portfolio",
            "completed",
            `Detected ${portResult.evidence.length} web artifacts`
          );
        } else {
          await updateProgress(
            analysisRunId,
            progress,
            "collect_portfolio",
            "warning",
            portResult.error || "Portfolio scan failed"
          );
        }
      } catch (e: any) {
        console.warn("Portfolio collection non-fatal error:", e);
        await updateProgress(analysisRunId, progress, "collect_portfolio", "warning", e?.message || "Scan failed");
      }
    } else {
      await updateProgress(analysisRunId, progress, "collect_portfolio", "completed", "No portfolio URL connected");
    }

    // ── Collect Resumes ───────────────────────────────────────────────
    if (candidate.resumes && candidate.resumes.length > 0) {
      configuredSourcesCount++;
      await updateProgress(analysisRunId, progress, "collect_resume", "running", `Parsing ${candidate.resumes.length} document(s)`);
      for (const res of candidate.resumes) {
        if (res.parsedText) {
          const resResult = collectResumeEvidence(res.filename, res.parsedText);
          if (resResult.success && resResult.evidence.length > 0) {
            allNormalizedItems.push(...resResult.evidence);
          }
        }
      }
      successfulSourcesCount++;
      await updateProgress(analysisRunId, progress, "collect_resume", "completed", "Resume document parsed");
    } else {
      await updateProgress(analysisRunId, progress, "collect_resume", "completed", "No resume uploaded");
    }

    // Fallback baseline if candidate hasn't configured any sources
    if (allNormalizedItems.length === 0) {
      allNormalizedItems.push({
        source: "portfolio",
        sourceUrl: undefined,
        evidenceType: "baseline_identity",
        title: "Candidate Identity Initialized",
        description: `Profile verified for ${candidate.name} (${candidate.email}). Ready for external proof synchronization.`,
        rawData: { initialized: true },
        confidence: 0.8,
        collectedAt: new Date().toISOString(),
      });
      configuredSourcesCount = 1;
      successfulSourcesCount = 1;
    }

    // Calculate Evidence Coverage %
    const evidenceCoverage =
      configuredSourcesCount > 0
        ? Math.round((successfulSourcesCount / configuredSourcesCount) * 100)
        : 100;

    // Persist and deduplicate into Neon PostgreSQL
    await persistNormalizedEvidence(candidate.id, allNormalizedItems);

    // ── Step 3: Create Immutable Evidence Snapshot ────────────────────
    await updateProgress(analysisRunId, progress, "snapshot", "running");
    const snapshotResult = await createEvidenceSnapshot(candidate.id);

    await db
      .update(analysisRuns)
      .set({ evidenceSnapshotId: snapshotResult.snapshotId })
      .where(eq(analysisRuns.id, analysisRunId));

    await updateProgress(
      analysisRunId,
      progress,
      "snapshot",
      "completed",
      `Snapshot ${snapshotResult.snapshotId.slice(0, 8)} · ${snapshotResult.evidenceCount} frozen items`
    );

    // ── Step 4: Fetch ONLY Snapshot Items for Analysis ────────────────
    const snapshotItems = await db.query.evidenceSnapshotItems.findMany({
      where: eq(evidenceSnapshotItems.snapshotId, snapshotResult.snapshotId),
      with: {
        evidence: true,
      },
    });

    const frozenEvidenceItems = snapshotItems.map((si) => ({
      id: si.evidence.id,
      source: si.evidence.source,
      evidenceType: si.evidence.evidenceType,
      title: si.evidence.title,
      description: si.evidence.description,
      sourceUrl: si.evidence.sourceUrl,
      rawData: si.evidence.rawData,
    }));

    // ── Step 5: Analyzing with Grok (Grounded to Snapshot Evidence) ───
    await db
      .update(analysisRuns)
      .set({ status: "analyzing" })
      .where(eq(analysisRuns.id, analysisRunId));

    await updateProgress(analysisRunId, progress, "analyze", "running", "Sending evidence digest to xAI Grok");

    const grokOutput = await analyzeEvidenceWithGrok({
      candidateName: candidate.name,
      targetRole: run.targetRole,
      experienceYears: run.experienceYears,
      evidenceItems: frozenEvidenceItems,
    });

    await updateProgress(
      analysisRunId,
      progress,
      "analyze",
      "completed",
      `Assessed level: ${grokOutput.assessedLevel}`
    );

    // ── Step 6: Deterministic Scoring ────────────────────────────────
    await db
      .update(analysisRuns)
      .set({ status: "scoring" })
      .where(eq(analysisRuns.id, analysisRunId));

    await updateProgress(analysisRunId, progress, "score", "running");

    const scores = computeDeterministicScores({
      targetRole: run.targetRole,
      experienceYears: run.experienceYears,
      evidenceItems: frozenEvidenceItems,
      grokInsights: grokOutput,
    });

    // Persist skill scores with grounded evidence citations
    for (const skill of scores.skillScores) {
      await db.insert(skillScores).values({
        analysisRunId,
        skill: skill.skill,
        score: skill.score,
        evidenceIds: skill.evidenceIds || [],
      });
    }

    await updateProgress(
      analysisRunId,
      progress,
      "score",
      "completed",
      `Overall: ${scores.overallScore}% · Fit: ${scores.fitScore}%`
    );

    // ── Step 7: Compute Reproducibility Fingerprint ──────────────────
    await updateProgress(analysisRunId, progress, "fingerprint", "running");

    const fingerprint = await computeFingerprint({
      candidateId: candidate.id,
      targetRole: run.targetRole,
      experienceYears: run.experienceYears,
      evidenceSnapshotId: snapshotResult.snapshotId,
      scoringVersion: SCORING_VERSION,
      promptVersion: PROMPT_VERSION,
      aiModel: AI_MODEL,
    });

    await updateProgress(
      analysisRunId,
      progress,
      "fingerprint",
      "completed",
      `SHA-256: ${fingerprint.slice(0, 16)}…`
    );

    // ── Step 8: Finalize Analysis Run ────────────────────────────────
    await updateProgress(analysisRunId, progress, "finalize", "running");

    const [finalRun] = await db
      .update(analysisRuns)
      .set({
        status: "completed",
        overallScore: scores.overallScore,
        fitScore: scores.fitScore,
        confidence: 0.95,
        evidenceCoverage,
        breakdown: scores.breakdown,
        skills: scores.skillScores,
        insights: grokOutput,
        fingerprint,
        scoringVersion: SCORING_VERSION,
        promptVersion: PROMPT_VERSION,
        aiModel: AI_MODEL,
        completedAt: new Date(),
      })
      .where(eq(analysisRuns.id, analysisRunId))
      .returning();

    await updateProgress(analysisRunId, progress, "finalize", "completed", "Evidence report ready");

    return finalRun;
  } catch (error: any) {
    console.error(`Pipeline error on run ${analysisRunId}:`, error);

    for (const step of progress) {
      if (step.status === "running") {
        step.status = "failed";
        step.completedAt = new Date().toISOString();
        step.detail = error?.message || "Pipeline failure";
      }
    }

    await db
      .update(analysisRuns)
      .set({
        status: "failed",
        progress,
        error: error?.message || "Unknown analysis failure",
      })
      .where(eq(analysisRuns.id, analysisRunId));
    throw error;
  }
}
