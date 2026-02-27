"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Customer = {
  id: string; name: string; contactName?: string | null;
  phone?: string | null; email?: string | null; address?: string | null;
  taxId?: string | null; notes?: string | null;
};
type Asset = {
  id: string; name: string; buildingName?: string | null;
  stops?: number | null; capacityKg?: number | null;
  controllerBrand?: string | null; riskScore?: number | null; serialNumber?: string | null;
};
type WorkOrder = {
  id: string; code: string; type: string; status: string;
  createdAt: string; asset?: { name: string } | null; technician?: { name: string } | null;
};

const STATUS_CLS: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700", IN_PROGRESS: "bg-amber-100 text-amber-700",
  DONE: "bg-green-100 text-green-700", PENDING: "bg-gray-100 text-gray-600", CANCELED: "bg-gray-100 text-gray-400",
};
const STATUS_LABELS: Record<string, string> = { URGENT: "Acil", IN_PROGRESS: "Devam", DONE: "Bitti", PENDING: "Planlı", CANCELED: "İptal" };
const TYPE_LABELS: Record<string, string> = { FAULT: "Arıza", PERIODIC_MAINTENANCE: "Periyodik", ANNUAL_INSPECTION: "Yıllık Muayene", REVISION: "Revizyon", INSTALLATION: "Kurulum" };
const inp = "mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [assetBuilding, setAssetBuilding] = useState("");
  const [assetStops, setAssetStops] = useState("");
  const [assetCapacity, setAssetCapacity] = useState("");
  const [assetController, setAssetController] = useState("");
  const [assetSerial, setAssetSerial] = useState("");
  const [savingAsset, setSavingAsset] = useState(false);

  async function load() {
    setLoading(true);
    const [cRes, aRes, wRes] = await Promise.all([
      fetch(`/api/customers/${id}`), fetch(`/api/assets?customerId=${id}`), fetch(`/api/work-orders?customerId=${id}`),
    ]);
    const [cData, aData, wData] = await Promise.all([cRes.json(), aRes.json(), wRes.json()]);
    setCustomer(cData.item ?? null);
    setAssets(aData.items ?? []);
    setWorkOrders(wData.items ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function addAsset(e: React.FormEvent) {
    e.preventDefault();
    setSavingAsset(true); setErr(null);
    const res = await fetch("/api/assets", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ customerId: id, name: assetName, buildingName: assetBuilding || undefined,
        stops: assetStops ? parseInt(assetStops) : undefined, capacityKg: assetCapacity ? parseInt(assetCapacity) : undefined,
        controllerBrand: assetController || undefined, serialNumber: assetSerial || undefined }),
    });
    const data = await res.json();
    setSavingAsset(false);
    if (!res.ok) { setErr(data.error ?? "Eklenemedi"); return; }
    setAssetName(""); setAssetBuilding(""); setAssetStops(""); setAssetCapacity(""); setAssetController(""); setAssetSerial("");
    setShowAssetForm(false); await load();
  }

  async function deleteAsset(assetId: string, name: string) {
    if (!confirm(`"${name}" asansörünü silmek istediğinize emin misiniz?`)) return;
    const res = await fetch(`/api/assets/${assetId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? "Silinemedi"); return; }
    await load();
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>;
  if (!customer) return <div className="p-4 text-red-600">Müşteri bulunamadı.</div>;

  const openOrders = workOrders.filter(w => !["DONE", "CANCELED"].includes(w.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">← Geri</button>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">{customer.name}</h1>
          {openOrders.length > 0 && <span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-700">{openOrders.length} açık iş</span>}
        </div>
        <Link href={`/app/work-orders?customerId=${id}`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm">
          + Yeni İş Emri
        </Link>
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err} <button onClick={() => setErr(null)} className="ml-2 font-bold">✕</button></div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Asansörler */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div><div className="font-semibold text-gray-900">Asansörler</div><div className="text-xs text-gray-400 mt-0.5">{assets.length} kayıt</div></div>
              <button onClick={() => setShowAssetForm(!showAssetForm)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                {showAssetForm ? "✕ İptal" : "+ Asansör Ekle"}
              </button>
            </div>

            {showAssetForm && (
              <form onSubmit={addAsset} className="border-b border-gray-100 bg-blue-50 px-5 py-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Asansör Adı *</label>
                    <input className={inp} value={assetName} onChange={e => setAssetName(e.target.value)} placeholder="A Blok Asansörü" required />
                  </div>
                  <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bina</label><input className={inp} value={assetBuilding} onChange={e => setAssetBuilding(e.target.value)} placeholder="Merkez Bina" /></div>
                  <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Durak</label><input className={inp} type="number" value={assetStops} onChange={e => setAssetStops(e.target.value)} placeholder="8" /></div>
                  <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kapasite (kg)</label><input className={inp} type="number" value={assetCapacity} onChange={e => setAssetCapacity(e.target.value)} placeholder="630" /></div>
                  <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kontrol Markası</label><input className={inp} value={assetController} onChange={e => setAssetController(e.target.value)} placeholder="Schindler" /></div>
                  <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Seri No</label><input className={inp} value={assetSerial} onChange={e => setAssetSerial(e.target.value)} placeholder="SN-12345" /></div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="submit" disabled={savingAsset} className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">{savingAsset ? "Kaydediliyor…" : "Kaydet"}</button>
                  <button type="button" onClick={() => setShowAssetForm(false)} className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">İptal</button>
                </div>
              </form>
            )}

            {assets.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">Henüz asansör eklenmemiş. <button onClick={() => setShowAssetForm(true)} className="ml-1 text-blue-600 hover:underline font-medium">Ekle →</button></div>
            ) : (
              <div className="divide-y divide-gray-100">
                {assets.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">🔧</div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{a.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {[a.buildingName, a.stops ? `${a.stops} durak` : null, a.capacityKg ? `${a.capacityKg} kg` : null, a.controllerBrand].filter(Boolean).join(" · ") || "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(a.riskScore ?? 0) >= 60 && <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-bold text-red-600">Risk: {a.riskScore}</span>}
                      <Link href={`/app/work-orders?customerId=${id}&assetId=${a.id}`} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">İş Emri</Link>
                      <button onClick={() => deleteAsset(a.id, a.name)} className="rounded p-1 text-gray-300 hover:text-red-500 transition-colors" title="Sil">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* İş Emirleri */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div><div className="font-semibold text-gray-900">İş Emirleri</div><div className="text-xs text-gray-400 mt-0.5">{workOrders.length} toplam · {openOrders.length} açık</div></div>
            </div>
            {workOrders.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">Henüz iş emri yok.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400"><th className="px-5 py-3">Kod</th><th className="px-5 py-3">Asansör</th><th className="px-5 py-3">Tür</th><th className="px-5 py-3">Teknisyen</th><th className="px-5 py-3">Durum</th><th className="px-5 py-3">Tarih</th></tr></thead>
                <tbody>
                  {workOrders.map((w) => (
                    <tr key={w.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-5 py-3"><Link href={`/app/work-orders/${w.id}`} className="font-mono text-xs font-bold text-blue-600 hover:underline">{w.code}</Link></td>
                      <td className="px-5 py-3 text-gray-600 text-xs">{w.asset?.name ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-600 text-xs">{TYPE_LABELS[w.type] ?? w.type}</td>
                      <td className="px-5 py-3 text-gray-600 text-xs">{w.technician?.name ?? "—"}</td>
                      <td className="px-5 py-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLS[w.status] ?? STATUS_CLS.PENDING}`}>{STATUS_LABELS[w.status] ?? w.status}</span></td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{new Date(w.createdAt).toLocaleDateString("tr-TR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Contact */}
        <div>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">İletişim</div>
            <dl className="space-y-3">
              {customer.contactName && <div><dt className="text-xs text-gray-400">İrtibat</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{customer.contactName}</dd></div>}
              {customer.phone && <div><dt className="text-xs text-gray-400">Telefon</dt><dd className="mt-0.5"><a href={`tel:${customer.phone}`} className="text-sm text-blue-600 hover:underline">{customer.phone}</a></dd></div>}
              {customer.email && <div><dt className="text-xs text-gray-400">E-posta</dt><dd className="mt-0.5"><a href={`mailto:${customer.email}`} className="text-sm text-blue-600 hover:underline">{customer.email}</a></dd></div>}
              {customer.address && <div><dt className="text-xs text-gray-400">Adres</dt><dd className="text-sm text-gray-700 mt-0.5">{customer.address}</dd></div>}
              {customer.taxId && <div><dt className="text-xs text-gray-400">Vergi No</dt><dd className="font-mono text-sm text-gray-700 mt-0.5">{customer.taxId}</dd></div>}
              {customer.notes && <div className="border-t pt-3 mt-3"><dt className="text-xs text-gray-400">Notlar</dt><dd className="text-sm text-gray-700 mt-1 leading-relaxed">{customer.notes}</dd></div>}
            </dl>
            <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center">
              <div><div className="text-2xl font-extrabold text-gray-900">{assets.length}</div><div className="text-xs text-gray-400">Asansör</div></div>
              <div><div className="text-2xl font-extrabold text-gray-900">{workOrders.length}</div><div className="text-xs text-gray-400">İş Emri</div></div>
              <div><div className={`text-2xl font-extrabold ${openOrders.length > 0 ? "text-amber-600" : "text-gray-900"}`}>{openOrders.length}</div><div className="text-xs text-gray-400">Açık</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
