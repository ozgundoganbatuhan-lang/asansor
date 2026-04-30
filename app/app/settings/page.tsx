"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Org = { id: string; name: string; slug: string; vertical: "ELEVATOR"; phone?: string|null; website?: string|null };
type Ent = { planTier: string; isTrial: boolean; isExpired: boolean; daysLeft: number; trialEndsAt: string };
type User = { id: string; email: string; name?: string | null; phone?: string | null; role: string; createdAt: string };

function roleLabel(r: string) {
  if (r === "OWNER") return "Sahip"; if (r === "ADMIN") return "Yönetici";
  if (r === "OFFICE") return "Ofis"; if (r === "TECHNICIAN") return "Teknisyen"; return r;
}
function roleDot(r: string) {
  if (r === "OWNER") return "#7c3aed"; if (r === "ADMIN") return "#2563eb";
  if (r === "TECHNICIAN") return "#059669"; return "#64748b";
}
function planLabel(ent: Ent | null) {
  if (!ent) return "—"; if (ent.isTrial) return `Deneme — ${ent.daysLeft} gün`;
  if (ent.planTier === "STARTER") return "Başlangıç"; if (ent.planTier === "PRO") return "Pro";
  if (ent.planTier === "ENTERPRISE") return "Kurumsal"; return ent.planTier;
}

