"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Asset = {
  id: string; name: string; buildingName?: string | null;
  elevatorIdNo?: string | null; locationNote?: string | null;
  riskScore?: number | null; inspectionLabel?: string | null;
  nextInspectionAt?: string | null; lastInspectionAt?: string | null;
  customer: { id: string; name: string };
};
type Customer = { id: string; name: string };

const LABEL_CFG: Record<string, { label: string; bg: string; border: string; text: string; dot: string; desc: string }> = {
  YESIL:   { label: "Yeşil",   bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46", dot: "#059669", desc: "Kusursuz" },
  MAVI:    { label: "Mavi",    bg: "#E4EFF9", border: "#90BEE0", text: "#1A4F80", dot: "#1A5C96", desc: "Hafif kusurlu" },
  SARI:    { label: "Sarı",    bg: "#FFF3DC", border: "#F0C060", text: "#92400e", dot: "#d97706", desc: "Kusurlu" },
  KIRMIZI: { label: "Kırmızı", bg: "#FCECE8", border: "#fca5a5", text: "#991b1b", dot: "#dc2626", desc: "GÜVENSİZ" },
};

const emptyForm = { customerId: "", name: "", buildingName: "", elevatorIdNo: "", locationNote: "", riskScore: "0" };

function LabelBadge({ label }: { label?: string | null }) {
  const cfg = label ? LABEL_CFG[label] : null;
  if (!cfg) return <span style={{ fontSize: 11, color: "#9C9080", fontStyle: "italic" }}>Kontrol kaydı yok</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label} Etiket
    </span>
  );
}

function Countdown({ nextAt }: { nextAt?: string | null }) {
  if (!nextAt) return null;
  const days = Math.ceil((new Date(nextAt).getTime() - Date.now()) / 86400000);
  if (days < 0)  return <span style={{ fontSize: 11.5, fontWeight: 700, color: "#C0311A" }}>Kontrol {Math.abs(days)} gün gecikti</span>;
  if (days <=30) return <span style={{ fontSize: 11.5, fontWeight: 700, color: "#B86800" }}>Kontrole {days} gün</span>;
  if (days <=90) return <span style={{ fontSize: 11.5, fontWeight: 600, color: "#6E6455" }}>Kontrole {days} gün</span>;
  return <span style={{ fontSize: 11, color: "#9C9080" }}>{new Date(nextAt).toLocaleDateString("tr-TR")}</span>;
}

