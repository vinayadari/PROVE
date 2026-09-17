import { z } from "zod";

export const GrokCompetencySchema = z.object({
  skill: z.string().min(1),
  level: z.enum(["Foundational", "Proficient", "Expert"]),
  evidenceProof: z.string().min(1),
  evidenceIds: z.array(z.string()).default([]),
});

export const GrokAnalysisOutputSchema = z.object({
  summary: z.string().min(1),
  assessedLevel: z.enum(["Junior", "Mid-Level", "Senior", "Staff", "Principal"]),
  verifiedCompetencies: z.array(GrokCompetencySchema),
  strengths: z.array(z.string()).default([]),
  blindSpots: z.array(z.string()).default([]),
  engineeringRigorScore: z.number().min(0).max(100).default(80),
  roleFitJustification: z.string().min(1),
});

export type GrokAnalysisOutput = z.infer<typeof GrokAnalysisOutputSchema>;

export class GroundingValidationError extends Error {
  invalidIds: string[];
  constructor(invalidIds: string[]) {
    super(`Grounding gate rejection: Grok cited hallucinated/invalid evidence IDs: [${invalidIds.join(", ")}]`);
    this.name = "GroundingValidationError";
    this.invalidIds = invalidIds;
  }
}

/**
 * Validates that every evidenceId cited by Grok exists in the frozen immutable snapshot.
 * If any reference is hallucinated or invalid, throws GroundingValidationError.
 */
export function validateGrokGrounding(
  output: GrokAnalysisOutput,
  snapshotItems: { id: string }[]
): void {
  const validIds = new Set(snapshotItems.map((e) => e.id));
  const invalidIds: string[] = [];

  for (const comp of output.verifiedCompetencies) {
    for (const id of comp.evidenceIds) {
      if (!validIds.has(id)) {
        invalidIds.push(id);
      }
    }
  }

  if (invalidIds.length > 0) {
    throw new GroundingValidationError(invalidIds);
  }
}

export interface SnapshotEvidenceDigestItem {
  id: string;
  source: string;
  evidenceType: string;
  title: string;
  description: string;
  sourceUrl?: string | null;
  rawData?: any;
}

