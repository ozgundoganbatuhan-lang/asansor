import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const customerId = searchParams.get("customerId") ?? undefined;
    const deviceId = searchParams.get("deviceId") ?? undefined;

    const calls = await prisma.serviceCall.findMany({
      where: {
        organizationId: session.orgId,
        ...(status && status !== "ALL" ? { status: status as any } : {}),
        ...(customerId ? { customerId } : {}),
        ...(deviceId ? { deviceId } : {}),
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        device: { select: { id: true, category: true, modelName: true, serialNumber: true, brand: { select: { name: true } } } },
        technician: { select: { id: true, name: true, initials: true } },
        _count: { select: { partsUsed: true } },
      },
    });

    // Compute working days used and legal status
    const now = new Date();
    const enriched = calls.map(c => {
      const received = new Date(c.receivedAt);
      const daysDiff = Math.floor((now.getTime() - received.getTime()) / 86400000);
      const legalDeadlineBreached = daysDiff > 30 && c.status !== "COMPLETED" && c.status !== "CANCELED";
      return { ...c, daysSinceReceived: daysDiff, legalDeadlineBreached };
    });

    return NextResponse.json({ items: enriched, ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e), items: [] }, { status: 500 });
  }
}

// Generate unique service call code
async function generateCode(orgId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.serviceCall.count({ where: { organizationId: orgId } });
  return `SRV-${year}-${String(count + 1).padStart(4, "0")}`;
}

const schema = z.object({
  customerId: z.string().min(1),
  deviceId: z.string().min(1),
  technicianId: z.string().optional(),
  callType: z.enum(["FAULT_REPAIR","WARRANTY_REPAIR","PERIODIC_MAINTENANCE","INSTALLATION","UNINSTALLATION","TECHNICAL_INSPECTION","CUSTOMER_MISUSE","SPARE_PART_SUPPLY"]).default("FAULT_REPAIR"),
  priority: z.enum(["URGENT","HIGH","NORMAL","LOW"]).default("NORMAL"),
  warrantyStatus: z.enum(["IN_WARRANTY","OUT_OF_WARRANTY","EXTENDED_WARRANTY","UNKNOWN"]).default("UNKNOWN"),
  isUnderWarranty: z.boolean().default(false),
  faultDescription: z.string().optional(),
  visitType: z.enum(["HOME_VISIT","WORKSHOP","REMOTE"]).default("HOME_VISIT"),
  address: z.string().optional(),
  scheduledAt: z.string().optional(),
  laborCost: z.coerce.number().int().default(0),
  transportCost: z.coerce.number().int().default(0),
  diagnosticFee: z.coerce.number().int().default(0),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

    const code = await generateCode(session.orgId);

    const call = await prisma.serviceCall.create({
      data: {
        organizationId: session.orgId,
        code,
        ...parsed.data,
        laborCost: Math.round((parsed.data.laborCost ?? 0) * 100),
        transportCost: Math.round((parsed.data.transportCost ?? 0) * 100),
        diagnosticFee: Math.round((parsed.data.diagnosticFee ?? 0) * 100),
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
        status: "RECEIVED",
      },
      include: {
        customer: { select: { id: true, name: true } },
        device: { select: { id: true, category: true, modelName: true, brand: { select: { name: true } } } },
      },
    });

    // Mark device as under repair
    await prisma.device.update({ where: { id: parsed.data.deviceId }, data: { isUnderRepair: true } });

    return NextResponse.json({ item: call, ok: true }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
