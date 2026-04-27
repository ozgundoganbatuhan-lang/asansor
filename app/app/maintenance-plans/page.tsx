"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OnboardingBeacon from "@/components/OnboardingBeacon";

type Asset = { id: string; name: string; elevatorIdNo?: string | null; customer: { id: string; name: string } };
type Contract = { id: string; contractNumber?: string | null; customer: { name: string } };
type Plan = {
  id: string; name?: string | null; planType: string; periodDays: number; monthlyFee: number;
  nextDueAt: string; lastDoneAt?: string | null; notes?: string | null;
  asset: { id: string; name: string; elevatorIdNo?: string | null; customer: { id: string; name: string } };
  contract?: { id: string; contractNumber?: string | null } | null;
};

const PLAN_TYPE_MAP: Record<string, { label: string; icon: string; cls: string }> = {
  PERIODIC:          { label: "Periyodik Bakım",     icon: "🔧", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  ANNUAL_INSPECTION: { label: "Yıllık Muayene",      icon: "📋", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  CUSTOM:            { label: "Özel Bakım",           icon: "⚙️",  cls: "bg-gray-50 text-gray-700 border-gray-200" },
};

function daysLeft(d: string) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); }
function periodLabel(days: number) {
  if (days === 30) return "Aylık"; if (days === 60) return "2 Aylık"; if (days === 90) return "3 Aylık";
  if (days === 180) return "6 Aylık"; if (days === 365) return "Yıllık"; return `${days} günde bir`;
}

