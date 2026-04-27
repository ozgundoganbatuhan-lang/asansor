"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { buildGoogleMapsDirections } from "@/lib/maps";
import { statusLabel, statusTone, inspectionDueDate, daysBetween } from "@/lib/utils";

type Asset = {
  id:string; name:string; buildingName?:string|null; locationNote?:string|null; elevatorIdNo?:string|null; riskScore?:number|null;
  nextInspectionAt?:string|null; serialNumber?:string|null; stops?:number|null; capacityKg?:number|null; controllerBrand?:string|null;
  customer:{ id:string; name:string; address?:string|null; phone?:string|null };
  workOrders:Array<{id:string;code:string;type:string;status:string;createdAt:string;technician?:{name:string|null}|null}>;
  inspections:Array<{id:string;inspectionDate:string;label:string;result:string;nextDueDate?:string|null}>;
  maintenancePlans:Array<{id:string;nextDueAt:string;name?:string|null;planType:string}>;
};

const TYPE_L:Record<string,string>={FAULT:"Arıza",PERIODIC_MAINTENANCE:"Periyodik Bakım",ANNUAL_INSPECTION:"Yıllık Muayene",REVISION:"Revizyon",INSTALLATION:"Kurulum"};
const S_CFG:Record<string,{bg:string;color:string;dot:string}>={
  URGENT:{bg:"#fef2f2",color:"#b91c1c",dot:"#dc2626"},IN_PROGRESS:{bg:"#fffbeb",color:"#b45309",dot:"#d97706"},
  DONE:{bg:"#f0fdf4",color:"#15803d",dot:"#22c55e"},PENDING:{bg:"#eff6ff",color:"#1d4ed8",dot:"#3b82f6"},CANCELED:{bg:"#f4f4f5",color:"#52525b",dot:"#a1a1aa"},
};
const LABEL_DOT:Record<string,string>={YESIL:"#22c55e",MAVI:"#3b82f6",SARI:"#f59e0b",KIRMIZI:"#dc2626"};
const PLAN_L:Record<string,string>={PERIODIC:"🔧 Periyodik",ANNUAL_INSPECTION:"📋 Yıllık Muayene",CUSTOM:"⚙️ Özel"};

function InfoRow({label,value}:{label:string;value:string}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"10px 0",borderBottom:"1px solid #f4f4f5",gap:12}}>
      <span style={{fontSize:12.5,color:"#71717a",flexShrink:0}}>{label}</span>
      <span style={{fontSize:13,fontWeight:600,color:"#0a0a0f",textAlign:"right"}}>{value}</span>
    </div>
  );
}

