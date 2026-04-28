import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "VOID"]).optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    const invoice = await prisma.invoice.findFirst({ where: { id: id, organizationId: session.orgId } });
    if (!invoice) return NextResponse.json({ error: "Fatura bulunamadı." }, { status: 404 });
    const updated = await prisma.invoice.update({
      where: { id: id },
      data: {
        ...(parsed.data.status ? { status: parsed.data.status, paidAt: parsed.data.status === "PAID" ? new Date() : undefined } : {}),
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
      },
      include: { workOrder: { select: { id: true, code: true, customer: { select: { name: true } } } } },
    });
    return NextResponse.json({ item: updated, ok: true });
  } catch (e: unknown) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
