"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDashed,
  Code2,
  FileText,
  Fingerprint,
  Github,
  Globe2,
  Layers3,
  Menu,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  Users,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import RequestAccessDialog from "@/components/RequestAccessDialog";
import LiveAnalyzerModal from "@/components/LiveAnalyzerModal";
import CandidateExplorer from "@/components/CandidateExplorer";

type Role = "recruiter" | "candidate";

type Signal = {
  label: string;
  detail: string;
  icon: typeof Github;
  color: string;
};

const signals: Signal[] = [
  { label: "GitHub", detail: "12 repos · consistent", icon: Github, color: "violet" },
  { label: "LeetCode", detail: "340 solved · 86th pct", icon: Code2, color: "cyan" },
  { label: "Portfolio", detail: "5 live projects", icon: Globe2, color: "pink" },
  { label: "Resume", detail: "2 roles · 4 years", icon: FileText, color: "amber" },
];

const capabilities = [
  {
    index: "01",
    title: "Aggregate the signal",
    body: "Pull together the work that already exists across GitHub, LeetCode, portfolios, credentials, and more.",
    icon: Layers3,
    tone: "violet",
  },
  {
    index: "02",
    title: "Understand the depth",
    body: "Go beyond presence. PROVE evaluates context, consistency, complexity, and the shape of someone's work.",
    icon: BrainCircuit,
    tone: "cyan",
  },
  {
    index: "03",
    title: "Explain the fit",
    body: "Every score comes with a trail of evidence—so decisions get faster without becoming a black box.",
    icon: ShieldCheck,
    tone: "pink",
  },
];

const tickerItems = ["GitHub", "LeetCode", "Portfolio", "Open source", "Certifications", "Production Systems", "Distributed Cache", "eBPF Probes"];

