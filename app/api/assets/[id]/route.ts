import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const item = await prisma.asset.findFirst({
    where: { id: params.id, organizationId: session.orgId },
    include: { customer: { select: { id: true, name: true } } },
  });

  if (!item) return NextResponse.json({ error: "Asansör bulunamadı." }, { status: 404 });
  return NextResponse.json({ item, ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const existing = await prisma.asset.findFirst({
    where: { id: params.id, organizationId: session.orgId },
  });
  if (!existing) return NextResponse.json({ error: "Asansör bulunamadı." }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  const updated = await prisma.asset.update({
    where: { id: params.id },
    data: {
      name: body.name ?? undefined,
      buildingName: body.buildingName ?? undefined,
      stops: body.stops ?? undefined,
      capacityKg: body.capacityKg ?? undefined,
      controllerBrand: body.controllerBrand ?? undefined,
      serialNumber: body.serialNumber ?? undefined,
      installYear: body.installYear ?? undefined,
      riskScore: body.riskScore ?? undefined,
      locationNote: body.locationNote ?? undefined,
    },
    include: { customer: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ item: updated, ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const existing = await prisma.asset.findFirst({
    where: { id: params.id, organizationId: session.orgId },
  });
  if (!existing) return NextResponse.json({ error: "Asansör bulunamadı." }, { status: 404 });

  // Check for related work orders
  const woCount = await prisma.workOrder.count({ where: { assetId: params.id } });
  if (woCount > 0) {
    return NextResponse.json(
      { error: `Bu asansöre ait ${woCount} iş emri var. Önce iş emirlerini silin veya asansör atamasını kaldırın.` },
      { status: 400 }
    );
  }

  await prisma.asset.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
