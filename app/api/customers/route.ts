import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const customers = await prisma.customer.findMany({
      where: { organizationId: session.orgId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { assets: true, workOrders: true } } },
    });
    return NextResponse.json({ items: customers, ok: true });
  } catch (e: unknown) {
    const msg = String(e);
    // If a column is missing from the DB, return empty list with a warning (migration pending)
    if (msg.includes("does not exist") || msg.includes("P2022")) {
      console.error("[customers GET] Missing DB column — startup.js migration may not have run:", msg.slice(0, 200));
      // Retry with raw SQL selecting only base columns that must exist
      try {
        const rows = await (prisma as any).$queryRawUnsafe(
          `SELECT id, "organizationId", name, phone, email, address, notes, "createdAt", "updatedAt"
           FROM "Customer" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
          session.orgId
        );
        return NextResponse.json({ items: rows, ok: true, migrationPending: true });
      } catch (e2) {
        return NextResponse.json({ error: String(e2), items: [] }, { status: 500 });
      }
    }
    return NextResponse.json({ error: msg, items: [] }, { status: 500 });
  }
}

const schema = z.object({
  name:        z.string().min(1),
  contactName: z.string().optional(),
  phone:       z.string().optional(),
  email:       z.string().email().optional().or(z.literal("")),
  address:     z.string().optional(),
  taxId:       z.string().optional(),
  identityNo:  z.string().optional(),
  notes:       z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const body   = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz form" }, { status: 400 });
    let customer;
    try {
      customer = await prisma.customer.create({ data: { organizationId: session.orgId, ...parsed.data } });
    } catch (colErr: unknown) {
      const msg = String(colErr);
      if (msg.includes("does not exist") || msg.includes("P2022")) {
        // Strip optional columns that may not exist yet in this DB
        const { identityNo, contactName, taxId, ...safeData } = parsed.data as any;
        void identityNo; void contactName; void taxId;
        customer = await prisma.customer.create({ data: { organizationId: session.orgId, ...safeData } });
      } else {
        throw colErr;
      }
    }
    return NextResponse.json({ item: customer, ok: true }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
