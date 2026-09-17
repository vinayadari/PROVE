import * as cheerio from "cheerio";
import {
  CollectorResult,
  CollectorInput,
  EvidenceCollector,
  NormalizedEvidence,
} from "./types";
import { validatePublicUrl } from "@/lib/security/ssrf";

const TECH_KEYWORDS = [
  "React",
  "Next.js",
  "Vue",
  "Angular",
  "Svelte",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Express",
  "NestJS",
  "FastAPI",
  "Django",
  "Flask",
  "Python",
  "Go",
  "Golang",
  "Rust",
  "C++",
  "Java",
  "Spring Boot",
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
  "TailwindCSS",
  "Prisma",
  "Drizzle",
  "Supabase",
  "Firebase",
];

export class PortfolioCollector implements EvidenceCollector {
  provider = "portfolio" as const;

  async collect(input: CollectorInput): Promise<CollectorResult> {
    if (!input.profileUrl) {
      return {
        source: "portfolio",
        success: false,
        evidence: [],
        error: "Portfolio URL is required.",
        errorCode: "INVALID_INPUT",
      };
    }
    return collectPortfolioEvidence(input.profileUrl);
  }
}

export async function collectPortfolioEvidence(
  rawUrl: string
): Promise<CollectorResult> {
  // 1. SSRF and public URL validation
  const validation = await validatePublicUrl(rawUrl);
  if (!validation.valid || !validation.url) {
    return {
      source: "portfolio",
      success: false,
      evidence: [],
      error: validation.error || "URL failed SSRF validation.",
      errorCode: "SSRF_BLOCKED",
    };
  }

  const targetUrl = validation.url.toString();
  const evidence: NormalizedEvidence[] = [];

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "PROVE-Evidence-Crawler/1.0 (+https://prove.dev; verified crawler)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });

    if (!res.ok) {
      return {
        source: "portfolio",
        success: false,
        evidence: [],
        error: `Portfolio server returned HTTP ${res.status}`,
        errorCode: "NETWORK_ERROR",
      };
    }

    // Verify redirected URL for SSRF protection
    if (res.url && res.url !== targetUrl) {
      const redirectCheck = await validatePublicUrl(res.url);
      if (!redirectCheck.valid) {
        return {
          source: "portfolio",
          success: false,
          evidence: [],
          error: "Redirected to forbidden or internal IP address.",
          errorCode: "SSRF_BLOCKED",
        };
      }
    }

    const html = await res.text();

    // Check size limit: max 5MB
    if (html.length > 5 * 1024 * 1024) {
      return {
        source: "portfolio",
        success: false,
        evidence: [],
        error: "Portfolio response exceeded maximum permitted size (5MB).",
        errorCode: "PARSING_ERROR",
      };
    }

    const $ = cheerio.load(html);

    // Meta extraction
    const pageTitle =
      $("title").text().trim() ||
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $("h1").first().text().trim() ||
      targetUrl;

    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim() ||
      "";

    const canonicalUrl = $('link[rel="canonical"]').attr("href") || targetUrl;

    // Body text for tech detection
    const bodyText = $("body").text();

    // Detect technology mentions explicitly stated on the page
    const detectedTechs: string[] = [];
    for (const tech of TECH_KEYWORDS) {
      const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, "i");
      if (regex.test(bodyText) || html.includes(tech)) {
        detectedTechs.push(tech);
      }
    }

    // Detect projects
    const detectedProjects: {
      name: string;
      description?: string;
      link?: string;
    }[] = [];

    // Scan semantic elements (articles, cards, project sections)
    $("h2, h3, h4").each((_, el) => {
      const heading = $(el).text().trim();
      const parent = $(el).closest("div, section, article, li");
      const link = parent.find("a[href]").attr("href");
      const desc = parent.find("p").first().text().trim();

      const isIgnoredSection = [
        "about",
        "skills",
        "experience",
        "contact",
        "education",
        "nav",
        "menu",
        "footer",
      ].some((s) => heading.toLowerCase().includes(s));

      if (heading.length > 2 && heading.length < 60 && !isIgnoredSection) {
        if (detectedProjects.length < 8) {
          detectedProjects.push({
            name: heading,
            description: desc ? desc.slice(0, 160) : undefined,
            link: link && (link.startsWith("http") || link.startsWith("/")) ? link : undefined,
          });
        }
      }
    });

    // 1. Portfolio Overview Evidence
    evidence.push({
      source: "portfolio",
      evidenceType: "portfolio_overview",
      title: `Portfolio: ${pageTitle.slice(0, 60)}`,
      description: metaDescription
        ? metaDescription.slice(0, 200)
        : `Verified deployed web presence. ${detectedProjects.length} projects detected, ${detectedTechs.length} technologies referenced.`,
      sourceUrl: targetUrl,
      rawData: {
        url: targetUrl,
        canonicalUrl,
        pageTitle,
        metaDescription,
        projectsDetectedCount: detectedProjects.length,
        technologiesCount: detectedTechs.length,
      },
      confidence: 0.98,
      collectedAt: new Date().toISOString(),
    });

    // 2. Individual Project Evidence Items
    for (const proj of detectedProjects.slice(0, 4)) {
      evidence.push({
        source: "portfolio",
        evidenceType: "portfolio_project",
        title: `Project: ${proj.name}`,
        description: proj.description || `Public project documented on ${targetUrl}.`,
        sourceUrl: proj.link?.startsWith("http") ? proj.link : targetUrl,
        rawData: {
          projectName: proj.name,
          description: proj.description,
          link: proj.link,
          portfolioUrl: targetUrl,
        },
        confidence: 0.92,
        collectedAt: new Date().toISOString(),
      });
    }

    // 3. Technology Signal Evidence (observable facts only)
    if (detectedTechs.length > 0) {
      evidence.push({
        source: "portfolio",
        evidenceType: "technology_signal",
        title: "Observed Stack on Portfolio",
        description: `Explicit technology mentions extracted from public page: ${detectedTechs.slice(0, 8).join(", ")}.`,
        sourceUrl: targetUrl,
        rawData: {
          technologies: detectedTechs,
        },
        confidence: 0.88,
        collectedAt: new Date().toISOString(),
      });
    }

    return {
      source: "portfolio",
      success: true,
      evidence,
      meta: {
        pageTitle,
        projectsCount: detectedProjects.length,
        technologiesCount: detectedTechs.length,
      },
    };
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return {
        source: "portfolio",
        success: false,
        evidence: [],
        error: "Portfolio crawl timed out (exceeded 8s).",
        errorCode: "TIMEOUT",
      };
    }
    return {
      source: "portfolio",
      success: false,
      evidence: [],
      error: err?.message || "Failed to crawl portfolio.",
      errorCode: "NETWORK_ERROR",
    };
  }
}
