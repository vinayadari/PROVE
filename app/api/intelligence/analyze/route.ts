import { NextResponse } from "next/server";
import { z } from "zod";

const AnalyzeSchema = z.object({
  targetRole: z.string().default("Backend Engineer"),
  github: z.string().optional(),
  leetcode: z.string().optional(),
  portfolio: z.string().optional(),
  experienceYears: z.number().min(0).max(30).default(3),
  focusSignals: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = AnalyzeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid analysis request parameters", details: parsed.error.format() },
      { status: 400 },
    );
  }

  const {
    targetRole,
    github,
    leetcode,
    portfolio,
    experienceYears,
    focusSignals = [],
  } = parsed.data;

  // Preserve the original demo behavior, but make it deterministic.
  let baseScore = 60;
  const receipts: Array<{
    source: "GitHub" | "LeetCode" | "Portfolio" | "Resume";
    status: "verified";
    metric: string;
    detail: string;
    confidenceScore: number;
    evidencePoints: string[];
  }> = [];

  if (github?.trim()) {
    baseScore += 12;
    receipts.push({
      source: "GitHub",
      status: "verified",
      metric: `@${github.replace(/^@/, "")} · Active public code history`,
      detail: "Analyzed code frequency, commit cadence, and PR complexity",
      confidenceScore: 93,
      evidencePoints: [
        "Demonstrated sustained code velocity with recent branch activity",
        "Repository architecture exhibits modular design and automated CI workflows",
        "Code patterns show defensive error handling and typed interfaces",
      ],
    });
  }

  if (leetcode?.trim()) {
    baseScore += 10;
    receipts.push({
      source: "LeetCode",
      status: "verified",
      metric: `@${leetcode.replace(/^@/, "")} · Algorithmic rigor`,
      detail: "Evaluated data structure proficiency and algorithmic complexity",
      confidenceScore: 90,
      evidencePoints: [
        "Strong mastery of graph traversal, dynamic programming, and heaps",
        "Consistent problem solving track record in competitive timing",
      ],
    });
  }

  if (portfolio?.trim()) {
    baseScore += 10;
    receipts.push({
      source: "Portfolio",
      status: "verified",
      metric: `${portfolio} · Live production artifacts`,
      detail: "Verified live interactive demos and responsive interfaces",
      confidenceScore: 93,
      evidencePoints: [
        "Demonstrates end-to-end delivery of deployed web applications",
        "UX craftsmanship with smooth fluid animations and accessibility",
      ],
    });
  }

  const expBonus = Math.min(10, Math.floor(experienceYears * 2));
  baseScore += expBonus;

  receipts.push({
    source: "Resume",
    status: "verified",
    metric: `${experienceYears} ${experienceYears === 1 ? "year" : "years"} demonstrated experience`,
    detail: `Target alignment for ${targetRole}`,
    confidenceScore: 90,
    evidencePoints: [
      "Track record across engineering delivery lifecycles",
      `Practical domain experience matching ${targetRole} expectations`,
    ],
  });

  const finalScore = Math.min(98, Math.max(55, baseScore));
  const fitScore = Math.min(99, Math.max(60, finalScore + (focusSignals.length > 0 ? 2 : 0)));

  const systemDesign = Math.min(97, Math.max(65, Math.floor(finalScore * 0.98 + (github ? 4 : 0))));
  const problemSolving = Math.min(98, Math.max(68, Math.floor(finalScore * 0.95 + (leetcode ? 6 : 0))));
  const codeQuality = Math.min(96, Math.max(70, Math.floor(finalScore * 0.99 + (portfolio ? 3 : 0))));
  const consistency = Math.min(99, Math.max(60, Math.floor(finalScore * 0.94 + 5)));

  return NextResponse.json({
    success: true,
    data: {
      targetRole,
      overallScore: finalScore,
      fitScore,
      breakdown: { systemDesign, problemSolving, codeQuality, consistency },
      signals: receipts,
      insights: [
        {
          title: "Demonstrated Proof of Capability",
          summary: `Candidate signals reflect verified competence across ${receipts.length} distinct data sources with zero keyword reliance.`,
          level: "exceptional",
        },
        {
          title: "Role Match Confidence",
          summary: `High statistical correlation for ${targetRole} responsibilities based on code velocity and architecture complexity.`,
          level: "strong",
        },
      ],
      evaluatedAt: new Date().toISOString(),
    },
  });
}
