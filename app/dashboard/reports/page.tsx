"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  FileSearch,
  ArrowUpRight,
  Loader2,
  Sparkles,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart2,
  TrendingUp,
  Award,
} from "lucide-react";
import { toast } from "sonner";

export default function ReportsListPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analysis");
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs || []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load evidence runs");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRun = async (e: React.MouseEvent, runId: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setDeletingId(runId);
      const res = await fetch(`/api/analysis?id=${runId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete run");
      }

      toast.success("Evidence run deleted");
      setRuns((prev) => prev.filter((r) => r.id !== runId));
    } catch (err: any) {
      toast.error(err?.message || "Error deleting run");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRuns = useMemo(() => {
    return runs.filter((r) => {
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || r.targetRole.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [runs, statusFilter, searchQuery]);

  // Aggregate metrics
  const avgScore =
    runs.length > 0
      ? Math.round(runs.reduce((sum, r) => sum + (r.overallScore || 0), 0) / runs.length)
      : 0;

  const topFit =
    runs.length > 0
      ? Math.max(...runs.map((r) => r.fitScore || 0))
      : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <p className="text-sm text-slate-400">Loading evidence runs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Evidence Reports Dossier
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Historical analysis dossiers, cryptographic SHA-256 fingerprints, and deterministic proofs.
          </p>
        </div>

        <Link
          href="/dashboard/analyze"
          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-violet-600/20 flex items-center gap-2 self-start sm:self-auto transition"
        >
          <Sparkles className="w-4 h-4" /> New Evidence Run
        </Link>
      </div>

      {/* Summary KPI Cards */}
      {runs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Runs Logged</p>
              <p className="text-2xl font-bold text-white mt-0.5">{runs.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Average Evidence Score</p>
              <p className="text-2xl font-bold text-violet-400 mt-0.5">{avgScore}%</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Peak Role Alignment</p>
              <p className="text-2xl font-bold text-emerald-400 mt-0.5">{topFit}%</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      {runs.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {["all", "completed", "failed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl text-xs font-medium capitalize transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search target role..."
              className="pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500 w-52 sm:w-64"
            />
          </div>
        </div>
      )}

      {/* Runs List */}
      {filteredRuns.length > 0 ? (
        <div className="space-y-3">
          {filteredRuns.map((r) => (
            <Link
              key={r.id}
              href={`/dashboard/reports/${r.id}`}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition group"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white group-hover:text-violet-300 transition text-sm">
                    {r.targetRole}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400">
                    {r.experienceYears}y exp
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${
                      r.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : r.status === "failed"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Created {new Date(r.createdAt).toLocaleString()}</span>
                  {r.fingerprint && (
                    <span className="font-mono text-[10px] text-slate-500">
                      &bull; SHA: {r.fingerprint.slice(0, 8)}...
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                <div className="text-right">
                  <span className="block text-xl font-bold text-white font-mono">
                    {r.overallScore ?? 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Evidence Score
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-xl font-bold text-emerald-400 font-mono">
                    {r.fitScore ?? 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Role Fit
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => handleDeleteRun(e, r.id)}
                    disabled={deletingId === r.id}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
                    title="Delete run"
                  >
                    {deletingId === r.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>

                  <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-white transition">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-3">
          <FileSearch className="w-10 h-10 text-slate-500 mx-auto" />
          <p className="text-sm text-slate-400">
            {searchQuery
              ? `No reports found for "${searchQuery}".`
              : "No reports generated yet."}
          </p>
          <Link
            href="/dashboard/analyze"
            className="inline-block px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-medium"
          >
            Go to Analyze & Run Pipeline
          </Link>
        </div>
      )}
    </div>
  );
}
