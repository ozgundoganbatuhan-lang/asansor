import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";

type Row = {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  identityNo?: string;
  notes?: string;
};

// Columns that may not yet exist in the live DB (added via startup.js migration).
// If a column-does-not-exist error is thrown, we retry without these.
const OPTIONAL_COLUMNS: (keyof Row)[] = ["identityNo", "contactName", "taxId"];

function buildData(orgId: string, row: Row, omit: (keyof Row)[] = []) {
  const d: Record<string, string | null> = {
    organizationId: orgId,
    name:        row.name.trim(),
    phone:       row.phone?.trim()    || null,
    email:       row.email?.trim()    || null,
    address:     row.address?.trim()  || null,
    notes:       row.notes?.trim()    || null,
  };
  if (!omit.includes("contactName")) d.contactName = row.contactName?.trim() || null;
  if (!omit.includes("taxId"))       d.taxId       = row.taxId?.trim()       || null;
  if (!omit.includes("identityNo"))  d.identityNo  = row.identityNo?.trim()  || null;
  return d;
}

function isMissingColumnError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.includes("does not exist") || msg.includes("column") || msg.includes("P2022");
}

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  try {
    const body = await req.json().catch(() => null);
    if (!body?.rows || !Array.isArray(body.rows)) {
      return NextResponse.json({ error: "rows dizisi gereklidir" }, { status: 400 });
    }

    const rows: Row[] = body.rows;
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    // Detect which optional columns are missing from the DB up-front
    // by running a test query; build the omit list once for all rows.
    const omitColumns: (keyof Row)[] = [];
    try {
      await (prisma as any).$queryRawUnsafe(
        `SELECT "identityNo", "contactName", "taxId" FROM "Customer" LIMIT 0`
      );
    } catch (e) {
      // Determine which columns are missing
      const msg = e instanceof Error ? e.message : String(e);
      for (const col of OPTIONAL_COLUMNS) {
        if (msg.includes(`"${col}"`) || msg.includes(col)) {
          omitColumns.push(col);
        }
      }
      // If we can't determine specifically, omit all optional columns to be safe
      if (omitColumns.length === 0 && isMissingColumnError(e)) {
        omitColumns.push(...OPTIONAL_COLUMNS);
      }
    }

    if (omitColumns.length > 0) {
      console.warn(`[import] Omitting missing columns: ${omitColumns.join(", ")} — run startup.js to add them`);
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.name?.trim()) {
        results.errors.push(`Satır ${i + 2}: Firma adı zorunludur`);
        results.skipped++;
        continue;
      }
      try {
        await prisma.customer.create({
          data: buildData(session.orgId, row, omitColumns) as any,
        });
        results.created++;
      } catch (e) {
        // If this row still fails with a column error, retry omitting all optional columns
        if (isMissingColumnError(e)) {
          try {
            await prisma.customer.create({
              data: buildData(session.orgId, row, OPTIONAL_COLUMNS) as any,
            });
            results.created++;
          } catch (e2) {
            results.errors.push(`Satır ${i + 2} (${row.name}): ${e2 instanceof Error ? e2.message : String(e2)}`);
            results.skipped++;
          }
        } else {
          results.errors.push(`Satır ${i + 2} (${row.name}): ${e instanceof Error ? e.message : String(e)}`);
          results.skipped++;
        }
      }
    }

    return NextResponse.json({ ok: true, ...results });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
