"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Github,
  Code2,
  Globe,
  FileText,
  Loader2,
  CheckCircle2,
  Cpu,
  Zap,
  XCircle,
  Clock,
  BarChart3,
  Target,
} from "lucide-react";
import { toast } from "sonner";

interface ProgressStep {
  step: string;
  status: "pending" | "running" | "completed" | "failed";
  detail?: string;
  startedAt?: string;
  completedAt?: string;
}

const STEP_LABELS: Record<string, string> = {
  initialize: "Initialize Pipeline",
  collect_github: "GitHub REST Collection",
  collect_leetcode: "LeetCode GraphQL Query",
  collect_portfolio: "Portfolio Web Crawl",
  collect_resume: "Resume PDF Parsing",
  snapshot: "Evidence Snapshot",
  analyze: "Grok (xAI) Synthesis",
  score: "Deterministic Scoring",
  fingerprint: "Reproducibility Fingerprint",
  finalize: "Report Generation",
};

export default function AnalyzePage() {
  const router = useRouter();
  const [targetRole, setTargetRole] = useState("Senior Fullstack Engineer");
  const [experienceYears, setExperienceYears] = useState(4);
  const [useGithub, setUseGithub] = useState(true);
  const [useLeetCode, setUseLeetCode] = useState(true);
  const [usePortfolio, setUsePortfolio] = useState(true);
  const [useResume, setUseResume] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [pipelineStatus, setPipelineStatus] = useState<string | null>(null);
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const roles = [
    "Senior Fullstack Engineer",
    "Backend Systems Engineer",
    "Staff Platform Architect",
    "Frontend Engineering Specialist",
    "AI / ML Infrastructure Engineer",
  ];

  // Fetch role benchmarks from /api/intelligence/benchmarks
  useEffect(() => {
    fetch("/api/intelligence/benchmarks")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBenchmarks(data.data);
        }
      })
      .catch((err) => console.warn("Failed to load benchmarks:", err));
  }, []);

  // Poll for progress when we have a runId
  const pollProgress = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/analysis/${id}/progress`);
      if (!res.ok) return;
      const data = await res.json();
      setProgressSteps(data.progress || []);
      setPipelineStatus(data.status);

      if (data.status === "completed") {
        if (pollingRef.current) clearInterval(pollingRef.current);
        toast.success("Analysis complete! Directing to verified report...");
        setTimeout(() => {
          router.push(`/dashboard/reports/${id}`);
        }, 800);
      } else if (data.status === "failed") {
        if (pollingRef.current) clearInterval(pollingRef.current);
        toast.error(data.error || "Pipeline execution failed");
        setSubmitting(false);
      }
    } catch {
      // Non-fatal polling error
    }
  }, [router]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setProgressSteps([]);
      setPipelineStatus("queued");

      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          experienceYears,
          sources: {
            github: useGithub,
            leetcode: useLeetCode,
            portfolio: usePortfolio,
            resume: useResume,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Analysis pipeline execution failed");
      }

      // Pipeline ran synchronously — redirect immediately
      if (data.status === "completed") {
        toast.success("Analysis complete! Directing to verified report...");
        setTimeout(() => {
          router.push(`/dashboard/reports/${data.runId}`);
        }, 600);
      } else {
        // If it returned a runId but isn't completed, start polling
        setRunId(data.runId);
        pollingRef.current = setInterval(() => pollProgress(data.runId), 1500);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to run analysis");
      setPipelineStatus(null);
    } finally {
      setSubmitting(false);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

  // Get active benchmark data matching target role
  const getActiveBenchmark = () => {
    if (!benchmarks) return null;
    const lower = targetRole.toLowerCase();
    if (lower.includes("frontend")) return { key: "frontend", ...benchmarks.frontend };
    if (lower.includes("ai") || lower.includes("ml")) return { key: "aiProduct", ...benchmarks.aiProduct };
    return { key: "backend", ...benchmarks.backend };
  };

  const activeBenchmark = getActiveBenchmark();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Autonomous Evidence Ingestion & Synthesis</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Launch Evidence Analysis Run
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Configure target role benchmarks and launch an auditable evaluation. PROVE crawls your linked public profiles, extracts verified competencies, and runs Grok AI synthesis backed by deterministic mathematical scoring.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Configuration Card */}
        <div className="lg:col-span-8">
          <form
            onSubmit={handleStartAnalysis}
            className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0d0e1a] border border-slate-800/80 shadow-2xl space-y-6"
          >
            {/* Target Role selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Target Role Benchmark
                </label>
                {activeBenchmark && (
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Target Threshold: {activeBenchmark.topPercentileThreshold}%
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                {roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className={`text-left px-4 py-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                      targetRole === role
                        ? "bg-violet-600/20 border-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{role}</span>
                      {targetRole === role && (
                        <CheckCircle2 className="w-4 h-4 text-violet-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Or type custom role title..."
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500 transition"
              />
            </div>

            {/* Live Market Benchmark Box */}
            {activeBenchmark && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                    Market Expectation Benchmark
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Avg Score: {activeBenchmark.avgOverallScore}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeBenchmark.keySignals?.map((sig: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] border border-slate-800"
                    >
                      &bull; {sig}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Years */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Target Experience Baseline
                </label>
                <span className="text-xs font-mono font-semibold text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20">
                  {experienceYears} {experienceYears === 1 ? "Year" : "Years"}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full accent-violet-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>Entry (0-1y)</span>
                <span>Mid (2-4y)</span>
                <span>Senior (5-8y)</span>
                <span>Staff/Lead (9y+)</span>
              </div>
            </div>

            {/* Signal Collector Toggles */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Active Evidence Collectors
                </label>
                <Link
                  href="/dashboard/profile"
                  className="text-xs text-violet-400 hover:text-violet-300 hover:underline"
                >
                  Manage Linked Accounts →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setUseGithub(!useGithub)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    useGithub
                      ? "bg-slate-900 border-violet-500/50 text-white"
                      : "bg-slate-950/50 border-slate-800/80 text-slate-500"
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-200">
                    <Github className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">GitHub REST Collector</p>
                    <p className="text-[10px] text-slate-400">Repos, stars, velocity</p>
                  </div>
                </label>

                <label
                  onClick={() => setUseLeetCode(!useLeetCode)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    useLeetCode
                      ? "bg-slate-900 border-amber-500/50 text-white"
                      : "bg-slate-950/50 border-slate-800/80 text-slate-500"
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-800 text-amber-400">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">LeetCode GraphQL</p>
                    <p className="text-[10px] text-slate-400">Algorithms & contest rank</p>
                  </div>
                </label>

                <label
                  onClick={() => setUsePortfolio(!usePortfolio)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    usePortfolio
                      ? "bg-slate-900 border-cyan-500/50 text-white"
                      : "bg-slate-950/50 border-slate-800/80 text-slate-500"
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Portfolio Web Crawler</p>
                    <p className="text-[10px] text-slate-400">Live projects & tech stack</p>
                  </div>
                </label>

                <label
                  onClick={() => setUseResume(!useResume)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    useResume
                      ? "bg-slate-900 border-emerald-500/50 text-white"
                      : "bg-slate-950/50 border-slate-800/80 text-slate-500"
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-800 text-emerald-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Resume PDF Parser</p>
                    <p className="text-[10px] text-slate-400">Career tenure & stack</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Live Pipeline Progress */}
            {submitting && progressSteps.length > 0 && (
              <div className="p-5 rounded-xl bg-slate-950/80 border border-violet-500/20 space-y-2.5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                    Pipeline Executing ({pipelineStatus || "running"})
                  </span>
                </div>
                {progressSteps.map((step) => (
                  <div
                    key={step.step}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition ${
                      step.status === "running"
                        ? "bg-violet-950/40 border border-violet-500/20 text-white"
                        : step.status === "completed"
                        ? "text-slate-400"
                        : step.status === "failed"
                        ? "text-rose-400"
                        : "text-slate-600"
                    }`}
                  >
                    {getStepIcon(step.status)}
                    <span className="font-medium">
                      {STEP_LABELS[step.step] || step.step}
                    </span>
                    {step.detail && (
                      <span className="ml-auto text-[10px] font-mono text-slate-500 truncate max-w-[200px]">
                        {step.detail}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Simple progress for non-polling mode */}
            {submitting && progressSteps.length === 0 && (
              <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-500/30 text-violet-200 text-xs flex items-center gap-3 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-violet-400 shrink-0" />
                <span>Initializing evidence pipeline & freezing snapshot...</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm shadow-xl shadow-violet-600/25 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running Evidence Pipeline...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Execute Analysis & Generate Report
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar Info Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-400" />
              Evaluation Methodology
            </h3>

            <div className="space-y-3 text-xs text-slate-400">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="font-semibold text-slate-200 mb-1">1. Verifiable Ingestion</p>
                <p className="text-[11px] leading-relaxed">
                  Collectors fetch live JSON, GraphQL, and HTML data directly from primary sources, discarding unverified self-claims.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="font-semibold text-slate-200 mb-1">2. Evidence Snapshot</p>
                <p className="text-[11px] leading-relaxed">
                  All collected evidence is frozen into an immutable snapshot with a content-based SHA-256 fingerprint before analysis begins.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="font-semibold text-slate-200 mb-1">3. xAI Grok Synthesis</p>
                <p className="text-[11px] leading-relaxed">
                  Grok analyzes repository architecture, commit velocity, and algorithmic distribution to extract verified competencies with concrete proof citations.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="font-semibold text-slate-200 mb-1">4. Deterministic Scoring</p>
                <p className="text-[11px] leading-relaxed">
                  Mathematical formulas calculate code velocity (30%), algorithmic depth (25%), production delivery (25%), and domain breadth (20%).
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-950/20 to-fuchsia-950/20 border border-violet-500/20 text-xs">
            <div className="flex items-center gap-2 text-violet-300 font-semibold mb-2">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              Audit-Ready & Reproducible
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Every score is accompanied by an immutable SHA-256 fingerprint. Same candidate + same evidence + same role = identical score. No randomness, no variance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
