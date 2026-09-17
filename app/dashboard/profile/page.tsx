"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Github,
  Code2,
  Globe,
  UploadCloud,
  FileText,
  CheckCircle2,
  Loader2,
  Sparkles,
  Save,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Trash2,
  RefreshCw,
  ExternalLink,
  Clock,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export default function ProfileSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [deletingResumeId, setDeletingResumeId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [github, setGithub] = useState("");
  const [leetcode, setLeetcode] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [profilesStatus, setProfilesStatus] = useState<
    Record<string, { status: string; lastSyncedAt?: string }>
  >({});
  const [resumes, setResumes] = useState<any[]>([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.candidate) {
          setName(data.candidate.name || "");
          const statusMap: Record<string, { status: string; lastSyncedAt?: string }> = {};
          if (data.candidate.externalProfiles) {
            data.candidate.externalProfiles.forEach((ep: any) => {
              statusMap[ep.provider] = {
                status: ep.status || "pending",
                lastSyncedAt: ep.lastSyncedAt,
              };
              if (ep.provider === "github") setGithub(ep.username || "");
              if (ep.provider === "leetcode") setLeetcode(ep.username || "");
              if (ep.provider === "portfolio") setPortfolio(ep.profileUrl || "");
            });
          }
          setProfilesStatus(statusMap);
          if (data.candidate.resumes) {
            setResumes(data.candidate.resumes);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      toast.error("Failed to load profile signals");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          github,
          leetcode,
          portfolio,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save profile signals.");
      }

      toast.success("Profile signals saved! Ready for evidence pipeline.");
      await fetchProfile();
    } catch (err: any) {
      toast.error(err?.message || "Error saving profile signals.");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncSource = async (provider: "github" | "leetcode" | "portfolio") => {
    try {
      setSyncingProvider(provider);
      // Save first to ensure the username/URL is persisted
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, github, leetcode, portfolio }),
      });

      const res = await fetch("/api/profile/sources/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errorCode === "RATE_LIMITED") {
          toast.error("Rate limit reached for " + provider);
        } else if (data.errorCode === "SSRF_BLOCKED") {
          toast.error("URL rejected: Private IP or invalid destination.");
        } else {
          toast.error(data.error || `Failed to sync ${provider}`);
        }
        await fetchProfile();
        return;
      }

      toast.success(
        `Synced ${provider}! Extracted ${data.evidenceCount} verified evidence items (${data.newItemsInserted} new).`
      );
      await fetchProfile();
    } catch (err: any) {
      toast.error(err?.message || `Sync failed for ${provider}`);
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      toast.error("Only PDF files are supported.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit.");
      return;
    }

    try {
      setUploadingResume(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload resume.");
      }

      toast.success(`Resume "${file.name}" uploaded and parsed into evidence!`);
      await fetchProfile();
    } catch (err: any) {
      toast.error(err?.message || "Error uploading resume.");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDeleteResume = async (resumeId: string, filename: string) => {
    try {
      setDeletingResumeId(resumeId);
      const res = await fetch(`/api/profile/resume?id=${resumeId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete resume.");
      }

      toast.success(`Resume "${filename}" removed.`);
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
    } catch (err: any) {
      toast.error(err?.message || "Error deleting resume.");
    } finally {
      setDeletingResumeId(null);
    }
  };

  const formatLastSynced = (dateStr?: string) => {
    if (!dateStr) return "Never synced";
    const d = new Date(dateStr);
    const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <p className="text-sm text-slate-400">Loading candidate profile signals...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Candidate Signal Setup
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Deterministic Ingestion
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Connect verifiable proof channels. Grok & the PROVE engine crawl raw artifacts to build your cryptographic-grade evidence dossier.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/analyze")}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-violet-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Launch Pipeline
          </button>
        </div>
      </div>

      {/* Main Configuration Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Identity Credentials</h2>
              <p className="text-xs text-slate-400">
                Primary candidate identity linked to your verified Neon Auth session.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Full Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Satoshi Nakamoto"
              required
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-600 outline-none transition"
            />
          </div>
        </div>

        {/* Proof Providers Section */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">External Proof Channels</h2>
              <p className="text-xs text-slate-400">
                Enter usernames or URLs and click Sync to pull verified commits, algorithmic metrics, and architecture.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GitHub */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <Github className="w-4 h-4 text-violet-400" />
                  GitHub Username
                </label>
                <div className="flex items-center gap-2">
                  {profilesStatus.github && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border capitalize ${
                        profilesStatus.github.status === "synced"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : profilesStatus.github.status === "rate_limited"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {profilesStatus.github.status}
                    </span>
                  )}
                </div>
              </div>

              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="torvalds or github.com/torvalds"
                className="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-600 outline-none transition"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" /> {formatLastSynced(profilesStatus.github?.lastSyncedAt)}
                </span>
                <button
                  type="button"
                  onClick={() => handleSyncSource("github")}
                  disabled={!github.trim() || syncingProvider === "github"}
                  className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {syncingProvider === "github" ? (
                    <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Sync GitHub
                </button>
              </div>
            </div>

            {/* LeetCode */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  LeetCode Username
                </label>
                {profilesStatus.leetcode && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border capitalize ${
                      profilesStatus.leetcode.status === "synced"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {profilesStatus.leetcode.status}
                  </span>
                )}
              </div>

              <input
                type="text"
                value={leetcode}
                onChange={(e) => setLeetcode(e.target.value)}
                placeholder="e.g. neetcode"
                className="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-600 outline-none transition"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" /> {formatLastSynced(profilesStatus.leetcode?.lastSyncedAt)}
                </span>
                <button
                  type="button"
                  onClick={() => handleSyncSource("leetcode")}
                  disabled={!leetcode.trim() || syncingProvider === "leetcode"}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {syncingProvider === "leetcode" ? (
                    <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Sync LeetCode
                </button>
              </div>
            </div>

            {/* Portfolio / Personal Website */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <Globe className="w-4 h-4 text-sky-400" />
                  Portfolio or Technical Blog URL
                </label>
                {profilesStatus.portfolio && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border capitalize ${
                      profilesStatus.portfolio.status === "synced"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {profilesStatus.portfolio.status}
                  </span>
                )}
              </div>

              <input
                type="text"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                placeholder="https://yourportfolio.dev"
                className="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-600 outline-none transition"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" /> {formatLastSynced(profilesStatus.portfolio?.lastSyncedAt)}
                </span>
                <button
                  type="button"
                  onClick={() => handleSyncSource("portfolio")}
                  disabled={!portfolio.trim() || syncingProvider === "portfolio"}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {syncingProvider === "portfolio" ? (
                    <Loader2 className="w-3 h-3 animate-spin text-sky-400" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Scan Portfolio
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl text-xs sm:text-sm shadow-lg shadow-violet-600/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save All Signals
            </button>
          </div>
        </div>
      </form>

      {/* Resume Upload Section */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Curriculum Vitae / Resume</h2>
            <p className="text-xs text-slate-400">
              Upload PDF resume to extract career progression, tech stack claims, and cross-reference against code evidence.
            </p>
          </div>
        </div>

        <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 transition rounded-xl p-8 text-center bg-slate-950/30">
          <input
            type="file"
            id="resume-file"
            accept=".pdf"
            onChange={handleResumeUpload}
            className="hidden"
            disabled={uploadingResume}
          />
          <label
            htmlFor="resume-file"
            className="cursor-pointer flex flex-col items-center justify-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-violet-400 transition">
              {uploadingResume ? (
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">
                Click to upload PDF resume
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Maximum file size: 10MB (.pdf only)
              </p>
            </div>
          </label>
        </div>

        {/* Existing uploaded resumes */}
        {resumes.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Ingested Resumes ({resumes.length})
            </h3>
            <div className="space-y-2">
              {resumes.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-medium text-slate-200">{r.filename}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        ({r.parsedText ? `${r.parsedText.length.toLocaleString()} characters parsed` : "Parsed"})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteResume(r.id, r.filename)}
                      disabled={deletingResumeId === r.id}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Remove resume"
                    >
                      {deletingResumeId === r.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
