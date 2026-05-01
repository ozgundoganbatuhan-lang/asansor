import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId") ?? undefined;
  const assetId    = searchParams.get("assetId")    ?? undefined;
  const limit      = parseInt(searchParams.get("limit") ?? "100");

  const items = await prisma.workOrder.findMany({
    where: {
      organizationId: session.orgId,
      ...(customerId ? { customerId } : {}),
      ...(assetId    ? { assetId }    : {}),
    },
    take: limit,
    include: {
      customer: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true, initials: true } },
      asset: { select: { id: true, name: true } },
      partsUsed: { include: { part: true } },
      invoice: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items, ok: true });
}

const schema = z.object({
  customerId: z.string().min(1),
  assetId: z.string().optional(),
  technicianId: z.string().optional(),
  type: z.enum(["FAULT", "PERIODIC_MAINTENANCE", "ANNUAL_INSPECTION", "REVISION", "INSTALLATION"]).default("FAULT"),
  status: z.enum(["PENDING", "IN_PROGRESS", "URGENT", "DONE", "CANCELED"]).default("PENDING"),
  priority: z.string().optional().default("Normal"),
  note: z.string().optional(),
  laborCost: z.coerce.number().int().optional().default(0),
  serviceFee: z.coerce.number().int().optional().default(0),
  scheduledAt: z.string().datetime().optional(),
});

async function generateCode(orgId: string): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  // Use count + timestamp suffix to avoid collisions on concurrent inserts
  const count = await prisma.workOrder.count({ where: { organizationId: orgId } });
  const suffix = String(count + 1).padStart(5, "0");
  const candidate = `WO-${year}-${suffix}`;
  // Check for collision (e.g. after deletions or year rollover)
  const existing = await prisma.workOrder.findUnique({ where: { code: candidate } });
  if (!existing) return candidate;
  // Fallback: timestamp-based unique code
  const ts = Date.now().toString(36).toUpperCase().slice(-5);
  return `WO-${year}-${ts}`;
}

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz form" }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: { id: parsed.data.customerId, organizationId: session.orgId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });
  }

  const code = await generateCode(session.orgId);

  const workOrder = await prisma.workOrder.create({
    data: {
      organizationId: session.orgId,
      code,
      ...parsed.data,
    },
    include: {
      customer: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true, initials: true } },
      asset: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ item: workOrder, ok: true }, { status: 201 });
}
