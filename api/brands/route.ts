import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const brands = await prisma.brand.findMany({
      where: { organizationId: session.orgId },
      orderBy: { name: "asc" },
      include: { _count: { select: { devices: true } } },
    });
    return NextResponse.json({ items: brands, ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e), items: [] }, { status: 500 });
  }
}

const schema = z.object({
  name: z.string().min(1),
  authCode: z.string().optional(),
  authStartDate: z.string().optional(),
  authEndDate: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const brand = await prisma.brand.create({
      data: {
        organizationId: session.orgId,
        ...parsed.data,
        authStartDate: parsed.data.authStartDate ? new Date(parsed.data.authStartDate) : undefined,
        authEndDate: parsed.data.authEndDate ? new Date(parsed.data.authEndDate) : undefined,
      },
    });
    return NextResponse.json({ item: brand, ok: true }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
