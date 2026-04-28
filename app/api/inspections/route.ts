import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get("assetId") ?? undefined;
    const inspections = await prisma.inspection.findMany({
      where: { organizationId: session.orgId, ...(assetId ? { assetId } : {}) },
      orderBy: { inspectionDate: "desc" },
      include: { asset: { select: { id: true, name: true, customer: { select: { name: true } } } } },
    });
    return NextResponse.json({ items: inspections, ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e), items: [] }, { status: 500 });
  }
}

const LABEL_MAP: Record<string, string> = {
  UYGUNSUZLUK_YOK: "YESIL",
  HAFIF_KUSURLU: "MAVI",
  KUSURLU: "SARI",
  GUVENSIZ: "KIRMIZI",
};

const schema = z.object({
  assetId: z.string().min(1),
  inspectionDate: z.string(),
  nextDueDate: z.string(),
  inspectionBody: z.string().optional(),
  inspectorName: z.string().optional(),
  result: z.enum(["UYGUNSUZLUK_YOK", "HAFIF_KUSURLU", "KUSURLU", "GUVENSIZ"]).default("UYGUNSUZLUK_YOK"),
  deficiencies: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

    const label = LABEL_MAP[parsed.data.result] as any;

    const inspection = await prisma.inspection.create({
      data: {
        organizationId: session.orgId,
        ...parsed.data,
        label,
        inspectionDate: new Date(parsed.data.inspectionDate),
        nextDueDate: new Date(parsed.data.nextDueDate),
      },
    });

    // Update asset inspection fields
    await prisma.asset.update({
      where: { id: parsed.data.assetId },
      data: {
        lastInspectionAt: new Date(parsed.data.inspectionDate),
        nextInspectionAt: new Date(parsed.data.nextDueDate),
        inspectionLabel: label,
      },
    });

    return NextResponse.json({ item: inspection, ok: true }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
