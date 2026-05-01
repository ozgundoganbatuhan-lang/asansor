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

const PT: Record<string, { label: string; icon: string; bg: string; color: string; border: string }> = {
  PERIODIC:          { label: "Periyodik Bakım",    icon: "🔧", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  ANNUAL_INSPECTION: { label: "Yıllık Muayene",     icon: "📋", bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  CUSTOM:            { label: "Özel Bakım",          icon: "⚙️",  bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
};

function daysLeft(d: string) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); }
function periodLabel(days: number) {
  if (days === 15) return "15 günde bir"; if (days === 30) return "Aylık"; if (days === 60) return "2 Aylık";
  if (days === 90) return "3 Aylık"; if (days === 180) return "6 Aylık"; if (days === 365) return "Yıllık";
  return `${days} günde bir`;
}

const F: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", color: "#111827" };

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
  const router = useRouter();
  const [woCreating, setWoCreating] = useState<string | null>(null);

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
    const res = await fetch("/api/maintenance-plans", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ assetId: fAsset, name: fName || undefined, planType: fType, periodDays, monthlyFee: parseFloat(fFee) || 0, contractId: fContract || undefined, nextDueAt: fNext, notes: fNotes || undefined }) });
    const data = await res.json(); setCreating(false);
    if (!res.ok) { setErr(data.error ?? "Hata"); return; }
    setShowForm(false); setFAsset(""); setFName(""); setFType("PERIODIC"); setFPeriodPreset("30"); setFFee(""); setFContract(""); setFNotes(""); await load();
  }

  async function createWorkOrderFromPlan(plan: Plan) {
    if (woCreating) return; setWoCreating(plan.id);
    try {
      const res = await fetch("/api/work-orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ customerId: plan.asset.customer.id ?? "", assetId: plan.asset.id, type: plan.planType === "ANNUAL_INSPECTION" ? "ANNUAL_INSPECTION" : "PERIODIC_MAINTENANCE", status: "PENDING", priority: "Normal", note: `Otomatik oluşturuldu — Bakım Planı: ${plan.name ?? plan.asset.name}`, scheduledAt: plan.nextDueAt }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Oluşturulamadı");
      router.push(`/app/work-orders/${data.item.id}`);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "İş emri oluşturulamadı"); } finally { setWoCreating(null); }
  }

  const now = Date.now(); const in7 = now + 7 * 86400000;
  const overdue = plans.filter(p => new Date(p.nextDueAt).getTime() < now);
  const thisWeek = plans.filter(p => { const t = new Date(p.nextDueAt).getTime(); return t >= now && t <= in7; });
  const byAsset = useMemo(() => { const map = new Map<string, Plan[]>(); plans.forEach(p => { if (!map.has(p.asset.id)) map.set(p.asset.id, []); map.get(p.asset.id)!.push(p); }); return map; }, [plans]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "#9ca3af", marginBottom: 4 }}>Saha</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>Bakım Planları</h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Bir asansöre birden fazla bakım planı eklenebilir (aylık, 3 aylık, yıllık…)</p>
        </div>
        <OnboardingBeacon forStep={4} label="👆 Bakım planı oluşturun">
          <button data-tour="new-plan-btn" onClick={() => setShowForm(!showForm)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: showForm ? "#fff" : "#2563eb", color: showForm ? "#374151" : "#fff", border: showForm ? "1px solid #e5e7eb" : "none", fontSize: 13, fontWeight: 600, padding: "9px 18px", borderRadius: 9, cursor: "pointer" }}>
            {showForm ? "✕ Kapat" : "+ Yeni Plan"}
          </button>
        </OnboardingBeacon>
      </div>

      {err && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#b91c1c" }}>{err}</div>}

      {/* Alerts */}
      {overdue.length > 0 && <div style={{ display: "flex", gap: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", alignItems: "flex-start" }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <div><div style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c" }}>{overdue.length} bakım planı gecikti!</div>
          <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{overdue.slice(0, 4).map((p, i) => <span key={p.id}>{i > 0 && " · "}{p.asset.name} — {new Date(p.nextDueAt).toLocaleDateString("tr-TR")}</span>)}</div></div>
      </div>}
      {thisWeek.length > 0 && <div style={{ display: "flex", gap: 10, background: "#fefce8", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", alignItems: "center" }}>
        <span style={{ fontSize: 18 }}>🔔</span>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>{thisWeek.length} bakım bu hafta yapılmalı</div>
      </div>}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[{ label: "Toplam Plan", val: plans.length, color: "#111827" }, { label: "Gecikmiş", val: overdue.length, color: overdue.length > 0 ? "#b91c1c" : "#111827" }, { label: "Bu Hafta", val: thisWeek.length, color: thisWeek.length > 0 ? "#b45309" : "#111827" }, { label: "Asansör", val: byAsset.size, color: "#111827" }].map(k => (
          <div key={k.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", color: "#9ca3af", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: k.color, letterSpacing: "-1px" }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #bfdbfe", borderRadius: 14, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Yeni Bakım Planı</div>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#1d4ed8", marginBottom: 16 }}>
            💡 Bir asansöre birden fazla plan ekleyebilirsiniz. Örneğin: Aylık periyodik bakım + Yıllık muayene hazırlığı.
          </div>
          <form onSubmit={create} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Asansör *</label>
                <select style={F} value={fAsset} onChange={e => setFAsset(e.target.value)} required>
                  <option value="">— Seçin —</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name} — {a.customer?.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Plan Adı</label>
                <input style={F} value={fName} onChange={e => setFName(e.target.value)} placeholder="Aylık Bakım…" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Plan Türü</label>
                <select style={F} value={fType} onChange={e => setFType(e.target.value)}>
                  <option value="PERIODIC">Periyodik Bakım</option>
                  <option value="ANNUAL_INSPECTION">Yıllık Muayene</option>
                  <option value="CUSTOM">Özel</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Periyot</label>
                <select style={F} value={fPeriodPreset} onChange={e => setFPeriodPreset(e.target.value)}>
                  {[["15","15 günde bir"],["30","Aylık (30 gün)"],["60","2 Aylık"],["90","3 Aylık"],["180","6 Aylık"],["365","Yıllık"],["custom","Özel…"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
                {fPeriodPreset === "custom" && <input style={{ ...F, marginTop: 6 }} type="number" value={fPeriodCustom} onChange={e => setFPeriodCustom(e.target.value)} placeholder="Gün sayısı" min="1" />}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Aylık Ücret (₺)</label>
                <input style={F} type="number" value={fFee} onChange={e => setFFee(e.target.value)} placeholder="1500" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>İlk Bakım Tarihi *</label>
                <input style={F} type="date" value={fNext} onChange={e => setFNext(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Sözleşme</label>
                <select style={F} value={fContract} onChange={e => setFContract(e.target.value)}>
                  <option value="">— Bağlı yok —</option>
                  {contracts.map(c => <option key={c.id} value={c.id}>{c.contractNumber ?? "Sözleşme"} — {c.customer.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / 4" }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Notlar</label>
                <textarea style={{ ...F, minHeight: 60, resize: "vertical" }} value={fNotes} onChange={e => setFNotes(e.target.value)} placeholder="Özel bakım talimatları…" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={!fAsset || creating} style={{ background: "#2563eb", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, padding: "9px 20px", borderRadius: 9, cursor: "pointer", opacity: (!fAsset || creating) ? 0.6 : 1 }}>{creating ? "Oluşturuluyor…" : "Plan Oluştur →"}</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: "none", border: "1px solid #e5e7eb", color: "#6b7280", fontSize: 13, fontWeight: 600, padding: "9px 16px", borderRadius: 9, cursor: "pointer" }}>İptal</button>
            </div>
          </form>
        </div>
      )}

      {/* Plans list */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><div style={{ width: 28, height: 28, border: "3px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin .7s linear infinite" }} /></div>
      ) : plans.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Henüz bakım planı yok.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from(byAsset.entries()).map(([assetId, assetPlans]) => {
            const asset = assetPlans[0].asset;
            return (
              <div key={assetId} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>🏢</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{asset.name}</span>
                    {asset.elevatorIdNo && <span style={{ fontSize: 11, fontFamily: "monospace", color: "#9ca3af" }}>#{asset.elevatorIdNo}</span>}
                    <span style={{ fontSize: 12, color: "#6b7280" }}>— {asset.customer.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{assetPlans.length} plan</span>
                </div>
                <div>
                  {assetPlans.map((p, i) => {
                    const days = daysLeft(p.nextDueAt);
                    const isOverdue = days < 0; const isSoon = days >= 0 && days <= 7;
                    const pt = PT[p.planType] ?? PT.PERIODIC;
                    return (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: i < assetPlans.length - 1 ? "1px solid #f3f4f6" : "none", background: isOverdue ? "#fef2f2" : isSoon ? "#fefce8" : "#fff", flexWrap: "wrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: pt.bg, color: pt.color, border: `1px solid ${pt.border}`, borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{pt.icon} {pt.label}</span>
                        {p.name && <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{p.name}</span>}
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>{periodLabel(p.periodDays)}</span>
                        <div style={{ flex: 1 }} />
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isOverdue ? "#b91c1c" : isSoon ? "#b45309" : "#111827" }}>{isOverdue ? `${Math.abs(days)} gün gecikti` : days === 0 ? "Bugün!" : `${days} gün sonra`}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(p.nextDueAt).toLocaleDateString("tr-TR")}</div>
                        </div>
                        {p.monthlyFee > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(p.monthlyFee / 100)}/ay</span>}
                        <button onClick={() => createWorkOrderFromPlan(p)} disabled={woCreating === p.id} style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: woCreating === p.id ? 0.6 : 1 }}>{woCreating === p.id ? "Oluşturuluyor…" : "İş Emri Oluştur →"}</button>
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
