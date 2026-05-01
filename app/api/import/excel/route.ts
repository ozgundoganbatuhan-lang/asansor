import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";

export interface ImportRow {
  customerName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  taxId?: string;
  identityNo?: string;
  notes?: string;
  assetName?: string;
  elevatorIdNo?: string;
  stops?: number;
  driveType?: string;
  brand?: string;
  category?: string;
  buildingName?: string;
  locationNote?: string;
  capacityKg?: number;
}

async function ensureOptionalColumns() {
  const cols = [
    `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "identityNo" TEXT`,
    `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "contactName" TEXT`,
    `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "taxId" TEXT`,
  ];
  for (const sql of cols) {
    try { await (prisma as any).$executeRawUnsafe(sql); } catch { /* already exists */ }
  }
}

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  try {
    const body = await req.json().catch(() => null);
    if (!body?.rows || !Array.isArray(body.rows)) {
      return NextResponse.json({ error: "rows dizisi gereklidir" }, { status: 400 });
    }

    await ensureOptionalColumns();

    const rows: ImportRow[] = body.rows;
    const result = {
      ok: true, customersCreated: 0, customersReused: 0,
      assetsCreated: 0, skipped: 0, errors: [] as string[],
    };

    const customerCache = new Map<string, string>(); // lowercaseName → id

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lbl = `Satır ${i + 2}`;

      if (!row.customerName?.trim()) {
        result.errors.push(`${lbl}: Bina/müşteri adı boş — atlandı`);
        result.skipped++;
        continue;
      }

      const cName = row.customerName.trim();
      const cKey  = cName.toLowerCase();

      let fullAddress = row.address?.trim() || null;
      if (row.district?.trim()) {
        fullAddress = fullAddress ? `${fullAddress}, ${row.district.trim()}` : row.district.trim();
      }

      try {
        // ── Customer: find-or-create ────────────────────────────────
        let customerId: string | undefined = customerCache.get(cKey);
        if (!customerId) {
          const existing = await prisma.customer.findFirst({
            where: { organizationId: session.orgId, name: { equals: cName, mode: "insensitive" } },
            select: { id: true },
          });
          if (existing) {
            customerId = existing.id;
            result.customersReused++;
          } else {
            const base = { organizationId: session.orgId, name: cName,
              phone: row.phone?.trim() || null, email: row.email?.trim() || null,
              address: fullAddress, notes: row.notes?.trim() || null };
            const full = { ...base, contactName: row.contactName?.trim() || null,
              taxId: row.taxId?.trim() || null, identityNo: row.identityNo?.trim() || null };
            let c;
            try { c = await prisma.customer.create({ data: full as any }); }
            catch (e) {
              if (String(e).includes("does not exist") || String(e).includes("P2022")) {
                c = await prisma.customer.create({ data: base as any });
              } else throw e;
            }
            customerId = c.id;
            result.customersCreated++;
          }
          if (customerId) customerCache.set(cKey, customerId);
        } else {
          result.customersReused++;
        }

        // ── Asset: always create one per row ────────────────────────
        let driveType = row.driveType?.trim() || null;
        if (driveType) {
          const dt = driveType.toUpperCase();
          if (dt.includes("ELEK")) driveType = "Elektrikli";
          else if (dt.includes("HİD") || dt.includes("HID")) driveType = "Hidrolik";
          else if (dt.includes("PNÖM") || dt.includes("PNOM")) driveType = "Pnömatik";
        }

        if (!customerId) throw new Error("Müşteri oluşturulamadı");
        await prisma.asset.create({
          data: {
            organizationId: session.orgId,
            customerId: customerId!,
            name: row.assetName?.trim() || cName,
            elevatorIdNo: row.elevatorIdNo?.trim() || null,
            stops: row.stops != null ? Number(row.stops) : null,
            driveType,
            brand: row.brand?.trim() || null,
            category: row.category?.trim() || null,
            buildingName: row.buildingName?.trim() || cName,
            locationNote: row.locationNote?.trim() || null,
            capacityKg: row.capacityKg != null ? Number(row.capacityKg) : null,
            riskScore: 0,
          } as any,
        });
        result.assetsCreated++;

      } catch (e) {
        result.errors.push(`${lbl} (${cName}): ${e instanceof Error ? e.message.slice(0, 120) : String(e)}`);
        result.skipped++;
      }
    }

    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e), ok: false }, { status: 500 });
  }
}
