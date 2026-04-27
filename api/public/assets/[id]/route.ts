import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAssetShareToken } from "@/lib/asset-share";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token gerekli." }, { status: 401 });
  const payload = verifyAssetShareToken(token);
  if (!payload || payload.assetId !== id) return NextResponse.json({ error: "Geçersiz token." }, { status: 401 });

  const asset = await prisma.asset.findFirst({
    where: { id, organizationId: payload.orgId },
    include: {
      customer: { select: { name: true, address: true, phone: true } },
      workOrders: {
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { technician: { select: { name: true } } },
      },
      inspections: { orderBy: { inspectionDate: "desc" }, take: 4 },
      maintenancePlans: { orderBy: { nextDueAt: "asc" }, take: 2 },
      // Include related contracts via ContractAsset join to expose publicly shared documents
      contractAssets: {
        include: {
          contract: {
            select: {
              id: true,
              contractNumber: true,
              fileUrl: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!asset) return NextResponse.json({ error: "Asansör bulunamadı." }, { status: 404 });
  return NextResponse.json({ ok: true, item: asset });
}
