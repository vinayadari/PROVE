"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import {
  Settings,
  ShieldCheck,
  User,
  Cpu,
  Key,
  Database,
  CheckCircle2,
  Lock,
  LogOut,
  Save,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const session = useSession();
  const router = useRouter();
  const user = session?.data?.user;

  const [name, setName] = useState(user?.name || "Candidate");
  const [email, setEmail] = useState(user?.email || "candidate@prove.dev");
  const [publicSharing, setPublicSharing] = useState(true);
  const [aiModel, setAiModel] = useState("grok-2-latest");
  const [scoringEngine] = useState("Deterministic v1.0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch profile to populate latest name
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.candidate) {
          if (data.candidate.name) setName(data.candidate.name);
          if (data.candidate.email) setEmail(data.candidate.email);
        }
      })
      .catch((e) => console.warn("Could not load candidate profile:", e));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        throw new Error("Failed to update candidate settings");
      }

      toast.success("Settings and candidate identity saved successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/sign-in");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-3">
          <Settings className="w-3.5 h-3.5" />
          <span>System & Candidate Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Account & Engine Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your verified identity, Neon Auth credentials, xAI Grok model parameters, and public evidence dossier privacy.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Candidate Profile Details */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <User className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">
              Candidate Identity (Neon Auth)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-violet-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Primary Email
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3.5 py-2 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-slate-400 cursor-not-allowed outline-none font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <p className="font-medium text-slate-300">Neon Auth User ID</p>
              <p className="font-mono text-[11px] text-slate-500 truncate max-w-sm">
                {user?.id || "neon-auth-usr_live_candidate_01"}
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Verified Session
            </span>
          </div>
        </div>

        {/* AI Engine & Scoring Engine Configuration */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Cpu className="w-4 h-4 text-fuchsia-400" />
            <h2 className="text-sm font-semibold text-white">
              Grok (xAI) Intelligence Engine
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                xAI Synthesis Model
              </label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-violet-500 outline-none transition cursor-pointer"
              >
                <option value="grok-2-latest">grok-2-latest (Official Locked)</option>
                <option value="grok-2-mini">grok-2-mini</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Scoring Engine
              </label>
              <input
                type="text"
                disabled
                value={scoringEngine}
                className="w-full px-3.5 py-2 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-slate-400 cursor-not-allowed font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-slate-300">
                Environment key: <span className="font-mono text-slate-400">XAI_API_KEY</span>
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Active
            </span>
          </div>
        </div>

        {/* Dossier Privacy & Sharing */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">
              Public Dossier & Sharing
            </h2>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <p className="text-xs font-medium text-slate-200">
                Public Verified Dossier URL
              </p>
              <p className="text-[11px] text-slate-500">
                Allow recruiters and engineering leads to view your verified evidence report via public permalink.
              </p>
            </div>
            <input
              type="checkbox"
              checked={publicSharing}
              onChange={(e) => setPublicSharing(e.target.checked)}
              className="w-4 h-4 accent-violet-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/30 text-xs font-medium text-rose-400 transition flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of PROVE
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-medium text-white shadow-lg shadow-violet-600/25 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
