"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Customer = { id: string; name: string };
type Asset = { id: string; name: string; elevatorIdNo?: string | null };
type ContractAsset = { asset: Asset };
type Contract = {
  id: string; contractNumber?: string | null; status: string;
  startDate: string; endDate?: string | null; autoRenew: boolean;
  monthlyFee: number; technicianName?: string | null;
  hasEncryptionDevice: boolean; notes?: string | null;
  customer: { id: string; name: string };
  assets: ContractAsset[];
  _count: { maintenancePlans: number };
};

const STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  ACTIVE:     { label: "Aktif",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",  dot: "bg-emerald-500" },
  DRAFT:      { label: "Taslak",   cls: "bg-gray-100 text-gray-600 border-gray-200",          dot: "bg-gray-400" },
  EXPIRED:    { label: "Süresi Doldu", cls: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-500" },
  TERMINATED: { label: "Feshedildi",   cls: "bg-red-50 text-red-600 border-red-200",          dot: "bg-red-400" },
};

function money(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n / 100);
}

function daysLeft(d: string) {
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  return diff;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Form state
  const [fCustomer, setFCustomer] = useState("");
  const [fNumber, setFNumber] = useState("");
  const [fStart, setFStart] = useState(new Date().toISOString().slice(0, 10));
  const [fEnd, setFEnd] = useState("");
  const [fAutoRenew, setFAutoRenew] = useState(true);
  const [fFee, setFFee] = useState("");
  const [fTech, setFTech] = useState("");
  const [fTechCert, setFTechCert] = useState("");
  const [fEncryption, setFEncryption] = useState(false);
  const [fEncNote, setFEncNote] = useState("");
  const [fAssets, setFAssets] = useState<string[]>([]);
  const [fNotes, setFNotes] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const [cRes, cuRes, asRes] = await Promise.all([
      fetch("/api/contracts"),
      fetch("/api/customers"),
      fetch("/api/assets"),
    ]);
    const [c, cu, as] = await Promise.all([cRes.json(), cuRes.json(), asRes.json()]);
    setContracts(c.items ?? []);
    setCustomers(cu.items ?? []);
    setAssets(as.items ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  // filter assets by selected customer
  const customerAssets = useMemo(
    () => fCustomer ? (assets as any[]).filter((a: any) => a.customerId === fCustomer) : [],
    [assets, fCustomer]
  );

  const filtered = statusFilter === "ALL" ? contracts : contracts.filter(c => c.status === statusFilter);

  const kpis = useMemo(() => ({
    active: contracts.filter(c => c.status === "ACTIVE").length,
    expiring30: contracts.filter(c => c.status === "ACTIVE" && c.endDate && daysLeft(c.endDate) <= 30 && daysLeft(c.endDate) > 0).length,
    totalMonthly: contracts.filter(c => c.status === "ACTIVE").reduce((a, c) => a + c.monthlyFee, 0),
  }), [contracts]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true); setErr(null);
    const res = await fetch("/api/contracts", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerId: fCustomer, contractNumber: fNumber || undefined,
        startDate: fStart, endDate: fEnd || undefined,
        autoRenew: fAutoRenew, monthlyFee: parseFloat(fFee) || 0,
        technicianName: fTech || undefined, technicianCert: fTechCert || undefined,
        hasEncryptionDevice: fEncryption, encryptionNote: fEncNote || undefined,
        assetIds: fAssets, notes: fNotes || undefined,
      }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setErr(data.error ?? "Oluşturulamadı"); return; }
    setSuccess("Sözleşme oluşturuldu ✓");
    setShowForm(false);
    setTimeout(() => setSuccess(null), 4000);
    await load();
  }

  const inp = "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10";
  const lbl = "block text-xs font-semibold uppercase tracking-wide text-gray-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Sözleşmeler</h1>
          <p className="text-sm text-gray-500">Bakım sözleşmeleri — Asansör İşletme ve Bakım Yönetmeliği uyumlu</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm">
          {showForm ? "✕ Kapat" : "+ Yeni Sözleşme"}
        </button>
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex justify-between">{err}<button onClick={() => setErr(null)} className="font-bold">✕</button></div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Aktif Sözleşme</div>
          <div className="mt-1 text-3xl font-extrabold text-gray-900">{kpis.active}</div>
        </div>
        <div className={`rounded-2xl border p-4 shadow-sm ${kpis.expiring30 > 0 ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-white"}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">30 Günde Bitiyor</div>
          <div className={`mt-1 text-3xl font-extrabold ${kpis.expiring30 > 0 ? "text-amber-700" : "text-gray-900"}`}>{kpis.expiring30}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Aylık Ciro</div>
          <div className="mt-1 text-xl font-extrabold text-gray-900">{money(kpis.totalMonthly)}</div>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6">
          <div className="mb-5 text-base font-bold text-blue-900">Yeni Bakım Sözleşmesi</div>
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-xs text-blue-700">
            <strong>📋 Yasal Dayanaklar:</strong> Asansör İşletme ve Bakım Yönetmeliği (6 Nisan 2019, RG-30411) &amp; TS EN 13015 standardı
          </div>
          <form onSubmit={create} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <label className={lbl}>Müşteri (Bina Sorumlusu) <span className="text-blue-500">*</span></label>
                <select className={inp} value={fCustomer} onChange={e => { setFCustomer(e.target.value); setFAssets([]); }} required>
                  <option value="">— Seçin —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Sözleşme No</label>
                <input className={inp} value={fNumber} onChange={e => setFNumber(e.target.value)} placeholder="SZL-2025-001" />
              </div>
              <div>
                <label className={lbl}>Başlangıç <span className="text-blue-500">*</span></label>
                <input className={inp} type="date" value={fStart} onChange={e => setFStart(e.target.value)} required />
              </div>
              <div>
                <label className={lbl}>Bitiş</label>
                <input className={inp} type="date" value={fEnd} onChange={e => setFEnd(e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Aylık Bakım Ücreti (₺)</label>
                <input className={inp} type="number" value={fFee} onChange={e => setFFee(e.target.value)} placeholder="1500" />
              </div>
            </div>

            {/* Asansörler */}
            {fCustomer && customerAssets.length > 0 && (
              <div>
                <label className={`${lbl} mb-2`}>Sözleşme Kapsamındaki Asansörler</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {customerAssets.map((a: any) => (
                    <label key={a.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${fAssets.includes(a.id) ? "border-blue-300 bg-blue-50 text-blue-800" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}>
                      <input type="checkbox" className="rounded" checked={fAssets.includes(a.id)}
                        onChange={ev => setFAssets(ev.target.checked ? [...fAssets, a.id] : fAssets.filter(x => x !== a.id))} />
                      <span className="font-medium truncate">{a.name}</span>
                      {a.elevatorIdNo && <span className="text-xs text-gray-400 truncate">#{a.elevatorIdNo}</span>}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Teknik sorumlu */}
            <div className="border-t border-gray-100 pt-4">
              <div className={`${lbl} mb-3`}>Teknik Sorumlu Bilgileri <span className="text-gray-400 font-normal normal-case">(yönetmelik gereği sözleşmede zorunlu)</span></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={lbl}>Teknisyen Adı Soyadı</label>
                  <input className={inp} value={fTech} onChange={e => setFTech(e.target.value)} placeholder="Ali Yılmaz" />
                </div>
                <div>
                  <label className={lbl}>TSE/Sertifika No</label>
                  <input className={inp} value={fTechCert} onChange={e => setFTechCert(e.target.value)} placeholder="TSE-HYB-12345" />
                </div>
              </div>
            </div>

            {/* Şifreleme beyanı */}
            <div className="border-t border-gray-100 pt-4">
              <div className={`${lbl} mb-3`}>Şifreleme/Kısıtlama Beyanı <span className="text-gray-400 font-normal normal-case">(2019 yönetmeliği zorunlu kılıyor)</span></div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={fEncryption} onChange={e => setFEncryption(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700">Asansörde şifreleme veya kısıtlama cihazı mevcut</span>
              </label>
              {fEncryption && (
                <textarea className={`${inp} mt-2 resize-none`} rows={2} value={fEncNote} onChange={e => setFEncNote(e.target.value)}
                  placeholder="Şifreleme/kısıtlama cihazına dair açıklama…" />
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={lbl}>Notlar</label>
                <textarea className={`${inp} resize-none`} rows={2} value={fNotes} onChange={e => setFNotes(e.target.value)} placeholder="Özel koşullar…" />
              </div>
              <div className="flex flex-col gap-3 pt-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={fAutoRenew} onChange={e => setFAutoRenew(e.target.checked)} className="rounded" />
                  <div>
                    <div className="text-sm font-semibold text-gray-700">Otomatik Yenileme</div>
                    <div className="text-xs text-gray-400">Bitiş tarihi yaklaşınca uyarı gönderilir</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={!fCustomer || creating}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 shadow-sm">
                {creating ? "Oluşturuluyor…" : "Sözleşme Oluştur →"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
        {["ALL", "ACTIVE", "EXPIRED", "DRAFT", "TERMINATED"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
            {s === "ALL" ? "Tümü" : STATUS_MAP[s]?.label ?? s}
            {s !== "ALL" && <span className="ml-1 opacity-70">({contracts.filter(c => c.status === s).length})</span>}
          </button>
        ))}
      </div>

      {/* Contract list */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400">Sözleşme bulunamadı.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(c => {
              const st = STATUS_MAP[c.status] ?? STATUS_MAP.DRAFT;
              const days = c.endDate ? daysLeft(c.endDate) : null;
              const expiring = days !== null && days <= 30 && days > 0 && c.status === "ACTIVE";
              return (
                <div key={c.id} className={`px-5 py-4 hover:bg-gray-50/70 ${expiring ? "border-l-4 border-l-amber-400" : ""}`}>
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">{c.customer.name}</span>
                        {c.contractNumber && <span className="text-xs font-mono text-gray-400">{c.contractNumber}</span>}
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${st.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                        {expiring && (
                          <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            ⚠️ {days} gün kaldı
                          </span>
                        )}
                        {days !== null && days < 0 && c.status === "ACTIVE" && (
                          <span className="rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">Süresi doldu</span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>📅 {new Date(c.startDate).toLocaleDateString("tr-TR")} — {c.endDate ? new Date(c.endDate).toLocaleDateString("tr-TR") : "Süresiz"}</span>
                        {c.monthlyFee > 0 && <span className="font-semibold text-gray-700">{money(c.monthlyFee)}/ay</span>}
                        {c.technicianName && <span>👷 {c.technicianName}</span>}
                        {c.autoRenew && <span className="text-emerald-600">↺ Otomatik yenileme</span>}
                        {c.hasEncryptionDevice && <span className="text-amber-600">🔒 Şifreleme cihazı</span>}
                      </div>
                      {/* Asansörler */}
                      {c.assets.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {c.assets.map(ca => (
                            <span key={ca.asset.id} className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              🏢 {ca.asset.name}{ca.asset.elevatorIdNo ? ` #${ca.asset.elevatorIdNo}` : ""}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {c.status === "ACTIVE" && (
                        <button onClick={async () => {
                          await fetch(`/api/contracts/${c.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "TERMINATED" }) });
                          await load();
                        }} className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100">
                          Feshet
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legal info banner */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">📚 Yasal Zorunluluklar</div>
        <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex gap-2"><span className="text-emerald-500 flex-shrink-0">✓</span><span><strong>Aylık bakım zorunlu</strong> — En az ayda 1 kez yapılmalı</span></div>
          <div className="flex gap-2"><span className="text-emerald-500 flex-shrink-0">✓</span><span><strong>Yıllık periyodik kontrol</strong> — A Tipi Muayene Kuruluşu (TSE/SZUTEST)</span></div>
          <div className="flex gap-2"><span className="text-emerald-500 flex-shrink-0">✓</span><span><strong>Bakım föyü zorunlu</strong> — Her bakımda imzalanıp bina sorumlusuna verilmeli</span></div>
          <div className="flex gap-2"><span className="text-emerald-500 flex-shrink-0">✓</span><span><strong>Teknik sorumlu beyanı</strong> — Sözleşmede teknisyen bilgisi zorunlu</span></div>
          <div className="flex gap-2"><span className="text-emerald-500 flex-shrink-0">✓</span><span><strong>Şifreleme beyanı</strong> — 2019 yönetmeliği gereği sözleşmede belirtilmeli</span></div>
          <div className="flex gap-2"><span className="text-emerald-500 flex-shrink-0">✓</span><span><strong>Mesleki sorumluluk sigortası</strong> — Min. 500.000 ₺ zorunlu</span></div>
        </div>
      </div>
    </div>
  );
}