export default function AssetsPage() {
  const [assets, setAssets]       = useState<Asset[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery]         = useState("");
  const [labelFilter, setLabelFilter] = useState("ALL");
  const [form, setForm]           = useState(emptyForm);
  const [error, setError]         = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [showForm, setShowForm]   = useState(false);

  async function load() {
    const [aR, cR] = await Promise.all([fetch("/api/assets"), fetch("/api/customers")]);
    const [a, c]   = await Promise.all([aR.json(), cR.json()]);
    setAssets(a.items ?? []);
    setCustomers(c.items ?? []);
  }
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    let list = assets.filter(a => `${a.name} ${a.buildingName ?? ""} ${a.customer.name}`.toLowerCase().includes(query.toLowerCase()));
    if (labelFilter !== "ALL") list = list.filter(a => (a.inspectionLabel ?? "YOK") === labelFilter);
    return list;
  }, [assets, query, labelFilter]);

  const riskyCount   = assets.filter(a => (a.riskScore ?? 0) >= 70).length;
  const overdueCount = assets.filter(a => a.nextInspectionAt && new Date(a.nextInspectionAt) < new Date()).length;
  const redCount     = assets.filter(a => a.inspectionLabel === "KIRMIZI").length;
  const yellowCount  = assets.filter(a => a.inspectionLabel === "SARI").length;
  const noLabelCount = assets.filter(a => !a.inspectionLabel).length;

  async function submit() {
    setSaving(true); setError(null);
    const res = await fetch("/api/assets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, riskScore: Number(form.riskScore) }) });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setError(d.error ?? "Asansör oluşturulamadı."); return; }
    setForm(emptyForm); setShowForm(false); await load();
  }

  const filterButtons = [
    { key: "ALL",     label: "Tümü",       count: assets.length },
    { key: "YESIL",   label: "Yeşil",   count: assets.filter(a => a.inspectionLabel === "YESIL").length },
    { key: "MAVI",    label: "Mavi",    count: assets.filter(a => a.inspectionLabel === "MAVI").length },
    { key: "SARI",    label: "Sarı",    count: yellowCount },
    { key: "KIRMIZI", label: "Kırmızı", count: redCount },
    { key: "YOK",     label: "Kontrol kaydı yok", count: noLabelCount },
  ];

  const DOT: Record<string,string> = { YESIL:"#2E7D4F", MAVI:"#1A5C96", SARI:"#C87800", KIRMIZI:"#C0311A", YOK:"#B8B0A0" };
  const FIELDS: {k:string;l:string;ph?:string;type?:string;sel?:boolean;req?:boolean}[] = [
    { k:"customerId", l:"Müşteri *", sel:true, req:true },
    { k:"name", l:"Asansör adı *", ph:"A Blok yolcu asansörü", req:true },
    { k:"buildingName", l:"Bina / blok", ph:"A Blok" },
    { k:"elevatorIdNo", l:"Asansör kimlik no", ph:"Tescil / seri no" },
    { k:"locationNote", l:"Konum notu", ph:"Giriş katı, sağda" },
  ];
  return (
    <div className="pg">
      <div className="ph">
        <div>
          <div className="ph-eyebrow">Portföy</div>
          <h1 className="ph-title">Asansörler</h1>
          <p className="ph-sub">Her asansörün muayene etiketi, kontrol tarihi ve QR etiketi burada.</p>
        </div>
        <div className="ph-actions">
          <button className={`b ${showForm?"b-line":"b-ink"}`} onClick={()=>setShowForm(v=>!v)}>{showForm?"Formu kapat":<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>Yeni asansör</>}</button>
        </div>
      </div>

      <div className="kpis stagger">
        <div className="kpi"><span>Asansör</span><b>{assets.length}</b></div>
        <div className="kpi"><span>Kırmızı etiket</span><b style={{color:redCount?"#C0311A":undefined}}>{redCount}</b></div>
        <div className="kpi"><span>Kontrolü geçen</span><b style={{color:overdueCount?"#B86800":undefined}}>{overdueCount}</b></div>
        <div className="kpi"><span>Yüksek risk</span><b style={{color:riskyCount?"#B86800":undefined}}>{riskyCount}</b></div>
      </div>

      {redCount>0&&<div className="alert" role="alert">{redCount} asansör kırmızı (güvensiz) etiketli. Kullanıma kapatılması ve düzeltilmesi gerekiyor.</div>}
      {error&&<div className="alert" role="alert">{error}</div>}

      {showForm&&(
        <form onSubmit={e=>{e.preventDefault();void submit();}} className="card2 reveal" style={{padding:"16px 18px",display:"grid",gap:12}}>
          <div style={{fontSize:14,fontWeight:750,letterSpacing:"-.02em"}}>Yeni asansör</div>
          <div className="fgrid">
            {FIELDS.map(f=>(
              <label key={f.k} className="fl">{f.l}
                {f.sel
                  ? <select className="inp" required value={(form as any)[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}><option value="">Seçin</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
                  : <input className="inp" required={f.req} placeholder={f.ph} value={(form as any)[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/>}
              </label>
            ))}
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button type="submit" className="b b-ink" disabled={saving||!form.customerId||!form.name.trim()}>{saving?"Kaydediliyor…":"Asansörü kaydet"}</button>
            <button type="button" className="b b-line" onClick={()=>setShowForm(false)}>Vazgeç</button>
          </div>
          <p style={{margin:0,fontSize:12,color:"var(--muted)"}}>Kaydettiğinizde QR etiketi otomatik oluşur; asansör sayfasından yazdırabilirsiniz.</p>
        </form>
      )}

      <div className="bar">
        <div className="chips" role="tablist" aria-label="Etikete göre süz">
          {filterButtons.map(b=>(
            <button key={b.key} role="tab" aria-selected={labelFilter===b.key} className={`chipb${labelFilter===b.key?" on":""}`} onClick={()=>setLabelFilter(b.key)}>
              {b.key!=="ALL"&&<span className="sdot" style={{display:"inline-block",width:7,height:7,marginRight:6,background:DOT[b.key]}}/>}{b.label}{b.count>0&&<em>{b.count}</em>}
            </button>
          ))}
        </div>
        <label className="srch">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 21l-5-5m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Asansör, bina ya da müşteri" aria-label="Asansör ara"/>
        </label>
      </div>

      {filtered.length===0?(
        <div className="empty2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="2" width="14" height="20" rx="1.5"/><path d="M12 2v20"/></svg>
          <b>{query||labelFilter!=="ALL"?"Eşleşen asansör yok":"Henüz asansör yok"}</b>
          <p>{query||labelFilter!=="ALL"?"Farklı bir filtre deneyin.":"İlk asansörü ekleyin; QR etiketi kendiliğinden hazırlanır."}</p>
          {!query&&labelFilter==="ALL"&&<button className="b b-ink" style={{marginTop:8}} onClick={()=>setShowForm(true)}>Yeni asansör</button>}
        </div>
      ):(
        <div className="as-grid">
          {filtered.map((a,i)=>{
            const key=a.inspectionLabel??"YOK";
            return (
              <Link key={a.id} href={`/app/assets/${a.id}`} className="as-card lift" style={{["--c" as string]:DOT[key]??DOT.YOK,animationDelay:`${Math.min(i,12)*30}ms`}}>
                <div className="as-top">
                  <span className="as-ic" aria-hidden><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="1.5"/><path d="M12 2v20M8.5 8l1.5-1.5L11.5 8M12.5 16l1.5 1.5 1.5-1.5"/></svg></span>
                  <div className="lt-main"><b>{a.name}</b><small>{[a.buildingName,a.customer.name].filter(Boolean).join(" · ")}</small></div>
                </div>
                <div className="as-foot">
                  <LabelBadge label={a.inspectionLabel}/>
                  <Countdown nextAt={a.nextInspectionAt}/>
                </div>
                {a.elevatorIdNo&&<span className="code">{a.elevatorIdNo}</span>}
              </Link>
            );
          })}
        </div>
      )}
      <style>{`
        .as-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
        .as-card{position:relative;display:grid;gap:10px;padding:14px;border-radius:14px;background:var(--surface);border:1px solid var(--border);color:inherit;overflow:hidden;animation:fadeUp .4s var(--ease-out) both}
        .as-card::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:var(--c)}
        .as-top{display:flex;gap:10px;align-items:center;min-width:0}
        .as-ic{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex-shrink:0;background:var(--surface-2);color:var(--foreground-2)}
        .as-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
      `}</style>
    </div>
  );
}
