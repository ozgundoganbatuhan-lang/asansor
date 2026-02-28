import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId") ?? undefined;
    const devices = await prisma.device.findMany({
      where: { organizationId: session.orgId, ...(customerId ? { customerId } : {}) },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        brand: { select: { id: true, name: true } },
        _count: { select: { serviceCalls: true } },
      },
    });
    // Compute warranty status
    const now = new Date();
    const enriched = devices.map(d => ({
      ...d,
      warrantyActive: d.warrantyEndDate ? d.warrantyEndDate > now : false,
      warrantyDaysLeft: d.warrantyEndDate ? Math.ceil((d.warrantyEndDate.getTime() - now.getTime()) / 86400000) : null,
    }));
    return NextResponse.json({ items: enriched, ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e), items: [] }, { status: 500 });
  }
}

const schema = z.object({
  customerId: z.string().min(1),
  brandId: z.string().optional(),
  category: z.enum(["WASHING_MACHINE","DRYER","WASHER_DRYER","DISHWASHER","REFRIGERATOR","FREEZER","FRIDGE_FREEZER","OVEN","COOKTOP","RANGE_HOOD","MICROWAVE","AIR_CONDITIONER","WATER_HEATER","VACUUM_CLEANER","SMALL_APPLIANCE","OTHER"]),
  modelName: z.string().optional(),
  modelCode: z.string().optional(),
  serialNumber: z.string().optional(),
  productionYear: z.coerce.number().int().optional(),
  color: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePlace: z.string().optional(),
  invoiceNumber: z.string().optional(),
  installDate: z.string().optional(),
  locationNote: z.string().optional(),
  warrantyYears: z.coerce.number().int().default(2),
  extendedWarranty: z.boolean().default(false),
  extendedWarrantyEnd: z.string().optional(),
  powerWatts: z.coerce.number().int().optional(),
  voltage: z.string().optional(),
  capacity: z.string().optional(),
  energyClass: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

    const { customerId, ...rest } = parsed.data;

    // Compute warrantyEndDate from purchaseDate + warrantyYears
    let warrantyEndDate: Date | undefined;
    if (rest.purchaseDate) {
      const pd = new Date(rest.purchaseDate);
      warrantyEndDate = new Date(pd);
      warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + (rest.warrantyYears ?? 2));
    }

    const device = await prisma.device.create({
      data: {
        organizationId: session.orgId,
        customerId,
        ...rest,
        purchaseDate: rest.purchaseDate ? new Date(rest.purchaseDate) : undefined,
        installDate: rest.installDate ? new Date(rest.installDate) : undefined,
        extendedWarrantyEnd: rest.extendedWarrantyEnd ? new Date(rest.extendedWarrantyEnd) : undefined,
        warrantyEndDate,
      },
      include: {
        customer: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ item: device, ok: true }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
