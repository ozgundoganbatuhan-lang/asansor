import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "VOID"]),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, organizationId: session.orgId },
  });
  if (!invoice) {
    return NextResponse.json({ error: "Fatura bulunamadı." }, { status: 404 });
  }

  const updated = await prisma.invoice.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status as any,
      paidAt: parsed.data.status === "PAID" ? new Date() : undefined,
    },
    include: {
      workOrder: { select: { code: true, customer: { select: { name: true } } } },
    },
  });

  return NextResponse.json({ item: updated, ok: true });
}