function SectionHeader({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:24 }}>
      <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(135deg,#f5f3ff,#ede9fe)", border:"1px solid #ddd6fe", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:15, fontWeight:800, color:"#0f172a", letterSpacing:"-0.02em" }}>{title}</div>
        {sub && <div style={{ fontSize:12.5, color:"#64748b", marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:18, padding:"24px 28px", boxShadow:"0 1px 3px rgba(0,0,0,0.05)", ...style }}>{children}</div>;
}

export default function SettingsPage() {
  const [org, setOrg] = useState<Org | null>(null);
  const [ent, setEnt] = useState<Ent | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userForm, setUserForm] = useState({ role:"OFFICE", email:"", password:"", name:"", phone:"" });
  const [userErr, setUserErr] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"org"|"users"|"plan"|"security">("org");

  const load = useCallback(async () => {
    try {
      const [orgRes, entRes, meRes] = await Promise.all([fetch("/api/org"), fetch("/api/entitlements"), fetch("/api/me")]);
      const orgJson = await orgRes.json().catch(() => ({}));
      const entJson = await entRes.json().catch(() => ({}));
      const meJson  = await meRes.json().catch(() => ({}));
      if (orgRes.ok && orgJson.org) setOrg(orgJson.org);
      if (entRes.ok && entJson.ent) setEnt(entJson.ent);
      if (meRes.ok && meJson.session?.role) setMyRole(meJson.session.role);
    } catch { setErr("Veriler yüklenemedi. Sayfayı yenileyin."); }
  }, []);

  const loadUsers = useCallback(async () => {
    setUserLoading(true);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) { setUsers([]); return; }
      const data = await res.json().catch(() => ({}));
      setUsers(data.items ?? []);
    } finally { setUserLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (myRole === "OWNER" || myRole === "ADMIN") loadUsers(); }, [myRole, loadUsers]);

  async function saveOrg() {
    if (!org) return;
    setSaving(true); setErr(null); setSaved(false);
    try {
      const r = await fetch("/api/org", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name:org.name, vertical:"ELEVATOR", phone:org.phone||undefined, website:org.website||undefined }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Kaydedilemedi");
      if (j.org) setOrg(j.org);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Hata oluştu"); }
    finally { setSaving(false); }
  }

  async function createUser() {
    if (!userForm.email.trim()) return;
    setUserErr(null); setUserSuccess(null);
    try {
      const res = await fetch("/api/users", { method:"POST", headers:{"content-type":"application/json"},
        body:JSON.stringify({ role:userForm.role, email:userForm.email, password:userForm.password||undefined, name:userForm.name||undefined, phone:userForm.phone||undefined }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setUserErr(data.error ?? "Hata"); return; }
      setUserSuccess(userForm.password ? "Kullanıcı oluşturuldu." : `Kullanıcı oluşturuldu. Geçici şifre: ${data.generatedPassword}`);
      setUserForm({ role:"OFFICE", email:"", password:"", name:"", phone:"" });
      await loadUsers();
      setTimeout(() => setUserSuccess(null), 6000);
    } catch (e: unknown) { setUserErr(e instanceof Error ? e.message : "Hata"); }
  }

  const isAdmin = myRole === "OWNER" || myRole === "ADMIN";
  const pl = planLabel(ent);

  const TABS: { key: "org"|"users"|"plan"|"security"; label: string; icon: string; admin?: boolean }[] = [
    { key:"org",      label:"Organizasyon", icon:"🏢" },
    { key:"users",    label:"Kullanıcılar", icon:"👥", admin:true },
    { key:"plan",     label:"Abonelik",     icon:"💎" },
    { key:"security", label:"Güvenlik",     icon:"🔒" },
  ];

  const inputStyle: React.CSSProperties = { width:"100%", padding:"11px 14px", border:"1px solid #e2e8f0", borderRadius:12, fontSize:14, background:"#fff", outline:"none", fontFamily:"inherit", transition:"border-color 0.15s" };
  const btnPrimary: React.CSSProperties = { display:"inline-flex", alignItems:"center", gap:8, background:"#0f172a", color:"#fff", border:"none", borderRadius:12, padding:"11px 22px", fontSize:13.5, fontWeight:700, cursor:"pointer", transition:"all 0.15s", fontFamily:"inherit" };

  return (
    <div style={{ maxWidth:860, margin:"0 auto" }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:"#94a3b8", marginBottom:6 }}>Hesap & Yapılandırma</div>
        <h1 style={{ fontSize:28, fontWeight:900, letterSpacing:"-0.04em", color:"#0f172a", margin:0 }}>Ayarlar</h1>
      </div>

      {err && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, padding:"12px 16px", marginBottom:20, fontSize:13.5, color:"#b91c1c" }}>⚠️ {err}</div>}

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, background:"#f1f5f9", borderRadius:14, padding:4, marginBottom:24 }}>
        {TABS.filter(t => !t.admin || isAdmin).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as typeof activeTab)} style={{
            flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7,
            padding:"9px 16px", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:700,
            transition:"all 0.15s", background:activeTab===t.key?"#fff":"transparent",
            color:activeTab===t.key?"#0f172a":"#64748b", boxShadow:activeTab===t.key?"0 1px 4px rgba(0,0,0,0.08)":"none", fontFamily:"inherit",
          }}>
            <span>{t.icon}</span> <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── ORG ── */}
      {activeTab === "org" && (
        <Card>
          <SectionHeader icon="🏢" title="Organizasyon Bilgileri" sub="Firma adı ve sektör yapılandırması" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:20 }}>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#94a3b8", marginBottom:8 }}>Firma Adı</label>
              <input value={org?.name ?? ""} onChange={e => setOrg(o => o ? {...o, name:e.target.value} : o)} placeholder="Örn. Güvenli Asansör Ltd." disabled={!isAdmin} style={{...inputStyle, background:isAdmin?"#fff":"#f9f9fb"}} onFocus={e => e.target.style.borderColor="#7c3aed"} onBlur={e => e.target.style.borderColor="#e2e8f0"} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#94a3b8", marginBottom:8 }}>Telefon (QR sayfasında görünür)</label>
              <input value={org?.phone ?? ""} onChange={e => setOrg(o => o ? {...o, phone:e.target.value} : o)} placeholder="+90 212 000 00 00" disabled={!isAdmin} style={{...inputStyle, background:isAdmin?"#fff":"#f9f9fb"}} onFocus={e => e.target.style.borderColor="#7c3aed"} onBlur={e => e.target.style.borderColor="#e2e8f0"} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#94a3b8", marginBottom:8 }}>Web Sitesi (QR sayfasında görünür)</label>
              <input value={org?.website ?? ""} onChange={e => setOrg(o => o ? {...o, website:e.target.value} : o)} placeholder="www.firmaniz.com" disabled={!isAdmin} style={{...inputStyle, background:isAdmin?"#fff":"#f9f9fb"}} onFocus={e => e.target.style.borderColor="#7c3aed"} onBlur={e => e.target.style.borderColor="#e2e8f0"} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#94a3b8", marginBottom:8 }}>Slug / URL</label>
              <div style={{ display:"flex", alignItems:"center", border:"1px solid #e2e8f0", borderRadius:12, overflow:"hidden", background:"#f9f9fb" }}>
                <span style={{ padding:"11px 12px", fontSize:13, color:"#94a3b8", borderRight:"1px solid #e2e8f0", background:"#f1f1f4", whiteSpace:"nowrap" }}>servisim.app/</span>
                <span style={{ padding:"11px 14px", fontSize:14, color:"#475569", fontFamily:"monospace" }}>{org?.slug ?? "..."}</span>
              </div>
            </div>
          </div>
          <div style={{ padding:"14px 16px", background:"#f9f9fb", borderRadius:12, marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div><div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>Sektör</div><div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>Asansör Servisi & Bakım</div></div>
            <span style={{ background:"#eff6ff", color:"#1d4ed8", border:"1px solid #bfdbfe", padding:"4px 12px", borderRadius:999, fontSize:12, fontWeight:700 }}>ELEVATOR</span>
          </div>
          {saved && <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#15803d" }}>✅ Değişiklikler kaydedildi.</div>}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={saveOrg} disabled={saving || !isAdmin} style={{...btnPrimary, background:saving?"#94a3b8":"#0f172a", cursor:saving||!isAdmin?"not-allowed":"pointer"}}>
              {saving ? "⏳ Kaydediliyor..." : "💾 Kaydet"}
            </button>
            {!isAdmin && <span style={{ fontSize:12.5, color:"#94a3b8" }}>Yalnızca OWNER / ADMIN düzenleyebilir</span>}
          </div>
        </Card>
      )}

      {/* ── USERS ── */}
      {activeTab === "users" && isAdmin && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Card>
            <SectionHeader icon="➕" title="Yeni Kullanıcı Ekle" sub="Ofis veya teknisyen hesabı oluştur" />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:14, marginBottom:16 }}>
              {([
                { label:"Rol", field:"role", type:"select", options:[{value:"OFFICE",label:"🏢 Ofis"},{value:"TECHNICIAN",label:"🔧 Teknisyen"}] },
                { label:"E-posta *", field:"email", type:"email" },
                { label:"Şifre", field:"password", type:"password", placeholder:"Boş = otomatik" },
                { label:"İsim Soyisim", field:"name", type:"text" },
                { label:"Telefon", field:"phone", type:"tel" },
              ] as const).map(f => (
                <div key={f.field}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#94a3b8", marginBottom:8 }}>{f.label}</label>
                  {f.type === "select" ? (
                    <select value={userForm[f.field as keyof typeof userForm]} onChange={e => setUserForm(x => ({...x, [f.field]:e.target.value}))} style={{...inputStyle, cursor:"pointer"}}>
                      {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input type={f.type} value={userForm[f.field as keyof typeof userForm]} onChange={e => setUserForm(x => ({...x, [f.field]:e.target.value}))} placeholder={"placeholder" in f ? f.placeholder : ""} style={inputStyle} onFocus={e => e.target.style.borderColor="#7c3aed"} onBlur={e => e.target.style.borderColor="#e2e8f0"} />
                  )}
                </div>
              ))}
            </div>
            {userErr && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:13, color:"#b91c1c" }}>⚠️ {userErr}</div>}
            {userSuccess && <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:13, color:"#15803d" }}>✅ {userSuccess}</div>}
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button onClick={createUser} disabled={!userForm.email.trim()} style={{...btnPrimary, background:userForm.email.trim()?"#2563eb":"#e2e8f0", color:userForm.email.trim()?"#fff":"#94a3b8", cursor:userForm.email.trim()?"pointer":"not-allowed"}}>
                👤 Kullanıcı Ekle
              </button>
            </div>
          </Card>
          <Card>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:800, color:"#0f172a" }}>👥 Mevcut Kullanıcılar</div>
                <div style={{ fontSize:12.5, color:"#64748b", marginTop:2 }}>{userLoading ? "Yükleniyor..." : `${users.length} hesap`}</div>
              </div>
              <button onClick={loadUsers} style={{ background:"#f1f5f9", border:"none", borderRadius:9, padding:"8px 14px", fontSize:12.5, fontWeight:600, cursor:"pointer", color:"#475569", fontFamily:"inherit" }}>🔄 Yenile</button>
            </div>
            <div style={{ border:"1px solid #e2e8f0", borderRadius:14, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1fr", padding:"10px 16px", background:"#f9f9fb", borderBottom:"1px solid #e2e8f0" }}>
                {["E-posta","İsim","Telefon","Rol","Kayıt"].map(h => <div key={h} style={{ fontSize:10.5, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#94a3b8" }}>{h}</div>)}
              </div>
              {users.length === 0 ? (
                <div style={{ padding:"32px 16px", textAlign:"center", color:"#94a3b8", fontSize:14 }}>{userLoading ? "Yükleniyor..." : "Henüz kullanıcı yok."}</div>
              ) : users.map((u, i) => (
                <div key={u.id} style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1fr", padding:"13px 16px", fontSize:13, borderBottom:i<users.length-1?"1px solid #f1f5f9":"none", alignItems:"center" }}>
                  <div style={{ color:"#0f172a", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
                  <div style={{ color:"#475569" }}>{u.name || "—"}</div>
                  <div style={{ color:"#64748b" }}>{u.phone || "—"}</div>
                  <div><span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#f1f5f9", borderRadius:999, padding:"3px 10px", fontSize:11.5, fontWeight:700, color:"#475569" }}><span style={{ width:6, height:6, borderRadius:"50%", background:roleDot(u.role), display:"inline-block" }} />{roleLabel(u.role)}</span></div>
                  <div style={{ color:"#94a3b8" }}>{new Date(u.createdAt).toLocaleDateString("tr-TR")}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── PLAN ── */}
      {activeTab === "plan" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Card>
            <SectionHeader icon="💎" title="Abonelik Durumu" sub="Mevcut plan ve kullanım bilgileri" />
            <div style={{ background:ent?.isExpired?"linear-gradient(135deg,#fff7ed,#ffedd5)":ent?.isTrial?"linear-gradient(135deg,#f5f3ff,#ede9fe)":"linear-gradient(135deg,#f0fdf4,#dcfce7)", border:`1px solid ${ent?.isExpired?"#fed7aa":ent?.isTrial?"#ddd6fe":"#bbf7d0"}`, borderRadius:16, padding:"20px 24px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#64748b", marginBottom:6 }}>Aktif Plan</div>
                <div style={{ fontSize:26, fontWeight:900, letterSpacing:"-0.04em", color:"#0f172a" }}>{pl}</div>
                {ent?.isTrial && !ent.isExpired && <div style={{ fontSize:13, color:"#7c3aed", marginTop:4, fontWeight:600 }}>⏳ {new Date(ent.trialEndsAt).toLocaleDateString("tr-TR")} tarihinde sona erer</div>}
                {ent?.isExpired && <div style={{ fontSize:13, color:"#ea580c", marginTop:4, fontWeight:600 }}>🔒 Salt-okunur mod aktif</div>}
              </div>
              {(ent?.isTrial || ent?.isExpired) && (
                <Link href="/app/upgrade" style={{ display:"inline-flex", alignItems:"center", gap:8, background:ent.isExpired?"#ea580c":"#7c3aed", color:"#fff", borderRadius:12, padding:"12px 24px", fontSize:14, fontWeight:800, textDecoration:"none", boxShadow:"0 4px 14px rgba(0,0,0,0.15)" }}>
                  {ent.isExpired ? "Planı Yenile →" : "Yükselt →"}
                </Link>
              )}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={{ border:"1px solid #e2e8f0", borderRadius:14, padding:"16px 20px" }}>
                <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"#94a3b8", marginBottom:10 }}>WhatsApp</div>
                <a href="https://wa.me/905551234567" target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:8, fontSize:14, fontWeight:700, color:"#059669", textDecoration:"none" }}>📱 +90 555 123 45 67</a>
                <div style={{ fontSize:12, color:"#94a3b8", marginTop:6 }}>Hft içi 09:00 – 18:00</div>
              </div>
              <div style={{ border:"1px solid #e2e8f0", borderRadius:14, padding:"16px 20px" }}>
                <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"#94a3b8", marginBottom:10 }}>E-posta</div>
                <a href="mailto:satis@servisim.app" style={{ display:"flex", alignItems:"center", gap:8, fontSize:14, fontWeight:700, color:"#2563eb", textDecoration:"none" }}>✉️ satis@servisim.app</a>
                <div style={{ fontSize:12, color:"#94a3b8", marginTop:6 }}>1 iş günü içinde yanıt</div>
              </div>
            </div>
          </Card>
          <Card>
            <SectionHeader icon="📄" title="Belgeler & Şablonlar" sub="Bakım sözleşmesi ve teklif şablonları" />
            {[
              { title:"Teklif Şablonu", desc:"Bakım ve servis teklifleri için örnek PDF", href:"/docs/teklif-sablonu.pdf", editHref:"/app/docs/teklif" },
              { title:"Sözleşme Şablonu", desc:"Asansör bakım sözleşmesi için örnek PDF", href:"/docs/sozlesme-sablonu.pdf", editHref:"/app/docs/sozlesme" },
            ].map(doc => (
              <div key={doc.title} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", border:"1px solid #e2e8f0", borderRadius:12, marginBottom:10, gap:16, flexWrap:"wrap" }}>
                <div><div style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>{doc.title}</div><div style={{ fontSize:12.5, color:"#64748b", marginTop:2 }}>{doc.desc}</div></div>
                <div style={{ display:"flex", gap:8 }}>
                  <a href={doc.href} target="_blank" rel="noopener noreferrer" style={{ background:"#0f172a", color:"#fff", borderRadius:9, padding:"7px 14px", fontSize:12.5, fontWeight:700, textDecoration:"none" }}>⬇ İndir</a>
                  <Link href={doc.editHref} style={{ border:"1px solid #e2e8f0", color:"#475569", borderRadius:9, padding:"7px 14px", fontSize:12.5, fontWeight:700, textDecoration:"none" }}>✏️ Düzenle</Link>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── SECURITY ── */}
      {activeTab === "security" && (
        <Card>
          <SectionHeader icon="🔒" title="Güvenlik & Gizlilik" sub="Şifre yönetimi ve veri politikası" />
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { title:"Şifre Değiştir", desc:"Güçlü şifre öneririz (en az 12 karakter)", btn:"Yakında", disabled:true },
              { title:"İki Faktörlü Doğrulama", desc:"SMS veya authenticator ile oturum güvenliği", btn:"Yakında", disabled:true },
            ].map(item => (
              <div key={item.title} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", border:"1px solid #e2e8f0", borderRadius:14, gap:16, flexWrap:"wrap" }}>
                <div><div style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>{item.title}</div><div style={{ fontSize:12.5, color:"#64748b", marginTop:3 }}>{item.desc}</div></div>
                <button disabled style={{ background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:9, padding:"8px 16px", fontSize:12.5, fontWeight:700, color:"#94a3b8", cursor:"not-allowed", fontFamily:"inherit" }}>{item.btn}</button>
              </div>
            ))}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", border:"1px solid #e2e8f0", borderRadius:14, gap:16 }}>
              <div><div style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>KVKK & Gizlilik Politikası</div><div style={{ fontSize:12.5, color:"#64748b", marginTop:3 }}>Kişisel veri işleme politikası ve aydınlatma metni</div></div>
              <a href="/kvkk" target="_blank" rel="noopener noreferrer" style={{ border:"1px solid #e2e8f0", borderRadius:9, padding:"8px 16px", fontSize:12.5, fontWeight:700, color:"#475569", textDecoration:"none" }}>Görüntüle →</a>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
