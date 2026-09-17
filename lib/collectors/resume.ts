import { PDFParse } from "pdf-parse";
import {
  CollectorResult,
  CollectorInput,
  EvidenceCollector,
  NormalizedEvidence,
} from "./types";

const COMMON_SKILLS = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "C++",
  "C#",
  "React",
  "Next.js",
  "Vue",
  "Angular",
  "Node.js",
  "Express",
  "NestJS",
  "FastAPI",
  "Django",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "GraphQL",
  "Docker",
  "Kubernetes",
  "AWS",
  "GCP",
  "Azure",
  "CI/CD",
  "Git",
  "Linux",
  "TailwindCSS",
];

export class ResumeCollector implements EvidenceCollector {
  provider = "resume" as const;

  async collect(input: CollectorInput): Promise<CollectorResult> {
    if (!input.parsedText && !input.fileBuffer) {
      return {
        source: "resume",
        success: false,
        evidence: [],
        error: "Resume text or PDF file buffer is required.",
        errorCode: "INVALID_INPUT",
      };
    }

    let text = input.parsedText || "";

    if (!text && input.fileBuffer) {
      try {
        const parser = new PDFParse({ data: input.fileBuffer });
        const res = await parser.getText();
        text = res?.text || "";
        await parser.destroy();
      } catch (err: any) {
        return {
          source: "resume",
          success: false,
          evidence: [],
          error: `Failed to parse PDF document: ${err.message}`,
          errorCode: "PARSING_ERROR",
        };
      }
    }

    return collectResumeEvidence(input.filename || "Curriculum_Vitae.pdf", text);
  }
}

export function collectResumeEvidence(
  filename: string,
  parsedText: string
): CollectorResult {
  const evidence: NormalizedEvidence[] = [];
  const cleanText = parsedText.trim();

  if (!cleanText || cleanText.length < 20) {
    return {
      source: "resume",
      success: false,
      evidence: [],
      error: "Extracted resume text is too short or empty.",
      errorCode: "PARSING_ERROR",
    };
  }

  // 1. Overall Resume Profile Evidence
  evidence.push({
    source: "resume",
    evidenceType: "resume_profile",
    title: `Resume Document: ${filename}`,
    description: `Parsed curriculum vitae containing ${cleanText.length} characters of professional record.`,
    rawData: {
      filename,
      characterCount: cleanText.length,
      sampleText: cleanText.slice(0, 1000),
    },
    confidence: 1.0,
    collectedAt: new Date().toISOString(),
  });

  // 2. Extract Explicit Skills
  const detectedSkills: string[] = [];
  for (const skill of COMMON_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, "i");
    if (regex.test(cleanText)) {
      detectedSkills.push(skill);
    }
  }

  if (detectedSkills.length > 0) {
    evidence.push({
      source: "resume",
      evidenceType: "resume_skill",
      title: "Documented Resume Skills",
      description: `Explicit technical competencies listed in resume: ${detectedSkills.join(", ")}.`,
      rawData: {
        skillsFound: detectedSkills,
      },
      confidence: 0.95,
      collectedAt: new Date().toISOString(),
    });
  }

  // 3. Extract Experience Tenures & Roles (Heuristic segmentation)
  const lines = cleanText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const experienceSnippets: string[] = [];
  let inExperienceSection = false;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("experience") || lower.includes("employment") || lower.includes("work history")) {
      inExperienceSection = true;
      continue;
    }
    if (inExperienceSection) {
      if (lower.includes("education") || lower.includes("projects") || lower.includes("certifications")) {
        inExperienceSection = false;
        break;
      }
      if (line.length > 15 && experienceSnippets.length < 6) {
        experienceSnippets.push(line);
      }
    }
  }

  if (experienceSnippets.length > 0) {
    evidence.push({
      source: "resume",
      evidenceType: "resume_experience",
      title: "Documented Work Experience",
      description: `Identified career milestones and role descriptions from resume.`,
      rawData: {
        highlights: experienceSnippets,
      },
      confidence: 0.9,
      collectedAt: new Date().toISOString(),
    });
  }

  // 4. Extract Education Mentions
  const educationSnippets: string[] = [];
  let inEduSection = false;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("education") || lower.includes("academic") || lower.includes("degree")) {
      inEduSection = true;
      continue;
    }
    if (inEduSection) {
      if (lower.includes("experience") || lower.includes("skills") || lower.includes("projects")) {
        inEduSection = false;
        break;
      }
      if (line.length > 10 && educationSnippets.length < 4) {
        educationSnippets.push(line);
      }
    }
  }

  if (educationSnippets.length > 0) {
    evidence.push({
      source: "resume",
      evidenceType: "resume_education",
      title: "Academic Background",
      description: `Documented degrees or institutions: ${educationSnippets.slice(0, 2).join("; ")}.`,
      rawData: {
        educationEntries: educationSnippets,
      },
      confidence: 0.92,
      collectedAt: new Date().toISOString(),
    });
  }

  return {
    source: "resume",
    success: true,
    evidence,
    meta: {
      filename,
      skillsCount: detectedSkills.length,
      characterCount: cleanText.length,
    },
  };
}
