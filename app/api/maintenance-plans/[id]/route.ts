import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const plan = await prisma.maintenancePlan.findFirst({
    where: { id: params.id, organizationId: session.orgId },
  });
  if (!plan) return NextResponse.json({ error: "Plan bulunamadı." }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  // "Mark as done" — advance nextDueAt by periodMonths
  if (body.markDone) {
    const now = new Date();
    const next = new Date(now);
    next.setMonth(next.getMonth() + plan.periodMonths);

    const updated = await prisma.maintenancePlan.update({
      where: { id: params.id },
      data: {
        lastDoneAt: now,
        nextDueAt: next,
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

    // Also update the asset's lastMaintenanceAt
    await prisma.asset.update({
      where: { id: plan.assetId },
      data: { lastMaintenanceAt: now },
    });

    return NextResponse.json({ item: updated, ok: true });
  }

  // Generic update
  const updated = await prisma.maintenancePlan.update({
    where: { id: params.id },
    data: {
      periodMonths: body.periodMonths ?? undefined,
      nextDueAt: body.nextDueAt ? new Date(body.nextDueAt) : undefined,
      notes: body.notes ?? undefined,
    },
  });

  return NextResponse.json({ item: updated, ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const plan = await prisma.maintenancePlan.findFirst({
    where: { id: params.id, organizationId: session.orgId },
  });
  if (!plan) return NextResponse.json({ error: "Plan bulunamadı." }, { status: 404 });

  await prisma.maintenancePlan.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
