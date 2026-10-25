"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function WOWrapper() { return <Suspense><WOPage /></Suspense>; }

type WO = { id:string;code:string;status:string;type:string;priority?:string|null;createdAt:string;scheduledAt?:string|null;
  customer:{id:string;name:string};technician?:{id:string;name:string}|null;asset?:{id:string;name:string}|null };
type Customer   = { id:string;name:string };
type Technician = { id:string;name:string };
type Asset      = { id:string;name:string;customerId:string };

const TYPE_L:Record<string,string> = {
  FAULT:"Arıza",PERIODIC_MAINTENANCE:"Aylık bakım",
  ANNUAL_INSPECTION:"Yıllık kontrol",REVISION:"Revizyon",INSTALLATION:"Kurulum"
};
const S_CFG:Record<string,{label:string;bg:string;color:string;dot:string}> = {
  URGENT:     {label:"Acil",       bg:"#FCECE8",color:"#A8301A",dot:"#C0311A"},
  IN_PROGRESS:{label:"Sahada",     bg:"#FFF3DC",color:"#8A5500",dot:"#C87800"},
  PENDING:    {label:"Planlı",     bg:"#E4EFF9",color:"#1A4F80",dot:"#1A5C96"},
  DONE:       {label:"Tamamlandı", bg:"#E8F5EE",color:"#226440",dot:"#2E7D4F"},
  CANCELED:   {label:"İptal",      bg:"#F0EDE6",color:"#6E6455",dot:"#9C9080"},
};
const FILTERS = ["ALL","URGENT","IN_PROGRESS","PENDING","DONE","CANCELED"] as const;
const FL:Record<string,string> = {ALL:"Tümü",URGENT:"Acil",IN_PROGRESS:"Sahada",PENDING:"Planlı",DONE:"Tamamlandı",CANCELED:"İptal"};
const COLS = "10px minmax(0,1fr) 150px 70px 96px";
const Ic=({d,size=14}:{d:string;size?:number})=>(<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d}/></svg>);
const day = (s:string) => new Date(s).toLocaleDateString("tr-TR",{day:"2-digit",month:"short"});

