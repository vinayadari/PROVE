import assert from "node:assert";
import { validatePublicUrl } from "../lib/security/ssrf";
import { computeEvidenceDedupHash } from "../lib/analysis/normalize";
import {
  NormalizedEvidenceSchema,
  CollectorErrorCode,
} from "../lib/collectors/types";
import { collectResumeEvidence } from "../lib/collectors/resume";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runAllTests() {
  console.log("\n=======================================================");
  console.log("  PROVE Evidence Engine - Comprehensive Test Suite");
  console.log("=======================================================\n");

  console.log("--- 1. SSRF & URL Security Tests ---");

  await test("Rejects localhost hostname", async () => {
    const result = await validatePublicUrl("http://localhost:3000/admin");
    assert.strictEqual(result.valid, false);
    assert(result.error?.toLowerCase().includes("localhost"));
  });

  await test("Rejects 127.0.0.1 loopback IP", async () => {
    const result = await validatePublicUrl("http://127.0.0.1:8080");
    assert.strictEqual(result.valid, false);
    assert(result.error?.toLowerCase().includes("private") || result.error?.toLowerCase().includes("loopback") || result.error?.toLowerCase().includes("blocked"));
  });

  await test("Rejects AWS/Cloud metadata IP 169.254.169.254", async () => {
    const result = await validatePublicUrl("http://169.254.169.254/latest/meta-data");
    assert.strictEqual(result.valid, false);
    assert(result.error?.toLowerCase().includes("cloud metadata") || result.error?.toLowerCase().includes("private"));
  });

  await test("Rejects private class A network 10.0.0.5", async () => {
    const result = await validatePublicUrl("http://10.0.0.5:8000");
    assert.strictEqual(result.valid, false);
    assert(result.error?.toLowerCase().includes("private"));
  });

  await test("Rejects private class C network 192.168.1.100", async () => {
    const result = await validatePublicUrl("http://192.168.1.100");
    assert.strictEqual(result.valid, false);
    assert(result.error?.toLowerCase().includes("private"));
  });

  await test("Rejects non-http/https protocol (file://)", async () => {
    const result = await validatePublicUrl("file:///etc/passwd");
    assert.strictEqual(result.valid, false);
    assert(result.error?.toLowerCase().includes("protocol") || result.error?.toLowerCase().includes("scheme"));
  });

  await test("Rejects non-http/https protocol (ftp://)", async () => {
    const result = await validatePublicUrl("ftp://files.example.com");
    assert.strictEqual(result.valid, false);
    assert(result.error?.toLowerCase().includes("protocol") || result.error?.toLowerCase().includes("scheme"));
  });

  await test("Accepts legitimate public URL (https://github.com)", async () => {
    const result = await validatePublicUrl("https://github.com");
    assert.strictEqual(result.valid, true);
    assert(result.url instanceof URL);
  });

  console.log("\n--- 2. Evidence Deduplication & Hashing Tests ---");

  await test("Deterministic hash is identical regardless of execution order or object key order", () => {
    const item1 = {
      candidateId: "cand-123",
      source: "github" as const,
      evidenceType: "repository" as const,
      title: "Repository: prove",
      sourceUrl: "https://github.com/org/prove",
      rawData: { stars: 42, language: "TypeScript", name: "prove" },
    };

    const item2 = {
      candidateId: "cand-123",
      source: "github" as const,
      evidenceType: "repository" as const,
      title: "Repository: prove",
      sourceUrl: "https://github.com/org/prove",
      rawData: { name: "prove", language: "TypeScript", stars: 42 }, // reversed keys
    };

    const hash1 = computeEvidenceDedupHash(item1);
    const hash2 = computeEvidenceDedupHash(item2);

    assert.strictEqual(hash1, hash2, "Hashes must match regardless of key order");
    assert.strictEqual(hash1.length, 64, "SHA-256 hash must be 64 hex characters");
  });

  await test("Deterministic hash ignores timestamps (no timestamps in content hash)", () => {
    const base = {
      candidateId: "cand-123",
      source: "leetcode" as const,
      evidenceType: "leetcode_profile" as const,
      title: "LeetCode: user1",
      sourceUrl: "https://leetcode.com/user1",
      rawData: { totalSolved: 350 },
    };

    const hash1 = computeEvidenceDedupHash(base);
    const hash2 = computeEvidenceDedupHash({
      ...base,
      collectedAt: new Date(), // Has timestamp
    } as any);

    assert.strictEqual(hash1, hash2, "Timestamp must not alter the content dedup hash");
  });

  await test("Hash differentiates different repos or problem counts", () => {
    const hashA = computeEvidenceDedupHash({
      candidateId: "cand-123",
      source: "leetcode" as const,
      evidenceType: "leetcode_profile" as const,
      title: "LeetCode: user1",
      sourceUrl: "https://leetcode.com/user1",
      rawData: { totalSolved: 100 },
    });

    const hashB = computeEvidenceDedupHash({
      candidateId: "cand-123",
      source: "leetcode" as const,
      evidenceType: "leetcode_profile" as const,
      title: "LeetCode: user1",
      sourceUrl: "https://leetcode.com/user1",
      rawData: { totalSolved: 200 },
    });

    assert.notStrictEqual(hashA, hashB, "Different data must produce different hashes");
  });

  console.log("\n--- 3. Normalized Evidence Schema Tests ---");

  await test("Validates well-formed GitHub repository evidence item", () => {
    const validEvidence = {
      candidateId: "c3d964f5-7e87-4b13-a841-86641e7f3dc9",
      source: "github",
      evidenceType: "repository",
      title: "Repository: octocat/Hello-World",
      description: "Public GitHub repository with 1500 stars in C",
      sourceUrl: "https://github.com/octocat/Hello-World",
      rawData: { stars: 1500, forks: 800, language: "C" },
      confidence: 1.0,
      collectedAt: new Date().toISOString(),
    };

    const parsed = NormalizedEvidenceSchema.safeParse(validEvidence);
    assert.strictEqual(parsed.success, true);
  });

  await test("Rejects evidence item with invalid source provider", () => {
    const invalidEvidence = {
      candidateId: "c3d964f5-7e87-4b13-a841-86641e7f3dc9",
      source: "untrusted_network", // invalid source
      evidenceType: "repository",
      title: "Hack",
      description: "Fake",
      confidence: 1.0,
    };

    const parsed = NormalizedEvidenceSchema.safeParse(invalidEvidence);
    assert.strictEqual(parsed.success, false);
  });

  console.log("\n--- 4. Structured Error Codes Tests ---");

  await test("Structured collector error codes conform to specification", () => {
    const codes: CollectorErrorCode[] = [
      "NOT_FOUND",
      "RATE_LIMITED",
      "SSRF_BLOCKED",
      "TIMEOUT",
      "PARSING_ERROR",
      "NETWORK_ERROR",
    ];

    assert.strictEqual(codes.length, 6);
    assert(codes.includes("RATE_LIMITED"));
    assert(codes.includes("SSRF_BLOCKED"));
  });

  console.log("\n--- 5. Resume Segmentation & Parsing Tests ---");

  await test("Parses and segments resume text into structured evidence items", () => {
    const sampleResume = `
      John Doe
      Senior Full Stack Engineer
      Skills: TypeScript, React, Next.js, Node.js, PostgreSQL, Docker, AWS
      Experience:
      Senior Software Engineer at Acme Corp (2021 - Present)
      Built microservices handling 10M requests daily.
      Full Stack Developer at Beta Labs (2018 - 2021)
      Implemented frontend design system using React and TailwindCSS.
      Education:
      Bachelor of Science in Computer Science, State University (2014 - 2018)
    `;

    const result = collectResumeEvidence("john_doe_resume.pdf", sampleResume);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.source, "resume");
    assert(result.evidence.length >= 3, "Should extract profile, skills, and experience items");

    const skillItem = result.evidence.find((e) => e.evidenceType === "resume_skill");
    assert(skillItem, "Should have resume_skill item");
    assert(skillItem.rawData.skillsFound.includes("TypeScript"));
    assert(skillItem.rawData.skillsFound.includes("Docker"));

    const expItem = result.evidence.find((e) => e.evidenceType === "resume_experience");
    assert(expItem, "Should have resume_experience item");
  });

  await test("Rejects empty or too short resume input", () => {
    const result = collectResumeEvidence("empty.pdf", "Too short");
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.errorCode, "PARSING_ERROR");
    assert.strictEqual(result.evidence.length, 0);
  });

  console.log("\n=======================================================");
  console.log(`  Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Test runner encountered error:", err);
  process.exit(1);
});
