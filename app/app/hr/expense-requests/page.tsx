"use client";
import { useEffect, useState, useMemo } from "react";

type ExpenseRequest = {
  id: string; amountCents: number; currency: string; category: string;
  date: string; note?: string|null; status: string; createdAt: string;
  receiptUrls?: string[];
  technician?: { name:string }|null;
};

const CAT_L: Record<string,string> = {
  fuel:"Yakıt", material:"Malzeme", food:"Yemek",
  transport:"Ulaşım", tool:"Ekipman", other:"Diğer",
};
const CAT_ICON: Record<string,string> = {
  fuel:"⛽", material:"🔧", food:"🍽", transport:"🚌", tool:"🔑", other:"📎",
};
const STATUS_CFG: Record<string,{label:string;bg:string;color:string;border:string}> = {
  PENDING:  {label:"Bekliyor",  bg:"#FFF3DC",color:"#B86800",border:"#F0C060"},
  APPROVED: {label:"Onaylandı", bg:"#E8F5EE",color:"#2E7D4F",border:"#9DCFB0"},
  REJECTED: {label:"Reddedildi",bg:"#FCECE8",color:"#C0311A",border:"#E8A090"},
};
const CATEGORIES = [
  {value:"fuel",label:"Yakıt"},{value:"material",label:"Malzeme"},
  {value:"food",label:"Yemek"},{value:"transport",label:"Ulaşım"},
  {value:"tool",label:"Ekipman"},{value:"other",label:"Diğer"},
];
const Ic = ({d,size=15}:{d:string;size?:number})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
);
const money = (cents:number) =>
  new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:2}).format((cents??0)/100);
const fmt = (iso:string) =>
  new Date(iso).toLocaleDateString("tr-TR",{day:"numeric",month:"short",year:"numeric"});

