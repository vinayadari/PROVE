"use client";

import { useState } from "react";
import { X, Sparkles, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { api, WaitlistPayload } from "@/lib/api";
import { toast } from "sonner";

interface RequestAccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: "recruiter" | "candidate" | "engineering_leader";
}

export default function RequestAccessDialog({
  isOpen,
  onClose,
  defaultRole = "recruiter",
}: RequestAccessDialogProps) {
  const [roleType, setRoleType] = useState<"recruiter" | "candidate" | "engineering_leader">(defaultRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyOrPortfolio, setCompanyOrPortfolio] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please provide both name and email.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: WaitlistPayload = {
        name,
        email,
        roleType,
        companyOrPortfolio: companyOrPortfolio.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const res = await api.requestAccess(payload);
      setSubmitted(true);
      toast.success(res.message || "Access request received!");
    } catch (err: any) {
      toast.error(err.message || "Could not submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-[#0e0f1a] p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,.75)]">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />

        <button
          onClick={onClose}
          className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full border border-white/10 text-white/50 transition hover:border-white/25 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {submitted ? (
          <div className="py-6 text-center animate-in zoom-in-95 duration-300">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight text-white">
              You're on the priority list
            </h3>
            <p className="mt-2 text-sm text-white/55 leading-relaxed max-w-sm mx-auto">
              We're rolling out PROVE in curated batches to maintain signal precision. We'll email you with your early access credentials shortly.
            </p>
            <div className="mt-7 flex justify-center">
              <button
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="rounded-full bg-white/10 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-violet-300">
              <Sparkles className="h-3.5 w-3.5" /> Early Access
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white">
              Request Platform Access
            </h2>
            <p className="mt-1 text-xs text-white/50">
              Join leading tech teams and engineers moving to evidence-based talent intelligence.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Role toggle */}
              <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/30 p-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setRoleType("recruiter")}
                  className={`rounded-lg py-2 font-medium transition ${
                    roleType === "recruiter"
                      ? "bg-violet-600 text-white shadow"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Recruiter
                </button>
                <button
                  type="button"
                  onClick={() => setRoleType("candidate")}
                  className={`rounded-lg py-2 font-medium transition ${
                    roleType === "candidate"
                      ? "bg-violet-600 text-white shadow"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setRoleType("engineering_leader")}
                  className={`rounded-lg py-2 font-medium transition ${
                    roleType === "engineering_leader"
                      ? "bg-violet-600 text-white shadow"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Tech Leader
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70 mb-1.5">
                  Full Name <span className="text-violet-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70 mb-1.5">
                  Email Address <span className="text-violet-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70 mb-1.5">
                  {roleType === "candidate" ? "GitHub or Portfolio URL" : "Company / Organization"}
                </label>
                <input
                  type="text"
                  placeholder={
                    roleType === "candidate"
                      ? "github.com/yourhandle or portfolio.dev"
                      : "Company name (e.g. Stripe, OpenAI)"
                  }
                  value={companyOrPortfolio}
                  onChange={(e) => setCompanyOrPortfolio(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70 mb-1.5">
                  What are you most excited to solve? (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Finding high-velocity Go engineers without resume spam"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-white placeholder:text-white/25 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      Request Early Access{" "}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-white/35">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> No spam. Direct verification access only.
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
