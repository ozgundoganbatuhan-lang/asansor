import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const org = await prisma.organization.findUnique({ where: { id: session.orgId } });
  if (!org) return NextResponse.json({ error: "Org bulunamadı." }, { status: 404 });

  const now = new Date();
  const isExpired = org.planTier === "TRIAL" && org.trialEndsAt < now;
  const isTrial = org.planTier === "TRIAL";

  const ent = {
    planTier: org.planTier,
    isTrial,
    isExpired,
    canWrite: !isExpired,
    canExport: !isExpired,
    trialEndsAt: org.trialEndsAt.toISOString(),
    daysLeft: Math.max(0, Math.ceil((org.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
  };

  return NextResponse.json({ ent, ok: true });
}
