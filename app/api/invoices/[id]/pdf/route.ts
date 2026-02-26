import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";

function formatMoney(n: number, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 2 }).format(n / 100);
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, organizationId: session.orgId },
    include: {
      organization: true,
      customer: true,
      workOrder: {
        include: {
          partsUsed: { include: { part: true } },
          technician: { select: { name: true } },
          asset: { select: { name: true, buildingName: true, serialNumber: true } },
        },
      },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Fatura bulunamadı." }, { status: 404 });

  const partsRows = invoice.workOrder.partsUsed.map((p) => `
    <tr>
      <td>${p.part.name}</td>
      <td style="text-align:center">${p.quantity}</td>
      <td style="text-align:right">${p.part.price ? formatMoney(p.part.price) : "—"}</td>
      <td style="text-align:right">${p.part.price ? formatMoney(p.part.price * p.quantity) : "—"}</td>
    </tr>
  `).join("");

  const laborRow = invoice.workOrder.laborCost > 0 ? `
    <tr>
      <td>İşçilik</td>
      <td style="text-align:center">1</td>
      <td style="text-align:right">${formatMoney(invoice.workOrder.laborCost)}</td>
      <td style="text-align:right">${formatMoney(invoice.workOrder.laborCost)}</td>
    </tr>
  ` : "";

  const serviceFeeRow = invoice.workOrder.serviceFee > 0 ? `
    <tr>
      <td>Servis Ücreti</td>
      <td style="text-align:center">1</td>
      <td style="text-align:right">${formatMoney(invoice.workOrder.serviceFee)}</td>
      <td style="text-align:right">${formatMoney(invoice.workOrder.serviceFee)}</td>
    </tr>
  ` : "";

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Proforma Fatura — ${invoice.number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #1a1a2e;
      background: #fff;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .logo { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #2563eb; }
    .logo span { color: #1a1a2e; }
    .badge {
      background: #f0f4ff;
      color: #2563eb;
      border: 1px solid #c7d7ff;
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
    .meta-block h3 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; }
    .meta-block p { font-size: 13px; color: #1a1a2e; line-height: 1.6; }
    .meta-block p strong { font-weight: 700; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #f8fafc; }
    th { padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    tbody tr:last-child td { border-bottom: none; }
    .totals { display: flex; justify-content: flex-end; }
    .totals-table { width: 280px; }
    .totals-table td { padding: 6px 12px; }
    .totals-table .total-row td { font-size: 15px; font-weight: 800; border-top: 2px solid #1a1a2e; padding-top: 10px; }
    .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.8; }
    .status-paid { color: #059669; font-weight: 700; }
    .status-draft { color: #d97706; font-weight: 700; }
    .notice-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 12px; color: #92400e; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:#2563eb;color:#fff;text-align:center;padding:10px;margin:-40px -40px 40px;font-size:12px;font-weight:600">
    🖨️ Bu proforma faturadır — yasal e-fatura/e-arşiv için muhasebe entegrasyonu kullanın &nbsp;|&nbsp;
    <button onclick="window.print()" style="background:rgba(255,255,255,0.2);border:none;color:#fff;padding:4px 12px;border-radius:4px;cursor:pointer;font-weight:700">Yazdır / PDF</button>
  </div>

  <div class="notice-box">
    ⚠️ <strong>Proforma Fatura</strong> — Bu belge yasal fatura değildir. Resmi e-fatura kesilmesi için yetkili muhasebe yazılımı/entegratörü kullanılmalıdır.
  </div>

  <div class="header">
    <div>
      <div class="logo">Servisim<span>.</span></div>
      <div style="font-size:11px;color:#6b7280;margin-top:4px">${invoice.organization.name}</div>
    </div>
    <div style="text-align:right">
      <div class="badge">Proforma Fatura</div>
      <div style="margin-top:8px;font-size:18px;font-weight:800;color:#1a1a2e">${invoice.number}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px">
        Durum: <span class="${invoice.status === 'PAID' ? 'status-paid' : 'status-draft'}">${
          invoice.status === 'PAID' ? 'ÖDENDİ' :
          invoice.status === 'SENT' ? 'GÖNDERİLDİ' :
          invoice.status === 'VOID' ? 'İPTAL' : 'TASLAK'
        }</span>
      </div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-block">
      <h3>Faturalanan</h3>
      <p><strong>${invoice.customer.name}</strong></p>
      ${invoice.customer.contactName ? `<p>${invoice.customer.contactName}</p>` : ""}
      ${invoice.customer.phone ? `<p>${invoice.customer.phone}</p>` : ""}
      ${invoice.customer.email ? `<p>${invoice.customer.email}</p>` : ""}
      ${invoice.customer.address ? `<p>${invoice.customer.address}</p>` : ""}
      ${invoice.customer.taxId ? `<p>Vergi No: ${invoice.customer.taxId}</p>` : ""}
    </div>
    <div class="meta-block">
      <h3>Fatura Bilgileri</h3>
      <p><strong>No:</strong> ${invoice.number}</p>
      <p><strong>Düzenleme:</strong> ${formatDate(invoice.issuedAt)}</p>
      ${invoice.dueAt ? `<p><strong>Vade:</strong> ${formatDate(invoice.dueAt)}</p>` : ""}
      ${invoice.paidAt ? `<p><strong>Ödeme:</strong> ${formatDate(invoice.paidAt)}</p>` : ""}
      <p><strong>İş Emri:</strong> ${invoice.workOrder.code}</p>
      ${invoice.workOrder.asset ? `<p><strong>Asansör:</strong> ${invoice.workOrder.asset.name}${invoice.workOrder.asset.buildingName ? ` (${invoice.workOrder.asset.buildingName})` : ""}</p>` : ""}
      ${invoice.workOrder.technician ? `<p><strong>Teknisyen:</strong> ${invoice.workOrder.technician.name}</p>` : ""}
    </div>
  </div>

  <hr class="divider" />

  <table>
    <thead>
      <tr>
        <th>Açıklama</th>
        <th style="text-align:center">Miktar</th>
        <th style="text-align:right">Birim Fiyat</th>
        <th style="text-align:right">Tutar</th>
      </tr>
    </thead>
    <tbody>
      ${partsRows}
      ${laborRow}
      ${serviceFeeRow}
      ${!partsRows && !laborRow && !serviceFeeRow ? `<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:20px">Kalem eklenmemiş</td></tr>` : ""}
    </tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr>
        <td style="color:#6b7280">Ara Toplam</td>
        <td style="text-align:right">${formatMoney(invoice.subtotal)}</td>
      </tr>
      <tr>
        <td style="color:#6b7280">KDV (%${(invoice.taxRate / 100).toFixed(0)})</td>
        <td style="text-align:right">${formatMoney(invoice.taxAmount)}</td>
      </tr>
      <tr class="total-row">
        <td>TOPLAM</td>
        <td style="text-align:right">${formatMoney(invoice.total, invoice.currency)}</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <p>${invoice.organization.name} — Asansör Teknik Servis</p>
    <p>Bu proforma fatura, Servisim platformu üzerinden oluşturulmuştur.</p>
    <p style="margin-top:4px;color:#e5e7eb">⚠️ Yasal fatura değildir. Resmi fatura için muhasebeci/ERP entegrasyonu gereklidir.</p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="proforma-${invoice.number}.html"`,
    },
  });
}
