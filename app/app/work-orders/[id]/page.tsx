"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PhotoUploader from "@/components/PhotoUploader";
import SignaturePad from "@/components/SignaturePad";
import PrintButton from "@/components/PrintButton";

/* ─── Types ─── */
type WorkOrder = {
  id: string; code: string; status: string; type: string;
  priority?: string | null; note?: string | null;
  laborCost: number; serviceFee: number;
  scheduledAt?: string | null; completedAt?: string | null;
  customer: { id: string; name: string; phone?: string | null; address?: string | null; email?: string | null };
  asset?: { id: string; name: string; buildingName?: string | null; locationNote?: string | null; elevatorIdNo?: string | null } | null;
  technician?: { id: string; name: string; phone?: string | null } | null;
  partsUsed: { id: string; quantity: number; part: { id: string; name: string; price?: number | null } }[];
  invoice?: { id: string; number: string; status: string } | null;
};
type Evidence = {
  startedAt?: string | null; endedAt?: string | null;
  serviceOutcome?: string | null; summary?: string | null;
  signoffName?: string | null; customerContact?: string | null;
  locationNote?: string | null; signatureDataUrl?: string | null;
};
type Attachment = { id: string; url: string; originalName: string; size: number };
type Technician = { id: string; name: string };
type Asset = { id: string; name: string; buildingName?: string | null };

