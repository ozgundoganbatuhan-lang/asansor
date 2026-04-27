import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; usageId: string }> }) {
  const { id, usageId } = await params;
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  const wo = await prisma.workOrder.findFirst({ where: { id: id, organizationId: session.orgId } });
  if (!wo) return NextResponse.json({ error: "İş emri bulunamadı." }, { status: 404 });
  const usage = await prisma.partUsage.findUnique({ where: { id: usageId } });
  if (!usage || usage.workOrderId !== id) return NextResponse.json({ error: "Kullanım kaydı bulunamadı." }, { status: 404 });
  await prisma.part.update({ where: { id: usage.partId }, data: { stock: { increment: usage.quantity } } });
  await prisma.partUsage.delete({ where: { id: usageId } });
  return NextResponse.json({ ok: true });
}
