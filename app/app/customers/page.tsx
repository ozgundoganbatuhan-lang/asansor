"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Customer = {
  id: string; name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  _count: { assets: number; workOrders: number };
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [q, setQ]                 = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [name, setName]           = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone]         = useState("");
  const [email, setEmail]         = useState("");
  const [saving, setSaving]       = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/customers");
      const d = await r.json();
      if (d.error) setError(d.error);
      else setCustomers(d.items ?? []);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(
    () => customers.filter(c => !q || [c.name, c.contactName ?? "", c.phone ?? "", c.email ?? ""].join(" ").toLowerCase().includes(q.toLowerCase())),
    [customers, q]
  );

  const totalAssets = filtered.reduce((s, c) => s + c._count.assets, 0);
  const totalWO     = filtered.reduce((s, c) => s + c._count.workOrders, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setSaving(true);
    const res = await fetch("/api/customers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, contactName: contactName || undefined, phone: phone || undefined, email: email || undefined }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(d.error ?? "Müşteri oluşturulamadı"); return; }
    setName(""); setContactName(""); setPhone(""); setEmail(""); setShowForm(false);
    await load();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 14 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: "#94a3b8", marginBottom: 6 }}>Portföy</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.04em", color: "#0f172a", lineHeight: 1.05 }}>Müşteriler</h1>
          <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.65, color: "#64748b", maxWidth: 560 }}>
            Bina yöneticileri, site yönetimleri ve kurumsal müşteriler.
          </p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: showForm ? "#fff" : "#2563eb",
          color: showForm ? "#0f172a" : "#fff",
          border: showForm ? "1.5px solid #e2e8f0" : "none",
          fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 10,
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: showForm ? "none" : "0 4px 16px rgba(37,99,235,0.3)",
        }}>
          {showForm ? "Formu kapat" : (
            <>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
              Yeni müşteri
            </>
          )}
        </button>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "12px 16px", borderRadius: 12, fontSize: 13 }}>{error}</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {[
          { label: "Toplam müşteri", value: customers.length, color: "#0f172a" },
          { label: "Toplam asansör", value: totalAssets, color: "#2563eb" },
          { label: "Toplam iş emri", value: totalWO, color: "#7c3aed" },
        ].map((k, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#94a3b8", marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 1, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>Yeni müşteri ekle</div>
          <form onSubmit={submit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {[
                { l: "Müşteri adı *", v: name, set: setName, req: true },
                { l: "İletişim kişisi", v: contactName, set: setContactName },
                { l: "Telefon", v: phone, set: setPhone, type: "tel" },
                { l: "E-posta", v: email, set: setEmail, type: "email" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={labelStyle}>{f.l}</label>
                  <input required={f.req} type={f.type || "text"} value={f.v} onChange={e => f.set(e.target.value)} style={fieldStyle} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button type="submit" disabled={saving} style={{ background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700, padding: "11px 22px", borderRadius: 10, border: "none", cursor: saving ? "wait" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}>
                {saving ? "Kaydediliyor..." : "Müşteriyi oluştur"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: "#fff", color: "#0f172a", fontSize: 14, fontWeight: 600, padding: "11px 22px", borderRadius: 10, border: "1.5px solid #e2e8f0", cursor: "pointer", fontFamily: "inherit" }}>İptal</button>
            </div>
          </form>
        </div>
      )}

      <input type="text" placeholder="İsim, telefon, e-posta..." value={q} onChange={e => setQ(e.target.value)} style={{ ...fieldStyle, height: 44, fontSize: 14 }} />

      {loading ? (
        <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#fff", border: "1px dashed #e2e8f0", borderRadius: 16, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Müşteri bulunamadı</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Arama kriterini değiştirin veya yeni müşteri ekleyin.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {filtered.map(c => (
            <Link key={c.id} href={`/app/customers/${c.id}`} className="cust-card" style={{
              background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16,
              padding: 18, textDecoration: "none", color: "inherit", transition: "all 0.18s",
              display: "block",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {c.name.split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                  {c.contactName && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{c.contactName}</div>}
                </div>
              </div>
              {(c.phone || c.email) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                  {c.phone && <div style={{ fontSize: 12, color: "#64748b" }}>📞 {c.phone}</div>}
                  {c.email && <div style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>✉ {c.email}</div>}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: "#f9f9fb", borderRadius: 10, padding: "8px 11px" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8" }}>Asansör</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{c._count.assets}</div>
                </div>
                <div style={{ background: "#f9f9fb", borderRadius: 10, padding: "8px 11px" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8" }}>İş emri</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{c._count.workOrders}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        .cust-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.07); border-color: #c7d2fe !important; }
        input:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.10); }
      `}} />
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 12px",
  border: "1.5px solid #e2e8f0", borderRadius: 9,
  fontSize: 14, fontFamily: "inherit", outline: "none",
  background: "#fff", color: "#0f172a",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#64748b",
  textTransform: "uppercase", letterSpacing: "0.12em",
};
