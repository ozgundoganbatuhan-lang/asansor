"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function WOWrapper() { return <Suspense><WOPage /></Suspense>; }

type WO = { id:string;code:string;status:string;type:string;priority?:string|null;createdAt:string;
  customer:{id:string;name:string};technician?:{id:string;name:string}|null;asset?:{id:string;name:string}|null };
type Customer   = { id:string;name:string };
type Technician = { id:string;name:string };
type Asset      = { id:string;name:string;customerId:string };

const TYPE_L:Record<string,string> = {
  FAULT:"Arıza",PERIODIC_MAINTENANCE:"Periyodik bakım",
  ANNUAL_INSPECTION:"Yıllık kontrol",REVISION:"Revizyon",INSTALLATION:"Kurulum"
};
const S_CFG:Record<string,{label:string;bg:string;color:string;border:string;dot:string}> = {
  URGENT:     {label:"Acil",  bg:"#FCECE8",color:"#C0311A",border:"#E8A090",dot:"#C0311A"},
  IN_PROGRESS:{label:"Yolda", bg:"#FFF3DC",color:"#B86800",border:"#F0C060",dot:"#C87800"},
  DONE:       {label:"Tamam", bg:"#E8F5EE",color:"#2E7D4F",border:"#9DCFB0",dot:"#2E7D4F"},
  PENDING:    {label:"Planlı",bg:"#E4EFF9",color:"#0F121A",border:"#90BEE0",dot:"#C87800"},
  CANCELED:   {label:"İptal", bg:"#F0EDE6",color:"#6E6455",border:"#D6D0C4",dot:"#9C9080"},
};
const FILTERS = ["ALL","URGENT","IN_PROGRESS","PENDING","DONE","CANCELED"] as const;
const FL:Record<string,string> = {ALL:"Tümü",URGENT:"Acil",IN_PROGRESS:"Devam",PENDING:"Planlı",DONE:"Bitti",CANCELED:"İptal"};
const F:React.CSSProperties = {width:"100%",height:42,padding:"0 13px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",color:"#1A1510",transition:"border-color .15s"};
const Ic=({d,size=14,stroke="currentColor"}:{d:string;size?:number;stroke?:string})=>(<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>);

