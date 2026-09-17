"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Sparkles,
  Zap,
  TrendingUp,
  Github,
  Code2,
  Globe,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  Target,
  BrainCircuit,
  Award,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [latestRun, setLatestRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Trigger state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>("Initializing...");
  const [targetRole, setTargetRole] = useState("Senior Fullstack Engineer");
  const [experienceYears, setExperienceYears] = useState("5");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, rRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/analysis"),
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setProfile(pData.candidate);
      }

      if (rRes.ok) {
        const rData = await rRes.json();
        setRuns(rData.runs || []);
        if (rData.runs && rData.runs.length > 0) {
          setLatestRun(rData.runs[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAnalysis = async () => {
    try {
      setAnalyzing(true);
      setAnalysisStep("Extracting signals from GitHub, LeetCode, Portfolio...");

      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          experienceYears: parseInt(experienceYears, 10),
        }),
      });

      setAnalysisStep("Grok (xAI) auditing technical depth & rigor...");

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Analysis failed.");
      }

      setAnalysisStep("Finalizing evidence dossier...");
      await new Promise((r) => setTimeout(r, 400));

      if (data.runId) {
        router.push(`/dashboard/reports/${data.runId}`);
      } else {
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to complete evidence run.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <p className="text-sm text-slate-400">Loading verified candidate intelligence...</p>
      </div>
    );
  }

  const breakdown = latestRun?.breakdown || {
    codeVelocity: 75,
    algorithmicDepth: 70,
    productionDelivery: 80,
    domainBreadth: 65,
  };

  const insights = latestRun?.insights;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner with Candidate Overview */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/80 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CRYPTOGRAPHIC EVIDENCE DOSSIER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {profile?.name || "Verified Candidate"}
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Deterministic verification active. Real commits, algorithmic solutions, and production artifacts scored against market expectations.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 sm:gap-6 bg-slate-950/60 border border-slate-850 p-4 rounded-2xl backdrop-blur-md">
            <div className="text-center px-2 sm:px-4">
              <span className="block text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {latestRun?.overallScore ? `${latestRun.overallScore}%` : "—"}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Evidence Score
              </span>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="text-center px-2 sm:px-4">
              <span className="block text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
                {latestRun?.fitScore ? `${latestRun.fitScore}%` : "—"}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Role Alignment
              </span>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="text-center px-2 sm:px-4">
              <span className="block text-2xl sm:text-3xl font-bold text-violet-400 tracking-tight">
                {insights?.assessedLevel || (latestRun ? "Verified" : "Pending")}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Assessed Level
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trigger New Analysis Action Card */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Run Autonomous Evidence Pipeline
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Crawl connected profiles, send artifacts to Grok (xAI), and re-generate your score.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-xs text-slate-400">Role:</span>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="bg-transparent text-xs text-slate-100 font-medium outline-none w-48"
                placeholder="Target Role"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-xs text-slate-400">Exp:</span>
              <select
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="bg-transparent text-xs text-slate-100 font-medium outline-none"
              >
                <option value="1" className="bg-slate-900">1-2 years</option>
                <option value="3" className="bg-slate-900">3-4 years</option>
                <option value="5" className="bg-slate-900">5+ years (Senior)</option>
                <option value="8" className="bg-slate-900">8+ years (Staff/Lead)</option>
              </select>
            </div>

            <button
              onClick={handleTriggerAnalysis}
              disabled={analyzing}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-500 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl text-xs shadow-lg shadow-violet-600/25 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{analysisStep}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Evidence Run</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Connected Signals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GitHub */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">GitHub Signals</p>
              <p className="text-[11px] text-slate-400">
                {profile?.externalProfiles?.find((p: any) => p.provider === "github")?.username ? (
                  <span className="text-emerald-400 font-mono">
                    @{profile.externalProfiles.find((p: any) => p.provider === "github").username}
                  </span>
                ) : (
                  <span className="text-slate-500">Not connected</span>
                )}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/profile"
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center"
          >
            Edit
          </Link>
        </div>

        {/* LeetCode */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-amber-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">LeetCode Metrics</p>
              <p className="text-[11px] text-slate-400">
                {profile?.externalProfiles?.find((p: any) => p.provider === "leetcode")?.username ? (
                  <span className="text-emerald-400 font-mono">
                    @{profile.externalProfiles.find((p: any) => p.provider === "leetcode").username}
                  </span>
                ) : (
                  <span className="text-slate-500">Not connected</span>
                )}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/profile"
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center"
          >
            Edit
          </Link>
        </div>

        {/* Portfolio */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-sky-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Portfolio URL</p>
              <p className="text-[11px] text-slate-400 truncate max-w-[110px]">
                {profile?.externalProfiles?.find((p: any) => p.provider === "portfolio")?.profileUrl ? (
                  <span className="text-emerald-400">Connected</span>
                ) : (
                  <span className="text-slate-500">Not connected</span>
                )}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/profile"
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center"
          >
            Edit
          </Link>
        </div>

        {/* Resume */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Parsed CV</p>
              <p className="text-[11px] text-slate-400">
                {profile?.resumes && profile.resumes.length > 0 ? (
                  <span className="text-emerald-400">
                    {profile.resumes.length} Ingested
                  </span>
                ) : (
                  <span className="text-slate-500">None uploaded</span>
                )}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/profile"
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center"
          >
            Upload
          </Link>
        </div>
      </div>

      {/* Main Analysis Dossier Section */}
      {latestRun ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Grok Intelligence & Competencies */}
          <div className="lg:col-span-2 space-y-6">
            {/* Grok Synthesis Card */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      Grok (xAI) Evidence Synthesis
                    </h2>
                    <p className="text-xs text-slate-400">
                      Target Role: {latestRun.targetRole} &bull; {latestRun.experienceYears} Years Exp
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {insights?.assessedLevel || "Verified"} Candidate
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-sm leading-relaxed text-slate-200">
                {insights?.summary || "Analysis completed based on connected proof points."}
              </div>

              {/* Strengths and Blind Spots */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/30 space-y-2">
                  <span className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Strengths
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {insights?.strengths?.map((s: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">&bull;</span>
                        <span>{s}</span>
                      </li>
                    )) || (
                      <li>Consistent codebase activity and algorithmic problem solving.</li>
                    )}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 space-y-2">
                  <span className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5" /> Growth Gaps
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {insights?.blindSpots?.map((b: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">&bull;</span>
                        <span>{b}</span>
                      </li>
                    )) || (
                      <li>Deploying larger multi-tenant microservices to demonstrate scale.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Verified Competencies Table */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Verifiable Technical Proof Points
                </h3>
                <div className="space-y-2">
                  {insights?.verifiedCompetencies?.map((comp: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-white">{comp.skill}</span>
                        <p className="text-[11px] text-slate-400">{comp.evidenceProof}</p>
                      </div>
                      <span className="px-2 py-0.5 self-start sm:self-center rounded bg-slate-800 text-violet-300 font-mono text-[10px] border border-slate-700">
                        {comp.level}
                      </span>
                    </div>
                  )) || (
                    <p className="text-xs text-slate-500">No specific skills listed.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Deterministic Score Breakdown */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-violet-400" />
                <h2 className="text-base font-semibold text-white">Score Breakdown</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-300">Code Velocity (GitHub)</span>
                    <span className="text-slate-100 font-mono">{breakdown.codeVelocity}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full"
                      style={{ width: `${breakdown.codeVelocity}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-300">Algorithmic Mastery (LeetCode)</span>
                    <span className="text-slate-100 font-mono">{breakdown.algorithmicDepth}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                      style={{ width: `${breakdown.algorithmicDepth}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-300">Production Delivery</span>
                    <span className="text-slate-100 font-mono">{breakdown.productionDelivery}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      style={{ width: `${breakdown.productionDelivery}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-300">Domain Breadth</span>
                    <span className="text-slate-100 font-mono">{breakdown.domainBreadth}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full"
                      style={{ width: `${breakdown.domainBreadth}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <Link
                  href={`/dashboard/reports/${latestRun.id}`}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition"
                >
                  View Full Evidence Dossier <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Previous Runs History */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Run History ({runs.length})
              </h3>
              <div className="space-y-2">
                {runs.map((r) => (
                  <Link
                    key={r.id}
                    href={`/dashboard/reports/${r.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/50 hover:bg-slate-950 border border-slate-800/80 text-xs transition"
                  >
                    <div>
                      <span className="font-medium text-slate-200">{r.targetRole}</span>
                      <p className="text-[10px] text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-emerald-400 font-semibold">{r.overallScore}%</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/30">
          <Sparkles className="w-10 h-10 text-violet-400 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-white">No Evidence Runs Yet</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Link your GitHub, LeetCode, or Resume in Signal Setup, then execute an evidence run to generate your verified profile score.
          </p>
          <button
            onClick={handleTriggerAnalysis}
            disabled={analyzing}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-violet-600/20 transition cursor-pointer"
          >
            Start First Evidence Run
          </button>
        </div>
      )}
    </div>
  );
}
