"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Asset = {
  id: string; name: string; buildingName?: string | null;
  elevatorIdNo?: string | null; locationNote?: string | null;
  riskScore?: number | null; inspectionLabel?: string | null;
  nextInspectionAt?: string | null; lastInspectionAt?: string | null;
  customer: { id: string; name: string };
};
type Customer = { id: string; name: string };

const LABEL_CFG: Record<string, { label: string; bg: string; border: string; text: string; dot: string; desc: string }> = {
  YESIL:   { label: "Yeşil",   bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46", dot: "#059669", desc: "Kusursuz" },
  MAVI:    { label: "Mavi",    bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8", dot: "#2563eb", desc: "Hafif kusurlu" },
  SARI:    { label: "Sarı",    bg: "#fffbeb", border: "#fcd34d", text: "#92400e", dot: "#d97706", desc: "Kusurlu" },
  KIRMIZI: { label: "Kırmızı", bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", dot: "#dc2626", desc: "GÜVENSİZ" },
};

const emptyForm = { customerId: "", name: "", buildingName: "", elevatorIdNo: "", locationNote: "", riskScore: "0" };

function LabelBadge({ label }: { label?: string | null }) {
  const cfg = label ? LABEL_CFG[label] : null;
  if (!cfg) return <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Kontrol kaydı yok</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label} Etiket
    </span>
  );
}

function Countdown({ nextAt }: { nextAt?: string | null }) {
  if (!nextAt) return null;
  const days = Math.ceil((new Date(nextAt).getTime() - Date.now()) / 86400000);
  if (days < 0)  return <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>⚠ {Math.abs(days)} gün gecikti</span>;
  if (days <=30) return <span style={{ fontSize: 11, fontWeight: 700, color: "#d97706" }}>⏰ {days} gün kaldı</span>;
  if (days <=90) return <span style={{ fontSize: 11, fontWeight: 600, color: "#0891b2" }}>{days} gün kaldı</span>;
  return <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(nextAt).toLocaleDateString("tr-TR")}</span>;
}

