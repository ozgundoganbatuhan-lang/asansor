import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get("assetId") ?? undefined;
    const plans = await prisma.maintenancePlan.findMany({
      where: { organizationId: session.orgId, ...(assetId ? { assetId } : {}) },
      orderBy: { nextDueAt: "asc" },
      include: {
        asset: {
          select: {
            id: true, name: true, elevatorIdNo: true,
            customer: { select: { id: true, name: true } },
          },
        },
        contract: { select: { id: true, contractNumber: true } },
      },
    });
    return NextResponse.json({ items: plans, ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e), items: [] }, { status: 500 });
  }
}

const schema = z.object({
  assetId: z.string().min(1),
  name: z.string().optional(),
  planType: z.enum(["PERIODIC", "ANNUAL_INSPECTION", "CUSTOM"]).default("PERIODIC"),
  periodDays: z.coerce.number().int().min(1).default(30),
  monthlyFee: z.coerce.number().int().default(0),
  contractId: z.string().optional(),
  technicianId: z.string().optional(),
  nextDueAt: z.string(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

    const plan = await prisma.maintenancePlan.create({
      data: {
        organizationId: session.orgId,
        ...parsed.data,
        monthlyFee: Math.round(parsed.data.monthlyFee * 100),
        nextDueAt: new Date(parsed.data.nextDueAt),
      },
      include: {
        asset: { select: { id: true, name: true, customer: { select: { id: true, name: true } } } },
      },
    });
    return NextResponse.json({ item: plan, ok: true }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
