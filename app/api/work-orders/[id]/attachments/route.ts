import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { createWorkOrderAttachment, listWorkOrderAttachments } from "@/lib/work-order-attachments";

async function ensureOrder(orgId: string, workOrderId: string) {
  return prisma.workOrder.findFirst({ where: { id: workOrderId, organizationId: orgId } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  const { id } = await params;
  const order = await ensureOrder(session.orgId, id);
  if (!order) return NextResponse.json({ error: "İş emri bulunamadı." }, { status: 404 });
  const items = await listWorkOrderAttachments(session.orgId, id);
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  const { id } = await params;
  const order = await ensureOrder(session.orgId, id);
  if (!order) return NextResponse.json({ error: "İş emri bulunamadı." }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const item = await createWorkOrderAttachment({
    orgId: session.orgId,
    workOrderId: id,
    buffer,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
  });

  return NextResponse.json({ ok: true, item }, { status: 201 });
}
