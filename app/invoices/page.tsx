"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type WorkOrder = {
  id: string; code: string; laborCost: number; serviceFee: number;
  customer: { name: string }; invoice?: { id: string } | null;
  partsUsed: { quantity: number; part: { price?: number | null } }[];
};
type Invoice = {
  id: string; number: string; status: string; notes?: string | null;
  issuedAt: string; dueAt?: string | null; paidAt?: string | null;
  currency: string; subtotal: number; taxRate: number; taxAmount: number; total: number;
  workOrder: { id: string; code: string; customer: { name: string } };
};

function money(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n / 100);
}

const STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  DRAFT: { label: "Taslak",     cls: "bg-gray-100 text-gray-600 border-gray-200",    dot: "bg-gray-400" },
  SENT:  { label: "Gönderildi", cls: "bg-blue-50 text-blue-700 border-blue-200",     dot: "bg-blue-500" },
  PAID:  { label: "Ödendi",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  VOID:  { label: "İptal",      cls: "bg-red-50 text-red-600 border-red-200",        dot: "bg-red-400" },
};

export default function InvoicesPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Create form
  const [workOrderId, setWorkOrderId] = useState("");
  const [taxRatePct, setTaxRatePct] = useState("20");
  const [dueAt, setDueAt] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [creating, setCreating] = useState(false);

  // Inline note editing
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteVal, setEditingNoteVal] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  async function load() {
    setLoading(true);
    const [invRes, woRes] = await Promise.all([fetch("/api/invoices"), fetch("/api/work-orders")]);
    const [inv, wo] = await Promise.all([invRes.json(), woRes.json()]);
    setItems(inv.items ?? []);
    setWorkOrders((wo.items ?? []).filter((x: WorkOrder) => !x.invoice));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const selectedWO = workOrders.find(w => w.id === workOrderId);
  const previewParts = selectedWO?.partsUsed?.reduce((a, p) => a + (p.part.price ?? 0) * p.quantity, 0) ?? 0;
  const previewSub = selectedWO ? previewParts + (selectedWO.laborCost ?? 0) + (selectedWO.serviceFee ?? 0) : 0;
  const previewTax = Math.round((previewSub * (parseFloat(taxRatePct) || 0) * 100) / 10000);
  const previewTotal = previewSub + previewTax;

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
        notes: newNotes || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) { setErr(data.error ?? "Fatura oluşturulamadı"); return; }
    setSuccess(`${data.item?.number} oluşturuldu ✓`);
    setWorkOrderId(""); setDueAt(""); setNewNotes(""); setShowForm(false);
    setTimeout(() => setSuccess(null), 4000);
    await load();
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { const d = await res.json(); setErr(d.error ?? "Güncellenemedi"); return; }
    await load();
  }

  async function saveNote(id: string) {
    setSavingNote(true);
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ notes: editingNoteVal }),
    });
    setSavingNote(false);
    if (!res.ok) { const d = await res.json(); setErr(d.error ?? "Not kaydedilemedi"); return; }
    setEditingNoteId(null);
    await load();
  }

  const kpis = useMemo(() => ({
    count: items.length,
    total: items.reduce((a, i) => a + i.total, 0),
    paid: items.filter(i => i.status === "PAID").reduce((a, i) => a + i.total, 0),
    pending: items.filter(i => i.status === "SENT").reduce((a, i) => a + i.total, 0),
  }), [items]);

  const inp = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Faturalar</h1>
          <p className="text-sm text-gray-500">İş emrinden fatura oluştur, muhasebe entegrasyonu için dışa aktar.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-colors">
          {showForm ? "✕ Kapat" : "+ Yeni Fatura"}
        </button>
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">{err}<button onClick={() => setErr(null)} className="ml-2 font-bold text-red-400 hover:text-red-600">✕</button></div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Toplam Fatura", val: String(kpis.count), cls: "text-gray-900" },
          { label: "Toplam Tutar",  val: money(kpis.total),  cls: "text-gray-900" },
          { label: "Tahsil Edildi", val: money(kpis.paid),   cls: "text-emerald-700" },
          { label: "Bekleyen",      val: money(kpis.pending),cls: kpis.pending > 0 ? "text-amber-700" : "text-gray-900" },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{k.label}</div>
            <div className={`mt-1 text-xl font-extrabold ${k.cls}`}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* New invoice form */}
      {showForm && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6">
          <div className="mb-5 text-base font-bold text-blue-900">Yeni Fatura Oluştur</div>
          {workOrders.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Faturası olmayan iş emri bulunamadı.{" "}
              <Link href="/app/work-orders" className="font-bold underline">İş emirlerine git →</Link>
            </div>
          ) : (
            <form onSubmit={createInvoice} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">İş Emri *</label>
                <select className={inp} value={workOrderId} onChange={e => setWorkOrderId(e.target.value)} required>
                  <option value="">— Seç —</option>
                  {workOrders.map(w => <option key={w.id} value={w.id}>{w.code} — {w.customer?.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">KDV Oranı (%)</label>
                <input className={inp} type="number" min="0" max="100" value={taxRatePct} onChange={e => setTaxRatePct(e.target.value)} placeholder="20" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Vade Tarihi</label>
                <input className={inp} type="date" value={dueAt} onChange={e => setDueAt(e.target.value)} />
              </div>

              {/* Cost preview */}
              {selectedWO && (
                <div className="sm:col-span-2 lg:col-span-4 rounded-xl border border-blue-100 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Önizleme</div>
                  <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                    <div><div className="text-xs text-gray-400">Parçalar</div><div className="font-semibold">{money(previewParts)}</div></div>
                    <div><div className="text-xs text-gray-400">İşçilik</div><div className="font-semibold">{money(selectedWO.laborCost ?? 0)}</div></div>
                    <div><div className="text-xs text-gray-400">Servis</div><div className="font-semibold">{money(selectedWO.serviceFee ?? 0)}</div></div>
                    <div><div className="text-xs text-gray-400">KDV {taxRatePct}%</div><div className="font-semibold">{money(previewTax)}</div></div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-sm text-gray-500">Genel Toplam</span>
                    <span className="text-2xl font-extrabold text-gray-900">{money(previewTotal)}</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Fatura Notu (Müşteriye görünür)</label>
                <textarea className={`${inp} resize-none`} rows={2} value={newNotes} onChange={e => setNewNotes(e.target.value)}
                  placeholder="Ödeme bilgileri, banka IBAN, teşekkür notu…" />
              </div>

              <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
                <button type="submit" disabled={!workOrderId || creating}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 shadow-sm">
                  {creating ? "Oluşturuluyor…" : "Fatura Oluştur"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  İptal
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Invoice list */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="font-semibold text-gray-900">Fatura Listesi</div>
          <div className="text-xs text-gray-400">{items.length} fatura</div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-gray-400">Henüz fatura yok.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map(i => {
              const st = STATUS_MAP[i.status] ?? STATUS_MAP.DRAFT;
              const isEditingNote = editingNoteId === i.id;
              return (
                <div key={i.id} className="px-5 py-4 hover:bg-gray-50/70 transition-colors">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Invoice number + status */}
                    <div className="flex items-center gap-2 min-w-[160px]">
                      <span className="font-mono text-sm font-bold text-gray-900">{i.number}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${st.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </div>
                    {/* Work order + customer */}
                    <div className="flex-1 min-w-[180px]">
                      <div className="text-sm font-medium text-gray-900">
                        <Link href={`/app/work-orders/${i.workOrder.id}`} className="text-blue-600 hover:underline font-mono text-xs">{i.workOrder.code}</Link>
                        <span className="text-gray-400 mx-1">·</span>
                        {i.workOrder.customer.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(i.issuedAt).toLocaleDateString("tr-TR")}
                        {i.dueAt && <span className="ml-2">Vade: {new Date(i.dueAt).toLocaleDateString("tr-TR")}</span>}
                        {i.paidAt && <span className="ml-2 text-emerald-600">Ödendi: {new Date(i.paidAt).toLocaleDateString("tr-TR")}</span>}
                      </div>
                    </div>
                    {/* Amount */}
                    <div className="text-right min-w-[100px]">
                      <div className="text-base font-extrabold text-gray-900">{money(i.total)}</div>
                      <div className="text-xs text-gray-400">KDV dahil</div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {i.status === "DRAFT" && (
                        <button onClick={() => updateStatus(i.id, "SENT")}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
                          Gönderildi
                        </button>
                      )}
                      {(i.status === "DRAFT" || i.status === "SENT") && (
                        <button onClick={() => updateStatus(i.id, "PAID")}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
                          Ödendi ✓
                        </button>
                      )}
                      <button
                        onClick={() => { setEditingNoteId(isEditingNote ? null : i.id); setEditingNoteVal(i.notes ?? ""); }}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${isEditingNote ? "border-gray-300 bg-gray-100 text-gray-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
                        {isEditingNote ? "↑ Kapat" : "📝 Not"}
                      </button>
                      <a href={`/api/invoices/${i.id}/pdf`} target="_blank" rel="noopener noreferrer"
                        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                        PDF
                      </a>
                    </div>
                  </div>

                  {/* Existing note display */}
                  {i.notes && !isEditingNote && (
                    <div className="mt-2 ml-0 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-800">
                      <span className="font-semibold">Not:</span> {i.notes}
                    </div>
                  )}

                  {/* Note editing area */}
                  {isEditingNote && (
                    <div className="mt-3 flex gap-2 items-start">
                      <textarea
                        className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                        rows={2}
                        value={editingNoteVal}
                        onChange={e => setEditingNoteVal(e.target.value)}
                        placeholder="Ödeme bilgileri, IBAN, özel koşullar…"
                        autoFocus
                      />
                      <div className="flex flex-col gap-1.5">
                        <button onClick={() => saveNote(i.id)} disabled={savingNote}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60 whitespace-nowrap">
                          {savingNote ? "…" : "Kaydet"}
                        </button>
                        <button onClick={() => setEditingNoteId(null)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50">
                          İptal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Accounting integration banner */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-2xl">🏛️</div>
          <div className="flex-1">
            <div className="font-bold text-indigo-900 text-base">Muhasebe Entegrasyonu</div>
            <p className="mt-1 text-sm text-indigo-700 leading-relaxed">
              Tüm fatura ve iş emri verileriniz muhasebe firmanızla paylaşıma hazır.{" "}
              <strong>Paraşüt, Logo, Mikro veya Luca</strong> gibi yazılımlarla doğrudan entegrasyon kurulabilir — 
              muhasebecileriniz her ay elle veri girişi yapmak yerine tek tıkla tüm işlemlerinizi alabilir.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Paraşüt", "Logo GO", "Mikro", "Luca", "Özel API"].map(b => (
                <span key={b} className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">{b}</span>
              ))}
            </div>
            <p className="mt-2 text-xs text-indigo-500">
              Entegrasyon kurulumu için ekibimizle iletişime geçin. e-Fatura / e-Arşiv uyumu da sağlanabilmektedir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
