import {
  CollectorResult,
  CollectorInput,
  EvidenceCollector,
  NormalizedEvidence,
} from "./types";

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
  "Spring",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "GraphQL",
  "gRPC",
  "Kafka",
  "RabbitMQ",
  "Docker",
  "Kubernetes",
  "Terraform",
  "AWS",
  "GCP",
  "Azure",
  "TailwindCSS",
  "Prisma",
  "Drizzle",
];

export class GitHubCollector implements EvidenceCollector {
  provider = "github" as const;

  async collect(input: CollectorInput): Promise<CollectorResult> {
    if (!input.username) {
      return {
        source: "github",
        success: false,
        evidence: [],
        error: "GitHub username is required.",
        errorCode: "INVALID_INPUT",
      };
    }
    return collectGithubEvidence(input.username, input.token);
  }
}

export async function collectGithubEvidence(
  username: string,
  token?: string
): Promise<CollectorResult> {
  const cleanUser = username.trim().replace(/^@/, "").replace(/https?:\/\/github\.com\//, "").replace(/\/.*$/, "");
  if (!cleanUser) {
    return {
      source: "github",
      success: false,
      evidence: [],
      error: "Invalid GitHub username provided.",
      errorCode: "INVALID_INPUT",
    };
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "PROVE-Evidence-Engine/1.0",
  };

  const authToken = token || process.env.GITHUB_TOKEN;
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const evidence: NormalizedEvidence[] = [];

  try {
    // 1. Fetch GitHub user profile
    const userRes = await fetch(`https://api.github.com/users/${cleanUser}`, {
      headers,
      signal: AbortSignal.timeout(10000),
    });

    const rateLimitRemaining = Number(userRes.headers.get("x-ratelimit-remaining"));
    const rateLimitReset = Number(userRes.headers.get("x-ratelimit-reset"));

    if (!userRes.ok) {
      if (userRes.status === 404) {
        return {
          source: "github",
          success: false,
          evidence: [],
          error: `GitHub user "@${cleanUser}" does not exist.`,
          errorCode: "NOT_FOUND",
          rateLimitRemaining,
          rateLimitReset,
        };
      }
      if (userRes.status === 403 || userRes.status === 429) {
        return {
          source: "github",
          success: false,
          evidence: [],
          error: "GitHub API rate limit reached. Provide a GITHUB_TOKEN to increase limits.",
          errorCode: "RATE_LIMITED",
          rateLimitRemaining,
          rateLimitReset,
        };
      }
      if (userRes.status === 401) {
        return {
          source: "github",
          success: false,
          evidence: [],
          error: "Invalid GitHub token provided.",
          errorCode: "UNAUTHORIZED",
        };
      }
      return {
        source: "github",
        success: false,
        evidence: [],
        error: `GitHub API error: HTTP ${userRes.status}`,
        errorCode: "NETWORK_ERROR",
      };
    }

    const userData = await userRes.json();

    // 2. Fetch public repositories (up to 30, sorted by recently updated)
    const reposRes = await fetch(
      `https://api.github.com/users/${cleanUser}/repos?sort=updated&per_page=30`,
      { headers, signal: AbortSignal.timeout(10000) }
    );

    const repos = reposRes.ok ? await reposRes.json() : [];
    const nonForks = repos.filter((r: any) => !r.fork);
    const topRepos = (nonForks.length > 0 ? nonForks : repos).slice(0, 8);

    // Aggregate statistics
    let totalStars = 0;
    let totalForks = 0;
    const languageCounts: Record<string, number> = {};
    const allTopics = new Set<string>();

    for (const repo of repos) {
      if (!repo.fork) {
        totalStars += repo.stargazers_count || 0;
        totalForks += repo.forks_count || 0;
        if (repo.language) {
          languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
        }
        if (Array.isArray(repo.topics)) {
          repo.topics.forEach((t: string) => allTopics.add(t.toLowerCase()));
        }
      }
    }

    // 3. Profile overview evidence
    evidence.push({
      source: "github",
      evidenceType: "github_profile",
      title: `GitHub Profile: @${userData.login}`,
      description: `${userData.public_repos} public repositories, ${totalStars} total stars, ${userData.followers} followers.`,
      sourceUrl: userData.html_url,
      rawData: {
        login: userData.login,
        name: userData.name || userData.login,
        bio: userData.bio,
        publicRepos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        totalStars,
        totalForks,
        languagesDetected: Object.keys(languageCounts),
      },
      confidence: 1.0,
      collectedAt: new Date().toISOString(),
    });

    // 4. Detailed repository evidence items
    for (const repo of topRepos) {
      evidence.push({
        source: "github",
        evidenceType: "repository",
        title: `Repository: ${repo.name}`,
        description: repo.description
          ? `[${repo.language || "Polyglot"}] ${repo.description}`
          : `Public codebase written in ${repo.language || "multiple languages"} with ${repo.stargazers_count} stars.`,
        sourceUrl: repo.html_url,
        rawData: {
          repositoryName: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          defaultBranch: repo.default_branch,
          archived: repo.archived || false,
          topics: repo.topics || [],
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
        },
        confidence: 0.98,
        collectedAt: new Date().toISOString(),
      });
    }

    // 5. Query languages and README for top 2 repos to extract concrete project signals
    for (const repo of topRepos.slice(0, 2)) {
      try {
        // Fetch languages
        const langRes = await fetch(
          `https://api.github.com/repos/${cleanUser}/${repo.name}/languages`,
          { headers, signal: AbortSignal.timeout(5000) }
        );
        if (langRes.ok) {
          const langData = await langRes.json();
          const langNames = Object.keys(langData);
          if (langNames.length > 0) {
            evidence.push({
              source: "github",
              evidenceType: "repository_language",
              title: `${repo.name} Language Distribution`,
              description: `Detailed language breakdown: ${langNames.slice(0, 5).join(", ")}.`,
              sourceUrl: `${repo.html_url}`,
              rawData: {
                repository: repo.name,
                languages: langData,
              },
              confidence: 0.99,
              collectedAt: new Date().toISOString(),
            });
          }
        }

        // Fetch README
        const readmeRes = await fetch(
          `https://api.github.com/repos/${cleanUser}/${repo.name}/readme`,
          { headers, signal: AbortSignal.timeout(5000) }
        );
        if (readmeRes.ok) {
          const readmeData = await readmeRes.json();
          if (readmeData.content && readmeData.encoding === "base64") {
            const decoded = Buffer.from(readmeData.content, "base64").toString("utf-8");

            // Extract explicit technology mentions from README
            const foundTechs = TECH_KEYWORDS.filter((tech) => {
              const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, "i");
              return regex.test(decoded);
            });

            if (foundTechs.length > 0) {
              evidence.push({
                source: "github",
                evidenceType: "project_signal",
                title: `${repo.name} Documented Stack`,
                description: `README specifies use of: ${foundTechs.join(", ")}.`,
                sourceUrl: `${repo.html_url}#readme`,
                rawData: {
                  repository: repo.name,
                  technologiesFound: foundTechs,
                  readmeSnippet: decoded.slice(0, 600),
                },
                confidence: 0.92,
                collectedAt: new Date().toISOString(),
              });
            }
          }
        }
      } catch {
        // Non-fatal enhancement failures
      }
    }

    return {
      source: "github",
      success: true,
      evidence,
      rateLimitRemaining,
      rateLimitReset,
      meta: {
        publicRepos: userData.public_repos,
        totalStars,
      },
    };
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return {
        source: "github",
        success: false,
        evidence: [],
        error: "GitHub API request timed out.",
        errorCode: "TIMEOUT",
      };
    }
    return {
      source: "github",
      success: false,
      evidence: [],
      error: err?.message || "Failed to collect GitHub evidence.",
      errorCode: "NETWORK_ERROR",
    };
  }
}
