"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function WorkOrdersPageWrapper() {
  return <Suspense><WorkOrdersPage /></Suspense>;
}

type WorkOrder = {
  id: string; code: string; status: string; type: string; priority?: string | null;
  createdAt: string;
  customer: { id: string; name: string };
  technician?: { id: string; name: string } | null;
  asset?: { id: string; name: string } | null;
};
type Customer   = { id: string; name: string };
type Technician = { id: string; name: string };
type Asset      = { id: string; name: string; customerId: string };

const TYPE_LABEL: Record<string, string> = {
  FAULT: "Arıza", PERIODIC_MAINTENANCE: "Periyodik bakım",
  ANNUAL_INSPECTION: "Yıllık kontrol", REVISION: "Revizyon", INSTALLATION: "Kurulum",
};

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; border: string; dot: string }> = {
  URGENT:      { label: "Acil",       bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", dot: "#dc2626" },
  IN_PROGRESS: { label: "Yolda",      bg: "#fffbeb", color: "#b45309", border: "#fcd34d", dot: "#d97706" },
  DONE:        { label: "Tamam",      bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", dot: "#059669" },
  PENDING:     { label: "Planlı",     bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", dot: "#2563eb" },
  CANCELED:    { label: "İptal",      bg: "#f4f4f5", color: "#52525b", border: "#d4d4d8", dot: "#71717a" },
};

const FILTERS = ["ALL", "URGENT", "IN_PROGRESS", "PENDING", "DONE", "CANCELED"] as const;
const FILTER_LABEL: Record<string, string> = {
  ALL: "Tümü", URGENT: "Acil", IN_PROGRESS: "Devam", PENDING: "Planlı", DONE: "Bitti", CANCELED: "İptal",
};

function WorkOrdersPage() {
  const sp = useSearchParams();
  const preCustomerId = sp.get("customerId") ?? "";
  const preAssetId    = sp.get("assetId") ?? "";

  const [orders, setOrders]       = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTech]    = useState<Technician[]>([]);
  const [assets, setAssets]       = useState<Asset[]>([]);
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState<string | null>(null);
  const [filterStatus, setFS]     = useState<typeof FILTERS[number]>("ALL");
  const [q, setQ]                 = useState("");
  const [showForm, setShowForm]   = useState(!!preCustomerId);

  const [customerId, setCustomerId]     = useState(preCustomerId);
  const [technicianId, setTechnicianId] = useState("");
  const [assetId, setAssetId]           = useState(preAssetId);
  const [type, setType]                 = useState("FAULT");
  const [status, setStatus]             = useState("PENDING");
  const [priority, setPriority]         = useState("Normal");
  const [note, setNote]                 = useState("");
  const [scheduledAt, setScheduledAt]   = useState("");

  async function load() {
    setLoading(true); setErr(null);
    const [wR, cR, tR, aR] = await Promise.all([
      fetch("/api/work-orders"), fetch("/api/customers"),
      fetch("/api/technicians"), fetch("/api/assets"),
    ]);
    if (!wR.ok) { setErr("İş emirleri yüklenemedi"); setLoading(false); return; }
    const [w, c, t, a] = await Promise.all([wR.json(), cR.json(), tR.json(), aR.json()]);
    setOrders(w.items ?? []); setCustomers(c.items ?? []); setTech(t.items ?? []); setAssets(a.items ?? []);
    if (!customerId && !preCustomerId && c.items?.[0]) setCustomerId(c.items[0].id);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []); // eslint-disable-line

  const filteredAssets = useMemo(() => assets.filter(a => !customerId || a.customerId === customerId), [assets, customerId]);
  const counts = useMemo(() => {
    const m: Record<string, number> = { ALL: orders.length };
    FILTERS.slice(1).forEach(s => { m[s] = orders.filter(o => o.status === s).length; });
    return m;
  }, [orders]);

  const rows = useMemo(() => {
    let result = filterStatus === "ALL" ? orders : orders.filter(o => o.status === filterStatus);
    const s = q.trim().toLowerCase();
    if (s) result = result.filter(o =>
      [o.code, o.customer?.name, o.asset?.name ?? "", o.technician?.name ?? ""].join(" ").toLowerCase().includes(s)
    );
    return result;
  }, [orders, filterStatus, q]);

  async function createOrder(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    if (!customerId) { setErr("Lütfen bir müşteri seçin."); return; }
    const res = await fetch("/api/work-orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId, technicianId: technicianId || undefined, assetId: assetId || undefined,
        type, status, priority, note: note || undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(data?.error ?? "Oluşturma başarısız");
    setNote(""); setScheduledAt(""); setShowForm(false); await load();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Page header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 14 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: "#a1a1aa", marginBottom: 6 }}>Operasyon</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.04em", color: "#0a0a0f", lineHeight: 1.05 }}>İş emirleri</h1>
          <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.65, color: "#71717a", maxWidth: 560 }}>
            Planla, ata, sahayı görünür kıl. Operasyonun ritmi tek listede.
          </p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: showForm ? "#fff" : "#2563eb", color: showForm ? "#0a0a0f" : "#fff",
          border: showForm ? "1.5px solid #e4e4e7" : "none",
          fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 10,
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: showForm ? "none" : "0 4px 16px rgba(37,99,235,0.3)",
        }}>
          {showForm ? "Formu kapat" : (
            <>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
              Yeni iş emri
            </>
          )}
        </button>
      </div>

      {err && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "12px 16px", borderRadius: 12, fontSize: 13 }}>
          {err}
        </div>
      )}

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {[
          { label: "Toplam", value: rows.length, color: "#0a0a0f", bg: "#f4f4f5" },
          { label: "Acil", value: counts.URGENT, color: "#dc2626", bg: "#fef2f2" },
          { label: "Devam Eden", value: counts.IN_PROGRESS, color: "#d97706", bg: "#fffbeb" },
          { label: "Tamamlanan", value: counts.DONE, color: "#059669", bg: "#f0fdf4" },
        ].map((k, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#a1a1aa", marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 1, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* New form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0f", marginBottom: 14, letterSpacing: "-0.02em" }}>Yeni iş emri</div>
          <form onSubmit={createOrder}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {[
                { l: "Müşteri *", el: (
                  <select required value={customerId} onChange={e => { setCustomerId(e.target.value); setAssetId(""); }} style={fieldStyle}>
                    <option value="">Seçin</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) },
                { l: "Asansör", el: (
                  <select value={assetId} onChange={e => setAssetId(e.target.value)} style={fieldStyle}>
                    <option value="">Seçilmedi</option>
                    {filteredAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                ) },
                { l: "Teknisyen", el: (
                  <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} style={fieldStyle}>
                    <option value="">Atanmadı</option>
                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                ) },
                { l: "Tür", el: (
                  <select value={type} onChange={e => setType(e.target.value)} style={fieldStyle}>
                    {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                ) },
                { l: "Durum", el: (
                  <select value={status} onChange={e => setStatus(e.target.value)} style={fieldStyle}>
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                ) },
                { l: "Öncelik", el: (
                  <select value={priority} onChange={e => setPriority(e.target.value)} style={fieldStyle}>
                    {["Normal", "Yüksek", "Kritik"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) },
                { l: "Planlanan tarih", el: (
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={fieldStyle} />
                ) },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={labelStyle}>{f.l}</label>
                  {f.el}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={labelStyle}>Not / açıklama</label>
              <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                placeholder="Arıza detayı, yapılacaklar, bina erişim notu..."
                style={{ ...fieldStyle, height: "auto", padding: "10px 12px", minHeight: 80, resize: "vertical" }} />
            </div>
            {customerId && filteredAssets.length === 0 && (
              <div style={{ marginTop: 12, background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "10px 14px", fontSize: 12.5, color: "#92400e" }}>
                Bu müşteriye ait asansör görünmüyor. <Link href={`/app/customers/${customerId}`} style={{ fontWeight: 700, textDecoration: "underline", color: "#92400e" }}>Detaya gidip kayıt ekleyin.</Link>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <button type="submit" style={{ background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700, padding: "11px 22px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}>
                İş emrini oluştur
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: "#fff", color: "#0a0a0f", fontSize: 14, fontWeight: 600, padding: "11px 22px", borderRadius: 10, border: "1.5px solid #e4e4e7", cursor: "pointer", fontFamily: "inherit" }}>
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters + search */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFS(f)} style={{
              padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              background: filterStatus === f ? "#0a0a0f" : "#fff",
              color:      filterStatus === f ? "#fff"    : "#374151",
              border:     `1.5px solid ${filterStatus === f ? "#0a0a0f" : "#e4e4e7"}`,
              transition: "all 0.12s",
            }}>
              {FILTER_LABEL[f]} {counts[f] > 0 && <span style={{ marginLeft: 5, opacity: 0.65 }}>{counts[f]}</span>}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Kod, müşteri, asansör veya teknisyen..." value={q} onChange={e => setQ(e.target.value)} style={{
          width: 280, height: 38, padding: "0 14px", border: "1.5px solid #e4e4e7", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none",
        }} />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #e4e4e7", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        </div>
      ) : rows.length === 0 ? (
        <div style={{ background: "#fff", border: "1px dashed #e4e4e7", borderRadius: 16, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0f", marginBottom: 6 }}>
            {q || filterStatus !== "ALL" ? "Eşleşen iş emri bulunamadı" : "Henüz iş emri yok"}
          </div>
          <div style={{ fontSize: 13, color: "#71717a" }}>
            {q || filterStatus !== "ALL" ? "Farklı filtre veya arama deneyin." : "İlk iş emrini oluşturarak başlayın."}
          </div>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, overflow: "hidden" }}>
          {rows.map(o => {
            const sc = STATUS_CFG[o.status] ?? STATUS_CFG.PENDING;
            return (
              <Link key={o.id} href={`/app/work-orders/${o.id}`} className="wo-row" style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 18px", borderBottom: "1px solid #f4f4f5",
                textDecoration: "none", color: "inherit", transition: "all 0.12s",
              }}>
                <div style={{ width: 6, alignSelf: "stretch", borderRadius: 3, background: sc.dot, flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 12, fontWeight: 700, color: "#2563eb" }}>{o.code}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {o.asset?.name ?? "Asansör atanmadı"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>
                    {o.customer.name} · {TYPE_LABEL[o.type] ?? o.type} · {o.technician?.name ?? "Atanmadı"}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                  <span style={{ padding: "3px 11px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, whiteSpace: "nowrap" }}>
                    {sc.label}
                  </span>
                  <span style={{ fontSize: 11, color: "#a1a1aa" }}>{new Date(o.createdAt).toLocaleDateString("tr-TR")}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        .wo-row:last-child { border-bottom: none !important; }
        .wo-row:hover { background: #f9f9fb; }
        select:focus, input:focus, textarea:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.10); }
      `}} />
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 12px",
  border: "1.5px solid #e4e4e7", borderRadius: 9,
  fontSize: 14, fontFamily: "inherit", outline: "none",
  background: "#fff", color: "#0a0a0f",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#71717a",
  textTransform: "uppercase", letterSpacing: "0.12em",
};
