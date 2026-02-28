import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const updated = await prisma.serviceInvoice.update({
      where: { id: params.id },
      data: {
        status: body.status ?? undefined,
        paidAt: body.status === "PAID" ? new Date() : undefined,
        notes: body.notes ?? undefined,
      },
    });
    return NextResponse.json({ item: updated, ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
