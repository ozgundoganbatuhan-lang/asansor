"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Customer = { id:string;name:string;contactName?:string|null;phone?:string|null;email?:string|null;address?:string|null;_count:{assets:number;workOrders:number} };
const Ic=({d,size=15,stroke="currentColor"}:{d:string;size?:number;stroke?:string})=>(<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>);
const F:React.CSSProperties={width:"100%",height:42,padding:"0 13px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",color:"#0f172a",transition:"border-color .15s"};

export default function CustomersPage() {
  const [customers,setCustomers]=useState<Customer[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [q,setQ]=useState("");
  const [showForm,setShowForm]=useState(false);
  const [name,setName]=useState(""),[contactName,setContactName]=useState(""),
    [phone,setPhone]=useState(""),[ email,setEmail]=useState(""),
    [address,setAddress]=useState(""),
    [saving,setSaving]=useState(false);

  async function load(){setLoading(true);try{const r=await fetch("/api/customers");const d=await r.json();if(d.error)setError(d.error);else setCustomers(d.items??[]);}catch(e:any){setError(e.message);}setLoading(false);}
  useEffect(()=>{void load();},[]);

  const filtered=useMemo(()=>customers.filter(c=>!q||[c.name,c.contactName??"",c.phone??"",c.email??""].join(" ").toLowerCase().includes(q.toLowerCase())),[customers,q]);
  const totalA=filtered.reduce((s,c)=>s+c._count.assets,0);
  const totalW=filtered.reduce((s,c)=>s+c._count.workOrders,0);

  async function submit(e:React.FormEvent){e.preventDefault();setError(null);setSaving(true);
    const res=await fetch("/api/customers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,contactName:contactName||undefined,phone:phone||undefined,email:email||undefined,address:address||undefined})});
    const d=await res.json().catch(()=>({}));setSaving(false);
    if(!res.ok){setError(d.error??"Müşteri oluşturulamadı");return;}
    setName("");setContactName("");setPhone("");setEmail("");setAddress("");setShowForm(false);await load();}

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.c-row:hover{background:#f8fafc!important}.fi:focus{border-color:#2563eb!important;box-shadow:0 0 0 3px rgba(37,99,235,.12)!important}`}</style>

      <div style={{display:"flex",flexWrap:"wrap",alignItems:"flex-end",justifyContent:"space-between",gap:14}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",color:"#94a3b8",marginBottom:6}}>Portföy</div>
          <h1 style={{fontSize:26,fontWeight:900,letterSpacing:"-0.05em",color:"#0f172a",lineHeight:1.05,margin:0}}>Müşteriler</h1>
          <p style={{marginTop:6,fontSize:13.5,lineHeight:1.65,color:"#64748b",margin:"6px 0 0"}}>Bina yöneticileri, site yönetimleri ve kurumsal müşteriler.</p>
        </div>
        <button onClick={()=>setShowForm(v=>!v)} style={{display:"inline-flex",alignItems:"center",gap:6,
          background:showForm?"#fff":"#2563eb",color:showForm?"#0f172a":"#fff",
          border:showForm?"1.5px solid #e2e8f0":"none",fontSize:13,fontWeight:700,
          padding:"9px 18px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",
          boxShadow:showForm?"none":"0 3px 12px rgba(37,99,235,.28)"}}>
          {showForm?"Formu kapat":<><Ic d="M12 5v14M5 12h14" size={13} stroke="#fff"/>Yeni Müşteri</>}
        </button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>
        {[
          {l:"Toplam Müşteri",v:customers.length,c:"#0f172a",bg:"#f1f5f9",d:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z"},
          {l:"Filtrelenen",v:filtered.length,c:"#2563eb",bg:"#eff6ff",d:"M3 4a1 1 0 000 2h18a1 1 0 000-2H3zm2 7a1 1 0 000 2h14a1 1 0 000-2H5zm4 7a1 1 0 000 2h6a1 1 0 000-2H9z"},
          {l:"Toplam Asansör",v:totalA,c:"#059669",bg:"#f0fdf4",d:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10"},
          {l:"İş Emirleri",v:totalW,c:"#7c3aed",bg:"#f5f3ff",d:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4"},
        ].map((k,i)=>(
          <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"18px 20px",boxShadow:"0 2px 8px rgba(15,23,42,.04)"}}>
            <div style={{width:32,height:32,borderRadius:9,background:k.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}><Ic d={k.d} size={15} stroke={k.c}/></div>
            <div className="metric-label">{k.l}</div>
            <div style={{fontSize:"1.9rem",fontWeight:900,letterSpacing:"-0.06em",color:k.c,lineHeight:1}}>{k.v}</div>
          </div>
        ))}
      </div>

      {error&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#b91c1c",padding:"12px 16px",borderRadius:12,fontSize:13}}>{error}</div>}

      {showForm&&(
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"22px 24px",boxShadow:"0 2px 8px rgba(15,23,42,.04)"}}>
          <div style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:18,letterSpacing:"-0.03em"}}>Yeni Müşteri</div>
          <form onSubmit={submit}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14}}>
              {[{l:"Firma / Bina Adı *",v:name,set:setName,t:"text",ph:"ABC Apartman Yönetimi",req:true},
                {l:"İletişim Kişisi",v:contactName,set:setContactName,t:"text",ph:"Ali Yılmaz"},
                {l:"Telefon",v:phone,set:setPhone,t:"tel",ph:"05XX XXX XX XX"},
                {l:"E-posta",v:email,set:setEmail,t:"email",ph:"ali@apartman.com"},
                {l:"Adres",v:address,set:setAddress,t:"text",ph:"Atatürk Cad. No:5, Kadıköy / İstanbul"}
              ].map((fi,i)=>(
                <div key={i}>
                  <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:"0.06em",color:"#64748b",marginBottom:7}}>{fi.l}</label>
                  <input className="fi" value={fi.v} onChange={e=>fi.set(e.target.value)} type={fi.t} placeholder={fi.ph} required={fi.req} style={F}/>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginTop:18}}>
              <button type="submit" disabled={saving||!name.trim()} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,padding:"10px 20px",cursor:"pointer",fontFamily:"inherit",boxShadow:"0 3px 12px rgba(37,99,235,.28)",opacity:saving?.7:1}}>
                {saving?"Oluşturuluyor…":"Müşteri Oluştur"}
              </button>
              <button type="button" onClick={()=>setShowForm(false)} style={{background:"#fff",color:"#0f172a",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:13,fontWeight:600,padding:"10px 18px",cursor:"pointer",fontFamily:"inherit"}}>İptal</button>
            </div>
          </form>
        </div>
      )}

      <div style={{position:"relative",maxWidth:380}}>
        <div style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}><Ic d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></div>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Müşteri, kişi veya telefon ara..." className="fi" style={{...F,paddingLeft:38}}/>
      </div>

      {loading?(
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:200,gap:12,color:"#64748b"}}>
          <div style={{width:28,height:28,border:"3px solid #e2e8f0",borderTopColor:"#2563eb",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>Yükleniyor...
        </div>
      ):filtered.length===0?(
        <div style={{background:"#fff",border:"1.5px dashed #e2e8f0",borderRadius:16,padding:"44px 24px",textAlign:"center"}}>
          <div style={{fontSize:42,marginBottom:12}}>👥</div>
          <div style={{fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:6}}>{q?"Eşleşen müşteri bulunamadı":"Henüz müşteri yok"}</div>
          <div style={{fontSize:13,color:"#64748b"}}>{q?"Farklı bir arama deneyin.":"İlk müşterinizi ekleyerek başlayın."}</div>
        </div>
      ):(
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 8px rgba(15,23,42,.04)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 180px 90px 90px 80px",padding:"11px 22px",background:"#f8fafc",borderBottom:"1px solid #f1f5f9"}}>
            {["Müşteri","İletişim","Asansör","İş Emri",""].map((h,i)=>(
              <div key={i} style={{fontSize:10.5,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"#94a3b8"}}>{h}</div>
            ))}
          </div>
          {filtered.map((c,i)=>(
            <Link key={c.id} href={`/app/customers/${c.id}`} className="c-row" style={{display:"grid",gridTemplateColumns:"1fr 180px 90px 90px 80px",alignItems:"center",padding:"14px 22px",borderBottom:i<filtered.length-1?"1px solid #f1f5f9":"none",textDecoration:"none",color:"inherit",transition:"all .12s"}}>
              <div>
                <div style={{fontSize:13.5,fontWeight:700,color:"#0f172a"}}>{c.name}</div>
                {c.email&&<div style={{fontSize:11.5,color:"#94a3b8",marginTop:2}}>{c.email}</div>}
              </div>
              <div>
                {c.contactName&&<div style={{fontSize:13,fontWeight:600,color:"#334155"}}>{c.contactName}</div>}
                {c.phone&&<div style={{fontSize:11.5,color:"#94a3b8",marginTop:1}}>{c.phone}</div>}{c.address&&<div style={{fontSize:11,color:"#9ca3af",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📍 {c.address}</div>}
              </div>
              <div style={{fontSize:20,fontWeight:900,color:c._count.assets>0?"#2563eb":"#cbd5e1",letterSpacing:"-0.04em"}}>{c._count.assets}</div>
              <div style={{fontSize:20,fontWeight:900,color:c._count.workOrders>0?"#7c3aed":"#cbd5e1",letterSpacing:"-0.04em"}}>{c._count.workOrders}</div>
              <div style={{display:"flex",justifyContent:"flex-end"}}><span style={{fontSize:11.5,fontWeight:700,color:"#2563eb",background:"#eff6ff",padding:"4px 10px",borderRadius:7}}>Detay →</span></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
