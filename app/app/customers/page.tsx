"use client";
import { PlaceAutocomplete } from "@/components/PlaceAutocomplete";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Customer = { id:string;name:string;contactName?:string|null;phone?:string|null;email?:string|null;address?:string|null;_count:{assets:number;workOrders:number} };
const Ic=({d,size=15,stroke="currentColor"}:{d:string;size?:number;stroke?:string})=>(<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>);
const F:React.CSSProperties={width:"100%",height:42,padding:"0 13px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",color:"#1A1510",transition:"border-color .15s"};

export default function CustomersPage() {
  const [customers,setCustomers]=useState<Customer[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [q,setQ]=useState("");
  const [showForm,setShowForm]=useState(false);
  const [name,setName]=useState(""),[contactName,setContactName]=useState(""),
    [phone,setPhone]=useState(""),[ email,setEmail]=useState(""),
    [address,setAddress]=useState(""),
    [lat,setLat]=useState<number|undefined>(undefined),
    [lng,setLng]=useState<number|undefined>(undefined),
    [saving,setSaving]=useState(false);

  async function load(){setLoading(true);try{const r=await fetch("/api/customers");const d=await r.json();if(d.error)setError(d.error);else setCustomers(d.items??[]);}catch(e:any){setError(e.message);}setLoading(false);}
  useEffect(()=>{void load();},[]);

  const filtered=useMemo(()=>customers.filter(c=>!q||[c.name,c.contactName??"",c.phone??"",c.email??""].join(" ").toLowerCase().includes(q.toLowerCase())),[customers,q]);
  const totalA=filtered.reduce((s,c)=>s+c._count.assets,0);
  const totalW=filtered.reduce((s,c)=>s+c._count.workOrders,0);

  async function submit(e:React.FormEvent){e.preventDefault();setError(null);setSaving(true);
    const res=await fetch("/api/customers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,contactName:contactName||undefined,phone:phone||undefined,email:email||undefined,address:address||undefined,latitude:lat,longitude:lng})});
    const d=await res.json().catch(()=>({}));setSaving(false);
    if(!res.ok){setError(d.error??"Müşteri oluşturulamadı");return;}
    setName("");setContactName("");setPhone("");setEmail("");setAddress("");setLat(undefined);setLng(undefined);setShowForm(false);await load();}

  const COLS="minmax(0,1.3fr) minmax(0,1fr) 70px 70px";
  return (
    <div className="pg">
      <div className="ph">
        <div>
          <div className="ph-eyebrow">Portföy</div>
          <h1 className="ph-title">Müşteriler</h1>
          <p className="ph-sub">Bakımını yaptığınız binalar, siteler ve yönetimler.</p>
        </div>
        <div className="ph-actions">
          <Link href="/app/customers/import" className="b b-line">Excel'den aktar</Link>
          <button className={`b ${showForm?"b-line":"b-ink"}`} onClick={()=>setShowForm(v=>!v)}>{showForm?"Formu kapat":<><Ic d="M12 5v14M5 12h14" size={14}/>Yeni müşteri</>}</button>
        </div>
      </div>

      <div className="kpis stagger">
        <div className="kpi"><span>Müşteri</span><b>{customers.length}</b></div>
        <div className="kpi"><span>Asansör</span><b>{totalA}</b></div>
        <div className="kpi"><span>İş emri</span><b>{totalW}</b></div>
        <div className="kpi"><span>Asansörsüz</span><b style={{color:customers.some(c=>c._count.assets===0)?"#B86800":undefined}}>{customers.filter(c=>c._count.assets===0).length}</b></div>
      </div>

      {error&&<div className="alert" role="alert">{error}</div>}

      {showForm&&(
        <form onSubmit={submit} className="card2 reveal" style={{padding:"16px 18px",display:"grid",gap:12}}>
          <div style={{fontSize:14,fontWeight:750,letterSpacing:"-.02em"}}>Yeni müşteri</div>
          <div className="fgrid">
            {([
              {l:"Bina / firma adı *",v:name,set:setName,t:"text",ph:"Gül Apartmanı Yönetimi",req:true},
              {l:"Yetkili kişi",v:contactName,set:setContactName,t:"text",ph:"Ali Yılmaz"},
              {l:"Telefon",v:phone,set:setPhone,t:"tel",ph:"05XX XXX XX XX"},
              {l:"E-posta",v:email,set:setEmail,t:"email",ph:"yonetim@ornek.com"},
            ] as {l:string;v:string;set:(v:string)=>void;t:string;ph:string;req?:boolean}[]).map((fi,i)=>(
              <label key={i} className="fl">{fi.l}<input className="inp" value={fi.v} onChange={e=>fi.set(e.target.value)} type={fi.t} placeholder={fi.ph} required={fi.req}/></label>
            ))}
          </div>
          <label className="fl">Adres
            <PlaceAutocomplete value={address} onChange={(addr,la,lo)=>{setAddress(addr);if(la!=null)setLat(la);if(lo!=null)setLng(lo);}} placeholder="Atatürk Cad. No:5, Kadıköy / İstanbul" style={{width:"100%",height:36,padding:"0 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:13.5,fontFamily:"inherit",background:"#fff"}}/>
            {lat!=null&&lng!=null&&<span style={{fontSize:11.5,color:"var(--success)",fontWeight:600}}>Konum haritada doğrulandı</span>}
          </label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button type="submit" className="b b-ink" disabled={saving||!name.trim()}>{saving?"Kaydediliyor…":"Müşteriyi kaydet"}</button>
            <button type="button" className="b b-line" onClick={()=>setShowForm(false)}>Vazgeç</button>
          </div>
        </form>
      )}

      <div className="bar">
        <label className="srch" style={{flexBasis:380}}>
          <Ic d="M21 21l-5-5m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={14}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Bina, yetkili ya da telefon" aria-label="Müşteri ara"/>
        </label>
      </div>

      {loading?(
        <div className="lt">{[0,1,2].map(i=><div key={i} style={{padding:"12px 16px"}}><div className="skel" style={{height:30}}/></div>)}</div>
      ):filtered.length===0?(
        <div className="empty2">
          <Ic d="M3 21V7l9-4 9 4v14M9 21v-6h6v6" size={28}/>
          <b>{q?"Eşleşen müşteri yok":"Henüz müşteri yok"}</b>
          <p>{q?"Farklı bir arama deneyin.":"İlk binanızı ekleyin ya da müşteri listenizi Excel'den aktarın."}</p>
          {!q&&<div style={{display:"flex",gap:8,marginTop:8}}><button className="b b-ink" onClick={()=>setShowForm(true)}>Yeni müşteri</button><Link href="/app/customers/import" className="b b-line">Excel'den aktar</Link></div>}
        </div>
      ):(
        <div className="lt" style={{["--cols" as string]:COLS}}>
          <div className="lt-head"><span>Müşteri</span><span>Yetkili</span><span>Asansör</span><span>İş emri</span></div>
          {filtered.map((c,i)=>(
            <Link key={c.id} href={`/app/customers/${c.id}`} className="lt-row cu-row" style={{animationDelay:`${Math.min(i,10)*25}ms`}}>
              <div className="lt-main"><b>{c.name}</b><small>{c.address||c.email||"Adres girilmedi"}</small></div>
              <div className="lt-cell">{c.contactName||<span style={{color:"var(--muted-2)"}}>—</span>}{c.phone&&<div style={{fontSize:12,color:"var(--muted)"}}>{c.phone}</div>}</div>
              <div className="lt-cell" style={{fontWeight:750,fontVariantNumeric:"tabular-nums"}}>{c._count.assets}</div>
              <div className="lt-cell" style={{fontWeight:750,fontVariantNumeric:"tabular-nums"}}>{c._count.workOrders}</div>
              <span className="lt-st st" style={{background:"var(--surface-2)",color:"var(--foreground-2)"}}>{c._count.assets} asansör</span>
              <div className="lt-meta">{[c.contactName,c.phone].filter(Boolean).join(" · ")||"Yetkili girilmedi"}</div>
            </Link>
          ))}
        </div>
      )}
      <style>{`.cu-row>.lt-st{display:none}@media(max-width:760px){.cu-row{grid-template-areas:"main st" "meta meta"!important;grid-template-columns:1fr auto!important}.cu-row>.lt-st{display:inline-flex}}`}</style>
    </div>
  );
}
