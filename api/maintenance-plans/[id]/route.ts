import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const plan = await prisma.maintenancePlan.findFirst({ where: { id: id, organizationId: session.orgId } });
    if (!plan) return NextResponse.json({ error: "Plan bulunamadı." }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    if (body.markDone) {
      const now = new Date();
      const next = new Date(now);
      const days = plan.periodDays ?? (plan.periodMonths ? plan.periodMonths * 30 : 30);
      next.setDate(next.getDate() + days);
      const updated = await prisma.maintenancePlan.update({
        where: { id: id },
        data: { lastDoneAt: now, nextDueAt: next },
        include: { asset: { select: { id: true, name: true, buildingName: true, customer: { select: { id: true, name: true } } } } },
      });
      await prisma.asset.update({ where: { id: plan.assetId }, data: { lastMaintenanceAt: now } });
      return NextResponse.json({ item: updated, ok: true });
    }
    const updated = await prisma.maintenancePlan.update({
      where: { id: id },
      data: { periodDays: body.periodDays ?? undefined, nextDueAt: body.nextDueAt ? new Date(body.nextDueAt) : undefined, notes: body.notes ?? undefined },
    });
    return NextResponse.json({ item: updated, ok: true });
  } catch (e: unknown) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const plan = await prisma.maintenancePlan.findFirst({ where: { id: id, organizationId: session.orgId } });
    if (!plan) return NextResponse.json({ error: "Plan bulunamadı." }, { status: 404 });
    await prisma.maintenancePlan.delete({ where: { id: id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
