import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const items = await prisma.technician.findMany({
    where: { organizationId: session.orgId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ items, ok: true });
}

const schema = z.object({
  name: z.string().min(1),
  initials: z.string().max(5).optional(),
  phone: z.string().optional(),
  zone: z.string().optional(),
  certification: z.string().optional(),
  status: z.string().optional().default("Müsait"),
});

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz form" }, { status: 400 });
  }

  const item = await prisma.technician.create({
    data: {
      organizationId: session.orgId,
      ...parsed.data,
    },
  });

  return NextResponse.json({ item, ok: true }, { status: 201 });
}
