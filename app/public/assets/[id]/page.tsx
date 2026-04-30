import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyAssetShareToken } from "@/lib/asset-share";
import { statusLabel, inspectionDueDate, daysBetween } from "@/lib/utils";

export default async function PublicAssetPage({
  params, searchParams,
}: { params: Promise<{id:string}>; searchParams: Promise<{token?:string}> }) {
  const {id}    = await params;
  const {token} = await searchParams;

  if(!token) return <Err title="QR bağlantısı geçersiz" desc="Bu sayfa yalnızca geçerli bir QR kod tarandığında açılır." />;

  let payload: {assetId:string;orgId:string}|null = null;
  try { payload = verifyAssetShareToken(token); } catch {}
  if(!payload||payload.assetId!==id) return <Err title="Bağlantı süresi dolmuş" desc="QR kodunun bağlantı süresi dolmuş. Servis firmasıyla iletişime geçin." />;

  let asset: any = null;
  let org: any = null;
  try {
    [asset, org] = await Promise.all([
      prisma.asset.findFirst({
        where:{id,organizationId:payload.orgId},
        include:{
          customer:{select:{name:true,address:true,phone:true}},
          workOrders:{orderBy:{createdAt:"desc"},take:8,include:{technician:{select:{name:true}}}},
          maintenancePlans:{orderBy:{nextDueAt:"asc"},take:2},
          inspections:{orderBy:{inspectionDate:"desc"},take:3},
          contractAssets:{include:{contract:{select:{id:true,contractNumber:true,fileUrl:true,startDate:true,endDate:true,status:true}}}},
        },
      }),
      prisma.organization.findUnique({where:{id:payload.orgId},select:{name:true,phone:true,website:true}}),
    ]);
  } catch(err) {
    console.error("[PublicAssetPage] error:", err);
    return <Err title="Geçici hata" desc="Veriler yüklenirken bir sorun oluştu. Lütfen birkaç dakika sonra tekrar deneyin." />;
  }

  if(!asset) return <Err title="Asansör bulunamadı" desc="Bu QR koda ait asansör kaydı sistemde mevcut değil." />;

  // ── Computed ──────────────────────────────────────────────
  const latestInsp = asset.inspections[0];
  const lastInspDate = latestInsp ? new Date(latestInsp.inspectionDate).toLocaleDateString("tr-TR") : null;
  const inspLabel   = latestInsp?.label ?? null;
  let labelDaysLeft: number|null = null;
  if(latestInsp) {
    try { const due=inspectionDueDate(new Date(latestInsp.inspectionDate),latestInsp.label); labelDaysLeft=daysBetween(due,new Date()); } catch {}
  }
  const nextDue = asset.maintenancePlans[0]?.nextDueAt ? new Date(asset.maintenancePlans[0].nextDueAt).toLocaleDateString("tr-TR") : null;

  // Org contact: use org fields, then env fallback
  const orgName    = org?.name ?? (process.env.NEXT_PUBLIC_ORG_NAME ?? "Servis Firması");
  const orgPhone   = org?.phone ?? (process.env.NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY ?? "+90 555 000 00 00");
  const orgPhoneRaw= (org?.phone ?? process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "+905550000000").replace(/\D/g,"");
  const orgWebsite = org?.website ?? process.env.NEXT_PUBLIC_ORG_WEBSITE ?? null;
  const orgEmail   = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "info@servisim.app";
  const waLink     = `https://wa.me/${orgPhoneRaw}?text=Servis%20bilgisi%20almak%20istiyorum`;

  const LABEL_COLOR:Record<string,string>={YESIL:"#22c55e",MAVI:"#3b82f6",SARI:"#f59e0b",KIRMIZI:"#dc2626"};
  const dotColor   = inspLabel ? (LABEL_COLOR[inspLabel]??"#94a3b8") : "#94a3b8";

  const documents  = (asset.contractAssets??[])
    .map((ca:any)=>ca.contract).filter((c:any)=>c?.fileUrl)
    .map((c:any)=>({id:c.id,number:c.contractNumber??"Belge",fileUrl:c.fileUrl,startDate:c.startDate}));

  const gl = {background:"rgba(255,255,255,0.09)",border:"1px solid rgba(255,255,255,0.10)",backdropFilter:"blur(12px)"} as const;

  return (
    <main style={{minHeight:"100vh",background:"linear-gradient(180deg,#06142d 0%,#0b2553 38%,#102d63 100%)",padding:"24px 16px 60px",color:"#fff",fontFamily:"'Plus Jakarta Sans',-apple-system,system-ui,sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box}`}</style>
      <div style={{maxWidth:860,margin:"0 auto"}}>

        {/* Org header strip */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",marginBottom:20,...gl,borderRadius:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🛗</div>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:"#fff"}}>{orgName}</div>
              {orgWebsite && <a href={orgWebsite.startsWith("http")?orgWebsite:`https://${orgWebsite}`} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"rgba(255,255,255,0.45)",textDecoration:"none"}}>{orgWebsite.replace(/^https?:\/\//,"")}</a>}
            </div>
          </div>
          <span style={{background:"rgba(34,197,94,0.15)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:999,padding:"4px 12px",fontSize:11,fontWeight:700,color:"#86efac",display:"flex",alignItems:"center",gap:5}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>QR Görünümü
          </span>
        </div>

        {/* Hero */}
        <section style={{...gl,borderRadius:24,padding:"28px 24px",marginBottom:16,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,right:0,width:"45%",height:"100%",background:"radial-gradient(circle at top right,rgba(255,255,255,0.12),transparent 60%)",pointerEvents:"none"}}/>
          <div style={{position:"relative"}}>
            <h1 style={{fontSize:"clamp(22px,4vw,34px)",fontWeight:900,letterSpacing:"-0.04em",lineHeight:1.1,margin:"0 0 8px"}}>{asset.name}</h1>
            <p style={{fontSize:14,color:"rgba(255,255,255,0.5)",margin:"0 0 20px"}}>{asset.customer?.name}{asset.buildingName?` · ${asset.buildingName}`:""}</p>

            {/* Status chips */}
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
              {lastInspDate && (
                <div style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:12,padding:"10px 14px"}}>
                  <div style={{fontSize:9.5,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"rgba(255,255,255,0.4)",marginBottom:4}}>Son Kontrol Tarihi</div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>{lastInspDate}</div>
                </div>
              )}
              {inspLabel && (
                <div style={{background:`${dotColor}18`,border:`1px solid ${dotColor}44`,borderRadius:12,padding:"10px 14px"}}>
                  <div style={{fontSize:9.5,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"rgba(255,255,255,0.4)",marginBottom:4}}>Etiket</div>
                  <div style={{fontSize:14,fontWeight:800,color:dotColor}}>● {inspLabel}</div>
                </div>
              )}
              {nextDue && (
                <div style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:12,padding:"10px 14px"}}>
                  <div style={{fontSize:9.5,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"rgba(255,255,255,0.4)",marginBottom:4}}>Sonraki Bakım</div>
                  <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>{nextDue}</div>
                </div>
              )}
              {labelDaysLeft!=null && (
                <div style={{background:labelDaysLeft<30?"rgba(220,38,38,0.15)":"rgba(255,255,255,0.10)",border:`1px solid ${labelDaysLeft<30?"rgba(220,38,38,0.3)":"rgba(255,255,255,0.14)"}`,borderRadius:12,padding:"10px 14px"}}>
                  <div style={{fontSize:9.5,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"rgba(255,255,255,0.4)",marginBottom:4}}>Kalan Süre</div>
                  <div style={{fontSize:14,fontWeight:800,color:labelDaysLeft<30?"#fca5a5":"#fff"}}>{labelDaysLeft} gün</div>
                </div>
              )}
            </div>

            {/* Asset details */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8}}>
              {[
                {l:"Asansör ID",v:asset.elevatorIdNo},
                {l:"Konum Notu",v:asset.locationNote},
                {l:"Adres",v:asset.customer?.address},
              ].filter(r=>r.v).map(r=>(
                <div key={r.l} style={{background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"10px 13px"}}>
                  <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"rgba(255,255,255,0.35)",marginBottom:3}}>{r.l}</div>
                  <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.85)"}}>{r.v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Servis zaman akışı */}
        <section style={{...gl,borderRadius:24,padding:"22px 20px",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <div>
              <div style={{fontSize:15,fontWeight:800,letterSpacing:"-0.02em"}}>Servis Geçmişi</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:2}}>Son servis kayıtları</div>
            </div>
            <span style={{background:"rgba(255,255,255,0.10)",borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:700}}>{asset.workOrders.length} kayıt</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {asset.workOrders.length===0 ? (
              <div style={{background:"rgba(255,255,255,0.05)",borderRadius:12,padding:"14px",fontSize:13,color:"rgba(255,255,255,0.4)"}}>Henüz servis kaydı bulunmuyor.</div>
            ) : asset.workOrders.map((w:any)=>(
              <article key={w.id} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"14px 18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700}}>{w.code}</div>
                    <div style={{fontSize:11.5,color:"rgba(255,255,255,0.45)",marginTop:2}}>{new Date(w.createdAt).toLocaleDateString("tr-TR")} · {w.technician?.name??"—"}</div>
                  </div>
                  <span style={{background:"rgba(255,255,255,0.12)",borderRadius:999,padding:"3px 10px",fontSize:10.5,fontWeight:700}}>{statusLabel(w.status)}</span>
                </div>
                <div style={{background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"10px 13px",fontSize:12.5,lineHeight:1.6,color:"rgba(255,255,255,0.55)"}}>
                  {(w as any).note||"Servis özeti eklenmedi."}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Periyodik kontroller */}
        {asset.inspections.length>0 && (
          <section style={{...gl,borderRadius:24,padding:"22px 20px",marginBottom:16}}>
            <div style={{fontSize:15,fontWeight:800,letterSpacing:"-0.02em",marginBottom:14}}>Kontrol Geçmişi</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {asset.inspections.map((ins:any)=>{
                const dc=LABEL_COLOR[ins.label]??"#94a3b8";
                return (
                  <div key={ins.id} style={{background:"rgba(255,255,255,0.07)",borderRadius:14,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700}}>{new Date(ins.inspectionDate).toLocaleDateString("tr-TR")}</div>
                      {ins.note && <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",marginTop:2}}>{ins.note}</div>}
                    </div>
                    <span style={{background:`${dc}22`,color:dc,border:`1px solid ${dc}44`,borderRadius:999,padding:"3px 12px",fontSize:11.5,fontWeight:700}}>● {ins.label||"—"}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Documents */}
        {documents.length>0 && (
          <section style={{...gl,borderRadius:24,padding:"22px 20px",marginBottom:16}}>
            <div style={{fontSize:15,fontWeight:800,marginBottom:14}}>Belgeler</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {documents.map((d:any)=>(
                <div key={d.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,background:"rgba(255,255,255,0.07)",borderRadius:14,padding:"12px 16px"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700}}>{d.number}</div>
                    {d.startDate&&<div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>{new Date(d.startDate).toLocaleDateString("tr-TR")}</div>}
                  </div>
                  <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" style={{background:"#2563eb",color:"#fff",fontSize:12,fontWeight:700,padding:"7px 14px",borderRadius:9,textDecoration:"none"}}>Görüntüle</a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact */}
        <section style={{background:"rgba(255,255,255,0.97)",borderRadius:24,padding:"24px",color:"#111"}}>
          <div style={{fontSize:13,fontWeight:800,color:"#0f172a",marginBottom:4}}>İletişim</div>
          <p style={{fontSize:13,color:"#6b7280",lineHeight:1.7,margin:"0 0 18px"}}>
            Arıza bildirimi, bakım randevusu veya bilgi almak için aşağıdaki kanalları kullanabilirsiniz.
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <a href={`tel:${orgPhoneRaw}`} style={{display:"flex",alignItems:"center",gap:10,background:"#2563eb",color:"#fff",borderRadius:12,padding:"13px 18px",textDecoration:"none",fontWeight:700,fontSize:14}}>
              📞 {orgPhone}
            </a>
            <a href={waLink} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:10,background:"#25d366",color:"#fff",borderRadius:12,padding:"13px 18px",textDecoration:"none",fontWeight:700,fontSize:14}}>
              💬 WhatsApp ile Yaz
            </a>
            <a href={`mailto:${orgEmail}`} style={{display:"flex",alignItems:"center",gap:10,background:"#f3f4f6",color:"#334155",borderRadius:12,padding:"13px 18px",textDecoration:"none",fontWeight:600,fontSize:14}}>
              ✉️ {orgEmail}
            </a>
          </div>
          {/* Service firm footer */}
          <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:12.5,fontWeight:700,color:"#0f172a"}}>{orgName}</div>
              {orgWebsite && <a href={orgWebsite.startsWith("http")?orgWebsite:`https://${orgWebsite}`} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:"#2563eb",textDecoration:"none"}}>{orgWebsite.replace(/^https?:\/\//,"")}</a>}
            </div>
            <div style={{fontSize:11,color:"#94a3b8"}}>Servisim ile yönetiliyor</div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Err({title,desc}:{title:string;desc:string}) {
  return (
    <main style={{minHeight:"100vh",background:"linear-gradient(180deg,#06142d,#0b2553)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif"}}>
      <div style={{maxWidth:400,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:18,padding:"32px",textAlign:"center",color:"#fff"}}>
        <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
        <h1 style={{fontSize:20,fontWeight:800,margin:"0 0 10px"}}>{title}</h1>
        <p style={{fontSize:14,color:"rgba(255,255,255,0.5)",lineHeight:1.7,margin:0}}>{desc}</p>
      </div>
    </main>
  );
}

// avoid unused import error
const LABEL_COLOR:Record<string,string>={YESIL:"#22c55e",MAVI:"#3b82f6",SARI:"#f59e0b",KIRMIZI:"#dc2626"};
