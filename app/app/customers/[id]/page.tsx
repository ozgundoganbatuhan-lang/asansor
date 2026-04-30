"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Customer = { id:string; name:string; contactName?:string|null; phone?:string|null; email?:string|null; address?:string|null; taxId?:string|null; identityNo?:string|null; notes?:string|null };
type Asset = { id:string; name:string; buildingName?:string|null; stops?:number|null; capacityKg?:number|null; controllerBrand?:string|null; riskScore?:number|null; serialNumber?:string|null };
type WO = { id:string; code:string; type:string; status:string; createdAt:string; asset?:{name:string}|null; technician?:{name:string}|null };

const TYPE_L:Record<string,string>={FAULT:"Arıza",PERIODIC_MAINTENANCE:"Periyodik",ANNUAL_INSPECTION:"Yıllık Muayene",REVISION:"Revizyon",INSTALLATION:"Kurulum"};
const S_CFG:Record<string,{bg:string;c:string;dot:string}>={
  URGENT:{bg:"#fef2f2",c:"#b91c1c",dot:"#dc2626"},IN_PROGRESS:{bg:"#fffbeb",c:"#b45309",dot:"#d97706"},
  DONE:{bg:"#f0fdf4",c:"#15803d",dot:"#22c55e"},PENDING:{bg:"#eff6ff",c:"#1d4ed8",dot:"#3b82f6"},CANCELED:{bg:"#f1f5f9",c:"#475569",dot:"#94a3b8"},
};

const fi:React.CSSProperties={width:"100%",padding:"11px 14px",border:"1px solid #e2e8f0",borderRadius:12,fontSize:14,background:"#fff",outline:"none",fontFamily:"inherit",transition:"border-color 0.15s"};
const AVATARS=["#2563eb","#7c3aed","#059669","#d97706","#dc2626","#0891b2"];

