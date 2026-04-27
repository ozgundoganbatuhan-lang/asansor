import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  try {
    const now = new Date();
    const in7  = new Date(Date.now() + 7  * 24 * 60 * 60 * 1000);
    const in60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const orgId = session.orgId;

    // Monthly invoice window: first day of current month → now
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    // Last 6 months for trend
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      customers, assets, workOrders, urgent, dueSoon, overdue, risky,
      recentWOs, overdueList, upcomingPlans,
      lowStockParts, monthlyInvoices, invoiceTrend,
    ] = await Promise.all([
      prisma.customer.count({ where: { organizationId: orgId } }),
      prisma.asset.count({ where: { organizationId: orgId } }),
      prisma.workOrder.count({ where: { organizationId: orgId } }),
      prisma.workOrder.count({ where: { organizationId: orgId, status: "URGENT" } }),
      prisma.maintenancePlan.count({ where: { organizationId: orgId, nextDueAt: { gt: now, lte: in7 } } }),
      prisma.maintenancePlan.count({ where: { organizationId: orgId, nextDueAt: { lte: now } } }),
      prisma.asset.count({ where: { organizationId: orgId, riskScore: { gte: 60 } } }),

      // Recent work orders
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

      // Overdue maintenance
      prisma.maintenancePlan.findMany({
        where: { organizationId: orgId, nextDueAt: { lte: now } },
        take: 5,
        include: { asset: { select: { name: true, customer: { select: { name: true } } } } },
        orderBy: { nextDueAt: "asc" },
      }),

      // Upcoming 60 days for calendar
      prisma.maintenancePlan.findMany({
        where: { organizationId: orgId, nextDueAt: { gte: now, lte: in60 } },
        orderBy: { nextDueAt: "asc" },
        take: 100,
        include: {
          asset: {
            select: {
              id: true, name: true, buildingName: true, elevatorIdNo: true,
              customer: { select: { id: true, name: true, phone: true, address: true } },
            },
          },
        },
      }),

      // Low stock parts: stock <= minStock via raw query
      prisma.$queryRawUnsafe(
        `SELECT id, name, stock, "minStock", category, unit FROM "Part"
         WHERE "organizationId" = $1 AND "minStock" > 0 AND stock <= "minStock"
         ORDER BY stock ASC LIMIT 8`,
        orgId
      ).catch(() => []),

      // This month's invoices
      prisma.invoice.aggregate({
        where: {
          organizationId: orgId,
          issuedAt: { gte: monthStart, lte: now },
        },
        _sum: { total: true },
        _count: { _all: true },
      }).catch(() => ({ _sum: { total: 0 }, _count: { _all: 0 } })),

      // Invoice totals for last 6 months (for sparkline)
      prisma.$queryRawUnsafe(
        `SELECT
           TO_CHAR(DATE_TRUNC('month', "issuedAt"), 'YYYY-MM') AS month,
           COALESCE(SUM(total), 0)::int AS total,
           COUNT(*)::int AS count
         FROM "Invoice"
         WHERE "organizationId" = $1
           AND "issuedAt" >= $2
           AND status != 'VOID'
         GROUP BY 1
         ORDER BY 1`,
        orgId,
        sixMonthsAgo
      ).catch(() => [] as { month: string; total: number; count: number }[]),
    ]);

    return NextResponse.json({
      ok: true,
      stats: { customers, assets, workOrders, urgent, dueSoon, overdue, risky },
      recentWOs,
      overdueList,
      upcomingPlans,
      lowStockParts,
      invoiceSummary: {
        thisMonthTotal: monthlyInvoices._sum.total ?? 0,
        thisMonthCount: monthlyInvoices._count._all ?? 0,
        trend: invoiceTrend,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("does not exist") || msg.includes("P2022")) {
      console.error("[dashboard] DB migration pending — column missing:", msg.slice(0, 300));
      return NextResponse.json({
        stats: { customers:0, assets:0, workOrders:0, urgent:0, dueSoon:0, overdue:0, risky:0 },
        recentWOs: [], overdueList: [], upcomingPlans: [],
        lowStockParts: [],
        invoiceSummary: { thisMonthTotal:0, thisMonthCount:0, trend:[] },
        migrationPending: true, ok: true,
      });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
