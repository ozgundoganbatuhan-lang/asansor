import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  try {
    const now = new Date();
    const in7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const orgId = session.orgId;

    const [customers, assets, workOrders, urgent, dueSoon, overdue, risky, recentWOs, overdueList] = await Promise.all([
      prisma.customer.count({ where: { organizationId: orgId } }),
      prisma.asset.count({ where: { organizationId: orgId } }),
      prisma.workOrder.count({ where: { organizationId: orgId } }),
      prisma.workOrder.count({ where: { organizationId: orgId, status: "URGENT" } }),
      prisma.maintenancePlan.count({ where: { organizationId: orgId, nextDueAt: { gt: now, lte: in7 } } }),
      prisma.maintenancePlan.count({ where: { organizationId: orgId, nextDueAt: { lte: now } } }),
      prisma.asset.count({ where: { organizationId: orgId, riskScore: { gte: 60 } } }),
      prisma.workOrder.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          customer: { select: { name: true } },
          technician: { select: { name: true } },
          asset: { select: { name: true } },
        },
      }),
      prisma.maintenancePlan.findMany({
        where: { organizationId: orgId, nextDueAt: { lte: now } },
        take: 5,
        include: { asset: { select: { name: true, customer: { select: { name: true } } } } },
        orderBy: { nextDueAt: "asc" },
      }),
    ]);

    return NextResponse.json({ ok: true, stats: { customers, assets, workOrders, urgent, dueSoon, overdue, risky }, recentWOs, overdueList });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Dashboard error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
