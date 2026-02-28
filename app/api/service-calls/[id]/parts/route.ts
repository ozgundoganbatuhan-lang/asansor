import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const call = await prisma.serviceCall.findFirst({ where: { id: params.id, organizationId: session.orgId } });
    if (!call) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

    const body = await req.json();
    const schema = z.object({
      partId: z.string().min(1),
      quantity: z.coerce.number().int().min(1).default(1),
      unitPrice: z.coerce.number().default(0),
      isWarrantyCovered: z.boolean().default(false),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

    // Check stock
    const part = await prisma.part.findUnique({ where: { id: parsed.data.partId } });
    if (!part) return NextResponse.json({ error: "Parça bulunamadı" }, { status: 404 });
    if (part.stock < parsed.data.quantity) return NextResponse.json({ error: `Yetersiz stok (mevcut: ${part.stock})` }, { status: 400 });

    const usage = await prisma.servicePartUsage.create({
      data: {
        serviceCallId: params.id,
        ...parsed.data,
        unitPrice: Math.round(parsed.data.unitPrice * 100),
      },
    });

    // Deduct stock
    await prisma.part.update({ where: { id: parsed.data.partId }, data: { stock: { decrement: parsed.data.quantity } } });

    return NextResponse.json({ item: usage, ok: true }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
