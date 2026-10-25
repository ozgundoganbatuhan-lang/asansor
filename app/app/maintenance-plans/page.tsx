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
  PERIODIC:          { label: "Aylık bakım",    icon: "", bg: "#E4EFF9", color: "#1A4F80", border: "#90BEE0" },
  ANNUAL_INSPECTION: { label: "Yıllık muayene",     icon: "", bg: "#F0EDE6", color: "#1A5C96", border: "#ddd6fe" },
  CUSTOM:            { label: "Özel bakım",          icon: "", bg: "#F5F2EC", color: "#6b7280", border: "#e5e7eb" },
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

  const sorted = [...plans].sort((a, b) => +new Date(a.nextDueAt) - +new Date(b.nextDueAt));
  const COLS = "10px minmax(0,1.4fr) 110px 110px 150px";
  return (
    <div className="pg">
      <div className="ph">
        <div>
          <div className="ph-eyebrow">Saha</div>
          <h1 className="ph-title">Bakım planı</h1>
          <p className="ph-sub">Her asansörün bakım periyodu ve sıradaki bakım günü. Geciken bakımdan tek dokunuşla iş emri açın.</p>
        </div>
        <div className="ph-actions">
          <OnboardingBeacon forStep={4} label="Bakım planı oluşturun">
            <button data-tour="new-plan-btn" className={`b ${showForm?"b-line":"b-ink"}`} onClick={()=>setShowForm(!showForm)}>{showForm?"Formu kapat":"Yeni plan"}</button>
          </OnboardingBeacon>
        </div>
      </div>

      {err&&<div className="alert" role="alert">{err}</div>}

      <div className="kpis stagger">
        <div className="kpi"><span>Plan</span><b>{plans.length}</b></div>
        <div className="kpi"><span>Geciken</span><b style={{color:overdue.length?"#C0311A":undefined}}>{overdue.length}</b></div>
        <div className="kpi"><span>Bu hafta</span><b style={{color:thisWeek.length?"#B86800":undefined}}>{thisWeek.length}</b></div>
        <div className="kpi"><span>Asansör</span><b>{byAsset.size}</b></div>
      </div>

      {showForm&&(
        <form onSubmit={create} className="card2 reveal" style={{padding:"16px 18px",display:"grid",gap:12}}>
          <div style={{fontSize:14,fontWeight:750,letterSpacing:"-.02em"}}>Yeni bakım planı</div>
          <div className="fgrid">
            <label className="fl">Asansör *
              <select required className="inp" value={fAsset} onChange={e=>setFAsset(e.target.value)}><option value="">Seçin</option>{assets.map(a=><option key={a.id} value={a.id}>{a.name} · {a.customer.name}</option>)}</select></label>
            <label className="fl">Plan türü
              <select className="inp" value={fType} onChange={e=>setFType(e.target.value)}>{Object.entries(PT).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></label>
            <label className="fl">Periyot
              <select className="inp" value={fPeriodPreset} onChange={e=>setFPeriodPreset(e.target.value)}>{[["15","15 günde bir"],["30","Aylık"],["60","2 ayda bir"],["90","3 ayda bir"],["180","6 ayda bir"],["365","Yıllık"],["custom","Özel"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
            {fPeriodPreset==="custom"&&<label className="fl">Kaç günde bir
              <input className="inp" type="number" min={1} value={fPeriodCustom} onChange={e=>setFPeriodCustom(e.target.value)} placeholder="45"/></label>}
            <label className="fl">Sıradaki bakım
              <input className="inp" type="date" value={fNext} onChange={e=>setFNext(e.target.value)}/></label>
            <label className="fl">Aylık ücret (₺)
              <input className="inp" type="number" min={0} value={fFee} onChange={e=>setFFee(e.target.value)} placeholder="1500"/></label>
            <label className="fl">Sözleşme
              <select className="inp" value={fContract} onChange={e=>setFContract(e.target.value)}><option value="">Bağlı değil</option>{contracts.map(c=><option key={c.id} value={c.id}>{c.contractNumber??"Sözleşme"} · {c.customer.name}</option>)}</select></label>
            <label className="fl">Plan adı
              <input className="inp" value={fName} onChange={e=>setFName(e.target.value)} placeholder="İsteğe bağlı"/></label>
          </div>
          <label className="fl">Not<textarea className="inp" rows={2} value={fNotes} onChange={e=>setFNotes(e.target.value)} placeholder="Bina giriş saati, anahtar kimde…"/></label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button type="submit" className="b b-ink" disabled={creating||!fAsset}>{creating?"Kaydediliyor…":"Planı kaydet"}</button>
            <button type="button" className="b b-line" onClick={()=>setShowForm(false)}>Vazgeç</button>
          </div>
        </form>
      )}

      {loading?(
        <div className="lt">{[0,1,2].map(i=><div key={i} style={{padding:"12px 16px"}}><div className="skel" style={{height:30}}/></div>)}</div>
      ):sorted.length===0?(
        <div className="empty2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"/></svg>
          <b>Henüz bakım planı yok</b>
          <p>Asansör için periyot seçin; bakım günleri takvime kendiliğinden dağılır.</p>
          <button className="b b-ink" style={{marginTop:8}} onClick={()=>setShowForm(true)}>Yeni plan</button>
        </div>
      ):(
        <div className="lt" style={{["--cols" as string]:COLS}}>
          <div className="lt-head"><span/><span>Asansör</span><span>Periyot</span><span>Sıradaki</span><span/></div>
          {sorted.map((p,i)=>{
            const d=daysLeft(p.nextDueAt);
            const tone=d<0?{bg:"#FCECE8",c:"#A8301A",dot:"#C0311A",t:`${Math.abs(d)} gün gecikti`}:d<=7?{bg:"#FFF3DC",c:"#8A5500",dot:"#C87800",t:d===0?"Bugün":`${d} gün kaldı`}:{bg:"#E8F5EE",c:"#226440",dot:"#2E7D4F",t:`${d} gün kaldı`};
            return (
              <div key={p.id} className="lt-row mp-row" style={{animationDelay:`${Math.min(i,10)*25}ms`}}>
                <span className="lt-dot sdot" style={{background:tone.dot}}/>
                <div className="lt-main"><b>{p.asset.name}</b><small>{p.asset.customer.name} · {(PT[p.planType]??PT.CUSTOM).label}</small></div>
                <div className="lt-cell">{periodLabel(p.periodDays)}</div>
                <div className="lt-cell"><span className="st" style={{background:tone.bg,color:tone.c}}>{tone.t}</span></div>
                <span className="lt-st"><button className={`b b-sm ${d<=7?"b-ink":"b-line"}`} disabled={woCreating===p.id} onClick={()=>createWorkOrderFromPlan(p)}>{woCreating===p.id?"Açılıyor…":"İş emri aç"}</button></span>
                <div className="lt-meta"><span className="st" style={{background:tone.bg,color:tone.c,marginRight:8}}>{tone.t}</span>{periodLabel(p.periodDays)} · {new Date(p.nextDueAt).toLocaleDateString("tr-TR",{day:"numeric",month:"short"})}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
