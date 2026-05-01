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

const ST: Record<string, { label: string; bg: string; color: string; dot: string; border: string }> = {
  DRAFT: { label: "Taslak",     bg: "#f9fafb", color: "#6b7280", dot: "#9ca3af", border: "#e5e7eb" },
  SENT:  { label: "Gönderildi", bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6", border: "#bfdbfe" },
  PAID:  { label: "Ödendi",     bg: "#f0fdf4", color: "#166534", dot: "#22c55e", border: "#bbf7d0" },
  VOID:  { label: "İptal",      bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444", border: "#fecaca" },
};

const F: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", color: "#111827" };

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
  const [newNotes, setNewNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteVal, setEditingNoteVal] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  async function load() {
    setLoading(true);
    const [invRes, woRes] = await Promise.all([fetch("/api/invoices"), fetch("/api/work-orders")]);
    const [inv, wo] = await Promise.all([invRes.json(), woRes.json()]);
    setItems(inv.items ?? []); setWorkOrders((wo.items ?? []).filter((x: WorkOrder) => !x.invoice));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const selectedWO = workOrders.find(w => w.id === workOrderId);
  const previewParts = selectedWO?.partsUsed?.reduce((a, p) => a + (p.part.price ?? 0) * p.quantity, 0) ?? 0;
  const previewSub = selectedWO ? previewParts + (selectedWO.laborCost ?? 0) + (selectedWO.serviceFee ?? 0) : 0;
  const previewTax = Math.round((previewSub * (parseFloat(taxRatePct) || 0) * 100) / 10000);
  const previewTotal = previewSub + previewTax;

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault(); setCreating(true); setErr(null);
    const res = await fetch("/api/invoices", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ workOrderId, taxRate: Math.round((parseFloat(taxRatePct) || 0) * 100), dueAt: dueAt ? new Date(dueAt).toISOString() : undefined, notes: newNotes || undefined }) });
    const data = await res.json().catch(() => ({})); setCreating(false);
    if (!res.ok) { setErr(data.error ?? "Fatura oluşturulamadı"); return; }
    setSuccess(`${data.item?.number} oluşturuldu ✓`); setWorkOrderId(""); setDueAt(""); setNewNotes(""); setShowForm(false);
    setTimeout(() => setSuccess(null), 4000); await load();
  }
  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    if (!res.ok) { const d = await res.json(); setErr(d.error ?? "Güncellenemedi"); return; } await load();
  }
  async function saveNote(id: string) {
    setSavingNote(true);
    const res = await fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ notes: editingNoteVal }) });
    setSavingNote(false);
    if (!res.ok) { const d = await res.json(); setErr(d.error ?? "Kaydedilemedi"); return; }
    setEditingNoteId(null); await load();
  }

  const kpis = useMemo(() => ({ count: items.length, total: items.reduce((a, i) => a + i.total, 0), paid: items.filter(i => i.status === "PAID").reduce((a, i) => a + i.total, 0), pending: items.filter(i => i.status === "SENT").reduce((a, i) => a + i.total, 0) }), [items]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "#9ca3af", marginBottom: 4 }}>Finans</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>Faturalar</h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>İş emrinden fatura oluştur, muhasebe entegrasyonu için dışa aktar.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: showForm ? "#fff" : "#2563eb", color: showForm ? "#374151" : "#fff", border: showForm ? "1px solid #e5e7eb" : "none", fontSize: 13, fontWeight: 600, padding: "9px 18px", borderRadius: 9, cursor: "pointer" }}>
          {showForm ? "✕ Kapat" : "+ Yeni Fatura"}
        </button>
      </div>

      {err && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#b91c1c", display: "flex", justifyContent: "space-between" }}>{err}<button onClick={() => setErr(null)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "#b91c1c" }}>✕</button></div>}
      {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#166534" }}>{success}</div>}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[{ label: "Toplam Fatura", val: String(kpis.count), color: "#111827" }, { label: "Toplam Tutar", val: money(kpis.total), color: "#111827" }, { label: "Tahsil Edildi", val: money(kpis.paid), color: "#166534" }, { label: "Bekleyen", val: money(kpis.pending), color: kpis.pending > 0 ? "#b45309" : "#111827" }].map(k => (
          <div key={k.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", color: "#9ca3af", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color, letterSpacing: "-0.5px" }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #bfdbfe", borderRadius: 14, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Yeni Fatura Oluştur</div>
          {workOrders.length === 0 ? (
            <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#92400e" }}>
              Faturası olmayan iş emri bulunamadı. <Link href="/app/work-orders" style={{ fontWeight: 700, color: "#2563eb" }}>İş emirlerine git →</Link>
            </div>
          ) : (
            <form onSubmit={createInvoice} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>İş Emri *</label>
                  <select style={F} value={workOrderId} onChange={e => setWorkOrderId(e.target.value)} required>
                    <option value="">— Seç —</option>
                    {workOrders.map(w => <option key={w.id} value={w.id}>{w.code} — {w.customer?.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>KDV Oranı (%)</label>
                  <input style={F} type="number" min="0" max="100" value={taxRatePct} onChange={e => setTaxRatePct(e.target.value)} placeholder="20" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Vade Tarihi</label>
                  <input style={F} type="date" value={dueAt} onChange={e => setDueAt(e.target.value)} />
                </div>
              </div>

              {selectedWO && (
                <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "#9ca3af", marginBottom: 10 }}>Önizleme</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 12 }}>
                    {[{ l: "Parçalar", v: money(previewParts) }, { l: "İşçilik", v: money(selectedWO.laborCost ?? 0) }, { l: "Servis", v: money(selectedWO.serviceFee ?? 0) }, { l: `KDV ${taxRatePct}%`, v: money(previewTax) }].map(r => (
                      <div key={r.l}><div style={{ fontSize: 11, color: "#9ca3af" }}>{r.l}</div><div style={{ fontSize: 14, fontWeight: 600 }}>{r.v}</div></div>
                    ))}
                  </div>
                  <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#6b7280" }}>Genel Toplam</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>{money(previewTotal)}</span>
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Fatura Notu</label>
                <textarea style={{ ...F, minHeight: 60, resize: "vertical" }} value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Ödeme bilgileri, IBAN…" />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" disabled={!workOrderId || creating} style={{ background: "#2563eb", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, padding: "9px 20px", borderRadius: 9, cursor: "pointer", opacity: (!workOrderId || creating) ? 0.6 : 1 }}>{creating ? "Oluşturuluyor…" : "Fatura Oluştur"}</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: "none", border: "1px solid #e5e7eb", color: "#6b7280", fontSize: 13, fontWeight: 600, padding: "9px 16px", borderRadius: 9, cursor: "pointer" }}>İptal</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Invoice list */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Fatura Listesi</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{items.length} fatura</div>
        </div>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><div style={{ width: 28, height: 28, border: "3px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin .7s linear infinite" }} /></div>
        ) : items.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Henüz fatura yok.</div>
        ) : items.map((inv, i) => {
          const st = ST[inv.status] ?? ST.DRAFT;
          const isEditNote = editingNoteId === inv.id;
          return (
            <div key={inv.id} style={{ padding: "14px 18px", borderBottom: i < items.length - 1 ? "1px solid #f3f4f6" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 160 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#111827" }}>{inv.number}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 99, padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }} />{st.label}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                    <Link href={`/app/work-orders/${inv.workOrder.id}`} style={{ color: "#2563eb", fontFamily: "monospace", fontSize: 11 }}>{inv.workOrder.code}</Link>
                    <span style={{ color: "#9ca3af", margin: "0 4px" }}>·</span>{inv.workOrder.customer.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                    {new Date(inv.issuedAt).toLocaleDateString("tr-TR")}
                    {inv.dueAt && <span style={{ marginLeft: 8 }}>Vade: {new Date(inv.dueAt).toLocaleDateString("tr-TR")}</span>}
                    {inv.paidAt && <span style={{ marginLeft: 8, color: "#22c55e" }}>Ödendi: {new Date(inv.paidAt).toLocaleDateString("tr-TR")}</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 100 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{money(inv.total)}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>KDV dahil</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {inv.status === "DRAFT" && <button onClick={() => updateStatus(inv.id, "SENT")} style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Gönderildi</button>}
                  {(inv.status === "DRAFT" || inv.status === "SENT") && <button onClick={() => updateStatus(inv.id, "PAID")} style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Ödendi ✓</button>}
                  <button onClick={() => { setEditingNoteId(isEditNote ? null : inv.id); setEditingNoteVal(inv.notes ?? ""); }} style={{ background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{isEditNote ? "↑ Kapat" : "📝 Not"}</button>
                  <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer" style={{ background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center" }}>PDF</a>
                </div>
              </div>
              {inv.notes && !isEditNote && <div style={{ marginTop: 10, background: "#fefce8", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400e" }}><strong>Not:</strong> {inv.notes}</div>}
              {isEditNote && (
                <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <textarea style={{ flex: 1, ...F, minHeight: 60, resize: "vertical" }} value={editingNoteVal} onChange={e => setEditingNoteVal(e.target.value)} placeholder="Not…" autoFocus />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button onClick={() => saveNote(inv.id)} disabled={savingNote} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{savingNote ? "…" : "Kaydet"}</button>
                    <button onClick={() => setEditingNoteId(null)} style={{ background: "none", border: "1px solid #e5e7eb", color: "#6b7280", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>İptal</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
