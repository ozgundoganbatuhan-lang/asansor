import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId") ?? undefined;

  const assets = await prisma.asset.findMany({
    where: { organizationId: session.orgId, ...(customerId ? { customerId } : {}) },
    include: { customer: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items: assets, ok: true });
}

const schema = z.object({
  customerId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional(),
  serialNumber: z.string().optional(),
  locationNote: z.string().optional(),
  buildingName: z.string().optional(),
  doorNumber: z.string().optional(),
  stops: z.coerce.number().int().optional(),
  capacityKg: z.coerce.number().int().optional(),
  controllerBrand: z.string().optional(),
  installYear: z.coerce.number().int().optional(),
  riskScore: z.coerce.number().int().min(0).max(100).optional(),
});

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz form" }, { status: 400 });
  }

  const { customerId, ...rest } = parsed.data;

  // Verify customer belongs to org
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId: session.orgId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });
  }

  const asset = await prisma.asset.create({
    data: {
      organizationId: session.orgId,
      customerId,
      ...rest,
    },
    include: { customer: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ item: asset, ok: true }, { status: 201 });
}
