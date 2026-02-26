import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; usageId: string } }
) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  // Verify work order belongs to org
  const wo = await prisma.workOrder.findFirst({
    where: { id: params.id, organizationId: session.orgId },
  });
  if (!wo) return NextResponse.json({ error: "İş emri bulunamadı." }, { status: 404 });

  const usage = await prisma.partUsage.findUnique({ where: { id: params.usageId } });
  if (!usage || usage.workOrderId !== params.id) {
    return NextResponse.json({ error: "Kullanım kaydı bulunamadı." }, { status: 404 });
  }

  // Restore stock
  await prisma.part.update({
    where: { id: usage.partId },
    data: { stock: { increment: usage.quantity } },
  });

  await prisma.partUsage.delete({ where: { id: params.usageId } });

  return NextResponse.json({ ok: true });
}
