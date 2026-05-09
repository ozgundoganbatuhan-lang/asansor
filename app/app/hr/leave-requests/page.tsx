"use client";
import { useEffect, useState, useMemo } from "react";

/* ─── Types ─── */
type LeaveRequest = {
  id: string; leaveType: string; startDate: string; endDate: string;
  days: number; note?: string | null; status: string; createdAt: string;
  docUrls?: string[];
  technician?: { name: string } | null;
};

/* ─── Helpers ─── */
const LEAVE_TYPE_L: Record<string, string> = {
  annual:"Yıllık", sick:"Sağlık", unpaid:"Ücretsiz",
  excuse:"Mazeret", paternal:"Doğum", other:"Diğer",
};
const STATUS_CFG: Record<string, { label:string; bg:string; color:string; border:string }> = {
  PENDING:  { label:"Bekliyor", bg:"#FFF3DC", color:"#B86800", border:"#F0C060" },
  APPROVED: { label:"Onaylandı",bg:"#E8F5EE", color:"#2E7D4F", border:"#9DCFB0" },
  REJECTED: { label:"Reddedildi",bg:"#FCECE8",color:"#C0311A", border:"#E8A090" },
};
const Ic = ({ d, size=15 }: { d:string; size?:number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
);
function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR",{ day:"numeric", month:"short", year:"numeric" });
}

const CATEGORIES = [
  { value:"annual",   label:"Yıllık İzin" },
  { value:"sick",     label:"Sağlık İzni" },
  { value:"unpaid",   label:"Ücretsiz İzin" },
  { value:"excuse",   label:"Mazeret İzni" },
  { value:"paternal", label:"Doğum İzni" },
  { value:"other",    label:"Diğer" },
];

function daysBetween(a:string,b:string) {
  const da=new Date(a),db=new Date(b);
  if(isNaN(da.getTime())||isNaN(db.getTime())) return 0;
  return Math.max(0, Math.round((db.getTime()-da.getTime())/86400000)+1);
}

