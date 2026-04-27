import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { readWorkOrderEvidence, writeWorkOrderEvidence } from "@/lib/work-order-evidence";

async function ensureOrder(orgId: string, workOrderId: string) {
  return prisma.workOrder.findFirst({ where: { id: workOrderId, organizationId: orgId } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  const { id } = await params;
  const order = await ensureOrder(session.orgId, id);
  if (!order) return NextResponse.json({ error: "İş emri bulunamadı." }, { status: 404 });
  const item = await readWorkOrderEvidence(session.orgId, id);
  return NextResponse.json({ ok: true, item });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  const { id } = await params;
  const order = await ensureOrder(session.orgId, id);
  if (!order) return NextResponse.json({ error: "İş emri bulunamadı." }, { status: 404 });
  const body = (await req.json().catch(() => null)) ?? {};
  const item = await writeWorkOrderEvidence(session.orgId, id, {
    startedAt: body.startedAt ?? null,
    endedAt: body.endedAt ?? null,
    serviceOutcome: body.serviceOutcome ?? null,
    summary: body.summary ?? null,
    signoffName: body.signoffName ?? null,
    customerContact: body.customerContact ?? null,
    locationNote: body.locationNote ?? null,
    signatureDataUrl: body.signatureDataUrl ?? null,
  });
  return NextResponse.json({ ok: true, item });
}
