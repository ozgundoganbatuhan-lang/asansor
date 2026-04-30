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
  DONE:{bg:"#f0fdf4",color:"#15803d",dot:"#22c55e"},PENDING:{bg:"#eff6ff",color:"#1d4ed8",dot:"#3b82f6"},CANCELED:{bg:"#f1f5f9",color:"#475569",dot:"#94a3b8"},
};
const LABEL_DOT:Record<string,string>={YESIL:"#22c55e",MAVI:"#3b82f6",SARI:"#f59e0b",KIRMIZI:"#dc2626"};
const PLAN_L:Record<string,string>={PERIODIC:"🔧 Periyodik",ANNUAL_INSPECTION:"📋 Yıllık Muayene",CUSTOM:"⚙️ Özel"};

function InfoRow({label,value}:{label:string;value:string}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"10px 0",borderBottom:"1px solid #f1f5f9",gap:12}}>
      <span style={{fontSize:12,color:"#6b7280",flexShrink:0,fontWeight:500}}>{label}</span>
      <span style={{fontSize:13,fontWeight:600,color:"#111827",textAlign:"right"}}>{value}</span>
    </div>
  );
}

/* ── QR Section Component ── */
function QRSection({ asset, publicUrl }: { asset: Asset; publicUrl: string }) {
  const [selectedSize, setSelectedSize] = useState<"A6"|"A5"|"Etiket">("A6");
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}&margin=10`;

  const sizes = [
    { key: "A6" as const, dim: "105×148mm" },
    { key: "A5" as const, dim: "148×210mm" },
    { key: "Etiket" as const, dim: "50×50mm" },
  ];

  function handlePrint() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html><html><head>
      <title>QR Etiket — ${asset.name}</title>
      <style>
        body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;}
        .label{border:1.5px solid #e5e7eb;border-radius:16px;padding:28px 24px;text-align:center;max-width:320px;background:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.08);}
        .brand{font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;}
        img{border-radius:10px;border:1px solid #f3f4f6;}
        .name{font-size:17px;font-weight:800;color:#111827;margin-top:14px;letter-spacing:-0.03em;}
        .loc{font-size:12px;color:#6b7280;margin-top:4px;font-weight:500;}
        .code{font-size:10px;color:#9ca3af;font-family:monospace;margin-top:6px;letter-spacing:0.5px;}
        .divider{height:1px;background:#f3f4f6;margin:14px 0;}
        .cta{font-size:11px;color:#6b7280;line-height:1.6;}
        @media print{body{background:#fff;}.label{box-shadow:none;border:1px solid #e5e7eb;}}
      </style></head><body>
      <div class="label">
        <div class="brand">Servisim · Asansör QR Etiketi</div>
        <img src="${qrApiUrl.replace('200x200', selectedSize === 'A5' ? '280x280' : selectedSize === 'Etiket' ? '120x120' : '200x200')}" width="${selectedSize === 'A5' ? 240 : selectedSize === 'Etiket' ? 100 : 180}" height="${selectedSize === 'A5' ? 240 : selectedSize === 'Etiket' ? 100 : 180}" alt="QR">
        <div class="name">${asset.name}</div>
        <div class="loc">${asset.buildingName ?? ""}</div>
        ${asset.elevatorIdNo ? `<div class="code">${asset.elevatorIdNo}</div>` : ""}
        <div class="divider"></div>
        <div class="cta">Servis geçmişi için QR kodu okutun</div>
      </div>
      <script>window.onload=()=>setTimeout(()=>window.print(),400)<\/script>
      </body></html>
    `);
  }

  return (
    <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:"20px",overflow:"hidden"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700,color:"#111827"}}>QR Etiketi</div>
        <button onClick={handlePrint} style={{display:"flex",alignItems:"center",gap:5,
          background:"none",border:"1px solid #e5e7eb",borderRadius:7,
          padding:"5px 10px",fontSize:11,fontWeight:600,color:"#374151",cursor:"pointer"}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
          </svg>
          Yazdırılabilir
        </button>
      </div>

      {/* QR preview box */}
      <div style={{border:"2px dashed #e5e7eb",borderRadius:12,padding:"20px 16px",
        display:"flex",flexDirection:"column",alignItems:"center",gap:8,marginBottom:14,background:"#fafafa"}}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrApiUrl}
          alt="QR kod"
          width={140} height={140}
          style={{borderRadius:8,border:"1px solid #f3f4f6",background:"#fff"}}
        />
        <div style={{fontSize:13,fontWeight:700,color:"#111827",textAlign:"center"}}>{asset.name}</div>
        {asset.buildingName && <div style={{fontSize:11,color:"#6b7280",textAlign:"center"}}>{asset.buildingName}</div>}
        {asset.elevatorIdNo && <div style={{fontSize:10,color:"#9ca3af",fontFamily:"monospace",letterSpacing:"0.5px"}}>{asset.elevatorIdNo}</div>}
      </div>

      {/* Instructions */}
      <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8,padding:"10px 12px",marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:700,color:"#1d4ed8",display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Etiket Kullanım Talimatı
        </div>
        <ol style={{padding:"0 0 0 14px",margin:0}}>
          <li style={{fontSize:11,color:"#374151",marginBottom:3}}>QR kodu asansörün kapısına veya makine dairesine yapıştırın.</li>
          <li style={{fontSize:11,color:"#374151",marginBottom:3}}>Müşteriler QR&apos;ı okutarak servis geçmişini görüntüleyebilir.</li>
          <li style={{fontSize:11,color:"#374151"}}>Her servis ziyaretinde teknisyen QR ile kaydını doğrular.</li>
        </ol>
      </div>

      {/* Size selector */}
      <div style={{fontSize:10,fontWeight:600,color:"#9ca3af",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:8}}>Baskı Boyutu</div>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {sizes.map(s => (
          <button key={s.key} onClick={() => setSelectedSize(s.key)}
            style={{flex:1,padding:"7px 4px",borderRadius:8,cursor:"pointer",textAlign:"center",
              border: selectedSize===s.key ? "1.5px solid #3b82f6" : "1.5px solid #e5e7eb",
              background: selectedSize===s.key ? "#eff6ff" : "#fff",
              transition:"all 0.12s"}}>
            <div style={{fontSize:12,fontWeight:700,color: selectedSize===s.key ? "#2563eb" : "#111827"}}>{s.key}</div>
            <div style={{fontSize:9,color: selectedSize===s.key ? "#3b82f6" : "#9ca3af",marginTop:2}}>{s.dim}</div>
          </button>
        ))}
      </div>

      {/* Print button */}
      <button onClick={handlePrint}
        style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:7,
          background:"#2563eb",color:"#fff",border:"none",borderRadius:9,
          padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:8}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
        </svg>
        QR Etiketini Yazdır
      </button>

      {/* Public link */}
      <a href={publicUrl} target="_blank" rel="noopener noreferrer"
        style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:7,
          background:"none",color:"#374151",border:"1px solid #e5e7eb",borderRadius:9,
          padding:"9px",fontSize:13,fontWeight:600,cursor:"pointer",textDecoration:"none",boxSizing:"border-box"}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        Müşteri Sayfasını Aç
      </a>
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

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${siteUrl}/public/assets/${asset?.id ?? id}`;

  if(error) return <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:14,padding:"20px",color:"#b91c1c"}}>{error}</div>;
  if(!asset) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:300,gap:12,color:"#6b7280"}}>
      <div style={{width:24,height:24,border:"3px solid #e5e7eb",borderTopColor:"#2563eb",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
      Yükleniyor...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const latestLabel = latestInsp?.label ?? "";
  const labelDot = LABEL_DOT[latestLabel] ?? "#94a3b8";
  const riskColor = asset.riskScore!=null ? (asset.riskScore>=70?"#dc2626":asset.riskScore>=40?"#d97706":"#22c55e") : "#94a3b8";

  return (
    <div style={{maxWidth:1080,margin:"0 auto"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Breadcrumb */}
      <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#6b7280",marginBottom:20}}>
        <Link href="/app/assets" style={{color:"#6b7280",textDecoration:"none",fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          Asansörlere dön
        </Link>
      </div>

      {/* Detail header card */}
      <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:"20px 24px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
            {latestLabel && (
              <span style={{display:"inline-flex",alignItems:"center",gap:5,background:`${labelDot}18`,border:`1px solid ${labelDot}44`,color:labelDot,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:99}}>
                ● {latestLabel} Etiket
              </span>
            )}
            {asset.riskScore!=null && (
              <span style={{background:riskColor+"18",color:riskColor,border:`1px solid ${riskColor}44`,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:6}}>
                Risk {asset.riskScore}
              </span>
            )}
          </div>
          <h1 style={{fontSize:22,fontWeight:800,color:"#111827",letterSpacing:"-0.03em",margin:"0 0 4px"}}>{asset.name}</h1>
          <div style={{fontSize:13,color:"#6b7280"}}>{asset.buildingName && `${asset.buildingName} · `}{asset.customer.name}</div>
        </div>
        <div style={{display:"flex",gap:8,flexShrink:0}}>
          <Link href={`/app/work-orders?assetId=${id}`}
            style={{display:"inline-flex",alignItems:"center",gap:6,background:"#2563eb",color:"#fff",
              fontSize:12.5,fontWeight:700,padding:"8px 16px",borderRadius:8,textDecoration:"none"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            İş emri oluştur
          </Link>
          <a href={mapsUrl ?? "#"} target="_blank" rel="noopener noreferrer"
            style={{display:"inline-flex",alignItems:"center",gap:6,background:"#fff",color:"#374151",
              border:"1px solid #e5e7eb",fontSize:12.5,fontWeight:600,padding:"8px 14px",borderRadius:8,textDecoration:"none"}}>
            🗺 Yol tarifi
          </a>
        </div>
      </div>

      {/* Main grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 296px",gap:16,alignItems:"start"}}>

        {/* Left column */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>

          {/* Teknik bilgiler */}
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:"20px"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#111827",marginBottom:14}}>Teknik Bilgiler</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
              {[
                {l:"Kimlik No",v:asset.elevatorIdNo??"—"},
                {l:"Müşteri",v:asset.customer.name},
                {l:"Bina",v:asset.buildingName??"—"},
                {l:"Risk Skoru",v:asset.riskScore!=null?String(asset.riskScore):"—"},
                {l:"Seri No",v:asset.serialNumber??"—"},
                {l:"Kapasite",v:asset.capacityKg?`${asset.capacityKg} kg`:"—"},
                {l:"Kat Sayısı",v:asset.stops?`${asset.stops} kat`:"—"},
                {l:"Kontrol Sistemi",v:asset.controllerBrand??"—"},
              ].map(r=><InfoRow key={r.l} label={r.l} value={r.v}/>)}
            </div>
            {asset.customer.phone && (
              <a href={`tel:${asset.customer.phone}`}
                style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600,
                  color:"#2563eb",textDecoration:"none",marginTop:12}}>
                📞 {asset.customer.phone}
              </a>
            )}
          </div>

          {/* Tabs */}
          <div>
            <div style={{display:"flex",gap:4,background:"#f3f4f6",borderRadius:10,padding:4,marginBottom:14}}>
              {([
                {k:"timeline",l:"📋 Servis Geçmişi"},
                {k:"inspections",l:"🔍 Kontroller"},
                {k:"plans",l:"🔧 Bakım Planları"},
              ] as const).map(t=>(
                <button key={t.k} onClick={()=>setTab(t.k)}
                  style={{flex:1,padding:"8px",borderRadius:7,border:"none",cursor:"pointer",
                    fontSize:12.5,fontWeight:700,transition:"all 0.15s",fontFamily:"inherit",
                    background:tab===t.k?"#fff":"transparent",
                    color:tab===t.k?"#111827":"#6b7280",
                    boxShadow:tab===t.k?"0 1px 4px rgba(0,0,0,0.08)":"none"}}>
                  {t.l}
                </button>
              ))}
            </div>

            {/* Timeline */}
            {tab==="timeline" && (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{display:"flex",justifyContent:"flex-end",marginBottom:4}}>
                  <Link href={`/app/work-orders?assetId=${id}`}
                    style={{fontSize:13,fontWeight:700,color:"#2563eb",textDecoration:"none"}}>
                    + Yeni İş Emri
                  </Link>
                </div>
                {asset.workOrders.length===0 ? (
                  <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:"40px 24px",textAlign:"center"}}>
                    <div style={{fontSize:36,marginBottom:10}}>📋</div>
                    <div style={{fontSize:14,fontWeight:700,color:"#374151"}}>Servis kaydı yok</div>
                  </div>
                ) : asset.workOrders.map(wo=>{
                  const cfg=S_CFG[wo.status]??{bg:"#f1f5f9",color:"#475569",dot:"#94a3b8"};
                  return (
                    <Link key={wo.id} href={`/app/work-orders/${wo.id}`}
                      style={{display:"block",background:"#fff",border:"1px solid #e5e7eb",
                        borderRadius:12,padding:"14px 18px",textDecoration:"none",
                        borderLeft:`4px solid ${cfg.dot}`,transition:"all 0.12s"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:6}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontFamily:"monospace",fontSize:11,fontWeight:700,color:"#9ca3af"}}>{wo.code}</span>
                          <span style={{background:cfg.bg,color:cfg.color,borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:700}}>
                            {wo.status==="DONE"?"Tamam":wo.status==="URGENT"?"Acil":wo.status==="IN_PROGRESS"?"Devam":wo.status==="PENDING"?"Planlı":"İptal"}
                          </span>
                        </div>
                        <span style={{fontSize:12,color:"#9ca3af"}}>{new Date(wo.createdAt).toLocaleDateString("tr-TR")}</span>
                      </div>
                      <div style={{fontSize:13.5,fontWeight:700,color:"#111827",marginBottom:2}}>{TYPE_L[wo.type]??wo.type}</div>
                      {wo.technician && <div style={{fontSize:12,color:"#6b7280"}}>👤 {wo.technician.name}</div>}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Inspections */}
            {tab==="inspections" && (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {asset.inspections.length===0 ? (
                  <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:"40px 24px",textAlign:"center"}}>
                    <div style={{fontSize:36,marginBottom:10}}>🔍</div>
                    <div style={{fontSize:14,fontWeight:700,color:"#374151"}}>Kontrol kaydı yok</div>
                  </div>
                ) : asset.inspections.map(ins=>{
                  const dot=LABEL_DOT[ins.label]??"#94a3b8";
                  return (
                    <div key={ins.id} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:"14px 18px",borderLeft:`4px solid ${dot}`}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                        <div>
                          <div style={{fontSize:14,fontWeight:800,color:"#111827"}}>{new Date(ins.inspectionDate).toLocaleDateString("tr-TR")}</div>
                          <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{ins.result}</div>
                        </div>
                        <span style={{background:`${dot}18`,color:dot,border:`1px solid ${dot}44`,borderRadius:99,padding:"3px 12px",fontSize:12,fontWeight:700}}>● {ins.label}</span>
                      </div>
                      {ins.nextDueDate && <div style={{fontSize:12,color:"#6b7280",marginTop:8}}>Sonraki: {new Date(ins.nextDueDate).toLocaleDateString("tr-TR")}</div>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Plans */}
            {tab==="plans" && (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {asset.maintenancePlans.length===0 ? (
                  <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:"40px 24px",textAlign:"center"}}>
                    <div style={{fontSize:36,marginBottom:10}}>🔧</div>
                    <div style={{fontSize:14,fontWeight:700,color:"#374151"}}>Bakım planı yok</div>
                  </div>
                ) : asset.maintenancePlans.map(plan=>{
                  const due=new Date(plan.nextDueAt);
                  const overdue=due<new Date();
                  return (
                    <div key={plan.id} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:"14px 18px"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                        <div>
                          <div style={{fontSize:14,fontWeight:800,color:"#111827"}}>{plan.name||PLAN_L[plan.planType]||plan.planType}</div>
                          <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>Sonraki: {due.toLocaleDateString("tr-TR")}</div>
                        </div>
                        <span style={{background:overdue?"#fef2f2":"#f0fdf4",color:overdue?"#b91c1c":"#15803d",borderRadius:99,padding:"3px 12px",fontSize:12,fontWeight:700}}>
                          {overdue?"Gecikmiş":"Aktif"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column — QR + info */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <QRSection asset={asset} publicUrl={publicUrl} />

          {/* Quick links */}
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:"16px"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#111827",marginBottom:12}}>Hızlı Erişim</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <Link href={`/app/customers/${asset.customer.id}`}
                style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",
                  borderRadius:8,background:"#f9fafb",border:"1px solid #f3f4f6",
                  textDecoration:"none",fontSize:13,fontWeight:500,color:"#374151",transition:"background 0.12s"}}>
                👤 {asset.customer.name}
              </Link>
              <Link href={`/app/assets/${id}/label`}
                style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",
                  borderRadius:8,background:"#f9fafb",border:"1px solid #f3f4f6",
                  textDecoration:"none",fontSize:13,fontWeight:500,color:"#374151",transition:"background 0.12s"}}>
                🏷 QR Etiket Sayfası
              </Link>
              {asset.locationNote && (
                <div style={{padding:"8px 10px",borderRadius:8,background:"#f9fafb",
                  border:"1px solid #f3f4f6",fontSize:12,color:"#6b7280"}}>
                  📍 {asset.locationNote}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
