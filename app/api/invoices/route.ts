import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const items = await prisma.invoice.findMany({
    where: { organizationId: session.orgId },
    include: {
      workOrder: { select: { code: true, customer: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items, ok: true });
}

const schema = z.object({
  workOrderId: z.string().min(1),
  taxRate: z.coerce.number().int().default(2000),
  dueAt: z.string().datetime().optional(),
});

async function generateInvoiceNumber(orgId: string): Promise<string> {
  const count = await prisma.invoice.count({ where: { organizationId: orgId } });
  const year = new Date().getFullYear();
  const pad = String(count + 1).padStart(4, "0");
  return `INV-${year}-${pad}`;
}

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz form" }, { status: 400 });
  }

  const { workOrderId, taxRate, dueAt } = parsed.data;

  const workOrder = await prisma.workOrder.findFirst({
    where: { id: workOrderId, organizationId: session.orgId },
    include: { invoice: true, partsUsed: { include: { part: true } } },
  });

  if (!workOrder) {
    return NextResponse.json({ error: "İş emri bulunamadı." }, { status: 404 });
  }
  if (workOrder.invoice) {
    return NextResponse.json({ error: "Bu iş emrine zaten fatura kesilmiş." }, { status: 409 });
  }

  // Calculate totals
  const partsTotal = workOrder.partsUsed.reduce((acc, p) => acc + (p.part.price ?? 0) * p.quantity, 0);
  const subtotal = partsTotal + workOrder.laborCost + workOrder.serviceFee;
  const taxAmount = Math.round((subtotal * taxRate) / 10000);
  const total = subtotal + taxAmount;

  const number = await generateInvoiceNumber(session.orgId);

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: session.orgId,
      workOrderId,
      customerId: workOrder.customerId,
      number,
      taxRate,
      subtotal,
      taxAmount,
      total,
      dueAt: dueAt ? new Date(dueAt) : undefined,
    },
    include: {
      workOrder: { select: { code: true, customer: { select: { name: true } } } },
    },
  });

  return NextResponse.json({ item: invoice, ok: true }, { status: 201 });
}
