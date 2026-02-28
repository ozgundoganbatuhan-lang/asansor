import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const device = await prisma.device.findFirst({
      where: { id: params.id, organizationId: session.orgId },
      include: {
        customer: true,
        brand: true,
        serviceCalls: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { technician: { select: { id: true, name: true } } },
        },
      },
    });
    if (!device) return NextResponse.json({ error: "Cihaz bulunamadı" }, { status: 404 });
    return NextResponse.json({ item: device, ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const body = await req.json().catch(() => null);
    const updated = await prisma.device.update({
      where: { id: params.id },
      data: {
        notes: body.notes ?? undefined,
        locationNote: body.locationNote ?? undefined,
        isUnderRepair: body.isUnderRepair ?? undefined,
      },
    });
    return NextResponse.json({ item: updated, ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
