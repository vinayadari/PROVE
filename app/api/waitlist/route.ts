import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { waitlistStore } from "@/lib/server/demo-data";

const WaitlistSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  roleType: z.enum(["recruiter", "candidate", "engineering_leader"]),
  companyOrPortfolio: z.string().optional(),
  notes: z.string().optional(),
});

export function GET() {
  return NextResponse.json({
    success: true,
    count: waitlistStore.length,
    data: waitlistStore,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = WaitlistSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.format() },
      { status: 400 },
    );
  }

  const { name, email, roleType, companyOrPortfolio, notes } = parsed.data;
  const existing = waitlistStore.find((entry) => entry.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    return NextResponse.json({
      success: true,
      message: "You're already on the priority list! We'll reach out soon.",
      data: existing,
      isExisting: true,
    });
  }

  const newEntry = {
    id: `wl_${nanoid(8)}`,
    name,
    email,
    roleType,
    companyOrPortfolio,
    notes,
    createdAt: new Date().toISOString(),
  };

  waitlistStore.unshift(newEntry);

  return NextResponse.json(
    {
      success: true,
      message: "Thank you for requesting early access to PROVE.",
      data: newEntry,
      isExisting: false,
    },
    { status: 201 },
  );
}
