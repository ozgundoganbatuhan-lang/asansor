import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const item = await prisma.customer.findFirst({
    where: { id: params.id, organizationId: session.orgId },
  });

  if (!item) return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });
  return NextResponse.json({ item, ok: true });
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  contactName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const existing = await prisma.customer.findFirst({
    where: { id: params.id, organizationId: session.orgId },
  });
  if (!existing) return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz" }, { status: 400 });
  }

  const updated = await prisma.customer.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ item: updated, ok: true });
}
