import { NextRequest, NextResponse } from "next/server";
import { sessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Current user for the app shell: name, e-mail, role and company name (safe fields only).
export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, role: true, organization: { select: { name: true } } },
  }).catch(() => null);
  return NextResponse.json({
    ok: true,
    session,
    role: user?.role ?? session.role,
    name: user?.name ?? null,
    email: user?.email ?? null,
    orgName: user?.organization?.name ?? null,
  });
}
