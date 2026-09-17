import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "PROVE Talent Intelligence API",
    timestamp: new Date().toISOString(),
    uptimeSeconds: 0,
  });
}
