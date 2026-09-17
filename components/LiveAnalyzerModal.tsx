"use client";

import { useState } from "react";
import {
  X,
  Sparkles,
  Github,
  Code2,
  Globe2,
  Briefcase,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  BarChart3,
  Flame,
} from "lucide-react";
import { api, IntelligenceResult, SignalReceipt } from "@/lib/api";
import { toast } from "sonner";

interface LiveAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveAnalyzerModal({ isOpen, onClose }: LiveAnalyzerModalProps) {
  const [targetRole, setTargetRole] = useState("Senior Backend Engineer");
  const [github, setGithub] = useState("alex-dev");
  const [leetcode, setLeetcode] = useState("alex_codes");
  const [portfolio, setPortfolio] = useState("alexmorgan.dev");
  const [experienceYears, setExperienceYears] = useState(4);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntelligenceResult | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.analyzeSignals({
        targetRole,
        github: github.trim() || undefined,
        leetcode: leetcode.trim() || undefined,
        portfolio: portfolio.trim() || undefined,
        experienceYears,
      });
      setResult(res.data);
      toast.success("Intelligence report generated with live verified receipts!");
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0d0e18] p-5 sm:p-8 shadow-[0_25px_100px_rgba(0,0,0,.85)]">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-violet-600/15 blur-[100px]" />

        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-10 grid h-8 w-8 place-items-center rounded-full border border-white/10 text-white/50 transition hover:border-white/25 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-violet-300">
          <Sparkles className="h-3.5 w-3.5" /> Interactive Sandbox
        </div>
        <h2 className="mt-1.5 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Live Proof-of-Skill Engine
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-white/50 max-w-xl">
          Enter candidate evidence signals to evaluate capability in real time. Every calculated score is backed by an auditable trail of evidence.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Form input section */}
          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/75 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-300" /> Evidence Inputs
            </h3>

            <form onSubmit={handleAnalyze} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] text-white/60 mb-1">Target Engineering Role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#141524] px-3 py-2 text-xs text-white focus:border-violet-400 focus:outline-none"
                >
                  <option value="Senior Backend Engineer">Senior Backend Engineer</option>
                  <option value="Full Stack / AI Engineer">Full Stack / AI Engineer</option>
                  <option value="Platform / DevOps Engineer">Platform / DevOps Engineer</option>
                  <option value="Distributed Systems Lead">Distributed Systems Lead</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1 flex items-center gap-1.5">
                  <Github className="h-3 w-3 text-violet-400" /> GitHub Handle
                </label>
                <input
                  type="text"
                  placeholder="e.g. torvalds or alex-dev"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#141524] px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-violet-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1 flex items-center gap-1.5">
                  <Code2 className="h-3 w-3 text-cyan-400" /> LeetCode Profile
                </label>
                <input
                  type="text"
                  placeholder="e.g. alex_codes"
                  value={leetcode}
                  onChange={(e) => setLeetcode(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#141524] px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-violet-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1 flex items-center gap-1.5">
                  <Globe2 className="h-3 w-3 text-pink-400" /> Portfolio / Live Project
                </label>
                <input
                  type="text"
                  placeholder="e.g. myproject.dev"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#141524] px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-violet-400 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-white/60 mb-1">
                  <span>Years of Experience</span>
                  <span className="font-mono text-violet-300 font-bold">{experienceYears} yrs</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={15}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Analyzing Signals...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate Evidence Report
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results section */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            {result ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Score badge & header */}
                <div className="flex items-center justify-between rounded-2xl border border-white/12 bg-white/[0.04] p-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Computed Role Fit</div>
                    <div className="font-display text-2xl font-bold text-white">{result.targetRole}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300">
                      {result.fitScore}%
                    </div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1 justify-end">
                      <ShieldCheck className="h-3 w-3" /> High Confidence
                    </div>
                  </div>
                </div>

                {/* 4 Dimension Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-xl border border-white/8 bg-black/30 p-2.5 text-center">
                    <div className="text-[10px] text-white/40">System Design</div>
                    <div className="font-display text-lg font-bold text-violet-300">{result.breakdown.systemDesign}%</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-black/30 p-2.5 text-center">
                    <div className="text-[10px] text-white/40">Problem Solving</div>
                    <div className="font-display text-lg font-bold text-cyan-300">{result.breakdown.problemSolving}%</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-black/30 p-2.5 text-center">
                    <div className="text-[10px] text-white/40">Code Quality</div>
                    <div className="font-display text-lg font-bold text-pink-300">{result.breakdown.codeQuality}%</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-black/30 p-2.5 text-center">
                    <div className="text-[10px] text-white/40">Consistency</div>
                    <div className="font-display text-lg font-bold text-amber-300">{result.breakdown.consistency}%</div>
                  </div>
                </div>

                {/* Evidence Receipts */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60 mb-2 flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-violet-400" /> Evidence Receipts ({result.signals.length})
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {result.signals.map((sig: SignalReceipt, i: number) => (
                      <div key={i} className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-xs">
                        <div className="flex items-center justify-between font-medium">
                          <span className="text-white/90">{sig.metric}</span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            {sig.confidenceScore}% confidence
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-white/50">{sig.detail}</p>
                        <div className="mt-2 space-y-1">
                          {sig.evidencePoints.map((pt, pIdx) => (
                            <div key={pIdx} className="text-[10px] text-white/40 flex items-center gap-1.5">
                              <span className="h-1 w-1 rounded-full bg-violet-400" /> {pt}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-3">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="font-display text-base font-semibold text-white">No Analysis Run Yet</div>
                <p className="mt-1 text-xs text-white/40 max-w-xs">
                  Fill in the signal parameters on the left and click Generate to see live proof receipts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
