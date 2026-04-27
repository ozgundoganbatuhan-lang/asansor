import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  const { id } = await params;

  const asset = await prisma.asset.findFirst({
    where: { id, organizationId: session.orgId },
    include: {
      customer: true,
      maintenancePlans: { orderBy: { nextDueAt: "asc" }, take: 6 },
      inspections: { orderBy: { inspectionDate: "desc" }, take: 6 },
      workOrders: {
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          technician: { select: { id: true, name: true, phone: true } },
          customer: { select: { id: true, name: true, phone: true, address: true } },
        },
      },
    },
  });

  if (!asset) return NextResponse.json({ error: "Asansör bulunamadı." }, { status: 404 });

  return NextResponse.json({ ok: true, item: asset });
}
