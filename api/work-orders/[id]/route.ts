import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  const { id } = await params;
  const item = await prisma.workOrder.findFirst({
    where: { id, organizationId: session.orgId },
    include: {
      customer: { select: { id: true, name: true, phone: true, address: true, email: true } },
      asset: { select: { id: true, name: true, buildingName: true, locationNote: true, elevatorIdNo: true } },
      technician: { select: { id: true, name: true, phone: true, initials: true, zone: true } },
      partsUsed: { include: { part: { select: { id: true, name: true, price: true } } } },
      invoice: { select: { id: true, number: true, status: true } },
    },
  });
  if (!item) return NextResponse.json({ error: "İş emri bulunamadı." }, { status: 404 });
  return NextResponse.json({ ok: true, item });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  const { id } = await params;
  const existing = await prisma.workOrder.findFirst({ where: { id, organizationId: session.orgId } });
  if (!existing) return NextResponse.json({ error: "İş emri bulunamadı." }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz form" }, { status: 400 });
  }
  const updated = await prisma.workOrder.update({
    where: { id },
    data: {
      ...parsed.data,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : parsed.data.scheduledAt,
      completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : parsed.data.completedAt,
    },
    include: {
      customer: { select: { id: true, name: true, phone: true, address: true, email: true } },
      asset: { select: { id: true, name: true, buildingName: true, locationNote: true, elevatorIdNo: true } },
      technician: { select: { id: true, name: true, phone: true, initials: true, zone: true } },
      partsUsed: { include: { part: { select: { id: true, name: true, price: true } } } },
      invoice: { select: { id: true, number: true, status: true } },
    },
  });
  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  const { id } = await params;
  const existing = await prisma.workOrder.findFirst({ where: { id, organizationId: session.orgId } });
  if (!existing) return NextResponse.json({ error: "İş emri bulunamadı." }, { status: 404 });
  await prisma.workOrder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
