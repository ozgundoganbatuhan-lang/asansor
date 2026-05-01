"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type WO = { id:string; code:string; type:string; status:string; createdAt:string;
  customer:{name:string}; technician?:{name:string}|null; asset?:{name:string}|null };
type OD = { id:string; nextDueAt:string; asset:{name:string;customer:{name:string}} };
type LS = { id:string; name:string; stock:number; minStock:number };
type Resp = {
  stats: { customers:number; assets:number; workOrders:number; urgent:number; dueSoon:number; overdue:number; risky:number };
  recentWOs: WO[];
  overdueList: OD[];
  lowStockParts: LS[];
  invoiceSummary: { thisMonthTotal:number; thisMonthCount:number; trend:Array<{month:string;total:number}> };
};

const fmt = (v:number) => new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format((v??0)/100);

const STATUS:{[k:string]:{label:string;bg:string;color:string;border:string;dot:string}} = {
  PENDING:    {label:"Planlı",    bg:"#eff6ff",color:"#1d4ed8",border:"#bfdbfe",dot:"#3b82f6"},
  IN_PROGRESS:{label:"Yolda",    bg:"#fffbeb",color:"#b45309",border:"#fcd34d",dot:"#f59e0b"},
  URGENT:     {label:"Acil",     bg:"#fef2f2",color:"#b91c1c",border:"#fecaca",dot:"#ef4444"},
  DONE:       {label:"Tamam",    bg:"#f0fdf4",color:"#15803d",border:"#bbf7d0",dot:"#22c55e"},
  CANCELED:   {label:"İptal",   bg:"#f1f5f9",color:"#475569",border:"#e2e8f0",dot:"#94a3b8"},
};

const Ic = ({d,size=16,stroke="currentColor"}:{d:string;size?:number;stroke?:string}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke}
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
);