export default function CustomerDetailPage() {
  const { id } = useParams<{id:string}>();
  const [customer,setCustomer] = useState<Customer|null>(null);
  const [assets,setAssets] = useState<Asset[]>([]);
  const [wos,setWOs] = useState<WO[]>([]);
  const [loading,setLoading] = useState(true);
  const [err,setErr] = useState<string|null>(null);
  const [tab,setTab] = useState<"assets"|"history">("assets");
  const [showAssetForm,setShowAssetForm] = useState(false);
  const [aForm,setAForm] = useState({name:"",building:"",stops:"",capacity:"",controller:"",serial:""});
  const [saving,setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [cR,aR,wR] = await Promise.all([fetch(`/api/customers/${id}`),fetch(`/api/assets?customerId=${id}`),fetch(`/api/work-orders?customerId=${id}`)]);
    const [cd,ad,wd] = await Promise.all([cR.json().catch(()=>({})),aR.json().catch(()=>({})),wR.json().catch(()=>({}))]);
    setCustomer(cd.item??null); setAssets(ad.items??[]); setWOs(wd.items??[]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[id]);

  async function addAsset() {
    setSaving(true); setErr(null);
    const res = await fetch("/api/assets",{method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({customerId:id,name:aForm.name,buildingName:aForm.building||undefined,stops:aForm.stops?parseInt(aForm.stops):undefined,
        capacityKg:aForm.capacity?parseInt(aForm.capacity):undefined,controllerBrand:aForm.controller||undefined,serialNumber:aForm.serial||undefined})});
    const d=await res.json().catch(()=>({}));
    setSaving(false);
    if(!res.ok){setErr(d.error??"Eklenemedi");return;}
    setAForm({name:"",building:"",stops:"",capacity:"",controller:"",serial:""}); setShowAssetForm(false); await load();
  }

  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:300,gap:12,color:"#64748b"}}><div style={{width:24,height:24,border:"3px solid #e2e8f0",borderTopColor:"#7c3aed",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>Yükleniyor...</div>;
  if(!customer) return <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:14,padding:"20px",color:"#b91c1c"}}>Müşteri bulunamadı.</div>;

  const avtBg=AVATARS[customer.name.charCodeAt(0)%AVATARS.length];
  const initials=customer.name.split(" ").map(w=>w[0]).filter(Boolean).slice(0,2).join("").toUpperCase();
  const activeWOs=wos.filter(w=>!["DONE","CANCELED"].includes(w.status)).length;

  return (
    <div style={{maxWidth:1000,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#64748b",marginBottom:20}}>
        <Link href="/app/customers" style={{color:"#64748b",textDecoration:"none",fontWeight:600}}>← Müşteriler</Link>
        <span>/</span><span style={{color:"#0f172a",fontWeight:700}}>{customer.name}</span>
      </div>

      {/* Hero */}
      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:18,padding:"28px 32px",marginBottom:20,display:"flex",alignItems:"flex-start",gap:24,flexWrap:"wrap"}}>
        <div style={{width:64,height:64,borderRadius:18,background:avtBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:"#fff",flexShrink:0}}>{initials}</div>
        <div style={{flex:1,minWidth:0}}>
          <h1 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",color:"#0f172a",margin:"0 0 4px"}}>{customer.name}</h1>
          {customer.contactName && <div style={{fontSize:14,color:"#64748b",marginBottom:12}}>{customer.contactName}</div>}
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {customer.phone && <a href={`tel:${customer.phone}`} style={{display:"inline-flex",alignItems:"center",gap:6,background:"#eff6ff",color:"#1d4ed8",borderRadius:10,padding:"7px 14px",fontSize:13,fontWeight:700,textDecoration:"none"}}>📞 {customer.phone}</a>}
            {customer.email && <a href={`mailto:${customer.email}`} style={{display:"inline-flex",alignItems:"center",gap:6,background:"#f5f3ff",color:"#7c3aed",borderRadius:10,padding:"7px 14px",fontSize:13,fontWeight:700,textDecoration:"none"}}>✉️ {customer.email}</a>}
            {customer.address && <a href={`https://maps.google.com/?q=${encodeURIComponent(customer.address)}`} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:"#f1f5f9",color:"#475569",borderRadius:10,padding:"7px 14px",fontSize:13,fontWeight:700,textDecoration:"none"}}>📍 Haritada Gör</a>}
          </div>
        </div>
        <div style={{display:"flex",gap:12}}>
          {[{l:"Asansör",v:assets.length,c:"#0f172a",bg:"#f1f5f9"},{l:"Aktif İş",v:activeWOs,c:activeWOs>0?"#b91c1c":"#15803d",bg:activeWOs>0?"#fef2f2":"#f0fdf4"}].map(s=>(
            <div key={s.l} style={{background:s.bg,borderRadius:14,padding:"12px 16px",textAlign:"center",minWidth:70}}>
              <div style={{fontSize:22,fontWeight:900,color:s.c}}>{s.v}</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:2,fontWeight:600}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:20,alignItems:"start"}}>
        {/* Main */}
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{display:"flex",gap:4,background:"#f1f5f9",borderRadius:14,padding:4}}>
              {([{k:"assets",l:"🛗 Asansörler"},{k:"history",l:"📋 İş Emirleri"}] as const).map(t=>(
                <button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"8px 16px",borderRadius:10,border:"none",cursor:"pointer",fontSize:12.5,fontWeight:700,transition:"all 0.15s",background:tab===t.k?"#fff":"transparent",color:tab===t.k?"#0f172a":"#64748b",boxShadow:tab===t.k?"0 1px 4px rgba(0,0,0,0.08)":"none",fontFamily:"inherit"}}>
                  {t.l}
                </button>
              ))}
            </div>
            {tab==="assets" && (
              <button onClick={()=>setShowAssetForm(v=>!v)} style={{background:"#0f172a",color:"#fff",border:"none",borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {showAssetForm?"✕":"+ Asansör Ekle"}
              </button>
            )}
          </div>

          {showAssetForm && tab==="assets" && (
            <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"20px",marginBottom:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                {([{l:"Asansör Adı *",f:"name"},{l:"Bina",f:"building"},{l:"Kat / Durak",f:"stops",t:"number"},{l:"Kapasite (kg)",f:"capacity",t:"number"},{l:"Kontrol Sistemi",f:"controller"},{l:"Seri No",f:"serial"}] as const).map(fld=>(
                  <div key={fld.f}>
                    <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#94a3b8",marginBottom:6}}>{fld.l}</label>
                    <input value={aForm[fld.f as keyof typeof aForm]} onChange={e=>setAForm(x=>({...x,[fld.f]:e.target.value}))} type={"t" in fld?fld.t:"text"} style={fi}
                      onFocus={e=>e.target.style.borderColor="#7c3aed"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                  </div>
                ))}
              </div>
              {err && <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"10px",marginBottom:10,fontSize:13,color:"#b91c1c"}}>⚠️ {err}</div>}
              <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
                <button onClick={()=>setShowAssetForm(false)} style={{background:"#f1f5f9",border:"none",borderRadius:9,padding:"9px 16px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#475569"}}>İptal</button>
                <button onClick={addAsset} disabled={!aForm.name.trim()||saving} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:9,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",opacity:!aForm.name.trim()||saving?0.6:1}}>
                  {saving?"Ekleniyor...":"Ekle"}
                </button>
              </div>
            </div>
          )}

          {tab==="assets" && (
            assets.length===0 ? (
              <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:18,padding:"48px 24px",textAlign:"center"}}>
                <div style={{fontSize:48,marginBottom:12}}>🛗</div>
                <div style={{fontSize:15,fontWeight:700,color:"#0f172a"}}>Asansör kaydı yok</div>
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>
                {assets.map(a=>(
                  <Link key={a.id} href={`/app/assets/${a.id}`} style={{display:"block",background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"18px",textDecoration:"none",transition:"all 0.15s"}}>
                    <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#eff6ff,#dbeafe)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:12}}>🛗</div>
                    <div style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:4}}>{a.name}</div>
                    {a.buildingName && <div style={{fontSize:12.5,color:"#64748b",marginBottom:8}}>{a.buildingName}</div>}
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {a.stops && <span style={{background:"#f1f5f9",borderRadius:999,padding:"2px 8px",fontSize:11,fontWeight:600,color:"#475569"}}>{a.stops} kat</span>}
                      {a.capacityKg && <span style={{background:"#f1f5f9",borderRadius:999,padding:"2px 8px",fontSize:11,fontWeight:600,color:"#475569"}}>{a.capacityKg} kg</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}

          {tab==="history" && (
            wos.length===0 ? (
              <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:18,padding:"48px 24px",textAlign:"center"}}>
                <div style={{fontSize:48,marginBottom:12}}>📋</div>
                <div style={{fontSize:15,fontWeight:700,color:"#0f172a"}}>İş emri yok</div>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {wos.map(wo=>{
                  const cfg=S_CFG[wo.status]??{bg:"#f1f5f9",c:"#475569",dot:"#94a3b8"};
                  return (
                    <Link key={wo.id} href={`/app/work-orders/${wo.id}`} style={{display:"block",background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"14px 18px",textDecoration:"none",borderLeft:`4px solid ${cfg.dot}`,transition:"all 0.12s"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:6}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontFamily:"monospace",fontSize:11,fontWeight:700,color:"#94a3b8"}}>{wo.code}</span>
                          <span style={{background:cfg.bg,color:cfg.c,borderRadius:999,padding:"2px 8px",fontSize:11,fontWeight:700}}>{wo.status==="DONE"?"Tamam":wo.status==="URGENT"?"Acil":wo.status==="IN_PROGRESS"?"Devam":wo.status==="PENDING"?"Planlı":"İptal"}</span>
                        </div>
                        <span style={{fontSize:12,color:"#64748b"}}>{new Date(wo.createdAt).toLocaleDateString("tr-TR")}</span>
                      </div>
                      <div style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>{TYPE_L[wo.type]??wo.type}</div>
                      {wo.asset && <div style={{fontSize:12,color:"#64748b",marginTop:2}}>🛗 {wo.asset.name}</div>}
                    </Link>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Info */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:18,padding:"20px"}}>
          <div style={{fontSize:13,fontWeight:800,color:"#0f172a",marginBottom:14}}>📋 Müşteri Bilgileri</div>
          {[
            {l:"Vergi No",v:customer.taxId??"—"},
            {l:"TC No",v:customer.identityNo??"—"},
            {l:"Adres",v:customer.address??"—"},
          ].map(r=>(
            <div key={r.l} style={{padding:"10px 0",borderBottom:"1px solid #f1f5f9"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{r.l}</div>
              <div style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>{r.v}</div>
            </div>
          ))}
          {customer.notes && (
            <div style={{padding:"10px 0"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Notlar</div>
              <div style={{fontSize:13,color:"#475569",lineHeight:1.6}}>{customer.notes}</div>
            </div>
          )}
          <Link href={`/app/work-orders?customerId=${id}`} style={{display:"block",marginTop:16,background:"#0f172a",color:"#fff",borderRadius:10,padding:"10px 16px",fontSize:13,fontWeight:700,textDecoration:"none",textAlign:"center"}}>
            + Yeni İş Emri
          </Link>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
