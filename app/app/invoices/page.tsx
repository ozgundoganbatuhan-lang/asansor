"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type WorkOrder = {
  id: string; code: string;
  laborCost: number; serviceFee: number;
  customer: { name: string };
  invoice?: { id: string } | null;
  partsUsed: { quantity: number; part: { price?: number | null } }[];
};

type Invoice = {
  id: string; number: string; status: string;
  issuedAt: string; dueAt?: string | null; paidAt?: string | null;
  currency: string; subtotal: number; taxRate: number; taxAmount: number; total: number;
  workOrder: { id: string; code: string; customer: { name: string } };
};

function money(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n / 100);
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT:  { label: "Taslak",      cls: "bg-gray-100 text-gray-600" },
  SENT:   { label: "Gönderildi",  cls: "bg-blue-100 text-blue-700" },
  PAID:   { label: "Ödendi",      cls: "bg-green-100 text-green-700" },
  VOID:   { label: "İptal",       cls: "bg-red-100 text-red-600" },
};

export default function InvoicesPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [workOrderId, setWorkOrderId] = useState("");
  const [taxRatePct, setTaxRatePct] = useState("20");
  const [dueAt, setDueAt] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const [invRes, woRes] = await Promise.all([fetch("/api/invoices"), fetch("/api/work-orders")]);
    const [inv, wo] = await Promise.all([invRes.json(), woRes.json()]);
    setItems(inv.items ?? []);
    setWorkOrders((wo.items ?? []).filter((x: WorkOrder) => !x.invoice));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Preview cost when work order is selected
  const selectedWO = workOrders.find(w => w.id === workOrderId);
  const previewPartsTotal = selectedWO?.partsUsed?.reduce((a, p) => a + (p.part.price ?? 0) * p.quantity, 0) ?? 0;
  const previewSubtotal = selectedWO ? previewPartsTotal + (selectedWO.laborCost ?? 0) + (selectedWO.serviceFee ?? 0) : 0;
  const previewTax = Math.round((previewSubtotal * (parseInt(taxRatePct) || 0) * 100) / 10000);
  const previewTotal = previewSubtotal + previewTax;

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true); setErr(null);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workOrderId,
        taxRate: Math.round((parseFloat(taxRatePct) || 0) * 100),
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) { setErr(data.error ?? "Fatura oluşturulamadı"); return; }
    setSuccess(`${data.item?.number} numaralı fatura oluşturuldu ✓`);
    setWorkOrderId(""); setDueAt(""); setShowForm(false);
    setTimeout(() => setSuccess(null), 4000);
    await load();
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { const d = await res.json(); setErr(d.error ?? "Güncellenemedi"); return; }
    await load();
  }

  const kpis = useMemo(() => ({
    count: items.length,
    total: items.reduce((a, i) => a + i.total, 0),
    paid: items.filter(i => i.status === "PAID").reduce((a, i) => a + i.total, 0),
    pending: items.filter(i => i.status === "SENT").reduce((a, i) => a + i.total, 0),
  }), [items]);

  const inp = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Faturalar</h1>
          <p className="text-sm text-gray-500">İş emrinden fatura oluştur, durumunu takip et, PDF al.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm">
          {showForm ? "✕ Kapat" : "+ Yeni Fatura"}
        </button>
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err} <button onClick={() => setErr(null)} className="ml-2 font-bold">✕</button></div>}
      {success && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Toplam Fatura", val: String(kpis.count), sub: null },
          { label: "Toplam Tutar", val: money(kpis.total), sub: null },
          { label: "Tahsil Edildi", val: money(kpis.paid), cls: "text-green-700" },
          { label: "Bekleyen", val: money(kpis.pending), cls: kpis.pending > 0 ? "text-amber-700" : undefined },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{k.label}</div>
            <div className={`mt-1 text-xl font-extrabold ${k.cls ?? "text-gray-900"}`}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* New invoice form */}
      {showForm && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="mb-4 text-sm font-bold text-blue-900">Yeni Fatura Oluştur</div>

          {workOrders.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Fatura kesilecek tamamlanmış iş emri bulunamadı.{" "}
              <Link href="/app/work-orders" className="font-bold underline">İş emirlerine git →</Link>
            </div>
          ) : (
            <form onSubmit={createInvoice} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">İş Emri *</label>
                <select className={inp} value={workOrderId} onChange={e => setWorkOrderId(e.target.value)} required>
                  <option value="">— Seç —</option>
                  {workOrders.map(w => (
                    <option key={w.id} value={w.id}>{w.code} — {w.customer?.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">KDV Oranı (%)</label>
                <input className={inp} type="number" min="0" max="100" value={taxRatePct} onChange={e => setTaxRatePct(e.target.value)} placeholder="20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Vade Tarihi</label>
                <input className={inp} type="date" value={dueAt} onChange={e => setDueAt(e.target.value)} />
              </div>

              {/* Preview */}
              {selectedWO && (
                <div className="sm:col-span-2 lg:col-span-4 rounded-xl border border-blue-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Fatura Önizlemesi</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div><div className="text-xs text-gray-400">Parçalar</div><div className="font-semibold">{money(previewPartsTotal)}</div></div>
                    <div><div className="text-xs text-gray-400">İşçilik</div><div className="font-semibold">{money(selectedWO.laborCost ?? 0)}</div></div>
                    <div><div className="text-xs text-gray-400">Servis Ücreti</div><div className="font-semibold">{money(selectedWO.serviceFee ?? 0)}</div></div>
                    <div><div className="text-xs text-gray-400">KDV ({taxRatePct}%)</div><div className="font-semibold">{money(previewTax)}</div></div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <div className="text-sm text-gray-500">Genel Toplam</div>
                    <div className="text-xl font-extrabold text-gray-900">{money(previewTotal)}</div>
                  </div>
                  {previewTotal === 0 && (
                    <div className="mt-2 text-xs text-amber-700">
                      ⚠️ İş emrinde işçilik/servis ücreti girilmemiş. <Link href={`/app/work-orders/${selectedWO.id}`} className="underline font-bold">Düzenle →</Link>
                    </div>
                  )}
                </div>
              )}

              <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
                <button type="submit" disabled={!workOrderId || creating}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 shadow-sm">
                  {creating ? "Oluşturuluyor…" : "Fatura Oluştur"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  İptal
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Invoice list */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="font-semibold text-gray-900">Fatura Listesi</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-gray-400">Henüz fatura yok.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3">Fatura No</th>
                  <th className="px-5 py-3">İş Emri</th>
                  <th className="px-5 py-3">Müşteri</th>
                  <th className="px-5 py-3">Durum</th>
                  <th className="px-5 py-3 text-right">Toplam</th>
                  <th className="px-5 py-3">Tarih</th>
                  <th className="px-5 py-3">Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {items.map(i => {
                  const st = STATUS_MAP[i.status] ?? STATUS_MAP.DRAFT;
                  return (
                    <tr key={i.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-xs font-bold text-gray-900">{i.number}</td>
                      <td className="px-5 py-3">
                        <Link href={`/app/work-orders/${i.workOrder.id}`} className="font-mono text-xs text-blue-600 hover:underline">{i.workOrder.code}</Link>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{i.workOrder.customer.name}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-gray-900">{money(i.total)}</td>
                      <td className="px-5 py-3 text-xs text-gray-400">{new Date(i.issuedAt).toLocaleDateString("tr-TR")}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          {i.status === "DRAFT" && (
                            <button onClick={() => updateStatus(i.id, "SENT")}
                              className="rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                              Gönderildi
                            </button>
                          )}
                          {(i.status === "DRAFT" || i.status === "SENT") && (
                            <button onClick={() => updateStatus(i.id, "PAID")}
                              className="rounded border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-100">
                              Ödendi ✓
                            </button>
                          )}
                          <a href={`/api/invoices/${i.id}/pdf`} target="_blank" rel="noopener noreferrer"
                            className="rounded border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                            PDF
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <div className="font-bold mb-1">⚠️ Yasal Uyarı</div>
        Bu faturalar <strong>proforma/ön muhasebe</strong> amaçlıdır. Türkiye mevzuatı gereği resmi e-fatura/e-arşiv için{" "}
        <strong>GİB onaylı bir entegratör</strong> (Paraşüt, Logo, Mikro vb.) kullanmanız gerekmektedir.
      </div>
    </div>
  );
}
