import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  monthlyJobs: z.coerce.number().int().optional(),
  technicianCount: z.coerce.number().int().optional(),
  city: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz form" }, { status: 400 });
  }

  const item = await prisma.purchaseRequest.create({
    data: {
      organizationId: session.orgId,
      ...parsed.data,
    },
  });

  return NextResponse.json({ item, ok: true }, { status: 201 });
}
