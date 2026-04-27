import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";

function fmt(n: number, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 2 }).format(n / 100);
}
function fmtDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const invoice = await prisma.invoice.findFirst({
    where: { id: id, organizationId: session.orgId },
    include: {
      organization: true, customer: true,
      workOrder: { include: { partsUsed: { include: { part: true } }, technician: { select: { name: true } }, asset: { select: { name: true, buildingName: true, serialNumber: true } } } },
    },
  });
  if (!invoice) return NextResponse.json({ error: "Fatura bulunamadı." }, { status: 404 });

  const partsRows = invoice.workOrder.partsUsed.map((p: { part: { name: string; price?: number | null }; quantity: number }) => `<tr><td>${p.part.name}</td><td style="text-align:center">${p.quantity}</td><td style="text-align:right">${p.part.price ? fmt(p.part.price) : "—"}</td><td style="text-align:right">${p.part.price ? fmt(p.part.price * p.quantity) : "—"}</td></tr>`).join("");
  const laborRow = invoice.workOrder.laborCost > 0 ? `<tr><td>İşçilik</td><td style="text-align:center">1</td><td style="text-align:right">${fmt(invoice.workOrder.laborCost)}</td><td style="text-align:right">${fmt(invoice.workOrder.laborCost)}</td></tr>` : "";
  const serviceFeeRow = invoice.workOrder.serviceFee > 0 ? `<tr><td>Servis Ücreti</td><td style="text-align:center">1</td><td style="text-align:right">${fmt(invoice.workOrder.serviceFee)}</td><td style="text-align:right">${fmt(invoice.workOrder.serviceFee)}</td></tr>` : "";

  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Proforma Fatura — ${invoice.number}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#1a1a2e;padding:40px;max-width:800px;margin:0 auto}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px}.logo{font-size:22px;font-weight:900;color:#2563eb}.badge{background:#f0f4ff;color:#2563eb;border:1px solid #c7d7ff;border-radius:6px;padding:6px 14px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase}.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px}.meta-block h3{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-bottom:8px}table{width:100%;border-collapse:collapse;margin-bottom:24px}thead tr{background:#f8fafc}th{padding:10px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb}td{padding:10px 12px;border-bottom:1px solid #f1f5f9}.totals{display:flex;justify-content:flex-end}.totals-table{width:280px}.total-row td{font-size:15px;font-weight:800;border-top:2px solid #1a1a2e;padding-top:10px}.footer{margin-top:48px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center}@media print{.no-print{display:none}}</style></head>
<body>
<div class="no-print" style="background:#2563eb;color:#fff;text-align:center;padding:10px;margin:-40px -40px 40px;font-size:12px;font-weight:600">🖨️ Proforma faturadır &nbsp;|&nbsp; <button onclick="window.print()" style="background:rgba(255,255,255,0.2);border:none;color:#fff;padding:4px 12px;border-radius:4px;cursor:pointer;font-weight:700">Yazdır / PDF</button></div>
<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin-bottom:24px;font-size:12px;color:#92400e">⚠️ <strong>Proforma Fatura</strong> — Yasal fatura değildir.</div>
<div class="header"><div><div class="logo">Servisim.</div><div style="font-size:11px;color:#6b7280;margin-top:4px">${invoice.organization.name}</div></div><div style="text-align:right"><div class="badge">Proforma Fatura</div><div style="margin-top:8px;font-size:18px;font-weight:800">${invoice.number}</div></div></div>
<div class="meta-grid"><div class="meta-block"><h3>Faturalanan</h3><p><strong>${invoice.customer.name}</strong></p>${invoice.customer.phone ? `<p>${invoice.customer.phone}</p>` : ""}${invoice.customer.address ? `<p>${invoice.customer.address}</p>` : ""}${invoice.customer.taxId ? `<p>VKN: ${invoice.customer.taxId}</p>` : ""}</div><div class="meta-block"><h3>Fatura Bilgileri</h3><p><strong>No:</strong> ${invoice.number}</p><p><strong>Tarih:</strong> ${fmtDate(invoice.issuedAt)}</p>${invoice.dueAt ? `<p><strong>Vade:</strong> ${fmtDate(invoice.dueAt)}</p>` : ""}<p><strong>İş Emri:</strong> ${invoice.workOrder.code}</p>${invoice.workOrder.asset ? `<p><strong>Asansör:</strong> ${invoice.workOrder.asset.name}</p>` : ""}</div></div>
<table><thead><tr><th>Açıklama</th><th style="text-align:center">Miktar</th><th style="text-align:right">Birim</th><th style="text-align:right">Tutar</th></tr></thead><tbody>${partsRows}${laborRow}${serviceFeeRow}${!partsRows && !laborRow && !serviceFeeRow ? `<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:20px">Kalem eklenmemiş</td></tr>` : ""}</tbody></table>
<div class="totals"><table class="totals-table"><tr><td style="color:#6b7280">Ara Toplam</td><td style="text-align:right">${fmt(invoice.subtotal)}</td></tr><tr><td style="color:#6b7280">KDV (%${(invoice.taxRate / 100).toFixed(0)})</td><td style="text-align:right">${fmt(invoice.taxAmount)}</td></tr><tr class="total-row"><td>TOPLAM</td><td style="text-align:right">${fmt(invoice.total, invoice.currency)}</td></tr></table></div>
<div class="footer"><p>${invoice.organization.name} — Servisim platformu</p><p>Bu proforma fatura yasal fatura değildir.</p></div>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Content-Disposition": `inline; filename="proforma-${invoice.number}.html"` },
  });
}
