import { NextRequest, NextResponse } from "next/server";
import { sessionFromRequest, unauthorized } from "@/lib/auth";
import { writeFile, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomUUID } from "node:crypto";

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });

    // Validate image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Sadece görsel dosyalar kabul edilir" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Dosya 10MB'dan büyük olamaz" }, { status: 400 });
    }

    const ext = extname(file.name) || ".jpg";
    const fileName = `${randomUUID()}${ext}`;
    const dir = join(process.cwd(), "public", "uploads", "inspections", session.orgId);
    await mkdir(dir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, fileName), buffer);

    const url = `/uploads/inspections/${session.orgId}/${fileName}`;
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error("Inspection photo upload error:", e);
    return NextResponse.json({ error: "Yükleme başarısız" }, { status: 500 });
  }
}