/* ─── Status config ─── */
const ST: Record<string, { label: string; bg: string; color: string; dot: string; border: string }> = {
  PENDING:     { label: "Planlı",        bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6", border: "#bfdbfe" },
  IN_PROGRESS: { label: "Devam Ediyor",  bg: "#fefce8", color: "#92400e", dot: "#f59e0b", border: "#fde68a" },
  URGENT:      { label: "Acil",          bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444", border: "#fecaca" },
  DONE:        { label: "Tamamlandı",    bg: "#f0fdf4", color: "#166534", dot: "#22c55e", border: "#bbf7d0" },
  CANCELED:    { label: "İptal",         bg: "#f9fafb", color: "#6b7280", dot: "#9ca3af", border: "#e5e7eb" },
};

const TYPE_LABEL: Record<string, string> = {
  FAULT:                "Arıza Müdahalesi",
  PERIODIC_MAINTENANCE: "Periyodik Bakım",
  ANNUAL_INSPECTION:    "Yıllık Muayene",
  REVISION:             "Revizyon",
  INSTALLATION:         "Kurulum",
};

const CHECKLIST = [
  "Teknisyen atandı", "Planlanan saat girildi",
  "Servis özeti yazıldı", "Fotoğraf yüklendi", "İmza alındı",
];

/* ─── Helpers ─── */
function money(v: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format((v ?? 0) / 100);
}
function fmtDate(v?: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ─── Embedded Map (OpenStreetMap iframe — no API key) ─── */
function EmbeddedMap({ address, label, lat, lng }: { address?: string | null; label?: string | null; lat?: number | null; lng?: number | null }) {
  if (!address && !label && !lat) return null;
  // If we have coordinates, use them — much more accurate than text search
  const hasCoords  = lat != null && lng != null;
  const coordStr   = hasCoords ? `${lat},${lng}` : null;
  const searchQuery= encodeURIComponent(address || label || "");
  const labelQuery = encodeURIComponent([label, address].filter(Boolean).join(", "));
  const gmapsEmbed = hasCoords
    ? `https://maps.google.com/maps?q=${coordStr}&output=embed&z=16`
    : `https://maps.google.com/maps?q=${searchQuery}&output=embed&z=15`;
  const gmapsLink  = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${coordStr}`
    : `https://www.google.com/maps/search/?api=1&query=${labelQuery}`;
  const directionsLink = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${coordStr}`
    : `https://www.google.com/maps/dir/?api=1&destination=${searchQuery}`;

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 16 }}>
      {/* Google Maps embed */}
      <div style={{ position: "relative", height: 240 }}>
        <iframe
          src={gmapsEmbed}
          width="100%" height="100%"
          style={{ border: "none", display: "block" }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          title="Konum haritası"
        />
        <a href={gmapsLink} target="_blank" rel="noreferrer"
          style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 7, textDecoration: "none" }}>
          ↗ Tam ekran
        </a>
      </div>
      {/* Address + actions */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: "1px solid #f3f4f6", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", flex: 1, minWidth: 0 }}>
          <span>📍</span>
          <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {[label, address].filter(Boolean).join("  ·  ")}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <a href={gmapsLink} target="_blank" rel="noreferrer"
            style={{ fontSize: 12, fontWeight: 600, color: "#374151", padding: "6px 14px", background: "#f3f4f6", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap" }}>
            🗺️ Haritada Gör
          </a>
          <a href={directionsLink} target="_blank" rel="noreferrer"
            style={{ fontSize: 12, fontWeight: 700, color: "#fff", padding: "6px 14px", background: "#2563eb", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap" }}>
            🧭 Yol Tarifi
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Input / Field helpers ─── */
const F: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 9, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", color: "#111827", boxSizing: "border-box" };
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}

/* ─── Page ─── */
export default function WorkOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem]             = useState<WorkOrder | null>(null);
  const [technicians, setTechs]     = useState<Technician[]>([]);
  const [assets, setAssets]         = useState<Asset[]>([]);
  const [attachments, setAttach]    = useState<Attachment[]>([]);
  const [evidence, setEvidence]     = useState<Evidence>({});
  const [saving, setSaving]         = useState(false);
  const [savingEvidence, setSavEv]  = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState<string | null>(null);
  const [tab, setTab]               = useState<"detay" | "kanit" | "fotolar" | "imza">("detay");
  const [form, setForm]             = useState({ status: "PENDING", technicianId: "", assetId: "", scheduledAt: "", note: "", laborCost: "0", serviceFee: "0" });

  async function load() {
    const [itemRes, techRes, evRes, attRes] = await Promise.all([
      fetch(`/api/work-orders/${params.id}`),
      fetch(`/api/technicians`),
      fetch(`/api/work-orders/${params.id}/evidence`),
      fetch(`/api/work-orders/${params.id}/attachments`),
    ]);
    const itemData = await itemRes.json();
    if (!itemRes.ok) { setError(itemData.error ?? "Yüklenemedi."); return; }
    setItem(itemData.item);
    setForm({ status: itemData.item.status, technicianId: itemData.item.technician?.id ?? "", assetId: itemData.item.asset?.id ?? "", scheduledAt: itemData.item.scheduledAt?.slice(0, 16) ?? "", note: itemData.item.note ?? "", laborCost: String((itemData.item.laborCost ?? 0) / 100), serviceFee: String((itemData.item.serviceFee ?? 0) / 100) });
    setTechs((await techRes.json()).items ?? []);
    setEvidence((await evRes.json()).item ?? {});
    setAttach((await attRes.json()).items ?? []);
    if (itemData.item.customer?.id) {
      const aRes = await fetch(`/api/assets?customerId=${itemData.item.customer.id}`);
      setAssets((await aRes.json()).items ?? []);
    }
  }

  useEffect(() => { void load(); }, [params.id]);

  const st = item ? (ST[item.status] ?? ST.PENDING) : ST.PENDING;

  const completionList = useMemo(() => [
    { label: "Teknisyen atandı",       done: !!form.technicianId },
    { label: "Planlanan saat girildi", done: !!form.scheduledAt },
    { label: "Servis özeti yazıldı",   done: !!(evidence.summary ?? "").trim() },
    { label: "Fotoğraf yüklendi",      done: attachments.length > 0 },
    { label: "İmza alındı",            done: !!evidence.signatureDataUrl },
  ], [form.technicianId, form.scheduledAt, evidence.summary, evidence.signatureDataUrl, attachments.length]);

  const completionPct = Math.round(completionList.filter(c => c.done).length / completionList.length * 100);
  const totalCost = useMemo(() => item ? item.laborCost + item.serviceFee + item.partsUsed.reduce((s, u) => s + (u.part.price ?? 0) * u.quantity, 0) : 0, [item]);

  /* Map — prefer lat/lng coordinates from customer, fallback to address string */
  const mapLat     = (item?.customer as any)?.latitude ?? null;
  const mapLng     = (item?.customer as any)?.longitude ?? null;
  const mapAddress = item?.customer?.address;
  const mapLabel   = item?.customer?.address ?? [item?.asset?.buildingName, item?.customer?.name].filter(Boolean).join(" — ");

  async function saveOrder() {
    setSaving(true); setError(null); setSuccess(null);
    const res = await fetch(`/api/work-orders/${params.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: form.status, technicianId: form.technicianId || null, assetId: form.assetId || null, scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null, note: form.note || null, laborCost: Math.round(Number(form.laborCost) * 100), serviceFee: Math.round(Number(form.serviceFee) * 100), completedAt: form.status === "DONE" ? new Date().toISOString() : null }) });
    const data = await res.json(); setSaving(false);
    if (!res.ok) { setError(data.error ?? "Kaydedilemedi."); return; }
    setSuccess("İş emri güncellendi ✓"); await load();
  }

  async function saveEv() {
    setSavEv(true); setError(null);
    const res = await fetch(`/api/work-orders/${params.id}/evidence`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(evidence) });
    const data = await res.json(); setSavEv(false);
    if (!res.ok) { setError(data.error ?? "Kaydedilemedi."); return; }
    setSuccess("Servis kanıtı kaydedildi ✓");
  }

  if (!item) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
      {error ? <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 18px", color: "#b91c1c", fontSize: 13 }}>{error}</div>
             : <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #e5e7eb", borderTopColor: "#2563eb", animation: "spin .7s linear infinite" }} />}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input:focus,select:focus,textarea:focus{border-color:#2563eb!important;outline:none!important;}`}</style>

      {/* ── Breadcrumb ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9ca3af" }}>
        <Link href="/app/work-orders" style={{ color: "#6b7280", textDecoration: "none", fontWeight: 500 }}>← İş Emirleri</Link>
        <span>/</span>
        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#374151" }}>{item.code}</span>
      </div>

      {/* ── Header card ── */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            {/* Status pill */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 99, padding: "4px 12px", marginBottom: 10 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: st.dot }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: st.color }}>{st.label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#111827", letterSpacing: "-0.06em", marginBottom: 6 }}>{item.code}</div>
            <div style={{ fontSize: 14, color: "#6b7280" }}>
              <span style={{ fontWeight: 600, color: "#374151" }}>{item.customer.name}</span>
              {item.asset?.name && <><span style={{ margin: "0 6px", color: "#d1d5db" }}>·</span><span>{item.asset.name}</span></>}
              {item.asset?.buildingName && <><span style={{ margin: "0 6px", color: "#d1d5db" }}>·</span><span>{item.asset.buildingName}</span></>}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
              {TYPE_LABEL[item.type] ?? item.type}
              {item.scheduledAt && <><span style={{ margin: "0 8px" }}>·</span>📅 {fmtDate(item.scheduledAt)}</>}
              {item.technician?.name && <><span style={{ margin: "0 8px" }}>·</span>👷 {item.technician.name}</>}
            </div>
          </div>
          {/* Completion ring */}
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: completionPct === 100 ? "#22c55e" : completionPct >= 60 ? "#f59e0b" : "#ef4444", letterSpacing: "-1px" }}>%{completionPct}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Hazırlık</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 16, height: 6, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${completionPct}%`, background: completionPct === 100 ? "#22c55e" : "#2563eb", borderRadius: 99, transition: "width .3s" }} />
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <a href={`/service-forms/${item.id}`} target="_blank" rel="noreferrer"
            style={{ fontSize: 12, fontWeight: 700, padding: "7px 14px", background: "#111827", color: "#fff", borderRadius: 8, textDecoration: "none" }}>
            Servis Formu ↗
          </a>
          {item.customer.phone && (
            <a href={`tel:${item.customer.phone}`}
              style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", background: "#f3f4f6", color: "#374151", borderRadius: 8, textDecoration: "none" }}>
              📞 {item.customer.phone}
            </a>
          )}
          <PrintButton className="print-btn-dark" />
        </div>
      </div>

      {/* Alerts */}
      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#b91c1c", display: "flex", justifyContent: "space-between" }}>{error}<button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#b91c1c", fontWeight: 700 }}>✕</button></div>}
      {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#166534" }}>{success}</div>}

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", gap: 2, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 5 }}>
        {([
          { key: "detay",  label: "📋 Detay" },
          { key: "kanit",  label: "✅ Servis Kanıtı" },
          { key: "fotolar",label: "📷 Fotoğraflar" },
          { key: "imza",   label: "✍️ İmza" },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: 1, padding: "8px 14px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: tab === t.key ? "#111827" : "transparent", color: tab === t.key ? "#fff" : "#6b7280", transition: "all .15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════ DETAY TAB ══════════ */}
      {tab === "detay" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>
          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Map — always on top */}
            {(mapAddress || mapLabel) && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "#9ca3af", marginBottom: 8 }}>📍 KONUM</div>
                <EmbeddedMap address={mapAddress} label={mapLabel} lat={mapLat} lng={mapLng} />
              </div>
            )}

            {/* Operasyon kartı */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Operasyon Güncelle</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Durum">
                  <select style={F} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </Field>
                <Field label="Teknisyen">
                  <select style={F} value={form.technicianId} onChange={e => setForm(f => ({ ...f, technicianId: e.target.value }))}>
                    <option value="">— Seçin —</option>
                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </Field>
                <Field label="Asansör">
                  <select style={F} value={form.assetId} onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))}>
                    <option value="">— Seçin —</option>
                    {assets.map(a => <option key={a.id} value={a.id}>{a.name}{a.buildingName ? ` · ${a.buildingName}` : ""}</option>)}
                  </select>
                </Field>
                <Field label="Planlanan Tarih">
                  <input style={F} type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                </Field>
                <Field label="İşçilik (₺)">
                  <input style={F} type="number" value={form.laborCost} onChange={e => setForm(f => ({ ...f, laborCost: e.target.value }))} />
                </Field>
                <Field label="Servis Ücreti (₺)">
                  <input style={F} type="number" value={form.serviceFee} onChange={e => setForm(f => ({ ...f, serviceFee: e.target.value }))} />
                </Field>
                <div style={{ gridColumn: "1 / 3" }}>
                  <Field label="Not">
                    <textarea style={{ ...F, minHeight: 70, resize: "vertical" }} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="İş emri notu..." />
                  </Field>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button onClick={saveOrder} disabled={saving} style={{ background: "#2563eb", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, padding: "10px 20px", borderRadius: 9, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
                {form.status !== "IN_PROGRESS" && (
                  <button onClick={() => setForm(f => ({ ...f, status: "IN_PROGRESS" }))} style={{ background: "#fefce8", color: "#92400e", border: "1px solid #fde68a", fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: 9, cursor: "pointer" }}>
                    Başlat
                  </button>
                )}
                {form.status !== "DONE" && (
                  <button onClick={() => setForm(f => ({ ...f, status: "DONE" }))} style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: 9, cursor: "pointer" }}>
                    Tamamlandı
                  </button>
                )}
              </div>
            </div>

            {/* Finance */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 14 }}>Finans</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
                {[{ label: "İşçilik", val: money(item.laborCost) }, { label: "Servis", val: money(item.serviceFee) }, { label: "Parçalar", val: money(item.partsUsed.reduce((s, u) => s + (u.part.price ?? 0) * u.quantity, 0)) }, { label: "Toplam", val: money(totalCost) }].map(k => (
                  <div key={k.label} style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", color: "#9ca3af", marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{k.val}</div>
                  </div>
                ))}
              </div>
              {item.partsUsed.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {item.partsUsed.map(u => (
                    <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f9fafb", borderRadius: 9, fontSize: 13 }}>
                      <div><div style={{ fontWeight: 600, color: "#111827" }}>{u.part.name}</div><div style={{ color: "#9ca3af", fontSize: 11 }}>Adet: {u.quantity}</div></div>
                      <div style={{ fontWeight: 700 }}>{u.part.price ? money(u.part.price * u.quantity) : "—"}</div>
                    </div>
                  ))}
                </div>
              )}
              {item.invoice && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, background: "#f0fdf4", borderRadius: 9, padding: "10px 14px" }}>
                  <span style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>Fatura:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>{item.invoice.number}</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Completion checklist + Customer info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Completion checklist */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Kapanış Hazırlığı</div>
                <span style={{ fontSize: 18, fontWeight: 900, color: completionPct === 100 ? "#22c55e" : completionPct >= 60 ? "#f59e0b" : "#ef4444" }}>%{completionPct}</span>
              </div>
              <div style={{ height: 5, background: "#f3f4f6", borderRadius: 99, overflow: "hidden", marginBottom: 14 }}>
                <div style={{ height: "100%", width: `${completionPct}%`, background: completionPct === 100 ? "#22c55e" : "#2563eb", borderRadius: 99 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {completionList.map(c => (
                  <div key={c.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#f9fafb", borderRadius: 8 }}>
                    <span style={{ fontSize: 12, color: "#374151" }}>{c.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 99, background: c.done ? "#f0fdf4" : "#f3f4f6", color: c.done ? "#166534" : "#6b7280" }}>{c.done ? "✓" : "Eksik"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer info */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Müşteri & Konum</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[["Müşteri", item.customer.name], ["Telefon", item.customer.phone], ["E-posta", item.customer.email], ["Adres", item.customer.address], ["Asansör", item.asset?.name], ["Bina", item.asset?.buildingName], ["Asansör No", item.asset?.elevatorIdNo]].filter(([, v]) => v).map(([l, v], i, arr) => (
                  <div key={l as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none", gap: 12 }}>
                    <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>{l}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", textAlign: "right" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ KANİT TAB ══════════ */}
      {tab === "kanit" && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 18 }}>Servis Kanıtı ve Onay</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Başlangıç Saati">
              <input style={F} type="datetime-local" value={evidence.startedAt?.slice(0, 16) ?? ""} onChange={e => setEvidence(ev => ({ ...ev, startedAt: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
            </Field>
            <Field label="Bitiş Saati">
              <input style={F} type="datetime-local" value={evidence.endedAt?.slice(0, 16) ?? ""} onChange={e => setEvidence(ev => ({ ...ev, endedAt: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
            </Field>
            <Field label="Servis Sonucu">
              <input style={F} value={evidence.serviceOutcome ?? ""} onChange={e => setEvidence(ev => ({ ...ev, serviceOutcome: e.target.value }))} placeholder="Bakım tamamlandı / parça bekleniyor..." />
            </Field>
            <Field label="Onaylayan Kişi">
              <input style={F} value={evidence.signoffName ?? ""} onChange={e => setEvidence(ev => ({ ...ev, signoffName: e.target.value }))} placeholder="Bina yöneticisi..." />
            </Field>
            <Field label="Sahadaki Muhatap">
              <input style={F} value={evidence.customerContact ?? ""} onChange={e => setEvidence(ev => ({ ...ev, customerContact: e.target.value }))} />
            </Field>
            <Field label="Konum Notu">
              <input style={F} value={evidence.locationNote ?? ""} onChange={e => setEvidence(ev => ({ ...ev, locationNote: e.target.value }))} placeholder="Bina arka giriş, 3. kat..." />
            </Field>
            <div style={{ gridColumn: "1 / 3" }}>
              <Field label="Servis Özeti">
                <textarea style={{ ...F, minHeight: 90, resize: "vertical" }} value={evidence.summary ?? ""} onChange={e => setEvidence(ev => ({ ...ev, summary: e.target.value }))} placeholder="Yapılan işlem, tespit ve öneriler..." />
              </Field>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={saveEv} disabled={savingEvidence} style={{ background: "#2563eb", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, padding: "10px 20px", borderRadius: 9, cursor: "pointer", opacity: savingEvidence ? 0.6 : 1 }}>
              {savingEvidence ? "Kaydediliyor..." : "Kanıtı Kaydet"}
            </button>
            <button onClick={() => setEvidence(ev => ({ ...ev, summary: item.note ?? ev.summary }))} style={{ background: "#f3f4f6", color: "#374151", border: "none", fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: 9, cursor: "pointer" }}>
              İş emri notunu aktar
            </button>
          </div>
        </div>
      )}

      {/* ══════════ FOTOĞRAF TAB ══════════ */}
      {tab === "fotolar" && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Fotoğraf Kanıtları</div>
          <PhotoUploader workOrderId={item.id} onUploaded={newItems => setAttach(prev => [...newItems, ...prev])} />
          {attachments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", fontSize: 13 }}>Henüz fotoğraf yüklenmedi.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 16 }}>
              {attachments.map(a => (
                <a key={a.id} href={a.url} target="_blank" rel="noreferrer" style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", display: "block", textDecoration: "none" }}>
                  <img src={a.url} alt={a.originalName} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
                  <div style={{ padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.originalName}</div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ İMZA TAB ══════════ */}
      {tab === "imza" && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Müşteri İmzası</div>
          <SignaturePad value={evidence.signatureDataUrl} onChange={signatureDataUrl => setEvidence(ev => ({ ...ev, signatureDataUrl }))} />
          {evidence.signatureDataUrl && (
            <button onClick={saveEv} style={{ marginTop: 14, background: "#2563eb", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, padding: "10px 20px", borderRadius: 9, cursor: "pointer" }}>
              İmzayı Kaydet
            </button>
          )}
        </div>
      )}
    </div>
  );
}
