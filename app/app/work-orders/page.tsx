"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function WorkOrdersPageWrapper() {
  return <Suspense><WorkOrdersPage /></Suspense>;
}

type WorkOrder = {
  id: string; code: string; status: string; type: string;
  priority?: string | null; createdAt: string;
  customer: { id: string; name: string };
  technician?: { id: string; name: string } | null;
  asset?: { id: string; name: string } | null;
};
type Customer = { id: string; name: string };
type Technician = { id: string; name: string };
type Asset = { id: string; name: string; customerId: string };

const humanType: Record<string, string> = {
  FAULT: "Arıza", PERIODIC_MAINTENANCE: "Periyodik Bakım",
  ANNUAL_INSPECTION: "Yıllık Muayene", REVISION: "Revizyon", INSTALLATION: "Kurulum",
};
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  URGENT: { label: "Acil", cls: "border-red-200 bg-red-50 text-red-700" },
  IN_PROGRESS: { label: "Devam", cls: "border-amber-200 bg-amber-50 text-amber-700" },
  DONE: { label: "Bitti", cls: "border-green-200 bg-green-50 text-green-700" },
  PENDING: { label: "Planlı", cls: "border-gray-200 bg-gray-50 text-gray-700" },
  CANCELED: { label: "İptal", cls: "border-gray-200 bg-gray-50 text-gray-400" },
};
const FILTER_STATUSES = ["ALL","URGENT","IN_PROGRESS","PENDING","DONE","CANCELED"];
const FILTER_LABELS: Record<string, string> = { ALL:"Tümü", URGENT:"Acil", IN_PROGRESS:"Devam", PENDING:"Planlı", DONE:"Bitti", CANCELED:"İptal" };

function WorkOrdersPage() {
  const searchParams = useSearchParams();
  const preCustomerId = searchParams.get("customerId") ?? "";
  const preAssetId = searchParams.get("assetId") ?? "";

  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(!!preCustomerId);

  const [customerId, setCustomerId] = useState(preCustomerId);
  const [technicianId, setTechnicianId] = useState("");
  const [assetId, setAssetId] = useState(preAssetId);
  const [type, setType] = useState("FAULT");
  const [status, setStatus] = useState("PENDING");
  const [priority, setPriority] = useState("Normal");
  const [note, setNote] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  async function load() {
    setLoading(true); setErr(null);
    const [woRes, cRes, tRes, aRes] = await Promise.all([
      fetch("/api/work-orders"), fetch("/api/customers"),
      fetch("/api/technicians"), fetch("/api/assets"),
    ]);
    if (!woRes.ok) { setErr("İş emirleri yüklenemedi"); setLoading(false); return; }
    const [woData, cData, tData, aData] = await Promise.all([woRes.json(), cRes.json(), tRes.json(), aRes.json()]);
    setOrders(woData.items ?? []);
    setCustomers(cData.items ?? []);
    setTechnicians(tData.items ?? []);
    setAssets(aData.items ?? []);
    if (!customerId && !preCustomerId && cData.items?.[0]) setCustomerId(cData.items[0].id);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filteredAssets = useMemo(() => assets.filter(a => !customerId || a.customerId === customerId), [assets, customerId]);

  const rows = useMemo(() => {
    let r = orders;
    if (filterStatus !== "ALL") r = r.filter(o => o.status === filterStatus);
    const s = q.trim().toLowerCase();
    if (s) r = r.filter(o => [o.code, o.customer?.name, o.asset?.name ?? "", o.technician?.name ?? ""].join(" ").toLowerCase().includes(s));
    return r;
  }, [orders, filterStatus, q]);

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/work-orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId, technicianId: technicianId || undefined,
        assetId: assetId || undefined, type, status, priority,
        note: note || undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(data?.error ?? "Oluşturma başarısız");
    setNote(""); setScheduledAt(""); setShowForm(false);
    await load();
  }

  const counts: Record<string, number> = { ALL: orders.length };
  FILTER_STATUSES.slice(1).forEach(s => { counts[s] = orders.filter(o => o.status === s).length; });

  const inp = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
  const lbl = "mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">İş Emirleri</h1>
          <p className="text-sm text-gray-500">Planla, ata, takip et.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm">
          {showForm ? "✕ Kapat" : "+ Yeni İş Emri"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="mb-4 text-sm font-bold text-blue-900">Yeni İş Emri</div>
          <form onSubmit={createOrder} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={lbl}>Müşteri *</label>
              <select className={inp} value={customerId} onChange={e => { setCustomerId(e.target.value); setAssetId(""); }} required>
                <option value="">— Seç —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Asansör</label>
              <select className={inp} value={assetId} onChange={e => setAssetId(e.target.value)}>
                <option value="">— Seçilmedi —</option>
                {filteredAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              {customerId && filteredAssets.length === 0 && (
                <div className="mt-1 text-xs text-amber-600">Bu müşteriye ait asansör yok. <Link href={`/app/customers/${customerId}`} className="underline">Ekle →</Link></div>
              )}
            </div>
            <div>
              <label className={lbl}>Teknisyen</label>
              <select className={inp} value={technicianId} onChange={e => setTechnicianId(e.target.value)}>
                <option value="">— Atanmadı —</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Tür</label>
              <select className={inp} value={type} onChange={e => setType(e.target.value)}>
                {Object.entries(humanType).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl}>Durum</label>
                <select className={inp} value={status} onChange={e => setStatus(e.target.value)}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Öncelik</label>
                <select className={inp} value={priority} onChange={e => setPriority(e.target.value)}>
                  <option>Normal</option><option>Yüksek</option><option>Kritik</option>
                </select>
              </div>
            </div>
            <div>
              <label className={lbl}>Planlanma Tarihi</label>
              <input type="datetime-local" className={inp} value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={lbl}>Not / Açıklama</label>
              <textarea className={`${inp} resize-none`} rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Arıza detayı, yapılacaklar…" />
            </div>
            {err && <div className="sm:col-span-2 lg:col-span-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
              <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-sm">Oluştur</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">İptal</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1">
          {FILTER_STATUSES.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${filterStatus === s ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {FILTER_LABELS[s]}{counts[s] > 0 && <span className="ml-1 opacity-70">({counts[s]})</span>}
            </button>
          ))}
        </div>
        <div className="flex-1">
          <input className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            placeholder="Kod / müşteri / asansör ara…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            {q || filterStatus !== "ALL" ? "Filtrelerle eşleşen iş emri bulunamadı." : "Henüz iş emri yok."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3">Kod</th><th className="px-5 py-3">Müşteri</th>
                <th className="px-5 py-3">Asansör</th><th className="px-5 py-3">Teknisyen</th>
                <th className="px-5 py-3">Durum</th><th className="px-5 py-3">Tür</th><th className="px-5 py-3">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(o => {
                const s = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.PENDING;
                return (
                  <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3"><Link href={`/app/work-orders/${o.id}`} className="font-mono text-xs font-bold text-blue-600 hover:underline">{o.code}</Link></td>
                    <td className="px-5 py-3 font-medium text-gray-800"><Link href={`/app/customers/${o.customer.id}`} className="hover:text-blue-600">{o.customer.name}</Link></td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{o.asset?.name ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{o.technician?.name ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3"><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span></td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{humanType[o.type] ?? o.type}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString("tr-TR")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
