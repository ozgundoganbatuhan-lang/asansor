"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type WorkOrder = {
  id: string; code: string; status: string; type: string;
  scheduledAt?: string | null;
  customer: { name: string };
  technician?: { name: string; initials?: string | null } | null;
  asset?: { name: string } | null;
};

const TYPE_L: Record<string,string> = { FAULT:"Arıza", PERIODIC_MAINTENANCE:"Periyodik", ANNUAL_INSPECTION:"Muayene", REVISION:"Revizyon", INSTALLATION:"Kurulum" };
const S_CFG: Record<string,{bg:string;color:string;dot:string}> = {
  URGENT:      {bg:"#FCECE8",color:"#C0311A",dot:"#dc2626"},
  IN_PROGRESS: {bg:"#FFF3DC",color:"#B86800",dot:"#d97706"},
  DONE:        {bg:"#E8F5EE",color:"#2E7D4F",dot:"#2E7D4F"},
  PENDING:     {bg:"#E4EFF9",color:"#0F121A",dot:"#C87800"},
  CANCELED:    {bg:"#F0EDE6",color:"#6E6455",dot:"#9C9080"},
};
const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const DAYS   = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];

function toKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function dow(d: Date) { return (d.getDay()+6)%7; }
function daysInMonth(y:number,m:number) { return new Date(y,m+1,0).getDate(); }

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [items, setItems] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>(toKey(today));

  useEffect(() => {
    fetch("/api/work-orders").then(r=>r.json()).then(d=>{
      setItems((d.items??[]).filter((x:WorkOrder)=>x.scheduledAt));
    }).finally(()=>setLoading(false));
  }, []);

  const byDate = useMemo(() => {
    const map: Record<string,WorkOrder[]> = {};
    items.forEach(w => {
      if (!w.scheduledAt) return;
      const k = w.scheduledAt.slice(0,10);
      if (!map[k]) map[k]=[];
      map[k].push(w);
    });
    return map;
  }, [items]);

  function prev() { if(month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); }
  function next() { if(month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); }

  const grid = useMemo(() => {
    const first = new Date(year, month, 1);
    const offset = dow(first);
    const days = daysInMonth(year, month);
    const cells: (number|null)[] = [];
    for(let i=0;i<offset;i++) cells.push(null);
    for(let d=1;d<=days;d++) cells.push(d);
    while(cells.length%7!==0) cells.push(null);
    return cells;
  }, [year, month]);

  const selectedWOs = byDate[selected] ?? [];
  const todayKey = toKey(today);

  const monthTotal   = Object.entries(byDate).filter(([k])=>k.startsWith(`${year}-${String(month+1).padStart(2,"0")}`)).reduce((a,[,v])=>a+v.length,0);
  const urgentCount  = items.filter(w=>w.status==="URGENT").length;
  const pendingCount = items.filter(w=>w.status==="PENDING").length;

  const s = (st:string) => S_CFG[st] ?? {bg:"#F0EDE6",color:"#6E6455",dot:"#9C9080"};

  return (
    <div style={{maxWidth:1100,margin:"0 auto"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"#9C9080",marginBottom:6}}>Operasyon</div>
          <h1 style={{fontSize:28,fontWeight:900,letterSpacing:"-0.04em",color:"#1A1510",margin:0}}>Takvim</h1>
        </div>
        <div style={{display:"flex",gap:10}}>
          {[{l:"Bu Ay",v:monthTotal,c:"#1A1510",bg:"#F0EDE6"},{l:"Acil",v:urgentCount,c:"#C0311A",bg:"#FCECE8"},{l:"Planlı",v:pendingCount,c:"#0F121A",bg:"#E4EFF9"}].map(k=>(
            <div key={k.l} style={{background:k.bg,borderRadius:12,padding:"10px 16px",textAlign:"center",minWidth:72}}>
              <div style={{fontSize:20,fontWeight:900,color:k.c,letterSpacing:"-0.04em"}}>{k.v}</div>
              <div style={{fontSize:11,color:"#6E6455",marginTop:2,fontWeight:600}}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:20,alignItems:"start"}}>
        {/* Calendar grid */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:18,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
          {/* Month nav */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px",borderBottom:"1px solid #f1f5f9"}}>
            <button onClick={prev} style={{width:36,height:36,borderRadius:9,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontFamily:"inherit"}}>‹</button>
            <div style={{fontSize:17,fontWeight:900,color:"#1A1510",letterSpacing:"-0.03em"}}>{MONTHS[month]} {year}</div>
            <button onClick={next} style={{width:36,height:36,borderRadius:9,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontFamily:"inherit"}}>›</button>
          </div>
          {/* Day headers */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"10px 16px 6px"}}>
            {DAYS.map(d=>(
              <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"#9C9080",padding:"4px 0"}}>{d}</div>
            ))}
          </div>
          {/* Cells */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0 16px 16px",gap:3}}>
            {grid.map((day,i) => {
              if(!day) return <div key={i}/>;
              const k = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const wos = byDate[k]??[];
              const isToday = k===todayKey;
              const isSel   = k===selected;
              const hasUrgent = wos.some(w=>w.status==="URGENT");
              return (
                <button key={i} onClick={()=>setSelected(k)} style={{
                  border:"none",cursor:"pointer",padding:"6px 4px",borderRadius:10,
                  outline: isSel ? "2px solid #2563eb" : "none",
                  background: isSel ? "#E4EFF9" : isToday ? "#f5f3ff" : "transparent",
                  transition:"all 0.12s", fontFamily:"inherit",
                }}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:isToday?"#0d1117":"transparent",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",fontSize:13,fontWeight:isToday?900:600,color:isToday?"#fff":isSel?"#0F121A":"#1A1510"}}>
                    {day}
                  </div>
                  {wos.length>0 && (
                    <div style={{display:"flex",justifyContent:"center",gap:2,marginTop:3}}>
                      {wos.slice(0,3).map((w,ii)=>(
                        <span key={ii} style={{width:5,height:5,borderRadius:"50%",background:hasUrgent?"#dc2626":s(w.status).dot,display:"inline-block"}}/>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Selected day */}
          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:18,padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#1A1510",marginBottom:14,letterSpacing:"-0.01em"}}>
              {new Date(selected+"T00:00").toLocaleDateString("tr-TR",{weekday:"long",day:"numeric",month:"long"})}
            </div>
            {loading ? (
              <div style={{color:"#9C9080",fontSize:13}}>Yükleniyor...</div>
            ) : selectedWOs.length===0 ? (
              <div style={{textAlign:"center",padding:"24px 0"}}>
                <div style={{fontSize:32,marginBottom:8}}>📅</div>
                <div style={{fontSize:13,fontWeight:600,color:"#6E6455"}}>Bu gün iş emri yok</div>
                <div style={{fontSize:12,color:"#9C9080",marginTop:4}}>Farklı bir gün seçin</div>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {selectedWOs.map(w=>{
                  const cfg=s(w.status);
                  return (
                    <Link key={w.id} href={`/app/work-orders/${w.id}`} style={{
                      display:"block",border:"1px solid #e2e8f0",borderRadius:14,padding:"12px 14px",
                      textDecoration:"none",borderLeft:`3px solid ${cfg.dot}`,transition:"all 0.12s",
                    }}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:5}}>
                        <span style={{fontFamily:"monospace",fontSize:11,fontWeight:700,color:"#9C9080"}}>{w.code}</span>
                        <span style={{background:cfg.bg,color:cfg.color,borderRadius:999,padding:"2px 8px",fontSize:10.5,fontWeight:700}}>{w.status==="URGENT"?"Acil":w.status==="IN_PROGRESS"?"Devam":w.status==="DONE"?"Bitti":w.status==="PENDING"?"Planlı":"İptal"}</span>
                      </div>
                      <div style={{fontSize:13,fontWeight:700,color:"#1A1510",marginBottom:2}}>{w.customer.name}</div>
                      <div style={{fontSize:12,color:"#6E6455"}}>{TYPE_L[w.type]??w.type}{w.asset?` · ${w.asset.name}`:""}</div>
                      {w.technician && <div style={{fontSize:11.5,color:"#9C9080",marginTop:4}}>👤 {w.technician.name}</div>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:18,padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#1A1510",marginBottom:14}}>Yaklaşan İşler</div>
            {items.filter(w=>w.scheduledAt && w.scheduledAt>new Date().toISOString() && w.status!=="DONE" && w.status!=="CANCELED").slice(0,5).length===0 ? (
              <div style={{fontSize:13,color:"#9C9080"}}>Planlı iş yok.</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {items.filter(w=>w.scheduledAt && w.scheduledAt>new Date().toISOString() && w.status!=="DONE" && w.status!=="CANCELED")
                  .sort((a,b)=>a.scheduledAt!.localeCompare(b.scheduledAt!)).slice(0,5).map(w=>{
                  const cfg=s(w.status);
                  const dt=new Date(w.scheduledAt!);
                  return (
                    <Link key={w.id} href={`/app/work-orders/${w.id}`} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",border:"1px solid #e2e8f0",borderRadius:12,textDecoration:"none",transition:"all 0.12s"}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:cfg.dot,flexShrink:0,display:"inline-block"}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12.5,fontWeight:700,color:"#1A1510",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.customer.name}</div>
                        <div style={{fontSize:11,color:"#6E6455"}}>{dt.toLocaleDateString("tr-TR",{day:"numeric",month:"short"})}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
