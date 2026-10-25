import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Üye listesi: guzellik.seansim.com/yonetim (Merkez) sunucudan sunucuya, ortak anahtarla çeker.
const KEY = process.env.MERKEZ_KEY ?? "trk_5f0c2b7e91a44d6c";
const ROLE: Record<string, string> = { OWNER: "Sahibi", ADMIN: "Yönetici", MEMBER: "Üye", TECHNICIAN: "Teknisyen" };

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (req.headers.get("x-merkez-key") !== KEY) return NextResponse.json({ error: "yetkisiz" }, { status: 401 });
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: { name: true, email: true, phone: true, role: true, createdAt: true, organization: { select: { name: true, planTier: true, trialEndsAt: true, phone: true } } },
  });
  return NextResponse.json(
    {
      members: users.map((u: (typeof users)[number]) => ({
        name: u.name || u.email.split("@")[0],
        email: u.email,
        phone: u.phone ?? u.organization.phone ?? null,
        org: u.organization.name,
        city: null,
        role: ROLE[u.role] ?? u.role,
        plan: u.organization.planTier === "TRIAL" ? "TRIAL" : "ACTIVE",
        trialEndsAt: u.organization.planTier === "TRIAL" ? u.organization.trialEndsAt.toISOString() : null,
        createdAt: u.createdAt.toISOString(),
        lastSeen: null,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
