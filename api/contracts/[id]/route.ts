import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const contract = await prisma.contract.findFirst({
      where: { id: id, organizationId: session.orgId },
      include: { customer: true, assets: { include: { asset: true } }, maintenancePlans: { include: { asset: { select: { id: true, name: true } } } } },
    });
    if (!contract) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    return NextResponse.json({ item: contract, ok: true });
  } catch (e: unknown) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}

// Accept partial updates for contract.  In addition to status and dates, we
// allow updating the notes, monthly fee, autoRenew and an uploaded PDF file
// URL.  fileUrl must be a valid URL if provided.
const schema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED"]).optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
  monthlyFee: z.coerce.number().int().optional(),
  autoRenew: z.boolean().optional(),
  fileUrl: z.string().url().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const updated = await prisma.contract.update({
      where: { id: id },
      data: {
        ...parsed.data,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
        monthlyFee: parsed.data.monthlyFee !== undefined ? Math.round(parsed.data.monthlyFee * 100) : undefined,
        fileUrl: parsed.data.fileUrl,
      },
    });
    return NextResponse.json({ item: updated, ok: true });
  } catch (e: unknown) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
