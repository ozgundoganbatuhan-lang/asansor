import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const item = await prisma.workOrder.findFirst({
    where: { id: params.id, organizationId: session.orgId },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      asset: { select: { id: true, name: true, buildingName: true } },
      technician: { select: { id: true, name: true, phone: true, initials: true } },
      partsUsed: { include: { part: { select: { id: true, name: true, price: true } } } },
      invoice: { select: { id: true, number: true, status: true } },
    },
  });

  if (!item) return NextResponse.json({ error: "İş emri bulunamadı." }, { status: 404 });

  return NextResponse.json({ item, ok: true });
}

const patchSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "URGENT", "DONE", "CANCELED"]).optional(),
  technicianId: z.string().nullable().optional(),
  assetId: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  laborCost: z.coerce.number().int().optional(),
  serviceFee: z.coerce.number().int().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  priority: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const existing = await prisma.workOrder.findFirst({
    where: { id: params.id, organizationId: session.orgId },
  });
  if (!existing) return NextResponse.json({ error: "İş emri bulunamadı." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz form" }, { status: 400 });
  }

  const data: Record<string, any> = { ...parsed.data };
  if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt);
  if (data.completedAt) data.completedAt = new Date(data.completedAt);

  const updated = await prisma.workOrder.update({
    where: { id: params.id },
    data,
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      asset: { select: { id: true, name: true, buildingName: true } },
      technician: { select: { id: true, name: true, phone: true } },
      partsUsed: { include: { part: true } },
      invoice: { select: { id: true, number: true, status: true } },
    },
  });

  return NextResponse.json({ item: updated, ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const existing = await prisma.workOrder.findFirst({
    where: { id: params.id, organizationId: session.orgId },
  });
  if (!existing) return NextResponse.json({ error: "İş emri bulunamadı." }, { status: 404 });

  await prisma.workOrder.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
