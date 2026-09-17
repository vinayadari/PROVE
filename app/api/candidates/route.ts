import { NextRequest, NextResponse } from "next/server";
import { candidatesStore } from "@/lib/server/demo-data";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search");
  const role = searchParams.get("role");
  const minScore = searchParams.get("minScore");

  let results = [...candidatesStore];

  if (search?.trim()) {
    const q = search.toLowerCase().trim();
    results = results.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.topSkills.some((s) => s.toLowerCase().includes(q)),
    );
  }

  if (role?.trim()) {
    const r = role.toLowerCase().trim();
    results = results.filter((c) => c.role.toLowerCase().includes(r));
  }

  if (minScore !== null && !Number.isNaN(Number(minScore))) {
    const threshold = Number(minScore);
    results = results.filter((c) => c.overallScore >= threshold);
  }

  return NextResponse.json({
    success: true,
    count: results.length,
    data: results,
  });
}
