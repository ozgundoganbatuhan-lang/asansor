"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Technician = {
  id: string; name: string; initials?: string | null; phone?: string | null;
  zone?: string | null; certification?: string | null; status?: string | null; createdAt: string;
};

const STATUS_CFG: Record<string, { bg: string; color: string; dot: string; border: string }> = {
  müsait:  { bg: "#E8F5EE", color: "#2E7D4F", dot: "#2E7D4F", border: "#9DCFB0" },
  saha:    { bg: "#FFF3DC", color: "#B86800", dot: "#C87800", border: "#F0C060" },
  ofis:    { bg: "#E4EFF9", color: "#0F121A", dot: "#C87800", border: "#90BEE0" },
  izinli:  { bg: "#f5f3ff", color: "#1A5C96", dot: "#8b5cf6", border: "#ddd6fe" },
  default: { bg: "#F0EDE6", color: "#6E6455", dot: "#9C9080", border: "#D6D0C4" },
};

function getStatus(s?: string | null) {
  if (!s) return STATUS_CFG.default;
  const k = s.toLowerCase();
  for (const [key, val] of Object.entries(STATUS_CFG)) {
    if (k.includes(key)) return val;
  }
  return STATUS_CFG.default;
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = ["#1B1F2B","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#9333ea","#16a34a"];
function avatarBg(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }

const I = ({ d, size = 15 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

export default function TechniciansPage() {
  const [items, setItems]     = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ]             = useState("");
  const [form, setForm]       = useState({ name: "", initials: "", phone: "", zone: "", certification: "", status: "Müsait" });
  const [error, setError]     = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]   = useState(false);

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
      body: JSON.stringify({ name: form.name, initials: form.initials || undefined, phone: form.phone || undefined, zone: form.zone || undefined, certification: form.certification || undefined, status: form.status || undefined }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Hata"); return; }
    setForm({ name: "", initials: "", phone: "", zone: "", certification: "", status: "Müsait" });
    setShowForm(false);
    await load();
  }

  const inp: React.CSSProperties = { width: "100%", height: 42, padding: "0 13px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, background: "#fff", outline: "none", fontFamily: "inherit", transition: "border-color .15s, box-shadow .15s" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .tech-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
        .tech-inp:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.10) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#9C9080", marginBottom: 6 }}>Ekip Yönetimi</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.05em", color: "#1A1510", margin: 0 }}>Teknisyenler</h1>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9C9080" }}>
              <I d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </div>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Ara..." className="tech-inp"
              style={{ ...inp, paddingLeft: 36, width: 200 }} />
          </div>
          <Link href="/technician" target="_blank" style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "#E4EFF9", border: "1px solid #bfdbfe",
            color: "#0F121A", borderRadius: 10, padding: "9px 15px", fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}>
            🛗 Teknisyen Portalı
          </Link>
          <button onClick={() => setShowForm(v => !v)} style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: showForm ? "#fff" : "#1A1510", color: showForm ? "#1A1510" : "#fff",
            border: showForm ? "1.5px solid #e2e8f0" : "none",
            borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            {showForm ? "✕ Kapat" : "+ Teknisyen Ekle"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
        {[
          { label: "Toplam",  val: items.length, color: "#1A1510", bg: "#F0EDE6" },
          { label: "Müsait", val: items.filter(t => (t.status ?? "").toLowerCase().includes("müsait")).length, color: "#2E7D4F", bg: "#E8F5EE" },
          { label: "Sahada", val: items.filter(t => (t.status ?? "").toLowerCase().includes("saha")).length,   color: "#B86800", bg: "#FFF3DC" },
          { label: "Ofiste", val: items.filter(t => (t.status ?? "").toLowerCase().includes("ofis")).length,   color: "#0F121A", bg: "#E4EFF9" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, letterSpacing: "-0.05em" }}>{s.val}</div>
            <div style={{ fontSize: 11.5, color: "#6E6455", marginTop: 4, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1510", marginBottom: 18 }}>Yeni Teknisyen</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 16 }}>
            {([ { label: "Ad Soyad *", field: "name" }, { label: "Kısa", field: "initials", placeholder: "AY" }, { label: "Telefon", field: "phone", type: "tel" }, { label: "Bölge", field: "zone", placeholder: "Kadıköy" }, { label: "Sertifika", field: "certification" }, { label: "Durum", field: "status" } ] as const).map(f => (
              <div key={f.field}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#6E6455", marginBottom: 7 }}>{f.label}</label>
                {f.field === "status" ? (
                  <select value={form.status} onChange={e => setForm(x => ({...x, status: e.target.value}))} className="tech-inp" style={{ ...inp, cursor: "pointer" }}>
                    {["Müsait", "Sahada", "Ofiste", "İzinli"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input value={form[f.field as keyof typeof form]} onChange={e => setForm(x => ({...x, [f.field]: e.target.value}))} placeholder={"placeholder" in f ? f.placeholder : ""} type={"type" in f ? f.type : "text"} className="tech-inp" style={inp} />
                )}
              </div>
            ))}
          </div>
          {error && <div style={{ background: "#FCECE8", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#C0311A" }}>{error}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowForm(false)} style={{ background: "#F0EDE6", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6E6455", fontFamily: "inherit" }}>İptal</button>
            <button onClick={create} disabled={!form.name.trim() || saving} style={{ background: "#1B1F2B", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 3px 12px rgba(37,99,235,0.28)", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Ekleniyor..." : "Ekle"}
            </button>
          </div>
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 12, color: "#6E6455" }}>
          <div style={{ width: 28, height: 28, border: "3px solid #e2e8f0", borderTopColor: "#1B1F2B", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          Yükleniyor...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#fff", border: "1.5px dashed #e2e8f0", borderRadius: 16, padding: "44px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>🔧</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1510", marginBottom: 6 }}>{q ? "Sonuç bulunamadı" : "Henüz teknisyen yok"}</div>
          <div style={{ fontSize: 13, color: "#6E6455" }}>{q ? "Farklı bir arama deneyin." : "Ekibinizin ilk teknisyenini ekleyin."}</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {filtered.map(t => {
            const sc = getStatus(t.status);
            return (
              <div key={t.id} className="tech-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", transition: "all .18s" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: avatarBg(t.name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                    {t.initials || initials(t.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: "#1A1510", letterSpacing: "-0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 5, padding: "3px 9px", borderRadius: 999, background: sc.bg, border: `1px solid ${sc.border}` }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: sc.color }}>{t.status ?? "—"}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {t.phone && (
                    <a href={`tel:${t.phone}`} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "#1B1F2B", textDecoration: "none", fontWeight: 600 }}>
                      <span style={{ color: "#9C9080" }}><I d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></span>
                      {t.phone}
                    </a>
                  )}
                  {t.zone && (
                    <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "#6E6455" }}>
                      <span style={{ color: "#9C9080" }}><I d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></span>
                      {t.zone}
                    </div>
                  )}
                  {t.certification && (
                    <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "#6E6455" }}>
                      <span style={{ color: "#9C9080" }}><I d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></span>
                      {t.certification}
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#9C9080" }}>Katılım: {new Date(t.createdAt).toLocaleDateString("tr-TR")}</span>
                  <Link href={`/technician?tech=${t.id}`} target="_blank" style={{ fontSize: 11.5, fontWeight: 700, color: "#1B1F2B", textDecoration: "none", background: "#E4EFF9", borderRadius: 7, padding: "4px 10px" }}>
                    Portala git →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