export default function DashboardPage() {
  const [data, setData]       = useState<Resp|null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/dashboard");
        const j = await r.json();
        if (!r.ok) setError(j.error ?? "Yüklenemedi"); else setData(j);
      } catch { setError("Bağlantı hatası"); }
      finally { setLoading(false); }
    })();
  }, []);

  const monthlyTotal = useMemo(() => data?.invoiceSummary.thisMonthTotal ? fmt(data.invoiceSummary.thisMonthTotal) : "₺0", [data]);
  const trendMax = useMemo(() => Math.max(...(data?.invoiceSummary.trend?.map(t=>t.total)??[1]),1), [data]);
  const today = new Date().toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric",weekday:"long"});

  if (loading) return (
    <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{width:36,height:36,border:"3px solid #e2e8f0",borderTopColor:"#2563eb",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
      <div style={{fontSize:13,color:"#94a3b8"}}>Yükleniyor...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (error || !data) return (
    <div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#b91c1c",padding:"14px 18px",borderRadius:14,fontSize:13}}>
      {error ?? "Veri alınamadı."}
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .d-kpi:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(15,23,42,0.09)!important}
        .d-wo:hover{background:#f8fafc!important}
        @media(max-width:900px){.d-g2{grid-template-columns:1fr!important}}
        @media(max-width:700px){.d-g3{grid-template-columns:1fr!important}}
      `}</style>

      {/* ── Hero ── */}
      <div style={{background:"linear-gradient(140deg,#0d1526 0%,#0f2254 55%,#1a3a8a 100%)",
        borderRadius:18,padding:"28px 32px",color:"#fff",position:"relative",overflow:"hidden",
        boxShadow:"0 4px 24px rgba(15,23,42,0.18)"}}>
        <div style={{position:"absolute",top:-120,right:-80,width:440,height:440,
          background:"radial-gradient(circle,rgba(37,99,235,0.22),transparent 68%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-80,left:200,width:340,height:340,
          background:"radial-gradient(circle,rgba(99,102,241,0.16),transparent 65%)",pointerEvents:"none"}}/>
        <div style={{position:"relative",display:"flex",flexWrap:"wrap",alignItems:"flex-end",
          justifyContent:"space-between",gap:18}}>
          <div>
            <div style={{fontSize:10.5,fontWeight:700,textTransform:"uppercase",
              letterSpacing:"0.2em",color:"rgba(255,255,255,0.36)",marginBottom:10}}>
              {today}
            </div>
            <h1 style={{fontSize:28,fontWeight:900,letterSpacing:"-0.05em",lineHeight:1.1,margin:0}}>
              Günün özeti
            </h1>
            <p style={{marginTop:8,fontSize:13.5,lineHeight:1.7,color:"rgba(255,255,255,0.46)",
              maxWidth:460,margin:"8px 0 0"}}>
              Bakım ritmi, acil işler, tahsilat ve stok riski — tek bakışta.
            </p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Link href="/app/work-orders" style={{display:"inline-flex",alignItems:"center",gap:7,
              background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.14)",
              color:"#fff",fontSize:13,fontWeight:700,padding:"9px 17px",borderRadius:10,textDecoration:"none"}}>
              İş emirleri →
            </Link>
            <Link href="/app/work-orders" style={{display:"inline-flex",alignItems:"center",gap:7,
              background:"#fff",color:"#0f172a",fontSize:13,fontWeight:800,
              padding:"9px 17px",borderRadius:10,textDecoration:"none",
              boxShadow:"0 4px 18px rgba(0,0,0,0.2)"}}>
              + Yeni iş emri
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
        {[
          {label:"Aktif İş Emirleri",value:data.stats.workOrders,color:"#2563eb",iconBg:"#eff6ff",
            icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4",
            trend:"+3 dünden",up:true,href:"/app/work-orders"},
          {label:"Acil Müdahale",value:data.stats.urgent,color:"#dc2626",iconBg:"#fef2f2",
            icon:"M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
            trend:"Öncelikli",up:false,href:"/app/work-orders"},
          {label:"Yaklaşan Bakım",value:data.stats.dueSoon,color:"#059669",iconBg:"#f0fdf4",
            icon:"M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z",
            trend:"Takvime bağlı",up:true,href:"/app/maintenance-plans"},
          {label:"Aylık Gelir",value:monthlyTotal,color:"#7c3aed",iconBg:"#f5f3ff",
            icon:"M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
            trend:`${data.invoiceSummary.thisMonthCount} fatura`,up:true,href:"/app/invoices"},
        ].map((k,i) => (
          <Link key={i} href={k.href} className="d-kpi" style={{
            background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,
            padding:"20px 22px",textDecoration:"none",color:"inherit",
            transition:"all .18s",display:"block",boxShadow:"0 2px 8px rgba(15,23,42,0.04)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{width:38,height:38,borderRadius:11,background:k.iconBg,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Ic d={k.icon} size={17} stroke={k.color}/>
              </div>
              <span style={{fontSize:10.5,fontWeight:700,padding:"3px 9px",borderRadius:7,
                background:k.up?"#dcfce7":"#fee2e2",color:k.up?"#15803d":"#b91c1c"}}>
                {k.up?"↑":"↓"} {k.trend}
              </span>
            </div>
            <div className="metric-label">{k.label}</div>
            <div className="metric-value">{k.value}</div>
          </Link>
        ))}
      </div>

      {/* ── Chart + Fleet ── */}
      <div className="d-g2" style={{display:"grid",gridTemplateColumns:"minmax(0,1.4fr) minmax(0,1fr)",gap:14}}>
        {/* Revenue chart */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,
          padding:"22px 24px",boxShadow:"0 2px 8px rgba(15,23,42,0.04)"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22}}>
            <div>
              <div className="metric-label">Gelir Trendi</div>
              <div style={{fontSize:26,fontWeight:900,letterSpacing:"-0.06em",color:"#0f172a",lineHeight:1}}>
                {monthlyTotal}
              </div>
              <div style={{fontSize:12,color:"#64748b",marginTop:5}}>
                Bu ay · {data.invoiceSummary.thisMonthCount} fatura
              </div>
            </div>
            <span style={{fontSize:10.5,fontWeight:700,padding:"4px 10px",borderRadius:8,
              background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0"}}>Son 6 ay</span>
          </div>
          {data.invoiceSummary.trend?.length > 0 ? (
            <div style={{display:"flex",alignItems:"flex-end",gap:7,height:108}}>
              {data.invoiceSummary.trend.map((t,i) => {
                const h = Math.max(8,(t.total/trendMax)*100);
                const isLast = i === data.invoiceSummary.trend.length-1;
                return (
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:7}}>
                    <div style={{width:"100%",height:`${h}%`,
                      background:isLast?"linear-gradient(180deg,#3b82f6,#1d4ed8)":"#e8edf3",
                      borderRadius:"5px 5px 2px 2px",transition:"all .3s"}}
                      title={`${t.month}: ${fmt(t.total)}`}/>
                    <div style={{fontSize:9.5,color:"#94a3b8",fontWeight:600}}>{t.month}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{height:108,display:"flex",alignItems:"center",justifyContent:"center",
              color:"#94a3b8",fontSize:13}}>Henüz veri yok</div>
          )}
        </div>

        {/* Fleet */}
        <div style={{background:"linear-gradient(145deg,#0d1526 0%,#1a3a8a 100%)",
          borderRadius:16,padding:"22px 24px",color:"#fff",position:"relative",overflow:"hidden",
          boxShadow:"0 4px 20px rgba(15,23,42,0.16)"}}>
          <div style={{position:"absolute",top:-70,right:-70,width:220,height:220,
            background:"radial-gradient(circle,rgba(99,102,241,0.3),transparent 70%)"}}/>
          <div style={{position:"relative"}}>
            <div className="metric-label" style={{color:"rgba(255,255,255,0.36)"}}>Toplam Filo</div>
            <div style={{fontSize:"3rem",fontWeight:900,letterSpacing:"-0.08em",lineHeight:1}}>
              {data.stats.assets}
            </div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.46)",marginTop:6}}>Kayıtlı asansör</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:18}}>
              <div style={{background:"rgba(255,255,255,0.07)",borderRadius:11,padding:"12px 14px",
                border:"1px solid rgba(255,255,255,0.06)"}}>
                <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.14em",
                  color:"rgba(255,255,255,0.34)",marginBottom:5}}>Riskli</div>
                <div style={{fontSize:"1.5rem",fontWeight:900}}>{data.stats.risky}</div>
              </div>
              <div style={{background:"rgba(220,38,38,0.16)",borderRadius:11,padding:"12px 14px",
                border:"1px solid rgba(220,38,38,0.2)"}}>
                <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.14em",
                  color:"rgba(252,165,165,0.52)",marginBottom:5}}>Geciken</div>
                <div style={{fontSize:"1.5rem",fontWeight:900,color:"#fca5a5"}}>{data.stats.overdue}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active WOs + Stats ── */}
      <div className="d-g2" style={{display:"grid",gridTemplateColumns:"minmax(0,1.4fr) minmax(0,1fr)",gap:14}}>
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,overflow:"hidden",
          boxShadow:"0 2px 8px rgba(15,23,42,0.04)"}}>
          <div style={{padding:"16px 22px",borderBottom:"1px solid #f1f5f9",
            display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"#0f172a",letterSpacing:"-0.03em"}}>Aktif İş Emirleri</div>
              <div style={{fontSize:12,color:"#64748b",marginTop:2}}>
                {data.stats.workOrders} açık · {data.stats.urgent} acil
              </div>
            </div>
            <Link href="/app/work-orders" style={{fontSize:12,color:"#2563eb",fontWeight:700,textDecoration:"none"}}>
              Tümü →
            </Link>
          </div>
          <div>
            {data.recentWOs.length === 0 ? (
              <p style={{fontSize:13,color:"#94a3b8",textAlign:"center",padding:32}}>Aktif iş emri yok.</p>
            ) : data.recentWOs.slice(0,5).map((wo,i) => {
              const sc = STATUS[wo.status] ?? STATUS.PENDING;
              return (
                <Link key={wo.id} href={`/app/work-orders/${wo.id}`} className="d-wo" style={{
                  display:"flex",alignItems:"center",gap:14,padding:"12px 22px",
                  borderBottom:i<Math.min(data.recentWOs.length,5)-1?"1px solid #f1f5f9":"none",
                  textDecoration:"none",color:"inherit",transition:"all .12s"}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:sc.dot,flexShrink:0,
                    boxShadow:`0 0 0 3px ${sc.bg}`}}/>
                  <span style={{fontFamily:"ui-monospace,monospace",fontSize:11,fontWeight:700,
                    color:"#2563eb",width:52,flexShrink:0}}>{wo.code}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#0f172a",
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {wo.asset?.name ?? wo.customer.name}
                    </div>
                    <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>
                      {wo.customer.name} · {wo.technician?.name ?? "Atanmadı"}
                    </div>
                  </div>
                  <span className="badge" style={{background:sc.bg,color:sc.color,borderColor:sc.border}}>
                    {sc.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"22px",
          boxShadow:"0 2px 8px rgba(15,23,42,0.04)"}}>
          <div style={{fontSize:14,fontWeight:800,color:"#0f172a",letterSpacing:"-0.03em",marginBottom:16}}>
            Operasyon Özeti
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              {k:"Müşteri portföyü",v:data.stats.customers,d:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z",c:"#2563eb",bg:"#eff6ff"},
              {k:"Aktif iş akışı",v:data.stats.workOrders,d:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4",c:"#7c3aed",bg:"#f5f3ff"},
              {k:"Acil müdahale",v:data.stats.urgent,d:"M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",c:"#dc2626",bg:"#fef2f2"},
              {k:"Yaklaşan bakım",v:data.stats.dueSoon,d:"M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z",c:"#d97706",bg:"#fffbeb"},
            ].map((r,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",
                background:"#f8fafc",borderRadius:11,border:"1px solid #f1f5f9"}}>
                <div style={{width:32,height:32,borderRadius:9,background:r.bg,
                  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Ic d={r.d} size={14} stroke={r.c}/>
                </div>
                <div style={{flex:1,fontSize:13,color:"#475569",fontWeight:500}}>{r.k}</div>
                <div style={{fontSize:17,fontWeight:900,color:r.c,letterSpacing:"-0.04em"}}>{r.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Overdue + Low Stock ── */}
      <div className="d-g3" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,overflow:"hidden",
          boxShadow:"0 2px 8px rgba(15,23,42,0.04)"}}>
          <div style={{padding:"16px 22px",borderBottom:"1px solid #f1f5f9",
            display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"#0f172a",letterSpacing:"-0.03em"}}>Geciken Bakımlar</div>
              <div style={{fontSize:12,color:"#64748b",marginTop:2}}>Tarih kaçırılan asansörler</div>
            </div>
            {data.overdueList.length>0&&<span style={{fontSize:10.5,fontWeight:700,color:"#fff",
              background:"#dc2626",padding:"3px 9px",borderRadius:999}}>{data.overdueList.length}</span>}
          </div>
          <div style={{padding:"6px 14px"}}>
            {data.overdueList.length===0 ? (
              <p style={{fontSize:13,color:"#94a3b8",textAlign:"center",padding:28}}>Geciken bakım yok ✓</p>
            ) : data.overdueList.slice(0,5).map((it,i) => {
              const days=Math.floor((Date.now()-new Date(it.nextDueAt).getTime())/86400000);
              return (
                <div key={it.id} style={{display:"flex",alignItems:"center",gap:11,padding:"10px 8px",
                  borderBottom:i<4?"1px solid #f1f5f9":"none"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",
                    background:days>30?"#ef4444":"#f59e0b",flexShrink:0,
                    boxShadow:`0 0 0 3px ${days>30?"rgba(239,68,68,.14)":"rgba(245,158,11,.14)"}`}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#0f172a",
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.asset.name}</div>
                    <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{it.asset.customer.name}</div>
                  </div>
                  <span style={{fontSize:10.5,fontWeight:700,padding:"3px 9px",borderRadius:7,
                    background:days>30?"#fef2f2":"#fffbeb",color:days>30?"#b91c1c":"#b45309"}}>
                    +{days}g
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,overflow:"hidden",
          boxShadow:"0 2px 8px rgba(15,23,42,0.04)"}}>
          <div style={{padding:"16px 22px",borderBottom:"1px solid #f1f5f9"}}>
            <div style={{fontSize:14,fontWeight:800,color:"#0f172a",letterSpacing:"-0.03em"}}>Stok Uyarıları</div>
            <div style={{fontSize:12,color:"#64748b",marginTop:2}}>Minimum seviyenin altındaki parçalar</div>
          </div>
          <div style={{padding:"6px 14px"}}>
            {data.lowStockParts.length===0 ? (
              <p style={{fontSize:13,color:"#94a3b8",textAlign:"center",padding:28}}>Stok riski yok ✓</p>
            ) : data.lowStockParts.slice(0,5).map((p,i) => (
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:11,padding:"10px 8px",
                borderBottom:i<4?"1px solid #f1f5f9":"none"}}>
                <div style={{width:32,height:32,borderRadius:9,
                  background:p.stock<=0?"#fef2f2":"#fffbeb",
                  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Ic d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"
                    size={14} stroke={p.stock<=0?"#dc2626":"#d97706"}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{p.name}</div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>Min: {p.minStock}</div>
                </div>
                <span style={{fontSize:14,fontWeight:900,color:p.stock<=0?"#b91c1c":"#b45309"}}>
                  {p.stock}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
