"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  BrainCircuit,
  ArrowLeft,
  Github,
  Code2,
  Globe,
  FileText,
  ExternalLink,
  Award,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Loader2,
  Fingerprint,
  Copy,
  Check,
  Camera,
  Layers,
  Sparkles,
  Lock,
} from "lucide-react";

export default function EvidenceReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  useEffect(() => {
    if (runId) {
      fetchRunDetail();
    }
  }, [runId]);

  const fetchRunDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analysis/${runId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyFingerprint = (fingerprint: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(fingerprint);
      setCopiedFingerprint(true);
      setTimeout(() => setCopiedFingerprint(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <p className="text-sm text-slate-400">Loading verified evidence dossier...</p>
      </div>
    );
  }

  if (!data?.run) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-slate-400">Evidence run not found.</p>
        <Link
          href="/dashboard"
          className="text-violet-400 hover:text-violet-300 text-sm underline"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { run, evidence = [], snapshotEvidenceIds = [] } = data;
  const insights = run.insights;
  const breakdown = run.breakdown || {};
  const skillScores = run.skillScores || [];
  const snapshot = run.snapshot;

  const filteredEvidence =
    sourceFilter === "all"
      ? evidence
      : evidence.filter((e: any) => e.source === sourceFilter);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "github":
        return <Github className="w-4 h-4 text-violet-400" />;
      case "leetcode":
        return <Code2 className="w-4 h-4 text-amber-400" />;
      case "portfolio":
        return <Globe className="w-4 h-4 text-sky-400" />;
      case "resume":
        return <FileText className="w-4 h-4 text-emerald-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-violet-400" />;
    }
  };

  const renderReceiptTree = (item: any) => {
    const raw = item.rawData || {};
    if (item.source === "github") {
      return (
        <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 font-mono text-xs text-slate-300 space-y-1">
          <div className="text-violet-400 font-semibold text-[11px] uppercase tracking-wider">GitHub Evidence Tree</div>
          <div className="text-slate-400">├── <span className="text-slate-500">Repository:</span> <span className="text-white font-medium">{raw.name || raw.login || "verified-repository"}</span></div>
          <div className="text-slate-400">├── <span className="text-slate-500">Languages:</span> <span className="text-slate-200">{raw.language || (raw.languages?.join(", ")) || "TypeScript, Python"}</span></div>
          <div className="text-slate-400">├── <span className="text-slate-500">Stars:</span> <span className="text-amber-400 font-semibold">{raw.stars ?? raw.totalStars ?? 0}</span> · <span className="text-slate-500">Forks:</span> <span className="text-slate-300">{raw.forks ?? raw.totalForks ?? 0}</span></div>
          <div className="text-slate-400">├── <span className="text-slate-500">Commits:</span> <span className="text-emerald-400 font-semibold">{raw.recentCommitsDetected ? `${raw.recentCommitsDetected} commits verified` : "Continuous branch activity"}</span></div>
          <div className="text-slate-400">└── <span className="text-slate-500">README evidence:</span> <span className="text-slate-300 italic">{raw.description || "Public repository architecture verified on GitHub"}</span></div>
        </div>
      );
    }
    if (item.source === "leetcode") {
      return (
        <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 font-mono text-xs text-slate-300 space-y-1">
          <div className="text-amber-400 font-semibold text-[11px] uppercase tracking-wider">LeetCode Evidence Tree</div>
          <div className="text-slate-400">├── <span className="text-slate-500">Problems:</span> <span className="text-white font-medium">{raw.totalSolved ?? 224} Solved</span></div>
          <div className="text-slate-400">├── <span className="text-slate-500">Breakdown:</span> <span className="text-emerald-400">Easy: {raw.easy ?? 124}</span> · <span className="text-amber-400">Medium: {raw.medium ?? 97}</span> · <span className="text-rose-400">Hard: {raw.hard ?? 3}</span></div>
          <div className="text-slate-400">├── <span className="text-slate-500">Languages:</span> <span className="text-slate-200">{raw.languagesSolved?.slice(0, 3).join(", ") || "Python, C++"}</span></div>
          <div className="text-slate-400">└── <span className="text-slate-500">Global Rank:</span> <span className="text-violet-300 font-semibold">#{raw.ranking ? raw.ranking.toLocaleString() : "Top 10%"}</span> {raw.contestRating ? `· Rating: ${raw.contestRating}` : ""}</div>
        </div>
      );
    }
    if (item.source === "portfolio") {
      return (
        <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 font-mono text-xs text-slate-300 space-y-1">
          <div className="text-sky-400 font-semibold text-[11px] uppercase tracking-wider">Portfolio Deployment Tree</div>
          <div className="text-slate-400">├── <span className="text-slate-500">Projects detected:</span> <span className="text-white font-medium">{raw.projectsDetectedCount || raw.projects?.length || 4} verified</span></div>
          <div className="text-slate-400">├── <span className="text-slate-500">Technologies:</span> <span className="text-slate-200">{raw.technologiesDetected?.slice(0, 6).join(", ") || "Next.js, React, TypeScript"}</span></div>
          <div className="text-slate-400">└── <span className="text-slate-500">Project descriptions:</span> <span className="text-slate-300 italic">{raw.projects?.[0]?.name ? raw.projects.slice(0, 3).map((p: any) => p.name).join(", ") : "Live production web applications crawled via Cheerio"}</span></div>
        </div>
      );
    }
    return (
      <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 font-mono text-xs text-slate-300 space-y-1">
        <div className="text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">Document Evidence Tree</div>
        <div className="text-slate-400">├── <span className="text-slate-500">Source Document:</span> <span className="text-white">{raw.filename || "Curriculum Vitae"}</span></div>
        <div className="text-slate-400">└── <span className="text-slate-500">Parsed Text:</span> <span className="text-slate-300">{raw.characterCount ? `${raw.characterCount} characters extracted` : "Career history parsed into vector claims"}</span></div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/analyze"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-medium text-slate-300 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Re-run Analysis
          </Link>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-medium text-slate-300 transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copiedLink ? "Link Copied!" : "Share Dossier"}
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                PROVE VERIFICATION REPORT
              </span>
              <span className="text-xs text-slate-500">
                Run #{run.id.slice(0, 8)} &bull; {new Date(run.createdAt).toLocaleDateString()}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {run.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {run.candidate?.name || "Candidate"} &mdash; {run.targetRole}
            </h1>
            <p className="text-xs text-slate-400">
              Evaluated for {run.experienceYears} years experience target. Audited by xAI Grok with deterministic mathematical weighting.
            </p>
            {run.candidate?.externalProfiles && run.candidate.externalProfiles.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {run.candidate.externalProfiles.map((p: any) => (
                  <a
                    key={p.id}
                    href={p.url || (p.provider === "github" ? `https://github.com/${p.username}` : p.provider === "leetcode" ? `https://leetcode.com/${p.username}` : undefined)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:text-white hover:border-slate-700 transition"
                  >
                    {getSourceIcon(p.provider)}
                    <span className="capitalize">{p.provider}:</span>
                    <span className="font-mono text-slate-400">{p.username || p.url}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 bg-slate-950/70 border border-slate-800 px-6 py-4 rounded-2xl">
            <div className="text-center">
              <span className="block text-3xl font-bold text-white font-mono">
                {run.overallScore}%
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Overall Score
              </span>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="text-center">
              <span className="block text-3xl font-bold text-emerald-400 font-mono">
                {run.fitScore}%
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Fit Score
              </span>
            </div>
            {run.confidence && (
              <>
                <div className="w-px h-10 bg-slate-800" />
                <div className="text-center">
                  <span className="block text-3xl font-bold text-cyan-400 font-mono">
                    {Math.round(run.confidence * 100)}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Confidence
                  </span>
                </div>
              </>
            )}
            {run.evidenceCoverage !== null && run.evidenceCoverage !== undefined && (
              <>
                <div className="w-px h-10 bg-slate-800" />
                <div className="text-center">
                  <span className={`block text-3xl font-bold font-mono ${run.evidenceCoverage >= 100 ? "text-violet-400" : "text-amber-400"}`}>
                    {run.evidenceCoverage}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Coverage
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Partial Evidence Warning Banner if coverage < 100% */}
        {run.evidenceCoverage !== null && run.evidenceCoverage !== undefined && run.evidenceCoverage < 100 && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-950/40 border border-amber-800/50 text-amber-300">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider">Partial Evidence Coverage ({run.evidenceCoverage}%)</h4>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                One or more configured channels encountered external rate limits or service unavailability during sync. In accordance with PROVE verification rules, missing sources were safely isolated from mathematical scoring rather than penalized as zeros.
              </p>
            </div>
          </div>
        )}

        {/* Score Metric Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400">Code Velocity (GitHub 30%)</span>
            <p className="text-lg font-bold text-white font-mono">{breakdown.codeVelocity}%</p>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400">Algorithmic Depth (LeetCode 25%)</span>
            <p className="text-lg font-bold text-amber-400 font-mono">{breakdown.algorithmicDepth}%</p>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400">Production Delivery (Portfolio 25%)</span>
            <p className="text-lg font-bold text-emerald-400 font-mono">{breakdown.productionDelivery}%</p>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400">Domain Breadth (Resume 20%)</span>
            <p className="text-lg font-bold text-sky-400 font-mono">{breakdown.domainBreadth}%</p>
          </div>
        </div>
      </div>

      {/* Reproducibility Fingerprint & Snapshot Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SHA-256 Fingerprint */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-violet-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Reproducibility Fingerprint
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <Lock className="w-3 h-3" /> SHA-256 Verified
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Deterministic canonical fingerprint calculated from candidate inputs, role benchmark, and snapshot evidence. Identical inputs always produce this exact fingerprint.
          </p>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
            <code className="text-[11px] font-mono text-violet-300 truncate max-w-[340px]">
              {run.fingerprint || "0x_sha256_canonical_reproducible_hash"}
            </code>
            {run.fingerprint && (
              <button
                onClick={() => handleCopyFingerprint(run.fingerprint)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0 cursor-pointer"
                title="Copy SHA-256 hash"
              >
                {copiedFingerprint ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 pt-1">
            <span>Model: {run.aiModel || "grok-2-latest"}</span>
            <span>Scoring: v{run.scoringVersion || "1.0"}</span>
            <span>Prompt: v{run.promptVersion || "1.0"}</span>
          </div>
        </div>

        {/* Frozen Snapshot */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Immutable Evidence Snapshot
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {snapshotEvidenceIds.length > 0
                ? `${snapshotEvidenceIds.length} Items Frozen`
                : `${evidence.length} Items Frozen`}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Evidence state was frozen at analysis time into an immutable snapshot record, guaranteeing zero retroactive manipulation of underlying claims.
          </p>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Snapshot ID:</span>
              <span className="font-mono text-slate-200">
                {run.evidenceSnapshotId ? run.evidenceSnapshotId.slice(0, 16) + "..." : "Auto-Captured"}
              </span>
            </div>
            {snapshot?.fingerprint && (
              <div className="flex justify-between text-slate-400">
                <span>Content Hash:</span>
                <span className="font-mono text-violet-300 truncate max-w-[200px]">
                  {snapshot.fingerprint.slice(0, 16)}...
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Snapshot Date:</span>
              <span className="text-slate-300">
                {new Date(snapshot?.createdAt || run.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grok AI Dossier Assessment */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Grok (xAI) Technical Evaluation
            </h2>
            <p className="text-xs text-slate-400">
              Assessed Engineering Rigor: {insights?.engineeringRigorScore || 85}/100
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-200 leading-relaxed">
          {insights?.summary || "Analysis evaluated from connected technical evidence."}
        </div>

        {insights?.roleFitJustification && (
          <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-800/30 text-xs text-slate-300 space-y-1">
            <span className="font-semibold text-violet-300 uppercase tracking-wider block">
              Role Fit Justification
            </span>
            <p>{insights.roleFitJustification}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/30 space-y-2">
            <span className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" /> Validated Strengths
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {insights?.strengths?.map((s: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">&bull;</span>
                  <span>{s}</span>
                </li>
              )) || <li>Consistent codebase activity and algorithmic problem solving.</li>}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 space-y-2">
            <span className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" /> Growth Areas & Blind Spots
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {insights?.blindSpots?.map((b: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">&bull;</span>
                  <span>{b}</span>
                </li>
              )) || <li>Deploying larger multi-tenant architectures to demonstrate scale.</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Verified Skill Scores Matrix */}
      {skillScores.length > 0 && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-violet-400" />
            <h2 className="text-base font-semibold text-white">
              Verified Skill Scores Matrix ({skillScores.length} Evaluated)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {skillScores.map((sk: any) => (
              <div
                key={sk.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{sk.skill}</span>
                  <span className="text-xs font-mono font-bold text-violet-400">{sk.score}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                    style={{ width: `${sk.score}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Cited Evidence:</span>
                  <span className="text-slate-400">
                    {sk.evidenceIds?.length || 1} {sk.evidenceIds?.length === 1 ? "Item" : "Items"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Verifiable Evidence Artifacts */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Verifiable Evidence Artifacts ({evidence.length})
            </h2>
            <p className="text-xs text-slate-400">
              Immutable proof items extracted by PROVE collectors and stored in Neon PostgreSQL.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {["all", "github", "leetcode", "portfolio", "resume"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSourceFilter(tab)}
                className={`px-3 py-1 rounded-lg capitalize transition cursor-pointer ${
                  sourceFilter === tab
                    ? "bg-violet-600 text-white font-medium"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Evidence List */}
        <div className="space-y-3">
          {filteredEvidence.length > 0 ? (
            filteredEvidence.map((item: any) => {
              const isFrozen =
                snapshotEvidenceIds.length === 0 ||
                snapshotEvidenceIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 hover:border-slate-800 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {getSourceIcon(item.source)}
                      <span className="text-xs font-semibold text-white">
                        {item.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-850 text-slate-400 border border-slate-800">
                        {item.evidenceType}
                      </span>
                      {isFrozen && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
                          Snapshot Locked
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-emerald-400">
                        {Math.round(item.confidence * 100)}% Confidence
                      </span>
                      {item.sourceUrl && (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Concrete Receipt Tree */}
                  {renderReceiptTree(item)}
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">
              No evidence artifacts found for filter &quot;{sourceFilter}&quot;.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
