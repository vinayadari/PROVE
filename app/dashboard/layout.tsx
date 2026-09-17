"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth/client";
import {
  ShieldCheck,
  LayoutDashboard,
  User,
  Sparkles,
  Layers,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    document.cookie = "prove_demo_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    localStorage.removeItem("prove-demo-user");
    await signOut();
    router.push("/auth/sign-in");
  };

  const navItems = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: User,
      badge: "Signals",
    },
    {
      name: "Analyze",
      href: "/dashboard/analyze",
      icon: Sparkles,
      badge: "AI Run",
    },
    {
      name: "Evidence",
      href: "/dashboard/evidence",
      icon: Layers,
      badge: undefined,
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: FileText,
      badge: undefined,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      badge: undefined,
    },
  ];

  const user = session?.data?.user;
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "CD";

  const NavLinks = () => (
    <div className="space-y-1.5 py-4">
      <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
        Platform Navigation
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-violet-600/20 to-fuchsia-600/10 text-white border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-1.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-gradient-to-tr from-violet-600 to-indigo-500 text-white"
                    : "text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/80"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span>{item.name}</span>
            </div>

            {item.badge ? (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                  isActive
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700/50 group-hover:border-slate-600"
                }`}
              >
                {item.badge}
              </span>
            ) : isActive ? (
              <ChevronRight className="w-3.5 h-3.5 text-violet-400" />
            ) : null}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#08080c] text-slate-100 flex flex-col md:flex-row selection:bg-violet-500/30">
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-50 flex items-center justify-between px-4 h-16 bg-[#0c0d16]/90 backdrop-blur-xl border-b border-slate-800/80">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            PROVE
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-wider uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full">
            Core
          </span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-black/80 backdrop-blur-xl p-4 overflow-y-auto">
          <div className="bg-[#0e0f1a] border border-slate-800/80 rounded-2xl p-4 shadow-2xl">
            <NavLinks />

            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-xs text-white">
                  {userInitials}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">
                    {user?.name || "Candidate"}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                    {user?.email || "candidate@prove.dev"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar Navigation */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col justify-between border-r border-slate-800/80 bg-[#0a0a12]/95 backdrop-blur-xl p-5 sticky top-0 h-screen z-30">
        <div>
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800/60">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform duration-200">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                    PROVE
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-widest uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full">
                    Core
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Evidence Intelligence</p>
              </div>
            </Link>
          </div>

          {/* Engine Status Banner */}
          <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium text-slate-300">
                Grok Engine Ready
              </span>
            </div>
            <span className="text-[10px] font-mono text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">
              xAI
            </span>
          </div>

          {/* Nav items */}
          <NavLinks />
        </div>

        {/* Bottom Sidebar: Candidate Profile & Sign Out */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <Link
            href="/"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent transition"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Public Marketing
            </span>
            <span className="text-[10px] font-mono text-slate-500">Live</span>
          </Link>

          <div className="p-3 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/90 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md shadow-violet-500/20">
                {userInitials}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name || "Candidate"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email || "candidate@prove.dev"}
                </p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/50 hover:border-rose-500/30 transition duration-150 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
