import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

async function generateInvoiceNumber(orgId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.serviceInvoice.count({ where: { organizationId: orgId } });
  return `SFT-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const invoices = await prisma.serviceInvoice.findMany({
      where: { organizationId: session.orgId },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true } },
        serviceCall: { select: { id: true, code: true, device: { select: { category: true, modelName: true, brand: { select: { name: true } } } } } },
      },
    });
    return NextResponse.json({ items: invoices, ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e), items: [] }, { status: 500 });
  }
}

const schema = z.object({
  serviceCallId: z.string().min(1),
  taxRate: z.coerce.number().int().default(2000),
  dueAt: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

    const call = await prisma.serviceCall.findFirst({
      where: { id: parsed.data.serviceCallId, organizationId: session.orgId },
      include: { partsUsed: { include: { part: true } } },
    });
    if (!call) return NextResponse.json({ error: "Servis çağrısı bulunamadı" }, { status: 404 });

    // Check not already invoiced
    const existing = await prisma.serviceInvoice.findUnique({ where: { serviceCallId: parsed.data.serviceCallId } });
    if (existing) return NextResponse.json({ error: "Bu servis çağrısı için fatura zaten oluşturulmuş" }, { status: 400 });

    const partsTotal = call.partsUsed.filter(p => !p.isWarrantyCovered).reduce((a, p) => a + p.unitPrice * p.quantity, 0);
    const laborTotal = call.isWarrantyCovered ? 0 : (call.laborCost + call.transportCost + call.diagnosticFee);
    const subtotal = partsTotal + laborTotal;
    const taxAmount = Math.round((subtotal * parsed.data.taxRate) / 10000);
    const total = subtotal + taxAmount;
    const number = await generateInvoiceNumber(session.orgId);

    const invoice = await prisma.serviceInvoice.create({
      data: {
        organizationId: session.orgId,
        serviceCallId: parsed.data.serviceCallId,
        customerId: call.customerId,
        number,
        subtotal,
        taxRate: parsed.data.taxRate,
        taxAmount,
        total,
        notes: parsed.data.notes,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
      },
    });

    return NextResponse.json({ item: invoice, ok: true }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
