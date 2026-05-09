import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  amount:      z.number().positive(),
  currency:    z.string().default("TRY"),
  category:    z.string().min(1),
  date:        z.string().min(1),
  note:        z.string().optional(),
  receiptUrls: z.array(z.string()).optional(),
  technicianId:z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const techId = url.searchParams.get("technicianId") ?? undefined;

  try {
    const items = await (prisma as any).expenseRequest.findMany({
      where: {
        organizationId: session.orgId,
        ...(status ? { status }                 : {}),
        ...(techId ? { technicianId: techId }   : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { technician: true },
    });
    return NextResponse.json({ items, ok: true });
  } catch {
    return NextResponse.json({ items: [], ok: true, _warning: "Table not yet migrated" });
  }
}

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz veri", issues: parsed.error.issues }, { status: 400 });

  const { amount, currency, category, date, note, receiptUrls, technicianId } = parsed.data;

  try {
    const item = await (prisma as any).expenseRequest.create({
      data: {
        organizationId: session.orgId,
        userId:         session.userId,
        technicianId:   technicianId ?? null,
        amountCents:    Math.round(amount * 100),
        currency,
        category,
        date:           new Date(date),
        note:           note ?? null,
        receiptUrls:    receiptUrls ?? [],
        status:         "PENDING",
      },
    });
    return NextResponse.json({ item, ok: true }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const { id, status } = body;
  if (!id || !status) return NextResponse.json({ error: "id ve status zorunlu" }, { status: 400 });

  try {
    const item = await (prisma as any).expenseRequest.update({
      where: { id, organizationId: session.orgId },
      data: { status, reviewedAt: new Date(), reviewedBy: session.userId },
    });
    return NextResponse.json({ item, ok: true });
  } catch {
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 });
  }
}
