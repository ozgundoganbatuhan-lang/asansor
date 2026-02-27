import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const contracts = await prisma.contract.findMany({
      where: { organizationId: session.orgId },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true } },
        assets: { include: { asset: { select: { id: true, name: true, elevatorIdNo: true } } } },
        _count: { select: { maintenancePlans: true } },
      },
    });
    return NextResponse.json({ items: contracts, ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e), items: [] }, { status: 500 });
  }
}

const schema = z.object({
  customerId: z.string().min(1),
  contractNumber: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  autoRenew: z.boolean().default(true),
  monthlyFee: z.coerce.number().int().default(0),
  technicianName: z.string().optional(),
  technicianCert: z.string().optional(),
  hasEncryptionDevice: z.boolean().default(false),
  encryptionNote: z.string().optional(),
  notes: z.string().optional(),
  assetIds: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

    const { assetIds, ...data } = parsed.data;
    const contract = await prisma.contract.create({
      data: {
        organizationId: session.orgId,
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        monthlyFee: Math.round(data.monthlyFee * 100), // TL to kuruş
        status: "ACTIVE",
        assets: assetIds.length > 0 ? {
          create: assetIds.map(assetId => ({ assetId })),
        } : undefined,
      },
      include: {
        customer: { select: { id: true, name: true } },
        assets: { include: { asset: { select: { id: true, name: true } } } },
      },
    });
    return NextResponse.json({ item: contract, ok: true }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
