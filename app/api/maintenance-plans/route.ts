import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const items = await prisma.maintenancePlan.findMany({
    where: { organizationId: session.orgId },
    include: {
      asset: {
        select: {
          id: true,
          name: true,
          buildingName: true,
          customer: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { nextDueAt: "asc" },
  });

  return NextResponse.json({ items, ok: true });
}

const schema = z.object({
  assetId: z.string().min(1),
  periodMonths: z.coerce.number().int().min(1).max(24).default(1),
  nextDueAt: z.string().datetime(),
  lastDoneAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz form" }, { status: 400 });
  }

  const asset = await prisma.asset.findFirst({
    where: { id: parsed.data.assetId, organizationId: session.orgId },
  });
  if (!asset) return NextResponse.json({ error: "Asansör bulunamadı." }, { status: 404 });

  const item = await prisma.maintenancePlan.create({
    data: {
      organizationId: session.orgId,
      assetId: parsed.data.assetId,
      periodMonths: parsed.data.periodMonths,
      nextDueAt: new Date(parsed.data.nextDueAt),
      lastDoneAt: parsed.data.lastDoneAt ? new Date(parsed.data.lastDoneAt) : undefined,
      notes: parsed.data.notes,
    },
    include: {
      asset: {
        select: {
          id: true,
          name: true,
          buildingName: true,
          customer: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({ item, ok: true }, { status: 201 });
}