function WOPage() {
  const sp = useSearchParams();
  const preCId = sp.get("customerId")??"", preAId = sp.get("assetId")??"";
  const [orders,setOrders]=useState<WO[]>([]);
  const [customers,setCustomers]=useState<Customer[]>([]);
  const [technicians,setTech]=useState<Technician[]>([]);
  const [assets,setAssets]=useState<Asset[]>([]);
  const [loading,setLoading]=useState(true);
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
    if(!wR.ok){setErr("İş emirleri yüklenemedi");setLoading(false);return;}
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
    const s=q.trim().toLowerCase();
    if(s) r=r.filter(o=>[o.code,o.customer?.name,o.asset?.name??"",o.technician?.name??""].join(" ").toLowerCase().includes(s));
    return r;
  },[orders,fs,q]);

  async function create(e:React.FormEvent) {
    e.preventDefault();setErr(null);
    if(!cId){setErr("Lütfen bir müşteri seçin.");return;}
    const res=await fetch("/api/work-orders",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({customerId:cId,technicianId:tId||undefined,assetId:aId||undefined,type,status,priority,note:note||undefined,scheduledAt:sched?new Date(sched).toISOString():undefined})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok) return setErr(data?.error??"Oluşturma başarısız");
    setNote("");setSched("");setShowForm(false);await load();
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.wo-r:hover{background:#f8fafc!important}.wo-r:last-child{border-bottom:none!important}.fi:focus{border-color:#2563eb!important;box-shadow:0 0 0 3px rgba(37,99,235,.12)!important}`}</style>
      {/* Header */}
      <div style={{display:"flex",flexWrap:"wrap",alignItems:"flex-end",justifyContent:"space-between",gap:14}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",color:"#9C9080",marginBottom:6}}>Operasyon</div>
          <h1 style={{fontSize:26,fontWeight:900,letterSpacing:"-0.05em",color:"#1A1510",lineHeight:1.05,margin:0}}>İş Emirleri</h1>
          <p style={{marginTop:6,fontSize:13.5,lineHeight:1.65,color:"#6E6455",maxWidth:540,margin:"6px 0 0"}}>Planla, ata, sahayı görünür kıl. Operasyonun ritmi tek listede.</p>
        </div>
        <button onClick={()=>setShowForm(v=>!v)} style={{display:"inline-flex",alignItems:"center",gap:6,
          background:showForm?"#fff":"#1B1F2B",color:showForm?"#1A1510":"#fff",
          border:showForm?"1.5px solid #e2e8f0":"none",fontSize:13,fontWeight:700,
          padding:"9px 18px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",
          boxShadow:showForm?"none":"0 3px 12px rgba(37,99,235,.28)"}}>
          {showForm?"Formu kapat":<><Ic d="M12 5v14M5 12h14" size={13} stroke="#fff"/>Yeni İş Emri</>}
        </button>
      </div>

      {err&&<div style={{background:"#FCECE8",border:"1px solid #fecaca",color:"#C0311A",padding:"12px 16px",borderRadius:12,fontSize:13}}>{err}</div>}

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        {[{l:"Toplam",v:rows.length,c:"#1A1510",bg:"#F0EDE6"},{l:"Acil",v:counts.URGENT,c:"#dc2626",bg:"#FCECE8"},{l:"Devam Eden",v:counts.IN_PROGRESS,c:"#d97706",bg:"#FFF3DC"},{l:"Tamamlanan",v:counts.DONE,c:"#059669",bg:"#E8F5EE"}].map((k,i)=>(
          <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"18px 20px",boxShadow:"0 2px 8px rgba(15,23,42,.04)"}}>
            <div className="metric-label">{k.l}</div>
            <div style={{fontSize:"2rem",fontWeight:900,letterSpacing:"-0.06em",lineHeight:1,color:k.c}}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm&&(
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"22px 24px",boxShadow:"0 2px 8px rgba(15,23,42,.04)"}}>
          <div style={{fontSize:14,fontWeight:800,color:"#1A1510",marginBottom:18,letterSpacing:"-0.03em"}}>Yeni İş Emri</div>
          <form onSubmit={create}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
              {[
                {l:"Müşteri *",el:<select required value={cId} onChange={e=>{setCId(e.target.value);setAId("");}} className="fi" style={F}><option value="">Seçin</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>},
                {l:"Asansör",el:<select value={aId} onChange={e=>setAId(e.target.value)} className="fi" style={F}><option value="">Seçilmedi</option>{filteredA.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>},
                {l:"Teknisyen",el:<select value={tId} onChange={e=>setTId(e.target.value)} className="fi" style={F}><option value="">Atanmadı</option>{technicians.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>},
                {l:"Tür",el:<select value={type} onChange={e=>setType(e.target.value)} className="fi" style={F}>{Object.entries(TYPE_L).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>},
                {l:"Durum",el:<select value={status} onChange={e=>setStatus(e.target.value)} className="fi" style={F}>{Object.entries(S_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select>},
                {l:"Öncelik",el:<select value={priority} onChange={e=>setPriority(e.target.value)} className="fi" style={F}>{["Normal","Yüksek","Kritik"].map(p=><option key={p} value={p}>{p}</option>)}</select>},
                {l:"Planlanan tarih",el:<input type="datetime-local" value={sched} onChange={e=>setSched(e.target.value)} className="fi" style={F}/>},
              ].map((f,i)=>(
                <div key={i} style={{display:"flex",flexDirection:"column",gap:7}}>
                  <label style={{fontSize:11,fontWeight:700,letterSpacing:"0.06em",color:"#6E6455"}}>{f.l}</label>
                  {f.el}
                </div>
              ))}
            </div>
            <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:7}}>
              <label style={{fontSize:11,fontWeight:700,letterSpacing:"0.06em",color:"#6E6455"}}>Not / açıklama</label>
              <textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} className="fi"
                placeholder="Arıza detayı, yapılacaklar, bina erişim notu..."
                style={{...F,height:"auto",padding:"10px 13px",minHeight:80,resize:"vertical"}}/>
            </div>
            {cId&&filteredA.length===0&&<div style={{marginTop:12,background:"#FFF3DC",border:"1px solid #fcd34d",borderRadius:10,padding:"10px 14px",fontSize:12.5,color:"#92400e"}}>
              Bu müşteriye ait asansör görünmüyor. <Link href={`/app/customers/${cId}`} style={{fontWeight:700,textDecoration:"underline",color:"#92400e"}}>Detaya gidip kayıt ekleyin.</Link>
            </div>}
            <div style={{display:"flex",gap:8,marginTop:18,flexWrap:"wrap"}}>
              <button type="submit" style={{background:"#1B1F2B",color:"#fff",fontSize:13,fontWeight:700,padding:"10px 22px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",boxShadow:"0 3px 12px rgba(37,99,235,.28)"}}>İş Emrini Oluştur</button>
              <button type="button" onClick={()=>setShowForm(false)} style={{background:"#fff",color:"#1A1510",fontSize:13,fontWeight:600,padding:"10px 20px",borderRadius:10,border:"1.5px solid #e2e8f0",cursor:"pointer",fontFamily:"inherit"}}>İptal</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters + Search */}
      <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {FILTERS.map(f=>(
            <button key={f} onClick={()=>setFS(f)} style={{padding:"7px 14px",borderRadius:999,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
              background:fs===f?"#1A1510":"#fff",color:fs===f?"#fff":"#6E6455",
              border:`1.5px solid ${fs===f?"#1A1510":"#D6D0C4"}`,transition:"all .12s"}}>
              {FL[f]}{counts[f]>0&&<span style={{marginLeft:5,opacity:.55}}>{counts[f]}</span>}
            </button>
          ))}
        </div>
        <div style={{position:"relative"}}>
          <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#9C9080"}}>
            <Ic d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </div>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Kod, müşteri, asansör veya teknisyen..." className="fi"
            style={{...F,width:300,paddingLeft:36}}/>
        </div>
      </div>

      {/* List */}
      {loading?(
        <div style={{minHeight:200,display:"flex",alignItems:"center",justifyContent:"center",gap:12,color:"#6E6455"}}>
          <div style={{width:28,height:28,border:"3px solid #e2e8f0",borderTopColor:"#1B1F2B",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>Yükleniyor...
        </div>
      ):rows.length===0?(
        <div style={{background:"#fff",border:"1.5px dashed #e2e8f0",borderRadius:16,padding:44,textAlign:"center"}}>
          <div style={{fontSize:42,marginBottom:12}}>📋</div>
          <div style={{fontSize:15,fontWeight:800,color:"#1A1510",marginBottom:6}}>{q||fs!=="ALL"?"Eşleşen iş emri bulunamadı":"Henüz iş emri yok"}</div>
          <div style={{fontSize:13,color:"#6E6455"}}>{q||fs!=="ALL"?"Farklı filtre veya arama deneyin.":"İlk iş emrini oluşturarak başlayın."}</div>
        </div>
      ):(
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 8px rgba(15,23,42,.04)"}}>
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr 160px 90px 100px",alignItems:"center",gap:0,padding:"11px 22px",background:"#F0EDE6",borderBottom:"1px solid #f1f5f9"}}>
            {["","İş Emri","Teknisyen","Tarih","Durum"].map((h,i)=>(
              <div key={i} style={{fontSize:10.5,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"#9C9080"}}>{h}</div>
            ))}
          </div>
          {rows.map((o,idx)=>{
            const sc=S_CFG[o.status]??S_CFG.PENDING;
            return (
              <Link key={o.id} href={`/app/work-orders/${o.id}`} className="wo-r" style={{
                display:"grid",gridTemplateColumns:"auto 1fr 160px 90px 100px",alignItems:"center",
                padding:"12px 22px",borderBottom:idx<rows.length-1?"1px solid #f1f5f9":"none",
                textDecoration:"none",color:"inherit",transition:"all .12s"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:sc.dot,marginRight:16,flexShrink:0,boxShadow:`0 0 0 3px ${sc.bg}`}}/>
                <div style={{minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                    <span style={{fontFamily:"ui-monospace,monospace",fontSize:11.5,fontWeight:700,color:"#1B1F2B",flexShrink:0}}>{o.code}</span>
                    <span style={{fontSize:13.5,fontWeight:700,color:"#1A1510",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.asset?.name??"Asansör atanmadı"}</span>
                  </div>
                  <div style={{fontSize:11.5,color:"#6E6455"}}>{o.customer.name} · {TYPE_L[o.type]??o.type}</div>
                </div>
                <div style={{fontSize:12.5,color:o.technician?"#334155":"#9C9080",fontWeight:o.technician?600:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.technician?.name??"Atanmadı"}</div>
                <div style={{fontSize:11.5,color:"#9C9080"}}>{new Date(o.createdAt).toLocaleDateString("tr-TR",{day:"2-digit",month:"2-digit"})}</div>
                <span className="badge" style={{background:sc.bg,color:sc.color,borderColor:sc.border}}>{sc.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
