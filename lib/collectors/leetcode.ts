import {
  CollectorResult,
  CollectorInput,
  EvidenceCollector,
  NormalizedEvidence,
} from "./types";

export class LeetCodeCollector implements EvidenceCollector {
  provider = "leetcode" as const;

  async collect(input: CollectorInput): Promise<CollectorResult> {
    if (!input.username) {
      return {
        source: "leetcode",
        success: false,
        evidence: [],
        error: "LeetCode username is required.",
        errorCode: "INVALID_INPUT",
      };
    }
    return collectLeetcodeEvidence(input.username);
  }
}

export async function collectLeetcodeEvidence(
  username: string
): Promise<CollectorResult> {
  const cleanUser = username.trim().replace(/^@/, "").replace(/https?:\/\/leetcode\.com\/(u\/)?/, "").replace(/\/.*$/, "");
  if (!cleanUser) {
    return {
      source: "leetcode",
      success: false,
      evidence: [],
      error: "Invalid LeetCode username provided.",
      errorCode: "INVALID_INPUT",
    };
  }

  const evidence: NormalizedEvidence[] = [];

  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          reputation
          starRating
        }
        languageProblemSolved {
          languageName
          problemsSolved
        }
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        badges {
          displayName
          icon
        }
      }
      userContestRanking(username: $username) {
        rating
        globalRanking
        topPercentage
        attendedContestsCount
      }
    }
  `;

  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "PROVE-Evidence-Engine/1.0",
      },
      body: JSON.stringify({
        query,
        variables: { username: cleanUser },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return {
          source: "leetcode",
          success: false,
          evidence: [],
          error: "LeetCode rate limit reached.",
          errorCode: "RATE_LIMITED",
        };
      }
      return {
        source: "leetcode",
        success: false,
        evidence: [],
        error: `LeetCode GraphQL returned HTTP ${res.status}`,
        errorCode: "NETWORK_ERROR",
      };
    }

    const data = await res.json();
    const matchedUser = data?.data?.matchedUser;

    if (!matchedUser) {
      return {
        source: "leetcode",
        success: false,
        evidence: [],
        error: `LeetCode user "@${cleanUser}" not found.`,
        errorCode: "NOT_FOUND",
      };
    }

    const profileUrl = `https://leetcode.com/u/${cleanUser}/`;
    const acStats = matchedUser.submitStatsGlobal?.acSubmissionNum || [];
    const contest = data?.data?.userContestRanking;
    const languages = matchedUser.languageProblemSolved || [];
    const badges = matchedUser.badges || [];

    const allSolved = acStats.find((s: any) => s.difficulty === "All")?.count || 0;
    const easySolved = acStats.find((s: any) => s.difficulty === "Easy")?.count || 0;
    const mediumSolved = acStats.find((s: any) => s.difficulty === "Medium")?.count || 0;
    const hardSolved = acStats.find((s: any) => s.difficulty === "Hard")?.count || 0;

    // 1. Profile evidence
    evidence.push({
      source: "leetcode",
      evidenceType: "leetcode_profile",
      title: `LeetCode Profile: @${cleanUser}`,
      description: `Public LeetCode profile with global rank #${matchedUser.profile?.ranking ? matchedUser.profile.ranking.toLocaleString() : "Unranked"} and reputation ${matchedUser.profile?.reputation || 0}.`,
      sourceUrl: profileUrl,
      rawData: {
        username: cleanUser,
        ranking: matchedUser.profile?.ranking || null,
        reputation: matchedUser.profile?.reputation || 0,
        badgesCount: badges.length,
      },
      confidence: 1.0,
      collectedAt: new Date().toISOString(),
    });

    // 2. Problem solving statistics evidence
    evidence.push({
      source: "leetcode",
      evidenceType: "leetcode_problem_stats",
      title: "Problem Solving Statistics",
      description: `${allSolved} problems solved (Easy: ${easySolved}, Medium: ${mediumSolved}, Hard: ${hardSolved}).`,
      sourceUrl: profileUrl,
      rawData: {
        total: allSolved,
        easy: easySolved,
        medium: mediumSolved,
        hard: hardSolved,
        submissions: acStats.find((s: any) => s.difficulty === "All")?.submissions || 0,
      },
      confidence: 0.99,
      collectedAt: new Date().toISOString(),
    });

    // 3. Language distribution
    if (languages.length > 0) {
      evidence.push({
        source: "leetcode",
        evidenceType: "leetcode_language",
        title: "LeetCode Algorithmic Languages",
        description: `Solved problems using: ${languages.map((l: any) => `${l.languageName} (${l.problemsSolved})`).join(", ")}.`,
        sourceUrl: profileUrl,
        rawData: {
          languages: languages.map((l: any) => ({
            language: l.languageName,
            problemsSolved: l.problemsSolved,
          })),
        },
        confidence: 0.98,
        collectedAt: new Date().toISOString(),
      });
    }

    // 4. Contest performance
    if (contest && contest.attendedContestsCount > 0) {
      evidence.push({
        source: "leetcode",
        evidenceType: "leetcode_contest",
        title: `LeetCode Contest Rating: ${Math.round(contest.rating)}`,
        description: `Top ${contest.topPercentage || "N/A"}% globally across ${contest.attendedContestsCount} official contests. Global rank: #${contest.globalRanking ? contest.globalRanking.toLocaleString() : "N/A"}.`,
        sourceUrl: profileUrl,
        rawData: {
          rating: Math.round(contest.rating),
          globalRanking: contest.globalRanking,
          topPercentage: contest.topPercentage,
          attendedContestsCount: contest.attendedContestsCount,
        },
        confidence: 0.96,
        collectedAt: new Date().toISOString(),
      });
    }

    return {
      source: "leetcode",
      success: true,
      evidence,
      meta: {
        totalSolved: allSolved,
        ranking: matchedUser.profile?.ranking,
        contestRating: contest?.rating ? Math.round(contest.rating) : null,
      },
    };
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return {
        source: "leetcode",
        success: false,
        evidence: [],
        error: "LeetCode GraphQL request timed out.",
        errorCode: "TIMEOUT",
      };
    }
    return {
      source: "leetcode",
      success: false,
      evidence: [],
      error: err?.message || "Failed to query LeetCode GraphQL.",
      errorCode: "NETWORK_ERROR",
    };
  }
}
