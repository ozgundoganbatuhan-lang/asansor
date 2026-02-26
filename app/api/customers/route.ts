import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const customers = await prisma.customer.findMany({
    where: { organizationId: session.orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items: customers, ok: true });
}

const schema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz form" }, { status: 400 });
  }

  const customer = await prisma.customer.create({
    data: {
      organizationId: session.orgId,
      ...parsed.data,
      email: parsed.data.email || undefined,
    },
  });

  return NextResponse.json({ item: customer, ok: true }, { status: 201 });
}
