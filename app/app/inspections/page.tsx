"use client";

import { useEffect, useMemo, useState } from "react";

type Asset = { id: string; name: string; elevatorIdNo?: string | null; inspectionLabel?: string | null; nextInspectionAt?: string | null; customer: { name: string } };
type Inspection = {
  id: string; inspectionDate: string; nextDueDate: string;
  inspectionBody?: string | null; inspectorName?: string | null;
  result: string; label: string; deficiencies?: string | null; notes?: string | null;
  asset: { id: string; name: string; customer: { name: string } };
};

const LM: Record<string, { label: string; bg: string; color: string; border: string; icon: string; desc: string }> = {
  YESIL:   { label: "Yeşil",   bg: "#f0fdf4", color: "#166534", border: "#bbf7d0", icon: "🟢", desc: "Kusursuz — Güvenli kullanım" },
  MAVI:    { label: "Mavi",    bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", icon: "🔵", desc: "Hafif Kusurlu — 120 gün içinde düzeltilmeli" },
  SARI:    { label: "Sarı",    bg: "#fefce8", color: "#92400e", border: "#fde68a", icon: "🟡", desc: "Kusurlu — Takip muayenesi gerekli" },
  KIRMIZI: { label: "Kırmızı", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", icon: "🔴", desc: "GÜVENSİZ — 30 gün içinde durdurulacak!" },
};

function daysLeft(d: string) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); }

const F: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", color: "#111827" };