export default function ExpenseRequestsPage() {
  const [items,    setItems]    = useState<ExpenseRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState<string|null>(null);
  const [success,  setSuccess]  = useState(false);

  const [amount,   setAmount]   = useState("");
  const [category, setCategory] = useState("fuel");
  const [date,     setDate]     = useState(new Date().toISOString().slice(0,10));
  const [note,     setNote]     = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/hr/expense-requests");
    const j   = await res.json().catch(()=>({}));
    setItems(j.items ?? []);
    setLoading(false);
  }
  useEffect(()=>{ void load(); },[]);

  const filtered = useMemo(()=>{
    if(filter==="ALL") return items;
    return items.filter(i=>i.status===filter);
  },[items,filter]);

  const totalPending  = items.filter(i=>i.status==="PENDING").reduce((s,i)=>s+i.amountCents,0);
  const totalApproved = items.filter(i=>i.status==="APPROVED").reduce((s,i)=>s+i.amountCents,0);

  async function submit(e:React.FormEvent) {
    e.preventDefault(); setErr(null);
    const amt = parseFloat(amount.replace(",","."));
    if(!amt||amt<=0){ setErr("Geçerli bir tutar girin."); return; }
    if(!category){ setErr("Kategori seçin."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/hr/expense-requests",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ amount:amt, currency:"TRY", category, date, note:note||undefined }),
      });
      const j = await res.json().catch(()=>({}));
      if(!res.ok){ setErr(j.error??"Hata"); return; }
      setSuccess(true); setShowForm(false); setAmount(""); setNote("");
      setTimeout(()=>setSuccess(false),3000);
      await load();
    } finally { setSaving(false); }
  }

  async function updateStatus(id:string,status:string) {
    await fetch("/api/hr/expense-requests",{
      method:"PATCH",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({id,status}),
    });
    await load();
  }

  const F:React.CSSProperties = {width:"100%",height:40,padding:"0 12px",border:"1.5px solid #D6D0C4",borderRadius:9,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",color:"#1A1510"};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:22,fontWeight:900,color:"#1A1510",letterSpacing:"-0.4px"}}>Gider Talepleri</div>
          <div style={{fontSize:13,color:"#6E6455",marginTop:4}}>{items.length} talep · {items.filter(i=>i.status==="PENDING").length} bekliyor</div>
        </div>
        <button onClick={()=>setShowForm(v=>!v)} style={{display:"inline-flex",alignItems:"center",gap:8,background:"#1B1F2B",color:"#F5F2EC",border:"1.5px solid #0F121A",padding:"10px 18px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 0 rgba(0,0,0,0.18)"}}>
          <Ic d="M12 5v14M5 12h14" size={15}/> Yeni Talep
        </button>
      </div>

      {/* KPI strip */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
        {[
          {label:"Toplam Talep",    value:items.length,       sub:"adet",              color:"#1B1F2B"},
          {label:"Bekleyen Tutar",  value:money(totalPending), sub:`${items.filter(i=>i.status==="PENDING").length} talep`, color:"#B86800"},
          {label:"Onaylanan Tutar", value:money(totalApproved),sub:`${items.filter(i=>i.status==="APPROVED").length} talep`,color:"#2E7D4F"},
        ].map(k=>(
          <div key={k.label} style={{background:"#fff",borderRadius:11,border:"1px solid #D6D0C4",padding:"16px 18px",boxShadow:"0 2px 0 rgba(27,21,16,0.05)"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#9C9080",textTransform:"uppercase" as const,letterSpacing:"0.6px",marginBottom:8}}>{k.label}</div>
            <div style={{fontSize:24,fontWeight:900,letterSpacing:"-0.8px",color:k.color,lineHeight:1}}>{k.value}</div>
            <div style={{fontSize:11,color:"#6E6455",marginTop:4}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {success && (
        <div style={{background:"#E8F5EE",border:"1.5px solid #9DCFB0",color:"#2E7D4F",padding:"12px 18px",borderRadius:10,fontSize:13,fontWeight:700}}>
          ✓ Gider talebiniz gönderildi. Yönetici onayı bekleniyor.
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{background:"#fff",borderRadius:12,border:"1px solid #D6D0C4",padding:24,boxShadow:"0 2px 0 rgba(27,21,16,0.05)"}}>
          <div style={{fontSize:15,fontWeight:800,color:"#1A1510",marginBottom:18}}>Yeni Gider Talebi</div>
          {err && <div style={{background:"#FCECE8",border:"1px solid #E8A090",color:"#C0311A",padding:"10px 14px",borderRadius:8,fontSize:13,marginBottom:12}}>{err}</div>}
          <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Tutar */}
            <div>
              <label style={{fontSize:10,fontWeight:700,color:"#9C9080",textTransform:"uppercase" as const,letterSpacing:"0.6px",display:"block",marginBottom:6}}>Tutar (₺)</label>
              <div style={{display:"flex",alignItems:"center",border:"2px solid #C87800",borderRadius:10,background:"#fff",padding:"0 14px",height:52}}>
                <span style={{fontSize:22,fontWeight:900,color:"#C87800",marginRight:8}}>₺</span>
                <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" type="text" inputMode="decimal"
                  style={{flex:1,border:"none",outline:"none",fontSize:22,fontWeight:800,color:"#1A1510",background:"transparent",fontFamily:"inherit"}}/>
              </div>
            </div>
            {/* Kategori */}
            <div>
              <label style={{fontSize:10,fontWeight:700,color:"#9C9080",textTransform:"uppercase" as const,letterSpacing:"0.6px",display:"block",marginBottom:8}}>Kategori</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap" as const}}>
                {CATEGORIES.map(c=>(
                  <button key={c.value} type="button" onClick={()=>setCategory(c.value)}
                    style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:`1.5px solid ${category===c.value?"#C87800":"#D6D0C4"}`,background:category===c.value?"#FFF0D0":"#fff",color:category===c.value?"#B86800":"#3A3028"}}>
                    <span>{CAT_ICON[c.value]}</span>{c.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Tarih */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:"#9C9080",textTransform:"uppercase" as const,letterSpacing:"0.6px",display:"block",marginBottom:6}}>Tarih</label>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={F}/>
              </div>
            </div>
            {/* Not */}
            <div>
              <label style={{fontSize:10,fontWeight:700,color:"#9C9080",textTransform:"uppercase" as const,letterSpacing:"0.6px",display:"block",marginBottom:6}}>Açıklama <span style={{fontWeight:400,textTransform:"none" as const,letterSpacing:0}}>(opsiyonel)</span></label>
              <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="Giderin amacını kısaca açıklayın..."
                style={{...F,height:"auto",padding:"10px 12px",resize:"vertical" as const}}/>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button type="button" onClick={()=>setShowForm(false)} style={{padding:"10px 18px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"1.5px solid #D6D0C4",background:"#fff",color:"#6E6455"}}>İptal</button>
              <button type="submit" disabled={saving} style={{padding:"10px 20px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"1.5px solid #0F121A",background:"#1B1F2B",color:"#F5F2EC",opacity:saving?0.5:1,boxShadow:"0 2px 0 rgba(0,0,0,0.18)"}}>
                {saving?"Gönderiliyor...":"Talebi Gönder"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtre */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
        {[["ALL","Tümü"],["PENDING","Bekliyor"],["APPROVED","Onaylandı"],["REJECTED","Reddedildi"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{padding:"6px 14px",borderRadius:6,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:`1px solid ${filter===v?"#1B1F2B":"#D6D0C4"}`,background:filter===v?"#1B1F2B":"#fff",color:filter===v?"#F5F2EC":"#6E6455"}}>{l}</button>
        ))}
      </div>

      {/* Tablo */}
      <div style={{background:"#fff",borderRadius:12,border:"1px solid #D6D0C4",overflow:"hidden",boxShadow:"0 2px 0 rgba(27,21,16,0.05)"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 100px 120px 120px 140px",gap:12,padding:"10px 18px",fontSize:10,fontWeight:700,color:"#9C9080",textTransform:"uppercase" as const,letterSpacing:"0.6px",borderBottom:"1px solid #E8E3D8",background:"#F5F2EC"}}>
          <span>Personel / Kategori</span><span>Tarih</span><span>Tutar</span><span>Durum</span><span>İşlem</span>
        </div>
        {loading ? (
          <div style={{padding:40,textAlign:"center" as const,color:"#9C9080"}}>Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div style={{padding:48,textAlign:"center" as const}}>
            <div style={{fontSize:32,marginBottom:12}}>🧾</div>
            <div style={{fontSize:15,fontWeight:700,color:"#1A1510"}}>Gider talebi bulunamadı</div>
            <div style={{fontSize:13,color:"#6E6455",marginTop:4}}>Henüz gider talebi yok.</div>
          </div>
        ) : filtered.map(item=>{
          const st = STATUS_CFG[item.status] ?? STATUS_CFG.PENDING;
          return (
            <div key={item.id} style={{display:"grid",gridTemplateColumns:"1fr 100px 120px 120px 140px",gap:12,padding:"14px 18px",borderBottom:"1px solid #F0EDE6",alignItems:"center"}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#1A1510"}}>{item.technician?.name ?? "Bilinmiyor"}</div>
                <div style={{fontSize:11,color:"#6E6455",marginTop:2}}>{CAT_ICON[item.category]} {CAT_L[item.category]??item.category}</div>
                {item.note && <div style={{fontSize:11,color:"#9C9080",marginTop:3,fontStyle:"italic"}}>"{item.note}"</div>}
              </div>
              <div style={{fontSize:13,color:"#3A3028"}}>{fmt(item.date)}</div>
              <div style={{fontSize:14,fontWeight:800,color:"#1B1F2B"}}>{money(item.amountCents)}</div>
              <span style={{padding:"3px 10px",borderRadius:4,fontSize:11,fontWeight:700,background:st.bg,color:st.color,border:`1.5px solid ${st.border}`,alignSelf:"center" as const}}>{st.label}</span>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                {item.status==="PENDING" && (
                  <>
                    <button onClick={()=>updateStatus(item.id,"APPROVED")} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 10px",borderRadius:7,border:"1.5px solid #9DCFB0",background:"#E8F5EE",color:"#2E7D4F",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>
                      <Ic d="M20 6L9 17l-5-5" size={12}/> Onayla
                    </button>
                    <button onClick={()=>updateStatus(item.id,"REJECTED")} style={{width:28,height:28,borderRadius:7,border:"1.5px solid #E8A090",background:"#FCECE8",color:"#C0311A",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <Ic d="M6 6l12 12M18 6L6 18" size={12}/>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
