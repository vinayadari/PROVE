import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    success: true,
    data: {
      backend: {
        avgOverallScore: 78,
        topPercentileThreshold: 90,
        keySignals: ["GitHub consistency", "System design projects", "Concurrency & caching"],
      },
      frontend: {
        avgOverallScore: 81,
        topPercentileThreshold: 92,
        keySignals: ["Interactive portfolio", "Component architecture", "Performance & WCAG"],
      },
      aiProduct: {
        avgOverallScore: 76,
        topPercentileThreshold: 88,
        keySignals: ["Deployed LLM agents", "Vector retrieval", "Real-world user metrics"],
      },
    },
  });
}