export default function AssetDetailPage() {
  const { id } = useParams<{id:string}>();
  const [asset,setAsset] = useState<Asset|null>(null);
  const [error,setError] = useState<string|null>(null);
  const [tab,setTab] = useState<"timeline"|"inspections"|"plans">("timeline");

  useEffect(()=>{
    (async()=>{
      const res = await fetch(`/api/assets/${id}/history`);
      const d = await res.json().catch(()=>({}));
      if(!res.ok){setError(d.error??"Yüklenemedi");return;}
      setAsset(d.item);
    })();
  },[id]);

  const mapsUrl = useMemo(()=>buildGoogleMapsDirections({address:asset?.customer.address,label:`${asset?.buildingName??""} ${asset?.name??""}`}),[asset]);

  const latestInsp = asset?.inspections[0];
  const daysUntilNext = useMemo(()=>{
    if(!latestInsp) return null;
    try {
      const due = inspectionDueDate(new Date(latestInsp.inspectionDate), latestInsp.label);
      return daysBetween(due, new Date());
    } catch { return null; }
  },[latestInsp]);

  if(error) return <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:14,padding:"20px",color:"#b91c1c"}}>{error}</div>;
  if(!asset) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:300,gap:12,color:"#71717a"}}><div style={{width:24,height:24,border:"3px solid #e4e4e7",borderTopColor:"#7c3aed",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>Yükleniyor...</div>;

  const riskColor = asset.riskScore!=null ? (asset.riskScore>=8?"#dc2626":asset.riskScore>=5?"#d97706":"#22c55e") : "#a1a1aa";

  return (
    <div style={{maxWidth:1000,margin:"0 auto"}}>
      {/* Breadcrumb */}
      <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#71717a",marginBottom:20}}>
        <Link href="/app/assets" style={{color:"#71717a",textDecoration:"none",fontWeight:600}}>← Asansörler</Link>
        <span>/</span>
        <span style={{color:"#0a0a0f",fontWeight:700}}>{asset.name}</span>
      </div>

      {/* Hero */}
      <div style={{background:"linear-gradient(135deg,#0d1117,#1a1d2e)",borderRadius:20,padding:"28px 32px",color:"#fff",marginBottom:20,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-80,right:-80,width:280,height:280,background:"radial-gradient(circle,rgba(37,99,235,0.2),transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"relative",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:8}}>
              {asset.customer.name}
            </div>
            <h1 style={{fontSize:26,fontWeight:900,letterSpacing:"-0.04em",color:"#fff",margin:"0 0 6px"}}>{asset.name}</h1>
            {asset.buildingName && <div style={{fontSize:14,color:"rgba(255,255,255,0.55)"}}>{asset.buildingName}</div>}
            <div style={{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"}}>
              {asset.elevatorIdNo && <span style={{background:"rgba(255,255,255,0.1)",borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:600}}>ID: {asset.elevatorIdNo}</span>}
              {latestInsp && <span style={{background:`${LABEL_DOT[latestInsp.label]??"#a1a1aa"}22`,border:`1px solid ${LABEL_DOT[latestInsp.label]??"#a1a1aa"}44`,color:LABEL_DOT[latestInsp.label]??"#a1a1aa",borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:700}}>● {latestInsp.label} etiket</span>}
              {daysUntilNext!=null && <span style={{background:"rgba(255,255,255,0.08)",borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:600,color:daysUntilNext<30?"#fca5a5":"rgba(255,255,255,0.7)"}}>⏳ {daysUntilNext} gün kaldı</span>}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,minWidth:160}}>
            {asset.riskScore!=null && (
              <div style={{background:"rgba(255,255,255,0.08)",borderRadius:14,padding:"12px 16px",textAlign:"center"}}>
                <div style={{fontSize:9.5,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:4}}>Risk Skoru</div>
                <div style={{fontSize:28,fontWeight:900,color:riskColor}}>{asset.riskScore}<span style={{fontSize:14,color:"rgba(255,255,255,0.4)"}}>/10</span></div>
              </div>
            )}
            <div style={{display:"flex",gap:8}}>
              <Link href={`/app/customers/${asset.customer.id}`} style={{flex:1,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"8px 12px",fontSize:12,fontWeight:700,color:"#fff",textDecoration:"none",textAlign:"center"}}>Müşteri →</Link>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{flex:1,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"8px 12px",fontSize:12,fontWeight:700,color:"#fff",textDecoration:"none",textAlign:"center"}}>🗺 Yol</a>
            </div>
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:20,alignItems:"start"}}>
        {/* Main */}
        <div>
          {/* Tabs */}
          <div style={{display:"flex",gap:4,background:"#f4f4f6",borderRadius:14,padding:4,marginBottom:16}}>
            {([{k:"timeline",l:"📋 Servis Geçmişi"},{k:"inspections",l:"🔍 Kontroller"},{k:"plans",l:"🔧 Bakım Planları"}] as const).map(t=>(
              <button key={t.k} onClick={()=>setTab(t.k)} style={{flex:1,padding:"9px",borderRadius:10,border:"none",cursor:"pointer",fontSize:12.5,fontWeight:700,transition:"all 0.15s",background:tab===t.k?"#fff":"transparent",color:tab===t.k?"#0a0a0f":"#71717a",boxShadow:tab===t.k?"0 1px 4px rgba(0,0,0,0.08)":"none",fontFamily:"inherit"}}>
                {t.l}
              </button>
            ))}
          </div>

          {/* Timeline */}
          {tab==="timeline" && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:4}}>
                <Link href={`/app/work-orders?assetId=${id}`} style={{fontSize:13,fontWeight:700,color:"#2563eb",textDecoration:"none"}}>+ Yeni İş Emri</Link>
              </div>
              {asset.workOrders.length===0 ? (
                <div style={{background:"#fff",border:"1px solid #e4e4e7",borderRadius:16,padding:"40px 24px",textAlign:"center"}}><div style={{fontSize:40,marginBottom:10}}>📋</div><div style={{fontSize:14,fontWeight:700,color:"#52525b"}}>Servis kaydı yok</div></div>
              ) : asset.workOrders.map(wo=>{
                const cfg=S_CFG[wo.status]??{bg:"#f4f4f5",color:"#52525b",dot:"#a1a1aa"};
                return (
                  <Link key={wo.id} href={`/app/work-orders/${wo.id}`} style={{display:"block",background:"#fff",border:"1px solid #e4e4e7",borderRadius:16,padding:"16px 20px",textDecoration:"none",borderLeft:`4px solid ${cfg.dot}`,transition:"all 0.12s"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontFamily:"monospace",fontSize:11.5,fontWeight:700,color:"#a1a1aa"}}>{wo.code}</span>
                        <span style={{background:cfg.bg,color:cfg.color,borderRadius:999,padding:"2px 10px",fontSize:11,fontWeight:700}}>{wo.status==="DONE"?"Tamam":wo.status==="URGENT"?"Acil":wo.status==="IN_PROGRESS"?"Devam":wo.status==="PENDING"?"Planlı":"İptal"}</span>
                      </div>
                      <span style={{fontSize:12,color:"#71717a"}}>{new Date(wo.createdAt).toLocaleDateString("tr-TR")}</span>
                    </div>
                    <div style={{fontSize:13.5,fontWeight:700,color:"#0a0a0f",marginBottom:2}}>{TYPE_L[wo.type]??wo.type}</div>
                    {wo.technician && <div style={{fontSize:12,color:"#71717a"}}>👤 {wo.technician.name}</div>}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Inspections */}
          {tab==="inspections" && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {asset.inspections.length===0 ? (
                <div style={{background:"#fff",border:"1px solid #e4e4e7",borderRadius:16,padding:"40px 24px",textAlign:"center"}}><div style={{fontSize:40,marginBottom:10}}>🔍</div><div style={{fontSize:14,fontWeight:700,color:"#52525b"}}>Kontrol kaydı yok</div></div>
              ) : asset.inspections.map(ins=>{
                const dot=LABEL_DOT[ins.label]??"#a1a1aa";
                return (
                  <div key={ins.id} style={{background:"#fff",border:"1px solid #e4e4e7",borderRadius:16,padding:"16px 20px",borderLeft:`4px solid ${dot}`}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                      <div>
                        <div style={{fontSize:14,fontWeight:800,color:"#0a0a0f"}}>{new Date(ins.inspectionDate).toLocaleDateString("tr-TR")}</div>
                        <div style={{fontSize:12,color:"#71717a",marginTop:2}}>{ins.result}</div>
                      </div>
                      <span style={{background:`${dot}18`,color:dot,border:`1px solid ${dot}44`,borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:700}}>● {ins.label}</span>
                    </div>
                    {ins.nextDueDate && <div style={{fontSize:12,color:"#71717a",marginTop:8}}>Sonraki: {new Date(ins.nextDueDate).toLocaleDateString("tr-TR")}</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Plans */}
          {tab==="plans" && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {asset.maintenancePlans.length===0 ? (
                <div style={{background:"#fff",border:"1px solid #e4e4e7",borderRadius:16,padding:"40px 24px",textAlign:"center"}}><div style={{fontSize:40,marginBottom:10}}>🔧</div><div style={{fontSize:14,fontWeight:700,color:"#52525b"}}>Bakım planı yok</div></div>
              ) : asset.maintenancePlans.map(plan=>{
                const due=new Date(plan.nextDueAt);
                const overdue=due<new Date();
                return (
                  <div key={plan.id} style={{background:"#fff",border:"1px solid #e4e4e7",borderRadius:16,padding:"16px 20px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                      <div>
                        <div style={{fontSize:14,fontWeight:800,color:"#0a0a0f"}}>{plan.name||PLAN_L[plan.planType]||plan.planType}</div>
                        <div style={{fontSize:12,color:"#71717a",marginTop:2}}>Sonraki: {due.toLocaleDateString("tr-TR")}</div>
                      </div>
                      <span style={{background:overdue?"#fef2f2":"#f0fdf4",color:overdue?"#b91c1c":"#15803d",borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:700}}>{overdue?"Gecikmiş":"Aktif"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Ekipman */}
          <div style={{background:"#fff",border:"1px solid #e4e4e7",borderRadius:18,padding:"20px"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#0a0a0f",marginBottom:14}}>⚙️ Ekipman Bilgileri</div>
            {[
              {l:"Seri No",v:asset.serialNumber??"—"},
              {l:"Durdurma",v:asset.stops?`${asset.stops} kat`:"—"},
              {l:"Kapasite",v:asset.capacityKg?`${asset.capacityKg} kg`:"—"},
              {l:"Kontrol Sistemi",v:asset.controllerBrand??"—"},
              {l:"Konum Notu",v:asset.locationNote??"—"},
            ].map(r=><InfoRow key={r.l} label={r.l} value={r.v}/>)}
          </div>

          {/* Müşteri */}
          <div style={{background:"#fff",border:"1px solid #e4e4e7",borderRadius:18,padding:"20px"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#0a0a0f",marginBottom:14}}>👤 Müşteri</div>
            <div style={{fontSize:14,fontWeight:700,color:"#0a0a0f",marginBottom:4}}>{asset.customer.name}</div>
            {asset.customer.address && <div style={{fontSize:12.5,color:"#71717a",marginBottom:10,lineHeight:1.5}}>{asset.customer.address}</div>}
            {asset.customer.phone && (
              <a href={`tel:${asset.customer.phone}`} style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13,fontWeight:700,color:"#2563eb",textDecoration:"none"}}>
                📞 {asset.customer.phone}
              </a>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
