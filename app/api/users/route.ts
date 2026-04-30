import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";

// Schema for creating a new user within the organisation.  Only the
// organization owner or administrators may create additional accounts.
const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  phone: z.string().optional(),
  // Define the password as a string with a minimum length of 6 characters.
  // In Zod, calling `.optional()` on a schema returns a `ZodOptional` instance, which
  // does not have string-specific methods like `.min()`. To specify constraints
  // on an optional string, apply the `.min()` validation **before** calling
  // `.optional()`. See the Zod documentation on optionals, which notes that
  // methods like `.optional()` return a new schema instance【33892446764065†L1079-L1101】.
  password: z.string().min(6).optional(),
  role: z.enum(["OFFICE", "TECHNICIAN"]),
});

// GET /api/users → returns existing users in the organisation
export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  // Only OWNER and ADMIN can list users; others are forbidden
  if (session.role !== "OWNER" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    where: { organizationId: session.orgId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ items: users, ok: true });
}

// POST /api/users → creates a new user account within the organisation
export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();
  // Only owner/admin may create users
  if (session.role !== "OWNER" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz form" },
      { status: 400 },
    );
  }
  const { email, name, phone, password, role } = parsed.data;
  // Check existing email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta adresi kullanımda." }, { status: 409 });
  }
  // Enforce limits for trial plan
  const org = await prisma.organization.findUnique({ where: { id: session.orgId }, select: { planTier: true } });
  if (org?.planTier === "TRIAL") {
    const [officeCount, techCount] = await Promise.all([
      prisma.user.count({ where: { organizationId: session.orgId, role: "OFFICE" } }),
      prisma.user.count({ where: { organizationId: session.orgId, role: "TECHNICIAN" } }),
    ]);
    if (role === "OFFICE" && officeCount >= 1) {
      return NextResponse.json({ error: "Deneme sürümünde yalnızca 1 ofis hesabı oluşturabilirsiniz." }, { status: 403 });
    }
    if (role === "TECHNICIAN" && techCount >= 3) {
      return NextResponse.json({ error: "Deneme sürümünde en fazla 3 teknisyen hesabı oluşturabilirsiniz." }, { status: 403 });
    }
  }
  // If no password provided, generate a random one; user can change later
  const rawPassword = password ?? crypto.randomBytes(6).toString("base64url");
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  const userId = `u${crypto.randomBytes(11).toString("hex")}`;
  // Insert user using raw SQL to avoid issues if new columns were added
  await prisma.$executeRawUnsafe(
    `INSERT INTO "User" (id, "organizationId", name, email, phone, "passwordHash", role, "emailVerified", "createdAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
    userId,
    session.orgId,
    name ?? null,
    email,
    phone ?? null,
    passwordHash,
    role,
    true,
  );
  return NextResponse.json({ ok: true, generatedPassword: password ? undefined : rawPassword }, { status: 201 });
}