export default function MaintenancePlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [fAsset, setFAsset] = useState(""); const [fName, setFName] = useState("");
  const [fType, setFType] = useState("PERIODIC"); const [fPeriodPreset, setFPeriodPreset] = useState("30");
  const [fPeriodCustom, setFPeriodCustom] = useState(""); const [fFee, setFFee] = useState("");
  const [fContract, setFContract] = useState(""); const [fNext, setFNext] = useState(new Date().toISOString().slice(0, 10));
  const [fNotes, setFNotes] = useState(""); const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const [pRes, aRes, cRes] = await Promise.all([fetch("/api/maintenance-plans"), fetch("/api/assets"), fetch("/api/contracts")]);
    const [p, a, c] = await Promise.all([pRes.json(), aRes.json(), cRes.json()]);
    setPlans(p.items ?? []); setAssets(a.items ?? []); setContracts(c.items ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const periodDays = fPeriodPreset === "custom" ? parseInt(fPeriodCustom) || 30 : parseInt(fPeriodPreset);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setCreating(true); setErr(null);
    const res = await fetch("/api/maintenance-plans", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ assetId: fAsset, name: fName || undefined, planType: fType, periodDays, monthlyFee: parseFloat(fFee) || 0, contractId: fContract || undefined, nextDueAt: fNext, notes: fNotes || undefined }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setErr(data.error ?? "Hata"); return; }
    setShowForm(false); setFAsset(""); setFName(""); setFType("PERIODIC"); setFPeriodPreset("30"); setFFee(""); setFContract(""); setFNotes("");
    await load();
  }

  const router = useRouter();
  const [woCreating, setWoCreating] = useState<string | null>(null);

  async function createWorkOrderFromPlan(plan: Plan) {
    if (woCreating) return;
    setWoCreating(plan.id);
    try {
      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerId: plan.asset.customer.id ?? "",
          assetId: plan.asset.id,
          type: plan.planType === "ANNUAL_INSPECTION" ? "ANNUAL_INSPECTION" : "PERIODIC_MAINTENANCE",
          status: "PENDING",
          priority: "Normal",
          note: `Otomatik oluşturuldu — Bakım Planı: ${plan.name ?? plan.asset.name}`,
          scheduledAt: plan.nextDueAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Oluşturulamadı");
      router.push(`/app/work-orders/${data.item.id}`);
    } catch (e: any) {
      setErr(e.message ?? "İş emri oluşturulamadı");
    } finally {
      setWoCreating(null);
    }
  }

  const now = Date.now();
  const in7 = now + 7 * 86400000;
  const overdue = plans.filter(p => new Date(p.nextDueAt).getTime() < now);
  const thisWeek = plans.filter(p => { const t = new Date(p.nextDueAt).getTime(); return t >= now && t <= in7; });

  // Group by asset for multi-plan view
  const byAsset = useMemo(() => {
    const map = new Map<string, Plan[]>();
    plans.forEach(p => {
      const key = p.asset.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return map;
  }, [plans]);

  const inp = "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none";
  const lbl = "block text-xs font-semibold uppercase tracking-wide text-gray-500";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Bakım Planları</h1>
          <p className="text-sm text-gray-500">Bir asansöre birden fazla bakım planı eklenebilir (aylık, 3 aylık, yıllık…)</p>
        </div>
        <OnboardingBeacon forStep={4} label="👆 Bakım planı oluşturun">
          <button data-tour="new-plan-btn" onClick={() => setShowForm(!showForm)} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm">
          {showForm ? "✕ Kapat" : "+ Yeni Plan"}
        </button>
        </OnboardingBeacon>
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}

      {/* Alerts */}
      {(overdue.length > 0 || thisWeek.length > 0) && (
        <div className="space-y-2">
          {overdue.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <span className="mt-0.5 text-lg">⚠️</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-red-800">{overdue.length} bakım planı gecikti!</div>
                <div className="text-xs text-red-700 mt-1">{overdue.slice(0, 4).map((p, i) => <span key={p.id}>{i > 0 && " · "}{p.asset.name} ({p.asset.customer.name}) — {new Date(p.nextDueAt).toLocaleDateString("tr-TR")}</span>)}</div>
              </div>
            </div>
          )}
          {thisWeek.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <span className="mt-0.5 text-lg">🔔</span>
              <div className="text-sm font-bold text-amber-800">{thisWeek.length} bakım bu hafta yapılmalı</div>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Toplam Plan", val: String(plans.length) },
          { label: "Gecikmiş", val: String(overdue.length), cls: overdue.length > 0 ? "text-red-600" : undefined },
          { label: "Bu Hafta", val: String(thisWeek.length), cls: thisWeek.length > 0 ? "text-amber-700" : undefined },
          { label: "Asansör", val: String(byAsset.size) },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{k.label}</div>
            <div className={`mt-1 text-3xl font-extrabold ${k.cls ?? "text-gray-900"}`}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* New plan form */}
      {showForm && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-6">
          <div className="mb-4 text-base font-bold text-blue-900">Yeni Bakım Planı</div>
          <div className="mb-4 rounded-xl border border-blue-100 bg-white px-4 py-3 text-xs text-blue-700">
            💡 Bir asansöre birden fazla plan ekleyebilirsiniz. Örneğin: Aylık periyodik bakım + Yıllık muayene hazırlığı.
          </div>
          <form onSubmit={create} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <label className={lbl}>Asansör <span className="text-blue-500">*</span></label>
              <select className={inp} value={fAsset} onChange={e => setFAsset(e.target.value)} required>
                <option value="">— Seçin —</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name} — {(a as any).customer?.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Plan Adı</label>
              <input className={inp} value={fName} onChange={e => setFName(e.target.value)} placeholder="Aylık Bakım, Kış Revizyonu…" />
            </div>
            <div>
              <label className={lbl}>Plan Türü</label>
              <select className={inp} value={fType} onChange={e => setFType(e.target.value)}>
                <option value="PERIODIC">Periyodik Bakım</option>
                <option value="ANNUAL_INSPECTION">Yıllık Muayene Hazırlığı</option>
                <option value="CUSTOM">Özel</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Bakım Periyodu</label>
              <select className={inp} value={fPeriodPreset} onChange={e => setFPeriodPreset(e.target.value)}>
                <option value="15">15 günde bir</option>
                <option value="30">Aylık (30 gün)</option>
                <option value="60">2 Aylık (60 gün)</option>
                <option value="90">3 Aylık (90 gün)</option>
                <option value="180">6 Aylık (180 gün)</option>
                <option value="365">Yıllık (365 gün)</option>
                <option value="custom">Özel gün sayısı…</option>
              </select>
              {fPeriodPreset === "custom" && (
                <input className={`${inp} mt-2`} type="number" value={fPeriodCustom} onChange={e => setFPeriodCustom(e.target.value)} placeholder="Gün sayısı" min="1" />
              )}
            </div>
            <div>
              <label className={lbl}>Aylık Ücret (₺)</label>
              <input className={inp} type="number" value={fFee} onChange={e => setFFee(e.target.value)} placeholder="1500" />
            </div>
            <div>
              <label className={lbl}>Sözleşme (Opsiyonel)</label>
              <select className={inp} value={fContract} onChange={e => setFContract(e.target.value)}>
                <option value="">— Bağlı sözleşme yok —</option>
                {contracts.map(c => <option key={c.id} value={c.id}>{c.contractNumber ?? "Sözleşme"} — {c.customer.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>İlk Bakım Tarihi <span className="text-blue-500">*</span></label>
              <input className={inp} type="date" value={fNext} onChange={e => setFNext(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Notlar</label>
              <textarea className={`${inp} resize-none`} rows={2} value={fNotes} onChange={e => setFNotes(e.target.value)} placeholder="Özel bakım talimatları…" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
              <button type="submit" disabled={!fAsset || creating}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 shadow-sm">
                {creating ? "Oluşturuluyor…" : "Plan Oluştur →"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans grouped by asset */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-400">
          Henüz bakım planı yok.
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(byAsset.entries()).map(([assetId, assetPlans]) => {
            const asset = assetPlans[0].asset;
            return (
              <div key={assetId} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏢</span>
                    <span className="font-bold text-gray-900">{asset.name}</span>
                    {asset.elevatorIdNo && <span className="text-xs font-mono text-gray-400">#{asset.elevatorIdNo}</span>}
                    <span className="text-xs text-gray-500">— {asset.customer.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{assetPlans.length} plan</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {assetPlans.map(p => {
                    const days = daysLeft(p.nextDueAt);
                    const isOverdue = days < 0;
                    const isSoon = days >= 0 && days <= 7;
                    const pt = PLAN_TYPE_MAP[p.planType] ?? PLAN_TYPE_MAP.PERIODIC;
                    return (
                      <div key={p.id} className={`flex items-center gap-4 px-5 py-3 flex-wrap ${isOverdue ? "bg-red-50/50" : isSoon ? "bg-amber-50/50" : ""}`}>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${pt.cls}`}>
                          <span>{pt.icon}</span> {pt.label}
                        </span>
                        {p.name && <span className="text-sm font-semibold text-gray-800">{p.name}</span>}
                        <span className="text-xs text-gray-500">{periodLabel(p.periodDays)}</span>
                        <div className="flex-1" />
                        <div className="text-right">
                          <div className={`text-sm font-bold ${isOverdue ? "text-red-600" : isSoon ? "text-amber-700" : "text-gray-900"}`}>
                            {isOverdue ? `${Math.abs(days)} gün gecikti` : days === 0 ? "Bugün!" : `${days} gün sonra`}
                          </div>
                          <div className="text-xs text-gray-400">{new Date(p.nextDueAt).toLocaleDateString("tr-TR")}</div>
                        </div>
                        {p.contract && (
                          <span className="text-xs text-gray-400">📄 {p.contract.contractNumber ?? "Sözleşme"}</span>
                        )}
                        {p.monthlyFee > 0 && (
                          <span className="text-xs font-semibold text-gray-600">
                            {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(p.monthlyFee / 100)}/ay
                          </span>
                        )}
                        <button
                          onClick={() => createWorkOrderFromPlan(p)}
                          disabled={woCreating === p.id}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed">
                          {woCreating === p.id ? "Oluşturuluyor…" : "İş Emri Oluştur →"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
