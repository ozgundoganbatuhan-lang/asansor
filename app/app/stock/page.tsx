"use client";
import { useEffect, useMemo, useState } from "react";

type Part = { id:string; name:string; category?:string|null; unit?:string|null; supplier?:string|null; price?:number|null; stock:number; minStock:number };

const fi: React.CSSProperties = {width:"100%",padding:"11px 14px",border:"1px solid #e2e8f0",borderRadius:12,fontSize:14,background:"#fff",outline:"none",fontFamily:"inherit",transition:"border-color 0.15s"};
const fo = (e: React.FocusEvent<HTMLInputElement>) => e.target.style.borderColor="#7c3aed";
const fb = (e: React.FocusEvent<HTMLInputElement>) => e.target.style.borderColor="#e2e8f0";
const LBL = ({c}:{c:string}) => <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#94a3b8",marginBottom:8}}>{c}</label>;

export default function StockPage() {
  const [parts,setParts] = useState<Part[]>([]);
  const [loading,setLoading] = useState(true);
  const [q,setQ] = useState("");
  const [showForm,setShowForm] = useState(false);
  const [form,setForm] = useState({name:"",category:"",unit:"",supplier:"",price:"",stock:"0",minStock:"0"});
  const [saving,setSaving] = useState(false);
  const [err,setErr] = useState<string|null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/parts");
    const d = await res.json().catch(()=>({}));
    setParts(d.items??[]);
    setLoading(false);
  }
  useEffect(()=>{ void load(); },[]);

  const filtered = useMemo(()=>{
    const s=q.trim().toLowerCase();
    if(!s) return parts;
    return parts.filter(p=>(p.name+" "+(p.category??"")+" "+(p.supplier??"")).toLowerCase().includes(s));
  },[parts,q]);

  async function add() {
    setErr(null); setSaving(true);
    const res = await fetch("/api/parts",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({name:form.name,category:form.category||undefined,unit:form.unit||undefined,supplier:form.supplier||undefined,
        price:form.price?parseInt(form.price):undefined,stock:parseInt(form.stock||"0"),minStock:parseInt(form.minStock||"0")})});
    if(!res.ok){const d=await res.json().catch(()=>({}));setErr(d.error||"Kayıt başarısız");}
    else { setForm({name:"",category:"",unit:"",supplier:"",price:"",stock:"0",minStock:"0"}); setShowForm(false); await load(); }
    setSaving(false);
  }

  const lowStock = parts.filter(p=>p.stock<p.minStock).length;
  const totalVal = parts.reduce((a,p)=>{const u=p.unit==="Adet"||!p.unit;return a+((p.price??0)*(u?p.stock:0));},0);

  return (
    <div style={{maxWidth:960,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"#94a3b8",marginBottom:6}}>Depo & Lojistik</div>
          <h1 style={{fontSize:28,fontWeight:900,letterSpacing:"-0.04em",color:"#0f172a",margin:0}}>Stok</h1>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍  Ara..." style={{...fi,width:200}} onFocus={fo} onBlur={fb}/>
          <button onClick={()=>setShowForm(v=>!v)} style={{display:"inline-flex",alignItems:"center",gap:7,background:"#0f172a",color:"#fff",border:"none",borderRadius:12,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            {showForm?"✕ Kapat":"+ Parça Ekle"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:20}}>
        {[
          {l:"Toplam Çeşit",v:parts.length,c:"#0f172a",bg:"#f1f5f9"},
          {l:"Kritik Stok",v:lowStock,c:"#b91c1c",bg:"#fef2f2"},
          {l:"Toplam Kalem",v:parts.reduce((a,p)=>a+p.stock,0),c:"#059669",bg:"#f0fdf4"},
          {l:"Stok Değeri",v:`₺${totalVal.toLocaleString("tr-TR")}`,c:"#7c3aed",bg:"#f5f3ff"},
        ].map(s=>(
          <div key={s.l} style={{background:s.bg,borderRadius:14,padding:"14px 18px"}}>
            <div style={{fontSize:typeof s.v==="number"?22:16,fontWeight:900,color:s.c,letterSpacing:"-0.04em"}}>{s.v}</div>
            <div style={{fontSize:11.5,color:"#64748b",marginTop:3,fontWeight:600}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:18,padding:"24px",marginBottom:20}}>
          <div style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:18}}>➕ Yeni Parça</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:16}}>
            {([
              {l:"Parça Adı *",f:"name",p:"Kapı sensörü"},
              {l:"Kategori",f:"category",p:"Elektronik"},
              {l:"Birim",f:"unit",p:"Adet"},
              {l:"Tedarikçi",f:"supplier",p:"Lift Parts"},
              {l:"Fiyat (₺)",f:"price",p:"850",t:"number"},
              {l:"Stok",f:"stock",p:"0",t:"number"},
              {l:"Min Stok",f:"minStock",p:"2",t:"number"},
            ] as const).map(fld=>(
              <div key={fld.f}>
                <LBL c={fld.l}/>
                <input value={form[fld.f]} onChange={e=>setForm(x=>({...x,[fld.f]:e.target.value}))} placeholder={fld.p} type={"t" in fld ? fld.t : "text"} style={fi} onFocus={fo} onBlur={fb}/>
              </div>
            ))}
          </div>
          {err && <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#b91c1c"}}>⚠️ {err}</div>}
          <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
            <button onClick={()=>setShowForm(false)} style={{background:"#f1f5f9",border:"none",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#475569"}}>İptal</button>
            <button onClick={add} disabled={!form.name.trim()||saving} style={{background:form.name.trim()?"#2563eb":"#e2e8f0",color:form.name.trim()?"#fff":"#94a3b8",border:"none",borderRadius:10,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:form.name.trim()?"pointer":"not-allowed",fontFamily:"inherit"}}>
              {saving?"Kaydediliyor...":"Ekle"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:18,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 80px 80px 100px 1.5fr",padding:"12px 20px",background:"#f9f9fb",borderBottom:"1px solid #e2e8f0"}}>
          {["Parça","Kategori","Stok","Min","Fiyat","Tedarikçi"].map(h=>(
            <div key={h} style={{fontSize:10.5,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#94a3b8"}}>{h}</div>
          ))}
        </div>
        {loading ? (
          <div style={{padding:"40px 20px",textAlign:"center",color:"#94a3b8"}}>Yükleniyor...</div>
        ) : filtered.length===0 ? (
          <div style={{padding:"40px 20px",textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:10}}>📦</div>
            <div style={{fontSize:15,fontWeight:700,color:"#0f172a"}}>Stok kaydı yok</div>
          </div>
        ) : filtered.map((p,i)=>{
          const low = p.stock<p.minStock;
          return (
            <div key={p.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 80px 80px 100px 1.5fr",padding:"14px 20px",borderBottom:i<filtered.length-1?"1px solid #f1f5f9":"none",alignItems:"center",transition:"background 0.1s"}}>
              <div style={{fontWeight:700,color:"#0f172a",fontSize:13}}>{p.name}</div>
              <div style={{fontSize:13,color:"#475569"}}>{p.category??"—"}</div>
              <div>
                <span style={{background:low?"#fef2f2":"#f0fdf4",color:low?"#b91c1c":"#15803d",border:`1px solid ${low?"#fecaca":"#bbf7d0"}`,borderRadius:999,padding:"3px 10px",fontSize:12,fontWeight:800}}>
                  {p.stock}
                </span>
              </div>
              <div style={{fontSize:13,color:"#64748b"}}>{p.minStock}</div>
              <div style={{fontSize:13,color:"#475569"}}>{p.price?`₺${p.price.toLocaleString("tr-TR")}`:"—"}</div>
              <div style={{fontSize:13,color:"#64748b"}}>{p.supplier??"—"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