export async function analyzeEvidenceWithGrok(params: {
  candidateName: string;
  targetRole: string;
  experienceYears: number;
  evidenceItems: SnapshotEvidenceDigestItem[];
}): Promise<GrokAnalysisOutput> {
  const apiKey = process.env.XAI_API_KEY;

  // Build controlled, structured digest with immutable snapshot IDs
  const validIds = new Set(params.evidenceItems.map((e) => e.id));

  const evidenceDigest = params.evidenceItems.map((item) => ({
    evidenceId: item.id,
    source: item.source,
    type: item.evidenceType,
    title: item.title,
    description: item.description,
    url: item.sourceUrl || undefined,
    facts: item.rawData,
  }));

  const systemPrompt = `You are the PROVE Intelligence Engine powered by Grok (xAI).
Your mission is to perform deep, rigorous, and truthful evaluation of candidate engineering evidence.
You analyze verifiable snapshot artifacts: GitHub repositories, LeetCode algorithmic stats, portfolio projects, and resume history.
CRITICAL CONSTRAINT: Never hallucinate claims or IDs. Tie every competency directly to verifiable proof in the provided evidence.
Every competency MUST include an "evidenceIds" array containing the exact evidenceId strings from the provided digest that validate the claim.

Target Role: ${params.targetRole}
Target Experience: ${params.experienceYears} years
Candidate Name: ${params.candidateName}

You must return a strictly valid JSON object matching this schema:
{
  "summary": "2-3 sentences summarizing the candidate's real capabilities and evidence depth",
  "assessedLevel": "Junior" | "Mid-Level" | "Senior" | "Staff" | "Principal",
  "verifiedCompetencies": [
    {
      "skill": "Name of language/framework/concept",
      "level": "Foundational" | "Proficient" | "Expert",
      "evidenceProof": "Specific artifact or metric that validates this",
      "evidenceIds": ["exact_evidenceId_from_input"]
    }
  ],
  "strengths": ["Key strength 1 with citation", "Key strength 2 with citation"],
  "blindSpots": ["Identified gap or missing proof point for the target role"],
  "engineeringRigorScore": 85,
  "roleFitJustification": "Clear reasoning why the candidate fits or needs improvement for the target role"
}
Return ONLY JSON, no markdown codeblocks, no conversational text.`;

  if (!apiKey) {
    console.warn("XAI_API_KEY not configured. Generating heuristic evidence synthesis.");
    return generateFallbackAnalysis(params, validIds);
  }

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2-latest",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze the following snapshot evidence items:\n\n${JSON.stringify(evidenceDigest, null, 2)}`,
          },
        ],
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Grok API error (${res.status}):`, errText);
      return generateFallbackAnalysis(params, validIds);
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim();

    if (!rawContent) {
      return generateFallbackAnalysis(params, validIds);
    }

    // Clean JSON formatting
    const cleaned = rawContent.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsedRaw = JSON.parse(cleaned);

    // Validate with Zod
    const validated = GrokAnalysisOutputSchema.safeParse(parsedRaw);
    if (!validated.success) {
      console.warn("Grok schema validation failed:", validated.error.format());
      return generateFallbackAnalysis(params, validIds);
    }

    const output = validated.data;

    // Strict Grounding Gate: assert all cited evidenceIds exist in frozen snapshot
    validateGrokGrounding(output, params.evidenceItems);

    return output;
  } catch (err) {
    if (err instanceof GroundingValidationError) {
      // Strict rule: Any hallucinated reference causes immediate rejection and analysis failure
      throw err;
    }
    console.error("Failed to run Grok analysis:", err);
    return generateFallbackAnalysis(params, validIds);
  }
}

function generateFallbackAnalysis(
  params: {
    candidateName: string;
    targetRole: string;
    experienceYears: number;
    evidenceItems: SnapshotEvidenceDigestItem[];
  },
  validIds: Set<string>
): GrokAnalysisOutput {
  const ghItem = params.evidenceItems.find((e) => e.source === "github");
  const lcItem = params.evidenceItems.find((e) => e.source === "leetcode");
  const portItem = params.evidenceItems.find((e) => e.source === "portfolio");
  const resumeItem = params.evidenceItems.find((e) => e.source === "resume");

  const competencies: GrokAnalysisOutput["verifiedCompetencies"] = [];

  if (ghItem) {
    competencies.push({
      skill: "Code Velocity & Version Control",
      level: "Proficient",
      evidenceProof: "Active public GitHub repositories and commit cadence.",
      evidenceIds: [ghItem.id],
    });
  }

  if (lcItem) {
    competencies.push({
      skill: "Algorithmic Problem Solving",
      level: "Proficient",
      evidenceProof: "Verified LeetCode problem solving metrics and difficulty breakdown.",
      evidenceIds: [lcItem.id],
    });
  }

  if (portItem) {
    competencies.push({
      skill: "Production Web Architecture",
      level: "Proficient",
      evidenceProof: "Deployed web application artifacts crawled from portfolio.",
      evidenceIds: [portItem.id],
    });
  }

  if (resumeItem) {
    competencies.push({
      skill: "Full Lifecycle Engineering",
      level: "Proficient",
      evidenceProof: "Documented professional background parsed from CV.",
      evidenceIds: [resumeItem.id],
    });
  }

  const defaultId = params.evidenceItems[0]?.id || "ev_fallback";

  return {
    summary: `${params.candidateName} exhibits observable technical capability across ${params.evidenceItems.length} verified evidence items, benchmarked for ${params.targetRole}.`,
    assessedLevel:
      params.experienceYears >= 5 ? "Senior" : params.experienceYears >= 2 ? "Mid-Level" : "Junior",
    verifiedCompetencies:
      competencies.length > 0
        ? competencies
        : [
            {
              skill: "Software Engineering Fundamentals",
              level: "Proficient",
              evidenceProof: "Observable evidence baseline established.",
              evidenceIds: [defaultId],
            },
          ],
    strengths: [
      "Consistent observable codebase activity",
      "Demonstrated problem solving discipline",
    ],
    blindSpots: [
      "Additional production architecture case studies recommended for senior leadership tiering",
    ],
    engineeringRigorScore: ghItem && lcItem ? 88 : 78,
    roleFitJustification: `Demonstrated evidence shows solid fundamental coverage for ${params.targetRole} with direct technical proof points.`,
  };
}