export default function AssetsPage() {
  const [assets, setAssets]       = useState<Asset[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery]         = useState("");
  const [labelFilter, setLabelFilter] = useState("ALL");
  const [form, setForm]           = useState(emptyForm);
  const [error, setError]         = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [showForm, setShowForm]   = useState(false);

  async function load() {
    const [aR, cR] = await Promise.all([fetch("/api/assets"), fetch("/api/customers")]);
    const [a, c]   = await Promise.all([aR.json(), cR.json()]);
    setAssets(a.items ?? []);
    setCustomers(c.items ?? []);
  }
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    let list = assets.filter(a => `${a.name} ${a.buildingName ?? ""} ${a.customer.name}`.toLowerCase().includes(query.toLowerCase()));
    if (labelFilter !== "ALL") list = list.filter(a => (a.inspectionLabel ?? "YOK") === labelFilter);
    return list;
  }, [assets, query, labelFilter]);

  const riskyCount   = assets.filter(a => (a.riskScore ?? 0) >= 70).length;
  const overdueCount = assets.filter(a => a.nextInspectionAt && new Date(a.nextInspectionAt) < new Date()).length;
  const redCount     = assets.filter(a => a.inspectionLabel === "KIRMIZI").length;
  const yellowCount  = assets.filter(a => a.inspectionLabel === "SARI").length;
  const noLabelCount = assets.filter(a => !a.inspectionLabel).length;

  async function submit() {
    setSaving(true); setError(null);
    const res = await fetch("/api/assets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, riskScore: Number(form.riskScore) }) });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setError(d.error ?? "Asansör oluşturulamadı."); return; }
    setForm(emptyForm); setShowForm(false); await load();
  }

  const filterButtons = [
    { key: "ALL",     label: "Tümü",       count: assets.length },
    { key: "YESIL",   label: "🟢 Yeşil",   count: assets.filter(a => a.inspectionLabel === "YESIL").length },
    { key: "MAVI",    label: "🔵 Mavi",    count: assets.filter(a => a.inspectionLabel === "MAVI").length },
    { key: "SARI",    label: "🟡 Sarı",    count: yellowCount },
    { key: "KIRMIZI", label: "🔴 Kırmızı", count: redCount },
    { key: "YOK",     label: "⚪ Kayıt yok", count: noLabelCount },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Page header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 14 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: "#94a3b8", marginBottom: 6 }}>Servisim Filo</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.04em", color: "#0f172a", lineHeight: 1.05 }}>Asansör portföyü</h1>
          <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.65, color: "#64748b", maxWidth: 560 }}>
            Bina, müşteri, risk ve muayene etiketi. Etiket rengi A-Tipi muayene sonucunu yansıtır.
          </p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{
          display: "inline-flex", alignItems: "center", gap: 6, background: "#2563eb", color: "#fff",
          fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 10, border: "none",
          cursor: "pointer", boxShadow: "0 4px 16px rgba(37,99,235,0.3)", fontFamily: "inherit"
        }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          {showForm ? "Formu kapat" : "Yeni asansör"}
        </button>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "12px 16px", borderRadius: 12, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Alert strips */}
      {(redCount > 0 || yellowCount > 0 || overdueCount > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {redCount > 0 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 14, padding: "12px 16px" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>🔴</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>{redCount} asansör GÜVENSİZ etiket taşıyor — 30 gün içinde durdurulmalı.</div>
              </div>
            </div>
          )}
          {yellowCount > 0 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 14, padding: "12px 16px" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>🟡</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>{yellowCount} asansör Sarı etiketli — takip muayenesi gerekli.</div>
            </div>
          )}
          {overdueCount > 0 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 14, padding: "12px 16px" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>⏰</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#9a3412" }}>{overdueCount} asansörün periyodik kontrol tarihi geçti.</div>
            </div>
          )}
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {[
          { label: "Toplam asansör", value: assets.length, color: "#2563eb", bg: "#eff6ff" },
          { label: "Kırmızı etiket", value: redCount, color: "#dc2626", bg: "#fef2f2" },
          { label: "Yüksek risk", value: riskyCount, color: "#d97706", bg: "#fffbeb" },
          { label: "Kontrol kaydı yok", value: noLabelCount, color: "#64748b", bg: "#f1f5f9" },
        ].map((k, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: "20px 22px", position: "relative" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#94a3b8", marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 1, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filter buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {filterButtons.map(f => (
          <button key={f.key} onClick={() => setLabelFilter(f.key)} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
            background: labelFilter === f.key ? "#0f172a" : "#fff",
            color:      labelFilter === f.key ? "#fff"    : "#334155",
            border:     `1.5px solid ${labelFilter === f.key ? "#0f172a" : "#e2e8f0"}`,
            boxShadow:  labelFilter === f.key ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
          }}>
            {f.label}
            <span style={{ background: labelFilter === f.key ? "rgba(255,255,255,0.18)" : "#f3f4f6", color: labelFilter === f.key ? "#fff" : "#64748b", borderRadius: 999, padding: "1px 7px", fontSize: 11 }}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* New asset form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 14, letterSpacing: "-0.02em" }}>Yeni asansör ekle</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {[
              { k: "customerId", l: "Müşteri",        type: "select" },
              { k: "name",       l: "Asansör adı",    type: "text" },
              { k: "buildingName", l: "Bina adı",     type: "text" },
              { k: "elevatorIdNo", l: "Kimlik no",     type: "text", ph: "TR-IST-2024-0042" },
              { k: "locationNote", l: "Konum notu",   type: "text", ph: "B Blok, zemin kat" },
              { k: "riskScore",  l: "Risk skoru",     type: "number" },
            ].map(f => (
              <div key={f.k} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em" }}>{f.l}</label>
                {f.type === "select" ? (
                  <select value={(form as any)[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 12px", border: "1.5px solid #e2e8f0", borderRadius: 9, fontSize: 14, fontFamily: "inherit", outline: "none" }}>
                    <option value="">Müşteri seçin</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <input type={f.type} placeholder={f.ph || ""} value={(form as any)[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 12px", border: "1.5px solid #e2e8f0", borderRadius: 9, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#1d4ed8", marginTop: 14 }}>
            💡 Muayene etiketini (Yeşil/Mavi/Sarı/Kırmızı) Periyodik Kontrol menüsünden ekleyin.
          </div>
          <button onClick={submit} disabled={saving || !form.customerId || !form.name} style={{
            marginTop: 14, width: "100%", padding: "12px 20px", background: saving || !form.customerId || !form.name ? "#94a3b8" : "#2563eb",
            color: "#fff", fontSize: 14, fontWeight: 700, border: "none", borderRadius: 10, cursor: saving ? "wait" : "pointer", fontFamily: "inherit",
          }}>
            {saving ? "Kaydediliyor..." : "Asansörü oluştur →"}
          </button>
        </div>
      )}

      {/* Search */}
      <input type="text" placeholder="Bina, müşteri veya asansör adı ara..." value={query} onChange={e => setQuery(e.target.value)} style={{
        width: "100%", height: 44, padding: "0 16px", background: "#fff", border: "1.5px solid #e2e8f0",
        borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none",
      }} />

      {/* Asset cards grid */}
      {filtered.length === 0 ? (
        <div style={{ background: "#fff", border: "1px dashed #e2e8f0", borderRadius: 16, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏢</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Asansör bulunamadı</div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>Arama kriterini değiştirin veya yeni asansör ekleyin.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {filtered.map(asset => {
            const risk = asset.riskScore ?? 0;
            const riskColor = risk >= 70 ? "#dc2626" : risk >= 45 ? "#d97706" : "#059669";
            const riskBg    = risk >= 70 ? "#fef2f2" : risk >= 45 ? "#fffbeb" : "#ecfdf5";
            const riskBd    = risk >= 70 ? "#fecaca" : risk >= 45 ? "#fcd34d" : "#a7f3d0";
            const labelCfg  = asset.inspectionLabel ? LABEL_CFG[asset.inspectionLabel] : null;
            return (
              <Link key={asset.id} href={`/app/assets/${asset.id}`} className="asset-card" style={{
                background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16,
                padding: 18, textDecoration: "none", color: "inherit", transition: "all 0.18s",
                display: "block",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{asset.buildingName || "Bina yok"} · {asset.customer.name}</div>
                  </div>
                  <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: riskBg, color: riskColor, border: `1px solid ${riskBd}`, whiteSpace: "nowrap" }}>
                    Risk {risk}
                  </span>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                  background: labelCfg ? labelCfg.bg : "#f9f9fb",
                  border: `1px solid ${labelCfg ? labelCfg.border : "#e2e8f0"}`,
                  borderRadius: 12, padding: "8px 12px", marginBottom: 10,
                }}>
                  <LabelBadge label={asset.inspectionLabel} />
                  <Countdown nextAt={asset.nextInspectionAt} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ background: "#f9f9fb", borderRadius: 10, padding: "8px 11px" }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8" }}>Kimlik</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.elevatorIdNo || "—"}</div>
                  </div>
                  <div style={{ background: "#f9f9fb", borderRadius: 10, padding: "8px 11px" }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8" }}>Konum</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.locationNote || "—"}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .asset-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.07); border-color: #c7d2fe !important; }
        input:focus, select:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.10); }
      `}} />
    </div>
  );
}
