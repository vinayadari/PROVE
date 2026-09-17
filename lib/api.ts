export interface SignalReceipt {
  source: "GitHub" | "LeetCode" | "Portfolio" | "Resume" | "OpenSource" | "Certifications";
  status: "verified" | "pending" | "unlinked";
  metric: string;
  detail: string;
  confidenceScore: number;
  evidencePoints: string[];
}

export interface CandidateProfile {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  overallScore: number;
  fitScore: number;
  status: "open_to_work" | "interviewing" | "placed";
  topSkills: string[];
  signals: SignalReceipt[];
  insights: {
    title: string;
    summary: string;
    level: "exceptional" | "strong" | "developing";
  }[];
  breakdown: {
    systemDesign: number;
    problemSolving: number;
    codeQuality: number;
    consistency: number;
  };
}

export interface WaitlistPayload {
  name: string;
  email: string;
  roleType: "recruiter" | "candidate" | "engineering_leader";
  companyOrPortfolio?: string;
  notes?: string;
}

export interface AnalyzePayload {
  targetRole: string;
  github?: string;
  leetcode?: string;
  portfolio?: string;
  experienceYears: number;
  focusSignals?: string[];
}

export interface IntelligenceResult {
  targetRole: string;
  overallScore: number;
  fitScore: number;
  breakdown: {
    systemDesign: number;
    problemSolving: number;
    codeQuality: number;
    consistency: number;
  };
  signals: SignalReceipt[];
  insights: {
    title: string;
    summary: string;
    level: "exceptional" | "strong" | "developing";
  }[];
  evaluatedAt: string;
}

const API_BASE = "/api";

export const api = {
  // Healthcheck
  async checkHealth(): Promise<{ status: string; uptimeSeconds: number }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error("Backend service unreachable");
    return res.json();
  },

  // Waitlist / Access Request
  async requestAccess(payload: WaitlistPayload): Promise<{ success: boolean; message: string; isExisting?: boolean }> {
    const res = await fetch(`${API_BASE}/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to submit request");
    return data;
  },

  // Candidates
  async getCandidates(params?: { search?: string; role?: string; minScore?: number }): Promise<{ success: boolean; data: CandidateProfile[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.role) query.set("role", params.role);
    if (params?.minScore) query.set("minScore", params.minScore.toString());

    const res = await fetch(`${API_BASE}/candidates?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch candidate profiles");
    return res.json();
  },

  async getCandidateById(id: string): Promise<{ success: boolean; data: CandidateProfile }> {
    const res = await fetch(`${API_BASE}/candidates/${id}`);
    if (!res.ok) throw new Error("Candidate profile not found");
    return res.json();
  },

  // Intelligence scoring
  async analyzeSignals(payload: AnalyzePayload): Promise<{ success: boolean; data: IntelligenceResult }> {
    const res = await fetch(`${API_BASE}/intelligence/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signal analysis failed");
    return data;
  },

  // Benchmarks
  async getBenchmarks(): Promise<any> {
    const res = await fetch(`${API_BASE}/intelligence/benchmarks`);
    if (!res.ok) throw new Error("Failed to load benchmarks");
    return res.json();
  },
};
