"use client";
import { useEffect, useMemo, useState } from "react";

type WO = { id:string; status:string; type:string; createdAt:string; completedAt?:string|null; laborCost:number; serviceFee:number; partsUsed:{quantity:number;part:{price?:number|null}}[] };
type Invoice = { id:string; status:string; total:number; issuedAt:string; paidAt?:string|null };

function dlCSV(name:string, rows:Record<string,unknown>[]) {
  if(!rows.length) return;
  const h=Object.keys(rows[0]);
  const csv=[h.join(","),...rows.map(r=>h.map(k=>`"${String(r[k]??"").replaceAll('"','""')}"`).join(","))].join("\n");
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  a.download=name; a.click();
}

const money=(v:number)=>new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format((v??0)/100);

const MONTHS_TR=["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
const TYPE_L:Record<string,string>={FAULT:"Arıza",PERIODIC_MAINTENANCE:"Periyodik",ANNUAL_INSPECTION:"Muayene",REVISION:"Revizyon",INSTALLATION:"Kurulum"};

export default function ReportsPage() {
  const [wos,setWOs] = useState<WO[]>([]);
  const [invs,setInvs] = useState<Invoice[]>([]);
  const [loading,setLoading] = useState(true);
  const [err,setErr] = useState<string|null>(null);
  const [tab,setTab] = useState<"overview"|"workorders"|"finance">("overview");

  useEffect(()=>{
    Promise.all([fetch("/api/work-orders"),fetch("/api/invoices")]).then(async([w,i])=>{
      const [wd,id]=await Promise.all([w.json().catch(()=>({})),i.json().catch(()=>({}))]);
      if(!w.ok){setErr(wd.error??"Hata");return;}
      setWOs(wd.items??[]); setInvs(id.items??[]);
    }).finally(()=>setLoading(false));
  },[]);

  const kpi = useMemo(()=>{
    const done=wos.filter(w=>w.status==="DONE").length;
    const urgent=wos.filter(w=>w.status==="URGENT").length;
    const paidInvs=invs.filter(i=>i.status==="PAID");
    const totalInv=invs.reduce((a,i)=>a+(i.total??0),0);
    const paidTotal=paidInvs.reduce((a,i)=>a+(i.total??0),0);
    const rate=wos.length>0?Math.round(done/wos.length*100):0;
    return {total:wos.length,done,urgent,totalInv,paidTotal,openTotal:totalInv-paidTotal,rate};
  },[wos,invs]);

  // Revenue trend (last 6 months)
  const trend = useMemo(()=>{
    const now=new Date(); const months:Record<string,number>={};
    for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months[`${d.getFullYear()}-${d.getMonth()}`]=0;}
    invs.filter(i=>i.status==="PAID").forEach(i=>{
      const d=new Date(i.issuedAt);
      const k=`${d.getFullYear()}-${d.getMonth()}`;
      if(k in months) months[k]+=(i.total??0);
    });
    return Object.entries(months).map(([k,v])=>{const[y,m]=k.split("-");return {label:`${MONTHS_TR[parseInt(m)]} ${y}`,val:v};});
  },[invs]);

  const trendMax=Math.max(...trend.map(t=>t.val),1);

  const woByType = useMemo(()=>{
    const m:Record<string,number>={};
    wos.forEach(w=>{m[w.type]=(m[w.type]??0)+1;});
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  },[wos]);

  const TABS=[{k:"overview",l:"Genel Bakış"},{k:"workorders",l:"İş Emirleri"},{k:"finance",l:"Finansal"}] as const;

  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:300,gap:12,color:"#6E6455",fontSize:14}}><div style={{width:24,height:24,border:"3px solid #e2e8f0",borderTopColor:"#7c3aed",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>Yükleniyor...</div>;
  if(err) return <div style={{background:"#FCECE8",border:"1px solid #fecaca",borderRadius:12,padding:"16px 20px",color:"#C0311A"}}>⚠️ {err}</div>;

  return (
    <div style={{maxWidth:1000,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"#9C9080",marginBottom:6}}>Analitik & Veri</div>
          <h1 style={{fontSize:28,fontWeight:900,letterSpacing:"-0.04em",color:"#1A1510",margin:0}}>Raporlar</h1>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>dlCSV("is-emirleri.csv",wos.map(w=>({Kod:w.status,Tip:TYPE_L[w.type]??w.type,Durum:w.status,Tarih:w.createdAt.slice(0,10)})))} style={{background:"#F0EDE6",border:"none",borderRadius:10,padding:"10px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#6E6455"}}>
            ⬇ İş Emirleri CSV
          </button>
          <button onClick={()=>dlCSV("faturalar.csv",invs.map(i=>({Durum:i.status,Toplam:i.total,Tarih:i.issuedAt.slice(0,10)})))} style={{background:"#1A1510",color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            ⬇ Faturalar CSV
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:24}}>
        {[
          {l:"Toplam İş",v:kpi.total,c:"#1A1510",bg:"#F0EDE6",icon:"📋"},
          {l:"Tamamlanan",v:kpi.done,c:"#059669",bg:"#E8F5EE",icon:"✅"},
          {l:"Tamamlanma %",v:`%${kpi.rate}`,c:"#7c3aed",bg:"#f5f3ff",icon:"📊"},
          {l:"Acil",v:kpi.urgent,c:"#C0311A",bg:"#FCECE8",icon:"🚨"},
          {l:"Faturalanan",v:money(kpi.totalInv),c:"#1A1510",bg:"#f9f9fb",icon:"🧾"},
          {l:"Tahsil",v:money(kpi.paidTotal),c:"#059669",bg:"#E8F5EE",icon:"💰"},
          {l:"Bekleyen",v:money(kpi.openTotal),c:"#d97706",bg:"#FFF3DC",icon:"⏳"},
        ].map(k=>(
          <div key={k.l} style={{background:k.bg,borderRadius:14,padding:"16px 18px"}}>
            <div style={{fontSize:18,marginBottom:6}}>{k.icon}</div>
            <div style={{fontSize:typeof k.v==="number"&&k.v<1000?22:15,fontWeight:900,color:k.c,letterSpacing:"-0.03em",lineHeight:1.1}}>{k.v}</div>
            <div style={{fontSize:11,color:"#6E6455",marginTop:4,fontWeight:600}}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,background:"#F0EDE6",borderRadius:14,padding:4,marginBottom:20}}>
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{flex:1,padding:"9px 16px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,transition:"all 0.15s",background:tab===t.k?"#fff":"transparent",color:tab===t.k?"#1A1510":"#6E6455",boxShadow:tab===t.k?"0 1px 4px rgba(0,0,0,0.08)":"none",fontFamily:"inherit"}}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab==="overview" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {/* Revenue trend */}
          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:18,padding:"24px"}}>
            <div style={{fontSize:14,fontWeight:800,color:"#1A1510",marginBottom:4}}>Gelir Trendi</div>
            <div style={{fontSize:12,color:"#6E6455",marginBottom:20}}>Son 6 ay • tahsil edilen</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:8,height:120}}>
              {trend.map(t=>(
                <div key={t.label} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                  <div style={{fontSize:10,color:"#9C9080",fontWeight:600,textAlign:"center"}}>{t.val>0?money(t.val):""}</div>
                  <div style={{width:"100%",borderRadius:"6px 6px 0 0",background:t.val>0?"#1B1F2B":"#D6D0C4",height:`${Math.max((t.val/trendMax)*100,4)}%`,transition:"height 0.4s"}}/>
                  <div style={{fontSize:10,color:"#6E6455",fontWeight:600}}>{t.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Work order types */}
          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:18,padding:"24px"}}>
            <div style={{fontSize:14,fontWeight:800,color:"#1A1510",marginBottom:4}}>İş Emri Dağılımı</div>
            <div style={{fontSize:12,color:"#6E6455",marginBottom:20}}>Türe göre</div>
            {woByType.length===0 ? <div style={{color:"#9C9080",fontSize:13}}>Veri yok.</div> : (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {woByType.map(([type,count])=>{
                  const pct=Math.round(count/wos.length*100);
                  return (
                    <div key={type}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                        <span style={{fontSize:12.5,fontWeight:600,color:"#6E6455"}}>{TYPE_L[type]??type}</span>
                        <span style={{fontSize:12.5,fontWeight:800,color:"#1A1510"}}>{count} <span style={{color:"#9C9080",fontWeight:500}}>(%{pct})</span></span>
                      </div>
                      <div style={{height:6,background:"#F0EDE6",borderRadius:999,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#2563eb,#7c3aed)",borderRadius:999,transition:"width 0.4s"}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Work orders table */}
      {tab==="workorders" && (
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:18,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1.5fr 1fr 1fr",padding:"12px 20px",background:"#f9f9fb",borderBottom:"1px solid #e2e8f0"}}>
            {["Durum","Tür","Tarih",""].map(h=><div key={h} style={{fontSize:10.5,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#9C9080"}}>{h}</div>)}
          </div>
          {wos.slice(0,50).map((w,i)=>{
            const S:Record<string,{bg:string;c:string}>={DONE:{bg:"#E8F5EE",c:"#2E7D4F"},URGENT:{bg:"#FCECE8",c:"#C0311A"},IN_PROGRESS:{bg:"#FFF3DC",c:"#B86800"},PENDING:{bg:"#E4EFF9",c:"#0F121A"},CANCELED:{bg:"#F0EDE6",c:"#6E6455"}};
            const s=S[w.status]??{bg:"#F0EDE6",c:"#6E6455"};
            return (
              <div key={w.id} style={{display:"grid",gridTemplateColumns:"1fr 1.5fr 1fr 1fr",padding:"13px 20px",borderBottom:i<Math.min(wos.length,50)-1?"1px solid #f1f5f9":"none",alignItems:"center"}}>
                <span style={{background:s.bg,color:s.c,borderRadius:999,padding:"3px 10px",fontSize:12,fontWeight:700,display:"inline-block"}}>{w.status==="DONE"?"Tamam":w.status==="URGENT"?"Acil":w.status==="IN_PROGRESS"?"Devam":w.status==="PENDING"?"Planlı":"İptal"}</span>
                <span style={{fontSize:13,color:"#6E6455"}}>{TYPE_L[w.type]??w.type}</span>
                <span style={{fontSize:12,color:"#6E6455"}}>{new Date(w.createdAt).toLocaleDateString("tr-TR")}</span>
                <span style={{fontSize:12,color:"#6E6455"}}>{w.laborCost||w.serviceFee?money((w.laborCost??0)+(w.serviceFee??0)):"—"}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Finance */}
      {tab==="finance" && (
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:18,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",padding:"12px 20px",background:"#f9f9fb",borderBottom:"1px solid #e2e8f0"}}>
            {["Durum","Tutar","Fatura Tarihi","Ödeme"].map(h=><div key={h} style={{fontSize:10.5,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#9C9080"}}>{h}</div>)}
          </div>
          {invs.slice(0,50).map((inv,i)=>{
            const paid=inv.status==="PAID";
            return (
              <div key={inv.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",padding:"13px 20px",borderBottom:i<Math.min(invs.length,50)-1?"1px solid #f1f5f9":"none",alignItems:"center"}}>
                <span style={{background:paid?"#E8F5EE":"#FFF3DC",color:paid?"#2E7D4F":"#B86800",borderRadius:999,padding:"3px 10px",fontSize:12,fontWeight:700,display:"inline-block"}}>{paid?"Ödendi":"Bekliyor"}</span>
                <span style={{fontSize:13,fontWeight:700,color:"#1A1510"}}>{money(inv.total)}</span>
                <span style={{fontSize:12,color:"#6E6455"}}>{new Date(inv.issuedAt).toLocaleDateString("tr-TR")}</span>
                <span style={{fontSize:12,color:"#6E6455"}}>{inv.paidAt?new Date(inv.paidAt).toLocaleDateString("tr-TR"):"—"}</span>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
