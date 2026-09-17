"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  Github,
  Code2,
  Globe,
  FileText,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Filter,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Code,
  Search,
  Copy,
  Check,
  RefreshCw,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";

interface EvidenceItem {
  id: string;
  source: "github" | "leetcode" | "portfolio" | "resume";
  sourceUrl?: string | null;
  evidenceType: string;
  title: string;
  description: string;
  rawData: any;
  confidence: number;
  collectedAt: string;
}

export default function EvidencePage() {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "confidence">("date");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadEvidence();
  }, []);

  const loadEvidence = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/evidence");
      if (res.ok) {
        const data = await res.json();
        setEvidenceList(data.evidence || []);
      }
    } catch (err) {
      console.error("Failed to load evidence:", err);
      toast.error("Failed to load evidence items");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadEvidence();
      toast.success("Evidence list refreshed from Neon PostgreSQL");
    } finally {
      setRefreshing(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (expandedIds.size > 0) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filteredEvidence.map((e) => e.id)));
    }
  };

  const handleCopyRaw = (id: string, rawData: any) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(JSON.stringify(rawData, null, 2));
      setCopiedId(id);
      toast.success("Raw JSON payload copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredEvidence = useMemo(() => {
    return evidenceList
      .filter((e) => {
        const matchesSource = selectedSource === "all" || e.source === selectedSource;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.evidenceType.toLowerCase().includes(q) ||
          (e.sourceUrl && e.sourceUrl.toLowerCase().includes(q));
        return matchesSource && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === "confidence") {
          return (b.confidence || 0) - (a.confidence || 0);
        }
        return new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime();
      });
  }, [evidenceList, selectedSource, searchQuery, sortBy]);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "github":
        return <Github className="w-4 h-4 text-violet-400" />;
      case "leetcode":
        return <Code2 className="w-4 h-4 text-amber-400" />;
      case "portfolio":
        return <Globe className="w-4 h-4 text-cyan-400" />;
      case "resume":
        return <FileText className="w-4 h-4 text-emerald-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "github":
        return "bg-violet-500/10 text-violet-300 border-violet-500/30";
      case "leetcode":
        return "bg-amber-500/10 text-amber-300 border-amber-500/30";
      case "portfolio":
        return "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
      case "resume":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Auditable Evidence Records</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Collected Technical Evidence
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Verifiable artifacts extracted from linked repositories, coding profiles, deployed systems, and parsed resumes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center cursor-pointer disabled:opacity-50"
            title="Refresh evidence list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-violet-400" : ""}`} />
          </button>
          <Link
            href="/dashboard/profile"
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition"
          >
            Signal Setup
          </Link>
          <Link
            href="/dashboard/analyze"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-medium text-white shadow-lg shadow-violet-600/20 flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5" /> Run Analysis
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-xs text-slate-400 font-medium">Total Evidence Rows</p>
          <p className="text-2xl font-bold text-white mt-1">
            {evidenceList.length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-xs text-slate-400 font-medium">Verified Sources</p>
          <p className="text-2xl font-bold text-violet-400 mt-1">
            {new Set(evidenceList.map((e) => e.source)).size} / 4
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-xs text-slate-400 font-medium">Avg Confidence</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {evidenceList.length > 0
              ? `${Math.round(
                  (evidenceList.reduce((acc, e) => acc + (e.confidence || 1), 0) /
                    evidenceList.length) *
                    100
                )}%`
              : "100%"}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-xs text-slate-400 font-medium">Verification Status</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5" /> Active
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Source Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "All Artifacts" },
            { id: "github", label: "GitHub" },
            { id: "leetcode", label: "LeetCode" },
            { id: "portfolio", label: "Portfolio" },
            { id: "resume", label: "Resume" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedSource(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                selectedSource === tab.id
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input & Sort */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search evidence..."
              className="pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500 w-44 sm:w-56"
            />
          </div>

          <button
            onClick={() => setSortBy(sortBy === "date" ? "confidence" : "date")}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3 h-3" />
            <span className="capitalize">{sortBy}</span>
          </button>

          {filteredEvidence.length > 0 && (
            <button
              onClick={toggleAll}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              {expandedIds.size > 0 ? "Collapse All" : "Expand All"}
            </button>
          )}
        </div>
      </div>

      {/* Evidence Items List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          <p className="text-xs font-mono">Querying candidate evidence table...</p>
        </div>
      ) : filteredEvidence.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 grid place-items-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              No evidence artifacts found
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery
                ? `No artifacts matching query "${searchQuery}".`
                : "Connect your GitHub, LeetCode, or Portfolio in Profile Setup and trigger an analysis run to ingest verified evidence."}
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Link
              href="/dashboard/profile"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition"
            >
              Configure Profile
            </Link>
            <Link
              href="/dashboard/analyze"
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white transition"
            >
              Run Ingestion Pipeline
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvidence.map((item) => {
            const isExpanded = expandedIds.has(item.id);
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition overflow-hidden"
              >
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-slate-800/80 mt-0.5 shrink-0">
                      {getSourceIcon(item.source)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border uppercase tracking-wider ${getSourceBadge(
                            item.source
                          )}`}
                        >
                          {item.source}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {item.evidenceType}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          {Math.round((item.confidence || 1) * 100)}% Confidence
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750 transition"
                        title="Open source URL"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      className="text-xs text-violet-400 flex items-center gap-1 font-medium hover:underline"
                    >
                      {isExpanded ? "Hide Raw Data" : "Inspect Raw Data"}
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible raw data JSON viewer */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-950/90 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-violet-400" />
                        Verifiable Raw Payload Snapshot
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(item.collectedAt).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleCopyRaw(item.id, item.rawData)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy JSON
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-300 bg-[#07080f] p-4 rounded-xl border border-slate-800/80 overflow-x-auto max-h-72">
                      {JSON.stringify(item.rawData || {}, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