export default function Home() {
  const [role, setRole] = useState<Role>("recruiter");
  const [selectedSignals, setSelectedSignals] = useState<string[]>(signals.map((signal) => signal.label));
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [requestAccessOpen, setRequestAccessOpen] = useState(false);
  const [analyzerOpen, setAnalyzerOpen] = useState(false);
  const [defaultRequestRole, setDefaultRequestRole] = useState<"recruiter" | "candidate" | "engineering_leader">("recruiter");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const score = useMemo(() => Math.min(98, 56 + selectedSignals.length * 10), [selectedSignals.length]);

  const toggleSignal = (label: string) => {
    setSelectedSignals((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const openAccess = (r: "recruiter" | "candidate" | "engineering_leader" = "recruiter") => {
    setDefaultRequestRole(r);
    setRequestAccessOpen(true);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#090a12] text-[#f5f4fb] selection:bg-violet-500/40">
      <div className="grain" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-[-240px] h-[520px] w-[800px] -translate-x-1/2 rounded-full bg-violet-700/15 blur-[120px]" />

      {/* Navigation */}
      <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "border-b border-white/10 bg-[#090a12]/90 backdrop-blur-xl" : "bg-transparent"}`}>
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <button onClick={() => scrollTo("top")} className="group flex items-center gap-3 text-left" aria-label="Go to top">
            <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-[10px] bg-gradient-to-br from-violet-400 via-violet-600 to-fuchsia-600 shadow-[0_0_24px_rgba(139,92,246,.32)]">
              <span className="absolute h-3 w-3 rounded-full bg-white/90" />
              <span className="absolute h-8 w-px rotate-45 bg-white/50" />
            </span>
            <span className="font-display text-[19px] font-bold tracking-[-0.06em]">PROVE<span className="text-violet-400">.</span></span>
          </button>

          <div className="hidden items-center gap-8 text-[13px] text-white/55 md:flex">
            <button className="transition-colors hover:text-white" onClick={() => scrollTo("platform")}>Platform</button>
            <button className="transition-colors hover:text-white" onClick={() => scrollTo("how-it-works")}>How it works</button>
            <button className="transition-colors hover:text-white" onClick={() => scrollTo("candidates")}>Talent Pool</button>
            <button className="transition-colors hover:text-white" onClick={() => scrollTo("for-teams")}>For teams</button>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <button
              onClick={() => setAnalyzerOpen(true)}
              className="flex items-center gap-1.5 text-[13px] text-violet-300 transition-colors hover:text-white"
            >
              <Sparkles className="h-3.5 w-3.5" /> Test Sandbox
            </button>
            <Link
              href="/auth/sign-in"
              className="text-[13px] text-white/70 transition-colors hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-600/20 px-4 py-2 text-[13px] font-medium text-violet-200 transition-all hover:border-violet-400 hover:bg-violet-600 hover:text-white"
            >
              Candidate Core <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <button onClick={() => setMenuOpen((current) => !current)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white md:hidden" aria-label="Toggle menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-white/10 bg-[#0e0f19] px-5 pb-5 pt-3 md:hidden">
            <div className="flex flex-col gap-1 text-sm text-white/70">
              <button className="py-2.5 text-left" onClick={() => scrollTo("platform")}>Platform</button>
              <button className="py-2.5 text-left" onClick={() => scrollTo("how-it-works")}>How it works</button>
              <button className="py-2.5 text-left" onClick={() => scrollTo("candidates")}>Talent Pool</button>
              <button className="py-2.5 text-left" onClick={() => scrollTo("for-teams")}>For teams</button>
              <Link href="/auth/sign-in" className="py-2.5 text-left text-white/80" onClick={() => setMenuOpen(false)}>
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="mt-2 rounded-xl bg-violet-600 py-3 text-center font-semibold text-white"
                onClick={() => setMenuOpen(false)}
              >
                Candidate Dashboard
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="top" className="relative mx-auto max-w-[1240px] px-5 pb-20 pt-36 lg:px-8 lg:pb-28 lg:pt-48">
        <div className="grid items-center gap-16 lg:grid-cols-[0.93fr_1.07fr] lg:gap-12">
          <div className="relative z-10">
            <div className="mb-7 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-violet-300/80">
              <span className="h-px w-7 bg-violet-400" />
              Talent intelligence / 01
            </div>
            <h1 className="max-w-[660px] font-display text-[clamp(3.7rem,8vw,7.3rem)] font-semibold leading-[0.9] tracking-[-0.085em] text-white">
              Talent,
              <br />
              <span className="hero-gradient">with receipts.</span>
            </h1>
            <p className="mt-8 max-w-[470px] text-[17px] leading-[1.65] text-white/55">
              PROVE turns the scattered evidence of someone&apos;s work into one clear, continuously evolving profile—so the right people get seen for what they can actually do.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="group flex items-center gap-3 rounded-full bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(124,58,237,.35)] transition-all hover:-translate-y-0.5 hover:bg-violet-500 active:scale-[.98]"
              >
                Launch Candidate Core <Sparkles className="h-4 w-4" />
              </Link>
              <button onClick={() => setAnalyzerOpen(true)} className="group flex items-center gap-2 rounded-full border border-white/15 px-4 py-3 text-sm font-medium text-white/70 transition-colors hover:border-violet-400/50 hover:text-white">
                <Play className="h-3.5 w-3.5 text-violet-300" />
                Live Demo Sandbox
              </button>
            </div>
            <div className="mt-14 flex items-center gap-4 text-xs text-white/35">
              <div className="flex -space-x-2">
                {[["AM", "bg-violet-400"], ["ER", "bg-pink-400"], ["MV", "bg-cyan-400"], ["+", "bg-white/15"]].map(([initials, color]) => (
                  <span key={initials} className={`grid h-7 w-7 place-items-center rounded-full border-2 border-[#090a12] ${color} text-[9px] font-bold text-[#0b0c14]`}>
                    {initials}
                  </span>
                ))}
              </div>
              <span>Built for engineers and leaders who believe<br />a resume is only the beginning.</span>
            </div>
          </div>

          {/* Interactive Live Card */}
          <div className="relative lg:pl-2">
            <div className="absolute -inset-10 rounded-full bg-violet-500/10 blur-[80px]" />
            <div className="dashboard-shell relative overflow-hidden rounded-[28px] border border-white/12 bg-[#11121e]/95 shadow-[0_35px_100px_rgba(0,0,0,.45)]">
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
                  <CircleDashed className="h-3.5 w-3.5 text-violet-300" /> Live talent profile
                </div>
                <div className="flex items-center gap-2 text-[10px] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /> connected to API
                </div>
              </div>
              <div className="p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-[18px] bg-gradient-to-br from-violet-500 to-fuchsia-500 text-lg font-bold text-white shadow-[0_8px_24px_rgba(139,92,246,.28)]">
                      AM
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-semibold tracking-[-.04em] text-white">Alex Morgan</h2>
                      <p className="mt-0.5 text-xs text-white/45">Senior Backend Engineer · Bengaluru, IN</p>
                    </div>
                  </div>
                  <button onClick={() => setAnalyzerOpen(true)} className="rounded-full border border-white/12 px-3 py-1.5 text-[10px] text-violet-300 transition hover:border-violet-300/50 hover:bg-violet-500/10">
                    Analyze Signal
                  </button>
                </div>
                <div className="mt-7 grid grid-cols-[1fr_auto] items-end gap-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-white/35">
                      <span>{role === "recruiter" ? "Role fit" : "Profile strength"}</span>
                      <span className="text-violet-300">{score}/100</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-300 transition-all duration-500" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                  <div className="font-display text-5xl font-semibold leading-none tracking-[-.08em] text-white">
                    {score}<span className="ml-1 text-lg text-white/35">%</span>
                  </div>
                </div>
                <div className="mt-7 flex items-center justify-between">
                  <div className="text-xs font-medium text-white/75">Evidence signals (interactive toggle)</div>
                  <div className="text-[10px] text-white/35">{selectedSignals.length} of {signals.length} connected</div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {signals.map((signal) => {
                    const Icon = signal.icon;
                    const active = selectedSignals.includes(signal.label);
                    return (
                      <button
                        key={signal.label}
                        onClick={() => toggleSignal(signal.label)}
                        className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${active ? "border-white/12 bg-white/[0.06]" : "border-white/6 bg-white/[0.02] opacity-50 hover:opacity-80"}`}
                      >
                        <span className={`grid h-8 w-8 place-items-center rounded-xl ${signal.color === "violet" ? "bg-violet-500/15 text-violet-300" : signal.color === "cyan" ? "bg-cyan-400/12 text-cyan-300" : signal.color === "pink" ? "bg-pink-400/12 text-pink-300" : "bg-amber-300/12 text-amber-200"}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-medium text-white/80">{signal.label}</span>
                          <span className="mt-0.5 block truncate text-[10px] text-white/35">{signal.detail}</span>
                        </span>
                        {active && <Check className="ml-auto h-3.5 w-3.5 text-emerald-300" />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 flex items-center justify-between rounded-2xl border border-violet-300/15 bg-gradient-to-r from-violet-500/12 to-transparent px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-violet-300" />
                    <div>
                      <div className="text-[11px] font-medium text-white/80">PROVE insight</div>
                      <div className="mt-0.5 text-[10px] text-white/40">Strong systems architecture & consensus protocol evidence</div>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-violet-300" />
                </div>
              </div>
              <div className="flex items-center gap-4 border-t border-white/8 bg-white/[0.025] px-5 py-3 text-[10px] text-white/35">
                <span className="font-mono text-violet-300/70">PROVE / 2026</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>Every score backed by real code evidence.</span>
              </div>
            </div>
            <div className="absolute -bottom-7 -left-8 hidden w-44 rounded-2xl border border-white/10 bg-[#151625]/90 p-3.5 shadow-2xl backdrop-blur-md sm:block">
              <div className="flex items-center gap-2 text-[10px] text-white/45">
                <Zap className="h-3.5 w-3.5 text-amber-300" /> Signal accuracy
              </div>
              <div className="mt-2 font-display text-2xl tracking-[-.05em] text-white">
                98.4% <span className="text-xs text-emerald-300">↑ verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="border-y border-white/8 bg-white/[0.025]">
        <div className="mx-auto flex max-w-[1240px] items-center gap-7 overflow-hidden px-5 py-5 lg:px-8">
          <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-white/25">One profile, verified signals</span>
          <div className="h-px w-10 shrink-0 bg-white/15" />
          {tickerItems.map((item, index) => (
            <span key={item} className="flex shrink-0 items-center gap-2 text-xs text-white/40">
              <span className={`h-1.5 w-1.5 rounded-full ${index % 3 === 0 ? "bg-violet-400" : index % 3 === 1 ? "bg-cyan-300" : "bg-pink-300"}`} />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Platform capability section */}
      <section id="platform" className="relative mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-36">
        <div className="grid gap-16 lg:grid-cols-[.82fr_1.18fr] lg:gap-24">
          <div>
            <div className="section-kicker">The problem / 02</div>
            <h2 className="mt-6 max-w-[460px] font-display text-4xl font-semibold leading-[1.03] tracking-[-.065em] text-white sm:text-5xl">
              The resume is a summary.<br />
              <span className="text-white/30">Your work is the source.</span>
            </h2>
            <p className="mt-7 max-w-[420px] text-[16px] leading-[1.7] text-white/50">
              Meaningful work is happening everywhere. But when it is flattened into one page, the nuance disappears—the context, the craft, the trajectory.
            </p>
            <div className="mt-9 flex items-center gap-3 text-sm text-white/70">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-pink-400/10 text-pink-300">
                <ArrowDownRight className="h-4 w-4" />
              </span>
              From scattered footprints to a living verified profile
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {capabilities.map(({ index, title, body, icon: Icon, tone }) => (
              <article key={index} className="group rounded-[22px] border border-white/10 bg-white/[0.035] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06] sm:p-6">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[11px] text-white/25">{index}</span>
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone === "violet" ? "bg-violet-500/15 text-violet-300" : tone === "cyan" ? "bg-cyan-400/12 text-cyan-300" : "bg-pink-400/12 text-pink-300"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <h3 className="mt-12 font-display text-lg font-semibold leading-tight tracking-[-.04em] text-white">{title}</h3>
                <p className="mt-3 text-sm leading-[1.65] text-white/42">{body}</p>
                <div className="mt-7 h-px w-0 bg-white/60 transition-all duration-300 group-hover:w-8" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section id="how-it-works" className="border-y border-white/8 bg-[#0e0f19]">
        <div className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-32">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <div className="section-kicker">The engine / 03</div>
              <h2 className="mt-5 max-w-[620px] font-display text-4xl font-semibold leading-[1.03] tracking-[-.065em] text-white sm:text-6xl">
                From “I have this skill”<br />
                <span className="hero-gradient">to “here’s the proof.”</span>
              </h2>
            </div>
            <div className="max-w-[300px] text-sm leading-[1.7] text-white/45">
              A job-specific intelligence layer that makes capability legible—without asking anyone to perform for an algorithm.
            </div>
          </div>
          <div className="relative mt-16 grid gap-4 lg:grid-cols-[1fr_1.18fr_1fr] lg:items-center">
            <div className="absolute left-[16%] right-[16%] top-1/2 hidden h-px bg-gradient-to-r from-violet-400/20 via-violet-400/70 to-cyan-300/20 lg:block" />
            
            <div className="relative rounded-[22px] border border-white/10 bg-white/[0.035] p-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[.18em] text-white/35">Candidate signals</span>
                <Search className="h-4 w-4 text-white/30" />
              </div>
              <div className="mt-6 space-y-2">
                {signals.slice(0, 3).map((signal) => {
                  const Icon = signal.icon;
                  return (
                    <div key={signal.label} className="flex items-center gap-3 rounded-xl border border-white/7 bg-black/10 px-3 py-3">
                      <Icon className="h-4 w-4 text-white/55" />
                      <span className="text-xs text-white/65">{signal.label}</span>
                      <Check className="ml-auto h-3.5 w-3.5 text-emerald-300/80" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative rounded-[26px] border border-violet-300/30 bg-gradient-to-br from-violet-600/25 via-[#17152b] to-[#10131d] p-7 shadow-[0_0_80px_rgba(124,58,237,.14)]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-400/15 text-violet-200">
                  <BrainCircuit className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-display text-lg font-semibold tracking-[-.04em] text-white">PROVE engine</div>
                  <div className="font-mono text-[9px] uppercase tracking-[.18em] text-violet-200/55">extract · analyze · connect</div>
                </div>
              </div>
              <div className="mt-8 space-y-3">
                {["Understands the role requirements", "Analyzes live candidate code evidence", "Generates explainable audit receipts"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-white/70">
                    <span className="grid h-5 w-5 place-items-center rounded-full border border-violet-300/35 text-[9px] text-violet-200">{index + 1}</span>
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-7 flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
                <span className="text-[10px] text-white/50">Every conclusion keeps its receipts.</span>
                <button onClick={() => setAnalyzerOpen(true)} className="text-[10px] font-semibold text-violet-300 hover:text-white">
                  Test Sandbox &rarr;
                </button>
              </div>
            </div>

            <div className="relative rounded-[22px] border border-white/10 bg-white/[0.035] p-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[.18em] text-white/35">Explainable output</span>
                <BarChart3 className="h-4 w-4 text-white/30" />
              </div>
              <div className="mt-6 rounded-xl border border-white/7 bg-black/10 p-3">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>System design</span>
                  <span className="text-cyan-300">95%</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white/8">
                  <div className="h-full w-[95%] rounded-full bg-gradient-to-r from-violet-500 to-cyan-300" />
                </div>
              </div>
              <div className="mt-2 rounded-xl border border-white/7 bg-black/10 p-3">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>Problem solving</span>
                  <span className="text-violet-300">92%</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white/8">
                  <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Candidate Explorer Section */}
      <section id="candidates" className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-36">
        <CandidateExplorer onRequestAccess={() => openAccess("recruiter")} />
      </section>

      {/* For Teams Section */}
      <section id="for-teams" className="mx-auto max-w-[1240px] px-5 pb-24 lg:px-8 lg:pb-36">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="section-kicker">One engine / two better experiences</div>
            <h2 className="mt-5 max-w-[660px] font-display text-4xl font-semibold leading-[1.02] tracking-[-.07em] text-white sm:text-6xl">
              A clearer view of<br />
              <span className="text-white/35">what comes next.</span>
            </h2>
          </div>
          <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              onClick={() => setRole("recruiter")}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${role === "recruiter" ? "bg-violet-600 text-white" : "text-white/45 hover:text-white"}`}
            >
              For recruiters
            </button>
            <button
              onClick={() => setRole("candidate")}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${role === "candidate" ? "bg-violet-600 text-white" : "text-white/45 hover:text-white"}`}
            >
              For candidates
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <div className="relative min-h-[340px] overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br from-violet-500/15 via-white/[0.03] to-cyan-400/5 p-7 sm:p-9">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-violet-300/10" />
            <div className="absolute -right-8 top-[-10px] h-64 w-64 rounded-full border border-violet-300/10" />
            <div className="relative max-w-[440px]">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/8 text-violet-200">
                {role === "recruiter" ? <Target className="h-5 w-5" /> : <Fingerprint className="h-5 w-5" />}
              </div>
              <h3 className="mt-8 font-display text-3xl font-semibold tracking-[-.06em] text-white">
                {role === "recruiter" ? "Hire for capability, not keywords." : "Make your next move with clarity."}
              </h3>
              <p className="mt-4 text-sm leading-[1.7] text-white/50">
                {role === "recruiter"
                  ? "Rank candidates on demonstrated skill, project depth, and the signals that actually predict a great fit."
                  : "See your job-specific fit, understand the gaps, and turn your existing work into a profile people can trust."}
              </p>
              <button
                onClick={() => openAccess(role === "recruiter" ? "recruiter" : "candidate")}
                className="group mt-8 flex items-center gap-2 text-sm font-medium text-violet-200 hover:text-white"
              >
                {role === "recruiter" ? "Build a better shortlist" : "Claim your verified profile"}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {(role === "recruiter"
              ? [
                  { icon: Users, title: "Evidence-based ranking", body: "Find the signal inside the noise without keyword stuffing." },
                  { icon: CalendarDays, title: "One interview workspace", body: "Move from verified shortlist straight to technical conversation." },
                  { icon: BarChart3, title: "Depth, not just presence", body: "Understand capability in true production context." },
                ]
              : [
                  { icon: Sparkles, title: "Your work, made visible", body: "Turn scattered projects and repos into verifiable proof." },
                  { icon: Target, title: "Know your fit", body: "See where you stand for each role before applying." },
                  { icon: Zap, title: "Grow with intention", body: "Get practical next steps and feedback on your work." },
                ]
            ).map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-center gap-4 rounded-[20px] border border-white/10 bg-white/[0.035] p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/7 text-violet-200">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-medium text-white/80">{title}</div>
                  <div className="mt-1 text-xs text-white/38">{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Early access CTA */}
      <section id="contact" className="relative border-t border-white/8 bg-[#0e0f19] px-5 py-24 lg:px-8 lg:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,.15),transparent_42%)]" />
        <div className="relative mx-auto max-w-[900px] text-center">
          <div className="section-kicker justify-center">The future of hiring / 04</div>
          <h2 className="mx-auto mt-6 max-w-[760px] font-display text-5xl font-semibold leading-[.98] tracking-[-.075em] text-white sm:text-7xl">
            Stop asking for<br />
            <span className="hero-gradient">more resumes.</span>
          </h2>
          <p className="mx-auto mt-7 max-w-[470px] text-[16px] leading-[1.7] text-white/45">
            Start with the evidence that is already there. PROVE is building a more human way to see potential.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => openAccess("recruiter")}
              className="group inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-semibold text-[#0c0d15] transition-all hover:-translate-y-1 hover:bg-violet-100 active:scale-[.98]"
            >
              Join the early access list <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => setAnalyzerOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-6 py-4 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <Sparkles className="h-4 w-4 text-violet-300" /> Launch Proof Sandbox
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-8 text-[11px] text-white/30 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <span className="font-display text-sm font-bold tracking-[-.05em] text-white/65">PROVE<span className="text-violet-400">.</span></span>
          <span className="h-3 w-px bg-white/15" />
          <span>Talent, with receipts.</span>
        </div>
        <div className="flex items-center gap-5">
          <span>Modular Express Backend + React Client</span>
          <span className="font-mono">© 2026 PROVE Intelligence</span>
        </div>
      </footer>

      {/* Modals */}
      <RequestAccessDialog
        isOpen={requestAccessOpen}
        onClose={() => setRequestAccessOpen(false)}
        defaultRole={defaultRequestRole}
      />

      <LiveAnalyzerModal
        isOpen={analyzerOpen}
        onClose={() => setAnalyzerOpen(false)}
      />
    </main>
  );
}
