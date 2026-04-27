"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Technician = {
  id: string; name: string; initials?: string | null; phone?: string | null;
  zone?: string | null; certification?: string | null; status?: string | null; createdAt: string;
};

const STATUS_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  müsait:    { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  saha:      { bg: "#fffbeb", color: "#b45309", dot: "#f59e0b" },
  ofis:      { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  izinli:    { bg: "#f5f3ff", color: "#6d28d9", dot: "#8b5cf6" },
  default:   { bg: "#f4f4f5", color: "#52525b", dot: "#a1a1aa" },
};

function getStatusColor(s?: string | null) {
  if (!s) return STATUS_COLORS.default;
  const k = s.toLowerCase();
  for (const [key, val] of Object.entries(STATUS_COLORS)) {
    if (k.includes(key)) return val;
  }
  return STATUS_COLORS.default;
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = ["#2563eb","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#9333ea","#16a34a"];
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }

export default function TechniciansPage() {
  const [items, setItems] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", initials: "", phone: "", zone: "", certification: "", status: "Müsait" });
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/technicians", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    setItems(json.items ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(t => [t.name, t.initials, t.phone, t.zone, t.certification, t.status].filter(Boolean).join(" ").toLowerCase().includes(s));
  }, [items, q]);

  async function create() {
    if (!form.name.trim()) return;
    setError(null); setSaving(true);
    const res = await fetch("/api/technicians", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: form.name, initials: form.initials||undefined, phone: form.phone||undefined, zone: form.zone||undefined, certification: form.certification||undefined, status: form.status||undefined }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Hata"); return; }
    setForm({ name: "", initials: "", phone: "", zone: "", certification: "", status: "Müsait" });
    setShowForm(false);
    await load();
  }

  const inField: React.CSSProperties = { width:"100%", padding:"11px 14px", border:"1px solid #e4e4e7", borderRadius:12, fontSize:14, background:"#fff", outline:"none", fontFamily:"inherit", transition:"border-color 0.15s" };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: 6 }}>Ekip Yönetimi</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", color: "#0a0a0f", margin: 0 }}>Teknisyenler</h1>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍  Ara..." style={{ ...inField, width: 220, paddingLeft: 14 }} onFocus={e => e.target.style.borderColor="#7c3aed"} onBlur={e => e.target.style.borderColor="#e4e4e7"} />
          </div>
          <Link href="/technician" target="_blank" style={{ display:"inline-flex", alignItems:"center", gap:7, background:"linear-gradient(135deg,#eff6ff,#dbeafe)", border:"1px solid #bfdbfe", color:"#1d4ed8", borderRadius:12, padding:"10px 16px", fontSize:13, fontWeight:700, textDecoration:"none" }}>
            🛗 Teknisyen Portalı
          </Link>
          <button onClick={() => setShowForm(v => !v)} style={{ display:"inline-flex", alignItems:"center", gap:7, background:"#0a0a0f", color:"#fff", border:"none", borderRadius:12, padding:"10px 18px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            {showForm ? "✕ Kapat" : "+ Teknisyen Ekle"}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Toplam", val: items.length, color: "#0a0a0f", bg: "#f4f4f6" },
          { label: "Müsait", val: items.filter(t => (t.status ?? "").toLowerCase().includes("müsait")).length, color: "#15803d", bg: "#f0fdf4" },
          { label: "Sahada", val: items.filter(t => (t.status ?? "").toLowerCase().includes("saha")).length, color: "#b45309", bg: "#fffbeb" },
          { label: "Ofiste", val: items.filter(t => (t.status ?? "").toLowerCase().includes("ofis")).length, color: "#1d4ed8", bg: "#eff6ff" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "14px 18px" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, letterSpacing: "-0.04em" }}>{s.val}</div>
            <div style={{ fontSize: 11.5, color: "#71717a", marginTop: 3, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 20, padding: "24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0f", marginBottom: 18 }}>➕ Yeni Teknisyen</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 16 }}>
            {([
              { label: "Ad Soyad *", field: "name" },
              { label: "Kısa", field: "initials", placeholder: "AY" },
              { label: "Telefon", field: "phone", type: "tel" },
              { label: "Bölge", field: "zone", placeholder: "Kadıköy" },
              { label: "Sertifika", field: "certification" },
              { label: "Durum", field: "status" },
            ] as const).map(f => (
              <div key={f.field}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: 8 }}>{f.label}</label>
                {f.field === "status" ? (
                  <select value={form.status} onChange={e => setForm(x => ({...x, status: e.target.value}))} style={{...inField, cursor:"pointer"}}>
                    {["Müsait", "Sahada", "Ofiste", "İzinli"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input value={form[f.field as keyof typeof form]} onChange={e => setForm(x => ({...x, [f.field]: e.target.value}))} placeholder={"placeholder" in f ? f.placeholder : ""} type={"type" in f ? f.type : "text"} style={inField} onFocus={e => e.target.style.borderColor="#7c3aed"} onBlur={e => e.target.style.borderColor="#e4e4e7"} />
                )}
              </div>
            ))}
          </div>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#b91c1c" }}>⚠️ {error}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ background: "#f4f4f6", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#52525b", fontFamily: "inherit" }}>İptal</button>
            <button onClick={create} disabled={!form.name.trim() || saving} style={{ background: form.name.trim() ? "#2563eb" : "#e4e4e7", color: form.name.trim() ? "#fff" : "#a1a1aa", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: form.name.trim() ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all 0.15s" }}>
              {saving ? "⏳ Ekleniyor..." : "Ekle"}
            </button>
          </div>
        </div>
      )}

      {/* Card grid */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 12, color: "#71717a" }}>
          <div style={{ width: 24, height: 24, border: "3px solid #e4e4e7", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          Yükleniyor...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 20, padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔧</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0a0a0f", marginBottom: 6 }}>{q ? "Sonuç bulunamadı" : "Henüz teknisyen yok"}</div>
          <div style={{ fontSize: 13, color: "#71717a" }}>{q ? "Farklı bir arama deneyin." : "Ekibinizin ilk teknisyenini ekleyin."}</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {filtered.map(t => {
            const sc = getStatusColor(t.status);
            return (
              <div key={t.id} style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 18, padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.18s" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: avatarColor(t.name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                    {t.initials || initials(t.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0a0a0f", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot, flexShrink: 0, display: "inline-block" }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: sc.color }}>{t.status ?? "—"}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {t.phone && (
                    <a href={`tel:${t.phone}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
                      <span style={{ fontSize: 14 }}>📞</span> {t.phone}
                    </a>
                  )}
                  {t.zone && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#52525b" }}>
                      <span style={{ fontSize: 14 }}>📍</span> {t.zone}
                    </div>
                  )}
                  {t.certification && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#52525b" }}>
                      <span style={{ fontSize: 14 }}>🏅</span> {t.certification}
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f4f4f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#a1a1aa" }}>Katılım: {new Date(t.createdAt).toLocaleDateString("tr-TR")}</span>
                  <Link href={`/technician?tech=${t.id}`} target="_blank" style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", textDecoration: "none", background: "#eff6ff", borderRadius: 8, padding: "4px 10px" }}>
                    Portala git →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
