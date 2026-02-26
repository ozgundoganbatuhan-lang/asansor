import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const org = await prisma.organization.findUnique({ where: { id: session.orgId } });
  if (!org) return NextResponse.json({ error: "Org bulunamadı." }, { status: 404 });

  return NextResponse.json({ org, ok: true });
}

const schema = z.object({
  name: z.string().min(1).optional(),
  vertical: z.enum(["ELEVATOR", "WHITE_GOODS"]).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  if (session.role !== "OWNER" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz form" }, { status: 400 });
  }

  const org = await prisma.organization.update({
    where: { id: session.orgId },
    data: parsed.data as any,
  });

  return NextResponse.json({ org, ok: true });
}
