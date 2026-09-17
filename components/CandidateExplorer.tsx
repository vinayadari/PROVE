"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Code2,
  Github,
  Globe2,
  FileText,
  Filter,
  Loader2,
} from "lucide-react";
import { api, CandidateProfile, SignalReceipt } from "@/lib/api";
import { toast } from "sonner";

interface CandidateExplorerProps {
  onRequestAccess: () => void;
}

export default function CandidateExplorer({ onRequestAccess }: CandidateExplorerProps) {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);

  useEffect(() => {
    async function loadCandidates() {
      try {
        setLoading(true);
        const res = await api.getCandidates();
        setCandidates(res.data);
        if (res.data.length > 0) {
          setSelectedCandidate(res.data[0]);
        }
      } catch (err: any) {
        console.error("Failed to load candidates", err);
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, []);

  const filteredCandidates = candidates.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.topSkills.some((s) => s.toLowerCase().includes(q))
    );
  });

  const getSourceIcon = (source: SignalReceipt["source"]) => {
    switch (source) {
      case "GitHub":
        return <Github className="h-4 w-4 text-violet-400" />;
      case "LeetCode":
        return <Code2 className="h-4 w-4 text-cyan-400" />;
      case "Portfolio":
        return <Globe2 className="h-4 w-4 text-pink-400" />;
      default:
        return <FileText className="h-4 w-4 text-amber-300" />;
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0f101d]/90 p-5 sm:p-8 backdrop-blur-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/8 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-violet-300">
            <Users className="h-3.5 w-3.5" /> Live Candidate Intelligence Pool
          </div>
          <h3 className="mt-1 font-display text-2xl font-semibold text-white">
            Explore Verified Talent
          </h3>
          <p className="text-xs text-white/50">
            Real engineering profiles verified by proof, code history, and verifiable delivery.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
          <input
            type="text"
            placeholder="Search by skill, name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-white/10 bg-white/[0.04] pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:border-violet-400 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center text-white/50 gap-2 text-xs">
          <Loader2 className="h-4 w-4 animate-spin text-violet-400" /> Fetching live candidate intelligence data...
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Candidate list */}
          <div className="lg:col-span-5 space-y-2.5">
            {filteredCandidates.map((c) => {
              const active = selectedCandidate?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCandidate(c)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 ${
                    active
                      ? "border-violet-500/40 bg-violet-600/10 shadow-lg shadow-violet-900/20"
                      : "border-white/6 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xs font-bold text-white shadow">
                        {c.avatar}
                      </div>
                      <div>
                        <div className="font-display text-sm font-semibold text-white">{c.name}</div>
                        <div className="text-[11px] text-white/45">{c.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-lg font-bold text-white">{c.overallScore}</span>
                      <span className="text-[10px] text-violet-300">/100</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.topSkills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md border border-white/8 bg-white/[0.03] px-2 py-0.5 text-[9px] text-white/60 font-mono"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Candidate Detailed Evidence View */}
          <div className="lg:col-span-7">
            {selectedCandidate ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-5">
                <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display text-xl font-bold text-white">{selectedCandidate.name}</h4>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-medium text-emerald-300">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                      </span>
                    </div>
                    <p className="text-xs text-white/50">{selectedCandidate.role} · {selectedCandidate.location}</p>
                  </div>

                  <button
                    onClick={onRequestAccess}
                    className="rounded-full bg-violet-600 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-violet-500"
                  >
                    Unlock full profile
                  </button>
                </div>

                {/* Score breakdown metrics */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-xl border border-white/8 bg-black/20 p-2">
                    <div className="text-[9px] uppercase tracking-wider text-white/40">System Design</div>
                    <div className="font-display text-sm font-bold text-violet-300">
                      {selectedCandidate.breakdown.systemDesign}%
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-black/20 p-2">
                    <div className="text-[9px] uppercase tracking-wider text-white/40">Problem Solving</div>
                    <div className="font-display text-sm font-bold text-cyan-300">
                      {selectedCandidate.breakdown.problemSolving}%
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-black/20 p-2">
                    <div className="text-[9px] uppercase tracking-wider text-white/40">Code Quality</div>
                    <div className="font-display text-sm font-bold text-pink-300">
                      {selectedCandidate.breakdown.codeQuality}%
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-black/20 p-2">
                    <div className="text-[9px] uppercase tracking-wider text-white/40">Consistency</div>
                    <div className="font-display text-sm font-bold text-amber-300">
                      {selectedCandidate.breakdown.consistency}%
                    </div>
                  </div>
                </div>

                {/* Verified Signals Receipts */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60 mb-2.5 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Verified Evidence Receipts
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedCandidate.signals.map((signal, idx) => (
                      <div key={idx} className="rounded-xl border border-white/8 bg-black/30 p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-medium text-white/90">
                            {getSourceIcon(signal.source)}
                            <span>{signal.metric}</span>
                          </div>
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            {signal.confidenceScore}% verified
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-white/50">{signal.detail}</p>
                        <div className="mt-2 space-y-1">
                          {signal.evidencePoints.map((ep, eIdx) => (
                            <div key={eIdx} className="text-[10px] text-white/40 flex items-center gap-1.5">
                              <span className="h-1 w-1 rounded-full bg-violet-400" /> {ep}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Insights */}
                <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-3.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                    <Sparkles className="h-3 w-3" /> PROVE Talent Insight
                  </div>
                  {selectedCandidate.insights.map((ins, i) => (
                    <div key={i} className="mt-1.5 text-xs text-white/80">
                      <span className="font-semibold text-white">{ins.title}:</span>{" "}
                      <span className="text-white/60">{ins.summary}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
