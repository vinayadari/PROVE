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

export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  roleType: "recruiter" | "candidate" | "engineering_leader";
  companyOrPortfolio?: string;
  notes?: string;
  createdAt: string;
}

// Initial seed data
export const candidatesStore: CandidateProfile[] = [
  {
    id: "cand_1",
    name: "Alex Morgan",
    role: "Senior Backend Engineer",
    location: "Bengaluru, IN",
    avatar: "AM",
    overallScore: 94,
    fitScore: 96,
    status: "open_to_work",
    topSkills: ["Distributed Systems", "Go", "Kubernetes", "PostgreSQL", "Kafka"],
    signals: [
      {
        source: "GitHub",
        status: "verified",
        metric: "12 active repos · 1,420 contributions",
        detail: "Top 4% Go maintainer, built high-throughput message broker",
        confidenceScore: 96,
        evidencePoints: [
          "Authored custom Raft consensus implementation with 99.4% test coverage",
          "Consistently commits 4.2x/week over 36 consecutive months",
          "Merged 18 PRs into upstream open-source cloud native tools",
        ],
      },
      {
        source: "LeetCode",
        status: "verified",
        metric: "340 problems solved · 86th percentile",
        detail: "Guardian rating (2,180 contest rating)",
        confidenceScore: 91,
        evidencePoints: [
          "Solved 180+ hard problems in graphs, DP, and concurrency",
          "Ranked in top 2% across 14 weekly global contests",
        ],
      },
      {
        source: "Portfolio",
        status: "verified",
        metric: "5 live production projects",
        detail: "Includes distributed cache simulator and latency profiler",
        confidenceScore: 94,
        evidencePoints: [
          "Deployed live interactive playground handling 50k requests/min",
          "Architecture docs with benchmarks published and verified",
        ],
      },
      {
        source: "Resume",
        status: "verified",
        metric: "2 roles · 4.5 years experience",
        detail: "Fintech scale-up backend tech lead",
        confidenceScore: 92,
        evidencePoints: [
          "Reduced payment gateway p99 latency from 180ms to 24ms",
          "Led team of 6 engineers migrating monolith to event-driven services",
        ],
      },
    ],
    insights: [
      {
        title: "High Systems Architecture Acumen",
        summary: "Demonstrated through independent implementation of fault-tolerant distributed consensus engine.",
        level: "exceptional",
      },
      {
        title: "Consistent Engineering Craftsmanship",
        summary: "Zero commit breaks across 3 years with comprehensive end-to-end integration test suites.",
        level: "strong",
      },
    ],
    breakdown: {
      systemDesign: 95,
      problemSolving: 92,
      codeQuality: 96,
      consistency: 94,
    },
  },
  {
    id: "cand_2",
    name: "Elena Rostova",
    role: "Full Stack / AI Product Engineer",
    location: "Berlin, DE (Remote)",
    avatar: "ER",
    overallScore: 91,
    fitScore: 89,
    status: "interviewing",
    topSkills: ["TypeScript", "Next.js", "Python", "LangChain", "Vector DBs"],
    signals: [
      {
        source: "GitHub",
        status: "verified",
        metric: "24 public repos · 890 stars",
        detail: "Creator of multimodal agent evaluation framework",
        confidenceScore: 93,
        evidencePoints: [
          "Built high-performance streaming token parser with zero dependencies",
          "Featured in GitHub Trending TypeScript repositories (August 2025)",
        ],
      },
      {
        source: "Portfolio",
        status: "verified",
        metric: "4 AI applications live in production",
        detail: "Interactive canvas-based prompt engineering tool",
        confidenceScore: 95,
        evidencePoints: [
          "12,000 monthly active users on personal AI tool suite",
          "Implemented fluid 60fps WebGL visualizer for embedding spaces",
        ],
      },
      {
        source: "Resume",
        status: "verified",
        metric: "3 roles · 5 years experience",
        detail: "Senior UI/Full Stack Engineer at Series B SaaS",
        confidenceScore: 88,
        evidencePoints: [
          "Built design system used by 45 frontend engineers",
          "Redesigned core onboarding flow boosting activation by 28%",
        ],
      },
    ],
    insights: [
      {
        title: "Rapid Full-Stack Prototyping",
        summary: "Takes complex LLM workflows and turns them into intuitive, polished user experiences in record time.",
        level: "exceptional",
      },
      {
        title: "Design System Precision",
        summary: "Exceptional mastery of modern CSS, micro-animations, and accessible WCAG components.",
        level: "strong",
      },
    ],
    breakdown: {
      systemDesign: 88,
      problemSolving: 90,
      codeQuality: 94,
      consistency: 92,
    },
  },
  {
    id: "cand_3",
    name: "Marcus Vance",
    role: "Infrastructure & Platform Engineer",
    location: "San Francisco, US",
    avatar: "MV",
    overallScore: 88,
    fitScore: 92,
    status: "open_to_work",
    topSkills: ["Terraform", "Rust", "AWS", "eBPF", "Prometheus"],
    signals: [
      {
        source: "GitHub",
        status: "verified",
        metric: "9 open source tools · CNCF Contributor",
        detail: "Rust-based eBPF network packet inspector",
        confidenceScore: 90,
        evidencePoints: [
          "Contributed kernel bypass networking patch to envoy-proxy ecosystem",
          "Published zero-downtime multi-region Kubernetes failover pattern",
        ],
      },
      {
        source: "Resume",
        status: "verified",
        metric: "6 years experience across 2 tier-1 tech companies",
        detail: "Senior Site Reliability & Platform Engineer",
        confidenceScore: 91,
        evidencePoints: [
          "Cut AWS infrastructure bill by $1.2M/yr through automated spot fleet scheduling",
          "Architected 99.999% SLA multi-region database replication topology",
        ],
      },
    ],
    insights: [
      {
        title: "Deep Linux & Kernel Observability",
        summary: "Specialized in low-overhead eBPF probes and high-throughput kernel network routing.",
        level: "exceptional",
      },
    ],
    breakdown: {
      systemDesign: 94,
      problemSolving: 86,
      codeQuality: 89,
      consistency: 85,
    },
  },
];

export const waitlistStore: WaitlistEntry[] = [
  {
    id: "wl_1",
    name: "Sarah Chen",
    email: "sarah.chen@techcorp.io",
    roleType: "recruiter",
    companyOrPortfolio: "TechCorp Labs",
    notes: "Looking to hire 15 senior engineers based on evidence rather than standard ATS filtering.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

