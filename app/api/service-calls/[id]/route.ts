import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const call = await prisma.serviceCall.findFirst({
      where: { id: params.id, organizationId: session.orgId },
      include: {
        customer: true,
        device: { include: { brand: true } },
        technician: true,
        partsUsed: {
          include: { part: { select: { id: true, name: true, category: true } } },
        },
        invoice: true,
      },
    });
    if (!call) return NextResponse.json({ error: "Servis çağrısı bulunamadı" }, { status: 404 });
    return NextResponse.json({ item: call, ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

const schema = z.object({
  status: z.enum(["RECEIVED","SCHEDULED","TECHNICIAN_WAY","IN_PROGRESS","WAITING_PARTS","WAITING_APPROVAL","COMPLETED","CANNOT_REPAIR","CANCELED"]).optional(),
  technicianId: z.string().optional().nullable(),
  faultDiagnosis: z.string().optional(),
  faultCode: z.string().optional(),
  repairDescription: z.string().optional(),
  scheduledAt: z.string().optional(),
  laborCost: z.coerce.number().optional(),
  transportCost: z.coerce.number().optional(),
  diagnosticFee: z.coerce.number().optional(),
  isWarrantyCovered: z.boolean().optional(),
  customerInformed: z.boolean().optional(),
  rightToReplace: z.boolean().optional(),
  rightToRefund: z.boolean().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  warrantyStatus: z.enum(["IN_WARRANTY","OUT_OF_WARRANTY","EXTENDED_WARRANTY","UNKNOWN"]).optional(),
  isUnderWarranty: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const call = await prisma.serviceCall.findFirst({ where: { id: params.id, organizationId: session.orgId } });
    if (!call) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

    const now = new Date();
    const completedAt = parsed.data.status === "COMPLETED" ? now : undefined;
    const workingDaysUsed = completedAt
      ? Math.floor((completedAt.getTime() - new Date(call.receivedAt).getTime()) / 86400000)
      : undefined;

    const updated = await prisma.serviceCall.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
        laborCost: parsed.data.laborCost !== undefined ? Math.round(parsed.data.laborCost * 100) : undefined,
        transportCost: parsed.data.transportCost !== undefined ? Math.round(parsed.data.transportCost * 100) : undefined,
        diagnosticFee: parsed.data.diagnosticFee !== undefined ? Math.round(parsed.data.diagnosticFee * 100) : undefined,
        completedAt,
        workingDaysUsed,
      },
    });

    // If completed/cannot_repair, mark device not under repair
    if (parsed.data.status === "COMPLETED" || parsed.data.status === "CANNOT_REPAIR" || parsed.data.status === "CANCELED") {
      await prisma.device.update({
        where: { id: call.deviceId },
        data: {
          isUnderRepair: false,
          lastServiceAt: completedAt ?? undefined,
          totalServiceCount: { increment: parsed.data.status === "COMPLETED" ? 1 : 0 },
        },
      });
    }

    return NextResponse.json({ item: updated, ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
