import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  partId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).default(1),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const wo = await prisma.workOrder.findFirst({
    where: { id: params.id, organizationId: session.orgId },
  });
  if (!wo) return NextResponse.json({ error: "İş emri bulunamadı." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz" }, { status: 400 });
  }

  const part = await prisma.part.findFirst({
    where: { id: parsed.data.partId, organizationId: session.orgId },
  });
  if (!part) return NextResponse.json({ error: "Parça bulunamadı." }, { status: 404 });

  const usage = await prisma.partUsage.create({
    data: {
      workOrderId: params.id,
      partId: parsed.data.partId,
      quantity: parsed.data.quantity,
    },
    include: { part: true },
  });

  // Decrease stock
  await prisma.part.update({
    where: { id: parsed.data.partId },
    data: { stock: { decrement: parsed.data.quantity } },
  });

  return NextResponse.json({ item: usage, ok: true }, { status: 201 });
}