/* ─── Page ─── */
export default function LeaveRequestsPage() {
  const [items,     setItems]     = useState<LeaveRequest[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("ALL");
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState<string|null>(null);
  const [success,   setSuccess]   = useState(false);

  /* form */
  const [leaveType, setLeaveType] = useState("annual");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0,10));
  const [endDate,   setEndDate]   = useState(() => { const d=new Date(); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10); });
  const [note,      setNote]      = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/hr/leave-requests");
    const j   = await res.json().catch(()=>({}));
    setItems(j.items ?? []);
    setLoading(false);
  }
  useEffect(()=>{ void load(); },[]);

  const days = daysBetween(startDate, endDate);

  const filtered = useMemo(()=>{
    if(filter==="ALL") return items;
    return items.filter(i=>i.status===filter);
  },[items,filter]);

  async function submit(e:React.FormEvent) {
    e.preventDefault(); setErr(null);
    if(days<=0){ setErr("Bitiş tarihi başlangıçtan sonra olmalı."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/hr/leave-requests",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ leaveType, startDate, endDate, days, note: note||undefined }),
      });
      const j = await res.json().catch(()=>({}));
      if(!res.ok){ setErr(j.error??"Hata"); return; }
      setSuccess(true); setShowForm(false); setNote("");
      setTimeout(()=>setSuccess(false),3000);
      await load();
    } finally { setSaving(false); }
  }

  async function updateStatus(id:string, status:string) {
    await fetch("/api/hr/leave-requests",{
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({id,status}),
    });
    await load();
  }

  const S = { // inline styles shorthand
    page:   { display:"flex",flexDirection:"column" as const,gap:24 },
    header: { display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap" as const,gap:12 },
    title:  { fontSize:22,fontWeight:900,color:"#1A1510",letterSpacing:"-0.4px" },
    sub:    { fontSize:13,color:"#6E6455",marginTop:4 },
    card:   { background:"#fff",borderRadius:12,border:"1px solid #D6D0C4",overflow:"hidden" as const, boxShadow:"0 2px 0 rgba(27,21,16,0.05)" },
    tr:     { display:"flex",alignItems:"center",gap:12,padding:"13px 18px",borderBottom:"1px solid #F0EDE6",cursor:"pointer" as const },
    chips:  { display:"flex",gap:6,flexWrap:"wrap" as const },
    chip:   (on:boolean)=>({ padding:"6px 14px",borderRadius:6,fontSize:12,fontWeight:700,cursor:"pointer" as const,border:`1px solid ${on?"#1B1F2B":"#D6D0C4"}`,background:on?"#1B1F2B":"#fff",color:on?"#F5F2EC":"#6E6455" }),
    F:      { width:"100%",height:40,padding:"0 12px",border:"1.5px solid #D6D0C4",borderRadius:9,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",color:"#1A1510" },
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.title}>İzin Talepleri</div>
          <div style={S.sub}>{items.length} talep · {items.filter(i=>i.status==="PENDING").length} bekliyor</div>
        </div>
        <button onClick={()=>setShowForm(v=>!v)} style={{
          display:"inline-flex",alignItems:"center",gap:8,
          background:"#1B1F2B",color:"#F5F2EC",border:"1.5px solid #0F121A",
          padding:"10px 18px",borderRadius:9,fontSize:13,fontWeight:700,
          cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 0 rgba(0,0,0,0.18)",
        }}>
          <Ic d="M12 5v14M5 12h14" size={15}/> Yeni Talep
        </button>
      </div>

      {success && (
        <div style={{ background:"#E8F5EE",border:"1.5px solid #9DCFB0",color:"#2E7D4F",padding:"12px 18px",borderRadius:10,fontSize:13,fontWeight:700 }}>
          ✓ İzin talebiniz gönderildi. Yönetici onayı bekleniyor.
        </div>
      )}

      {/* Yeni talep formu */}
      {showForm && (
        <div style={{ ...S.card, padding:24 }}>
          <div style={{ fontSize:15,fontWeight:800,color:"#1A1510",marginBottom:18 }}>Yeni İzin Talebi</div>
          {err && <div style={{ background:"#FCECE8",border:"1px solid #E8A090",color:"#C0311A",padding:"10px 14px",borderRadius:8,fontSize:13,marginBottom:12 }}>{err}</div>}
          <form onSubmit={submit} style={{ display:"flex",flexDirection:"column",gap:16 }}>
            <div>
              <label style={{ fontSize:10,fontWeight:700,color:"#9C9080",textTransform:"uppercase",letterSpacing:"0.6px",display:"block",marginBottom:6 }}>İzin Türü</label>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                {CATEGORIES.map(c=>(
                  <button key={c.value} type="button" onClick={()=>setLeaveType(c.value)}
                    style={{ padding:"8px 14px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:`1.5px solid ${leaveType===c.value?"#1B1F2B":"#D6D0C4"}`,background:leaveType===c.value?"#1B1F2B":"#fff",color:leaveType===c.value?"#F5F2EC":"#3A3028" }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <div>
                <label style={{ fontSize:10,fontWeight:700,color:"#9C9080",textTransform:"uppercase",letterSpacing:"0.6px",display:"block",marginBottom:6 }}>Başlangıç Tarihi</label>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={S.F}/>
              </div>
              <div>
                <label style={{ fontSize:10,fontWeight:700,color:"#9C9080",textTransform:"uppercase",letterSpacing:"0.6px",display:"block",marginBottom:6 }}>Bitiş Tarihi</label>
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={S.F}/>
              </div>
            </div>
            {days > 0 && (
              <div style={{ background:"#E8F5EE",border:"1px solid #9DCFB0",color:"#2E7D4F",padding:"9px 14px",borderRadius:8,fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6 }}>
                <Ic d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" size={14}/>
                {days} iş günü izin talep ediliyor
              </div>
            )}
            <div>
              <label style={{ fontSize:10,fontWeight:700,color:"#9C9080",textTransform:"uppercase",letterSpacing:"0.6px",display:"block",marginBottom:6 }}>Mazeret / Not <span style={{ fontWeight:400,textTransform:"none",letterSpacing:0 }}>(opsiyonel)</span></label>
              <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="İzin gerekçenizi kısaca açıklayın..."
                style={{ ...S.F,height:"auto",padding:"10px 12px",resize:"vertical" as const }}/>
            </div>
            <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
              <button type="button" onClick={()=>setShowForm(false)} style={{ padding:"10px 18px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"1.5px solid #D6D0C4",background:"#fff",color:"#6E6455" }}>İptal</button>
              <button type="submit" disabled={saving||days<=0} style={{ padding:"10px 20px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"1.5px solid #0F121A",background:"#1B1F2B",color:"#F5F2EC",opacity:saving||days<=0?0.5:1,boxShadow:"0 2px 0 rgba(0,0,0,0.18)" }}>
                {saving?"Gönderiliyor...":"Talebi Gönder"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtreler */}
      <div style={S.chips}>
        {[["ALL","Tümü"],["PENDING","Bekliyor"],["APPROVED","Onaylandı"],["REJECTED","Reddedildi"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={S.chip(filter===v)}>{l}</button>
        ))}
      </div>

      {/* Liste */}
      <div style={S.card}>
        {/* Tablo başlığı */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 120px 100px 100px 120px",gap:12,padding:"10px 18px",fontSize:10,fontWeight:700,color:"#9C9080",textTransform:"uppercase",letterSpacing:"0.6px",borderBottom:"1px solid #E8E3D8",background:"#F5F2EC" }}>
          <span>Personel / Tür</span><span>Başlangıç</span><span>Bitiş</span><span>Gün</span><span>Durum</span>
        </div>
        {loading ? (
          <div style={{ padding:40,textAlign:"center",color:"#9C9080" }}>Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:48,textAlign:"center" }}>
            <div style={{ fontSize:32,marginBottom:12 }}>📅</div>
            <div style={{ fontSize:15,fontWeight:700,color:"#1A1510" }}>Talep bulunamadı</div>
            <div style={{ fontSize:13,color:"#6E6455",marginTop:4 }}>Henüz izin talebi yok.</div>
          </div>
        ) : filtered.map((item)=>{
          const st = STATUS_CFG[item.status] ?? STATUS_CFG.PENDING;
          return (
            <div key={item.id} style={{ display:"grid",gridTemplateColumns:"1fr 120px 100px 100px 120px",gap:12,padding:"14px 18px",borderBottom:"1px solid #F0EDE6",alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13,fontWeight:700,color:"#1A1510" }}>{item.technician?.name ?? "Bilinmiyor"}</div>
                <div style={{ fontSize:11,color:"#6E6455",marginTop:2 }}>{LEAVE_TYPE_L[item.leaveType]??item.leaveType}</div>
                {item.note && <div style={{ fontSize:11,color:"#9C9080",marginTop:3,fontStyle:"italic" }}>"{item.note}"</div>}
              </div>
              <div style={{ fontSize:13,color:"#3A3028" }}>{fmt(item.startDate)}</div>
              <div style={{ fontSize:13,color:"#3A3028" }}>{fmt(item.endDate)}</div>
              <div style={{ fontSize:14,fontWeight:800,color:"#1B1F2B" }}>{item.days}</div>
              <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" as const }}>
                <span style={{ padding:"3px 10px",borderRadius:4,fontSize:11,fontWeight:700,background:st.bg,color:st.color,border:`1.5px solid ${st.border}` }}>{st.label}</span>
                {item.status==="PENDING" && (
                  <div style={{ display:"flex",gap:4 }}>
                    <button onClick={()=>updateStatus(item.id,"APPROVED")} title="Onayla" style={{ width:26,height:26,borderRadius:6,border:"1.5px solid #9DCFB0",background:"#E8F5EE",color:"#2E7D4F",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <Ic d="M20 6L9 17l-5-5" size={12}/>
                    </button>
                    <button onClick={()=>updateStatus(item.id,"REJECTED")} title="Reddet" style={{ width:26,height:26,borderRadius:6,border:"1.5px solid #E8A090",background:"#FCECE8",color:"#C0311A",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <Ic d="M6 6l12 12M18 6L6 18" size={12}/>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
