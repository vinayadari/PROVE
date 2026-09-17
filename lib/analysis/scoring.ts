import { GrokAnalysisOutput } from "./grok";

export interface ScoreBreakdown {
  codeVelocity: number;      // 0 - 100
  algorithmicDepth: number;  // 0 - 100
  productionDelivery: number;// 0 - 100
  domainBreadth: number;     // 0 - 100
}

export interface DeterministicScoreResult {
  overallScore: number;
  fitScore: number;
  breakdown: ScoreBreakdown;
  skillScores: {
    skill: string;
    score: number;
    evidenceIds?: string[];
  }[];
}

export function computeDeterministicScores(params: {
  targetRole: string;
  experienceYears: number;
  evidenceItems: {
    id?: string;
    source: string;
    evidenceType: string;
    rawData: any;
  }[];
  grokInsights?: GrokAnalysisOutput;
}): DeterministicScoreResult {
  const { evidenceItems, grokInsights } = params;

  // 1. Evaluate Code Velocity (GitHub)
  let codeVelocity = 40; // baseline
  const ghOverview = evidenceItems.find((e) => e.evidenceType === "github_profile_overview");
  const ghVelocity = evidenceItems.find((e) => e.evidenceType === "github_codebase_velocity");

  if (ghOverview?.rawData) {
    const repos = ghOverview.rawData.publicRepos || 0;
    const followers = ghOverview.rawData.followers || 0;
    codeVelocity += Math.min(repos * 2, 30);
    codeVelocity += Math.min(followers, 10);
  }

  if (ghVelocity?.rawData) {
    const stars = ghVelocity.rawData.totalStars || 0;
    const languages = Object.keys(ghVelocity.rawData.languages || {}).length;
    codeVelocity += Math.min(stars * 2, 15);
    codeVelocity += Math.min(languages * 2, 10);
  }
  codeVelocity = Math.min(Math.max(codeVelocity, 20), 98);

  // 2. Evaluate Algorithmic Depth (LeetCode)
  let algorithmicDepth = 35; // baseline
  const lcItem = evidenceItems.find((e) => e.evidenceType === "leetcode_problem_solving");
  const lcContest = evidenceItems.find((e) => e.evidenceType === "leetcode_contest_performance");

  if (lcItem?.rawData) {
    const total = lcItem.rawData.totalSolved || 0;
    const hard = lcItem.rawData.hard || 0;
    const medium = lcItem.rawData.medium || 0;

    algorithmicDepth += Math.min(Math.floor(total / 10), 30);
    algorithmicDepth += Math.min(medium * 0.5, 15);
    algorithmicDepth += Math.min(hard * 2, 15);
  }

  if (lcContest?.rawData?.rating) {
    const rating = lcContest.rawData.rating;
    if (rating > 1800) algorithmicDepth += 10;
    if (rating > 2100) algorithmicDepth += 10;
  }
  algorithmicDepth = Math.min(Math.max(algorithmicDepth, 25), 99);

  // 3. Evaluate Production Delivery (Portfolio + Resume + Repos)
  let productionDelivery = 45;
  const hasPortfolio = evidenceItems.some((e) => e.source === "portfolio");
  const hasResume = evidenceItems.some((e) => e.source === "resume");
  const repoItems = evidenceItems.filter((e) => e.evidenceType === "github_repository");

  if (hasPortfolio) productionDelivery += 15;
  if (hasResume) productionDelivery += 15;
  productionDelivery += Math.min(repoItems.length * 3, 15);

  if (grokInsights?.engineeringRigorScore) {
    // Incorporate Grok's evaluation of code quality and rigor
    productionDelivery = Math.round((productionDelivery * 0.6) + (grokInsights.engineeringRigorScore * 0.4));
  }
  productionDelivery = Math.min(Math.max(productionDelivery, 30), 97);

  // 4. Evaluate Domain Breadth
  let domainBreadth = 50;
  const sourcesCount = new Set(evidenceItems.map((e) => e.source)).size;
  domainBreadth += (sourcesCount - 1) * 12;

  if (params.experienceYears > 0) {
    domainBreadth += Math.min(params.experienceYears * 2, 16);
  }
  domainBreadth = Math.min(Math.max(domainBreadth, 30), 96);

  // Calculate Overall Score (Weighted combination)
  const overallScore = Math.round(
    codeVelocity * 0.3 +
    algorithmicDepth * 0.25 +
    productionDelivery * 0.25 +
    domainBreadth * 0.2
  );

  // Calculate Role Fit Score
  const targetLower = params.targetRole.toLowerCase();
  let fitScore = overallScore;
  if (targetLower.includes("senior") || targetLower.includes("lead")) {
    fitScore = Math.round(overallScore * 0.95 + (params.experienceYears >= 5 ? 5 : -5));
  } else if (targetLower.includes("frontend")) {
    fitScore = hasPortfolio ? Math.min(overallScore + 4, 99) : overallScore;
  } else if (targetLower.includes("backend") || targetLower.includes("systems")) {
    fitScore = algorithmicDepth > 70 ? Math.min(overallScore + 5, 99) : overallScore;
  }
  fitScore = Math.min(Math.max(fitScore, 20), 99);

  // Compute Skill Scores
  const skillScores: DeterministicScoreResult["skillScores"] = [];
  if (grokInsights?.verifiedCompetencies) {
    for (const comp of grokInsights.verifiedCompetencies) {
      const baseVal =
        comp.level === "Expert" ? 92 : comp.level === "Proficient" ? 82 : 72;
      skillScores.push({
        skill: comp.skill,
        score: baseVal,
      });
    }
  }

  // Ensure default skills if none parsed
  if (skillScores.length === 0) {
    skillScores.push(
      { skill: "Software Engineering & Architecture", score: overallScore },
      { skill: "Data Structures & Algorithms", score: algorithmicDepth },
      { skill: "Code Quality & Testing", score: productionDelivery }
    );
  }

  return {
    overallScore,
    fitScore,
    breakdown: {
      codeVelocity,
      algorithmicDepth,
      productionDelivery,
      domainBreadth,
    },
    skillScores,
  };
}