export default function InspectionsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [items, setItems] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fAsset, setFAsset] = useState("");
  const [fDate, setFDate] = useState(new Date().toISOString().slice(0, 10));
  const [fNext, setFNext] = useState(() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); });
  const [fBody, setFBody] = useState(""); const [fInspector, setFInspector] = useState(""); const [fResult, setFResult] = useState("UYGUNSUZLUK_YOK"); const [fDeficiencies, setFDeficiencies] = useState(""); const [fNotes, setFNotes] = useState(""); const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const [iRes, aRes] = await Promise.all([fetch("/api/inspections"), fetch("/api/assets")]);
    const [i, a] = await Promise.all([iRes.json(), aRes.json()]);
    setItems(i.items ?? []); setAssets(a.items ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setCreating(true); setErr(null);
    const res = await fetch("/api/inspections", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ assetId: fAsset, inspectionDate: fDate, nextDueDate: fNext, inspectionBody: fBody || undefined, inspectorName: fInspector || undefined, result: fResult, deficiencies: fDeficiencies || undefined, notes: fNotes || undefined }) });
    const data = await res.json(); setCreating(false);
    if (!res.ok) { setErr(data.error ?? "Hata"); return; }
    setSuccess("Muayene kaydedildi ✓"); setShowForm(false); setTimeout(() => setSuccess(null), 4000); await load();
  }

  const upcoming = useMemo(() => assets.filter(a => a.nextInspectionAt).sort((a, b) => new Date(a.nextInspectionAt!).getTime() - new Date(b.nextInspectionAt!).getTime()).slice(0, 10), [assets]);
  const overdue = upcoming.filter(a => daysLeft(a.nextInspectionAt!) <= 0);
  const dueSoon = upcoming.filter(a => daysLeft(a.nextInspectionAt!) > 0 && daysLeft(a.nextInspectionAt!) <= 60);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <button onClick={() => setShowForm(!showForm)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: showForm ? "#fff" : "#2563eb", color: showForm ? "#374151" : "#fff", border: showForm ? "1px solid #e5e7eb" : "none", fontSize: 13, fontWeight: 600, padding: "9px 18px", borderRadius: 9, cursor: "pointer" }}>
          {showForm ? "✕ Kapat" : "+ Muayene Kaydet"}
        </button>
      </div>

      {err && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#b91c1c" }}>{err}</div>}
      {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#166534" }}>{success}</div>}

      {overdue.length > 0 && <div style={{ display: "flex", gap: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", alignItems: "flex-start" }}><span style={{ fontSize: 18 }}>🔴</span><div><div style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c" }}>{overdue.length} asansörün periyodik kontrolü gecikti!</div><div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{overdue.map((a, i) => <span key={a.id}>{i > 0 && " · "}{a.name} ({a.customer.name})</span>)}</div></div></div>}
      {dueSoon.length > 0 && <div style={{ display: "flex", gap: 10, background: "#fefce8", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", alignItems: "flex-start" }}><span style={{ fontSize: 18 }}>🟡</span><div><div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>{dueSoon.length} asansörün muayene tarihi 60 gün içinde!</div><div style={{ fontSize: 11, color: "#b45309", marginTop: 3 }}>{dueSoon.map((a, i) => <span key={a.id}>{i > 0 && " · "}{a.name} — {daysLeft(a.nextInspectionAt!)} gün</span>)}</div></div></div>}

      {/* Label legend */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {Object.entries(LM).map(([k, v]) => (
          <div key={k} style={{ background: v.bg, border: `1px solid ${v.border}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}><span>{v.icon}</span><span style={{ fontSize: 12, fontWeight: 700, color: v.color }}>{v.label} Etiket</span></div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{v.desc}</div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #bfdbfe", borderRadius: 14, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Yeni Periyodik Muayene Kaydı</div>
          <form onSubmit={create} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Asansör *</label>
                <select style={F} value={fAsset} onChange={e => setFAsset(e.target.value)} required>
                  <option value="">— Seçin —</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name} — {a.customer.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Muayene Tarihi *</label>
                <input style={F} type="date" value={fDate} onChange={e => setFDate(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Sonraki Muayene *</label>
                <input style={F} type="date" value={fNext} onChange={e => setFNext(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Muayene Kuruluşu</label>
                <input style={F} value={fBody} onChange={e => setFBody(e.target.value)} placeholder="TSE, SZUTEST…" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Muayene Sonucu</label>
                <select style={F} value={fResult} onChange={e => setFResult(e.target.value)}>
                  <option value="UYGUNSUZLUK_YOK">Uygunsuzluk Yok (Yeşil)</option>
                  <option value="HAFIF_KUSURLU">Hafif Kusurlu (Mavi)</option>
                  <option value="KUSURLU">Kusurlu (Sarı)</option>
                  <option value="GUVENSIZ">Güvensiz (Kırmızı)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Muayeneci</label>
                <input style={F} value={fInspector} onChange={e => setFInspector(e.target.value)} placeholder="Ad Soyad" />
              </div>
              <div style={{ gridColumn: "1 / 4" }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Eksiklikler</label>
                <textarea style={{ ...F, minHeight: 60, resize: "vertical" }} value={fDeficiencies} onChange={e => setFDeficiencies(e.target.value)} placeholder="Tespit edilen eksiklikler…" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={!fAsset || creating} style={{ background: "#2563eb", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, padding: "9px 20px", borderRadius: 9, cursor: "pointer", opacity: (!fAsset || creating) ? 0.6 : 1 }}>{creating ? "Kaydediliyor…" : "Muayene Kaydet →"}</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: "none", border: "1px solid #e5e7eb", color: "#6b7280", fontSize: 13, fontWeight: 600, padding: "9px 16px", borderRadius: 9, cursor: "pointer" }}>İptal</button>
            </div>
          </form>
        </div>
      )}

      {/* Inspections list */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Muayene Kayıtları</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{items.length} kayıt</div>
        </div>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><div style={{ width: 28, height: 28, border: "3px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin .7s linear infinite" }} /></div>
        ) : items.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Henüz muayene kaydı yok.</div>
        ) : items.map((insp, i) => {
          const lm = LM[insp.label] ?? LM.YESIL;
          return (
            <div key={insp.id} style={{ padding: "14px 18px", borderBottom: i < items.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", alignItems: "flex-start", gap: 14, borderLeft: `4px solid ${lm.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{insp.asset.name}</span>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>— {insp.asset.customer.name}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: lm.bg, color: lm.color, border: `1px solid ${lm.border}`, borderRadius: 99, padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>{lm.icon} {lm.label}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: "#6b7280" }}>
                  <span>📅 {new Date(insp.inspectionDate).toLocaleDateString("tr-TR")}</span>
                  <span>→ Sonraki: {new Date(insp.nextDueDate).toLocaleDateString("tr-TR")}</span>
                  {insp.inspectionBody && <span>🏛 {insp.inspectionBody}</span>}
                  {insp.inspectorName && <span>👤 {insp.inspectorName}</span>}
                </div>
                {insp.deficiencies && <div style={{ marginTop: 8, background: "#fefce8", border: "1px solid #fde68a", borderRadius: 7, padding: "6px 10px", fontSize: 12, color: "#92400e" }}>⚠ {insp.deficiencies}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