function WOPage() {
  const sp = useSearchParams();
  const preCId = sp.get("customerId")??"", preAId = sp.get("assetId")??"";
  const [orders,setOrders]=useState<WO[]>([]);
  const [customers,setCustomers]=useState<Customer[]>([]);
  const [technicians,setTech]=useState<Technician[]>([]);
  const [assets,setAssets]=useState<Asset[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState<string|null>(null);
  const [fs,setFS]=useState<typeof FILTERS[number]>("ALL");
  const [q,setQ]=useState("");
  const [showForm,setShowForm]=useState(!!preCId);
  const [cId,setCId]=useState(preCId);
  const [tId,setTId]=useState("");
  const [aId,setAId]=useState(preAId);
  const [type,setType]=useState("FAULT");
  const [status,setStatus]=useState("PENDING");
  const [priority,setPriority]=useState("Normal");
  const [note,setNote]=useState("");
  const [sched,setSched]=useState("");

  async function load() {
    setLoading(true); setErr(null);
    const [wR,cR,tR,aR]=await Promise.all([fetch("/api/work-orders"),fetch("/api/customers"),fetch("/api/technicians"),fetch("/api/assets")]);
    if(!wR.ok){setErr("İş emirleri yüklenemedi. Sayfayı yenileyin.");setLoading(false);return;}
    const [w,c,t,a]=await Promise.all([wR.json(),cR.json(),tR.json(),aR.json()]);
    setOrders(w.items??[]);setCustomers(c.items??[]);setTech(t.items??[]);setAssets(a.items??[]);
    if(!cId&&!preCId&&c.items?.[0]) setCId(c.items[0].id);
    setLoading(false);
  }
  useEffect(()=>{void load();},[]);// eslint-disable-line

  const filteredA=useMemo(()=>assets.filter(a=>!cId||a.customerId===cId),[assets,cId]);
  const counts=useMemo(()=>{const m:Record<string,number>={ALL:orders.length};FILTERS.slice(1).forEach(s=>{m[s]=orders.filter(o=>o.status===s).length;});return m;},[orders]);
  const rows=useMemo(()=>{
    let r=fs==="ALL"?orders:orders.filter(o=>o.status===fs);
    const s=q.trim().toLocaleLowerCase("tr");
    if(s) r=r.filter(o=>[o.code,o.customer?.name,o.asset?.name??"",o.technician?.name??""].join(" ").toLocaleLowerCase("tr").includes(s));
    return r;
  },[orders,fs,q]);

  async function create(e:React.FormEvent) {
    e.preventDefault();setErr(null);
    if(!cId){setErr("Önce bir müşteri seçin.");return;}
    setSaving(true);
    const res=await fetch("/api/work-orders",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({customerId:cId,technicianId:tId||undefined,assetId:aId||undefined,type,status,priority,note:note||undefined,scheduledAt:sched?new Date(sched).toISOString():undefined})});
    const data=await res.json().catch(()=>({}));
    setSaving(false);
    if(!res.ok) return setErr(data?.error??"İş emri oluşturulamadı. Bilgileri kontrol edip tekrar deneyin.");
    setNote("");setSched("");setShowForm(false);await load();
  }

  return (
    <div className="pg">
      <div className="ph">
        <div>
          <div className="ph-eyebrow">Operasyon</div>
          <h1 className="ph-title">İş emirleri</h1>
          <p className="ph-sub">Arızaları ve bakımları kaydedin, teknisyene atayın, durumunu buradan izleyin.</p>
        </div>
        <div className="ph-actions">
          <button className={`b ${showForm?"b-line":"b-ink"}`} onClick={()=>setShowForm(v=>!v)}>
            {showForm?"Formu kapat":<><Ic d="M12 5v14M5 12h14" size={14}/>Yeni iş emri</>}
          </button>
        </div>
      </div>

      {err&&<div className="alert" role="alert">{err}</div>}

      <div className="kpis stagger">
        <div className="kpi"><span>Açık</span><b>{counts.URGENT+counts.IN_PROGRESS+counts.PENDING}</b></div>
        <div className="kpi"><span>Acil</span><b style={{color:"#C0311A"}}>{counts.URGENT}</b></div>
        <div className="kpi"><span>Sahada</span><b style={{color:"#B86800"}}>{counts.IN_PROGRESS}</b></div>
        <div className="kpi"><span>Tamamlanan</span><b style={{color:"#2E7D4F"}}>{counts.DONE}</b></div>
      </div>

      {showForm&&(
        <form onSubmit={create} className="card2 reveal" style={{padding:"16px 18px",display:"grid",gap:12}}>
          <div style={{fontSize:14,fontWeight:750,letterSpacing:"-.02em"}}>Yeni iş emri</div>
          <div className="fgrid">
            <label className="fl">Müşteri *
              <select required value={cId} onChange={e=>{setCId(e.target.value);setAId("");}} className="inp"><option value="">Seçin</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="fl">Asansör
              <select value={aId} onChange={e=>setAId(e.target.value)} className="inp"><option value="">Seçilmedi</option>{filteredA.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
            <label className="fl">Teknisyen
              <select value={tId} onChange={e=>setTId(e.target.value)} className="inp"><option value="">Atanmadı</option>{technicians.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
            <label className="fl">İş türü
              <select value={type} onChange={e=>setType(e.target.value)} className="inp">{Object.entries(TYPE_L).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
            <label className="fl">Durum
              <select value={status} onChange={e=>setStatus(e.target.value)} className="inp">{Object.entries(S_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></label>
            <label className="fl">Öncelik
              <select value={priority} onChange={e=>setPriority(e.target.value)} className="inp">{["Normal","Yüksek","Kritik"].map(p=><option key={p} value={p}>{p}</option>)}</select></label>
            <label className="fl">Planlanan tarih
              <input type="datetime-local" value={sched} onChange={e=>setSched(e.target.value)} className="inp"/></label>
          </div>
          <label className="fl">Not
            <textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} className="inp" placeholder="Arıza ayrıntısı, kat, bina giriş notu…"/></label>
          {cId&&filteredA.length===0&&<div style={{background:"#FFF3DC",borderRadius:9,padding:"9px 12px",fontSize:12.5,color:"#7a4a00"}}>
            Bu müşterinin kayıtlı asansörü yok. <Link href={`/app/customers/${cId}`} style={{fontWeight:700,textDecoration:"underline"}}>Müşteri sayfasından ekleyin.</Link>
          </div>}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button type="submit" className="b b-ink" disabled={saving}>{saving?"Kaydediliyor…":"İş emrini oluştur"}</button>
            <button type="button" className="b b-line" onClick={()=>setShowForm(false)}>Vazgeç</button>
          </div>
        </form>
      )}

      <div className="bar">
        <div className="chips" role="tablist" aria-label="Duruma göre süz">
          {FILTERS.map(f=>(
            <button key={f} role="tab" aria-selected={fs===f} onClick={()=>setFS(f)} className={`chipb${fs===f?" on":""}`}>
              {FL[f]}{counts[f]>0&&<em>{counts[f]}</em>}
            </button>
          ))}
        </div>
        <label className="srch">
          <Ic d="M21 21l-5-5m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Kod, müşteri, asansör, teknisyen" aria-label="İş emri ara"/>
        </label>
      </div>

      {loading?(
        <div className="lt">{[0,1,2,3].map(i=><div key={i} style={{padding:"12px 16px"}}><div className="skel" style={{height:30}}/></div>)}</div>
      ):rows.length===0?(
        <div className="empty2">
          <Ic d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4" size={28}/>
          <b>{q||fs!=="ALL"?"Eşleşen iş emri yok":"Henüz iş emri yok"}</b>
          <p>{q||fs!=="ALL"?"Farklı bir filtre ya da arama deneyin.":"İlk arıza ya da bakım kaydını oluşturun; teknisyen telefonunda görsün."}</p>
          {!q&&fs==="ALL"&&<button className="b b-ink" style={{marginTop:8}} onClick={()=>setShowForm(true)}>Yeni iş emri</button>}
        </div>
      ):(
        <div className="lt" style={{["--cols" as string]:COLS}}>
          <div className="lt-head"><span/><span>İş emri</span><span>Teknisyen</span><span>Tarih</span><span>Durum</span></div>
          {rows.map((o,idx)=>{
            const sc=S_CFG[o.status]??S_CFG.PENDING;
            return (
              <Link key={o.id} href={`/app/work-orders/${o.id}`} className="lt-row" style={{animationDelay:`${Math.min(idx,10)*25}ms`}}>
                <span className="lt-dot sdot" style={{background:sc.dot}}/>
                <div className="lt-main">
                  <b><span className="code" style={{marginRight:8}}>{o.code}</span>{o.asset?.name??"Asansör seçilmedi"}</b>
                  <small>{o.customer.name} · {TYPE_L[o.type]??o.type}</small>
                </div>
                <div className={`lt-cell${o.technician?"":" mute"}`}>{o.technician?.name??"Atanmadı"}</div>
                <div className="lt-cell mute">{day(o.scheduledAt??o.createdAt)}</div>
                <span className="lt-st st" style={{background:sc.bg,color:sc.color}}>{sc.label}</span>
                <div className="lt-meta">{o.technician?.name??"Teknisyen atanmadı"} · {day(o.scheduledAt??o.createdAt)}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
