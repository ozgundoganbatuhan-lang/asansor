"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Button, Card, EmptyState, ErrorBanner, Input,
  MetricCard, PageHeader, Pill, Select,
} from "@/components/ui";

/* ── Types ── */
type Asset = {
  id: string; name: string; buildingName?: string | null;
  elevatorIdNo?: string | null; locationNote?: string | null;
  riskScore?: number | null;
  inspectionLabel?: string | null;    // YESIL | MAVI | SARI | KIRMIZI
  nextInspectionAt?: string | null;
  lastInspectionAt?: string | null;
  customer: { id: string; name: string };
};
type Customer = { id: string; name: string };

const emptyForm = {
  customerId: "", name: "", buildingName: "", elevatorIdNo: "",
  locationNote: "", riskScore: "0",
};

/* ── Etiket renk sistemi (TSE / A-Tipi Muayene) ── */
const LABEL_CFG: Record<string, {
  label: string; bg: string; border: string; text: string;
  dot: string; pill: "green" | "blue" | "amber" | "red" | "gray";
  desc: string;
}> = {
  YESIL:   { label: "Yeşil",   bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46", dot: "#059669", pill: "green", desc: "Kusursuz" },
  MAVI:    { label: "Mavi",    bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8", dot: "#2563eb", pill: "blue",  desc: "Hafif kusurlu" },
  SARI:    { label: "Sarı",    bg: "#fffbeb", border: "#fcd34d", text: "#92400e", dot: "#d97706", pill: "amber", desc: "Kusurlu" },
  KIRMIZI: { label: "Kırmızı", bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", dot: "#dc2626", pill: "red",   desc: "GÜVENSİZ" },
};

function LabelBadge({ label }: { label?: string | null }) {
  const cfg = label ? LABEL_CFG[label] : null;
  if (!cfg) return <span style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>Kontrol yok</span>;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.text, borderRadius: 999,
      padding: "3px 10px", fontSize: 11, fontWeight: 700,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block", flexShrink: 0 }} />
      {cfg.label} Etiket
    </span>
  );
}

function InspectionCountdown({ nextAt }: { nextAt?: string | null }) {
  if (!nextAt) return null;
  const days = Math.ceil((new Date(nextAt).getTime() - Date.now()) / 86400000);
  if (days < 0) return <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>⚠ {Math.abs(days)} gün gecikti</span>;
  if (days <= 30) return <span style={{ fontSize: 11, fontWeight: 700, color: "#d97706" }}>⏰ {days} gün kaldı</span>;
  if (days <= 90) return <span style={{ fontSize: 11, fontWeight: 600, color: "#0891b2" }}>{days} gün kaldı</span>;
  return <span style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(nextAt).toLocaleDateString("tr-TR")}</span>;
}

export default function AssetsPage() {
  const [assets,    setAssets]    = useState<Asset[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query,     setQuery]     = useState("");
  const [labelFilter, setLabelFilter] = useState<string>("ALL");
  const [form,      setForm]      = useState(emptyForm);
  const [error,     setError]     = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);

  async function load() {
    const [assetRes, customerRes] = await Promise.all([fetch("/api/assets"), fetch("/api/customers")]);
    const [assetData, customerData] = await Promise.all([assetRes.json(), customerRes.json()]);
    setAssets(assetData.items ?? []);
    setCustomers(customerData.items ?? []);
  }
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    let list = assets.filter(a =>
      `${a.name} ${a.buildingName ?? ""} ${a.customer.name}`.toLowerCase().includes(query.toLowerCase())
    );
    if (labelFilter !== "ALL") list = list.filter(a => (a.inspectionLabel ?? "YOK") === labelFilter);
    return list;
  }, [assets, query, labelFilter]);

  /* ── Stats ── */
  const riskyCount    = assets.filter(a => (a.riskScore ?? 0) >= 70).length;
  const overdueCount  = assets.filter(a => a.nextInspectionAt && new Date(a.nextInspectionAt) < new Date()).length;
  const redCount      = assets.filter(a => a.inspectionLabel === "KIRMIZI").length;
  const yellowCount   = assets.filter(a => a.inspectionLabel === "SARI").length;
  const noLabelCount  = assets.filter(a => !a.inspectionLabel).length;

  async function submit() {
    setSaving(true); setError(null);
    const res = await fetch("/api/assets", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, riskScore: Number(form.riskScore) }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Asansör oluşturulamadı."); return; }
    setForm(emptyForm);
    await load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asansör portföyü"
        subtitle="Bina, müşteri, risk ve muayene etiketi aynı listede. Etiket rengi TSE / A-Tipi Muayene sonucunu yansıtır."
        action={<Link href="#new-asset" className="rounded-[20px] bg-[color:var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)]">+ Yeni asansör</Link>}
      />

      {error && <ErrorBanner msg={error} />}

      {/* ── Etiket uyarı şeridi ── */}
      {(redCount > 0 || overdueCount > 0) && (
        <div className="space-y-2">
          {redCount > 0 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 14, padding: "12px 16px" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>🔴</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>{redCount} asansör GÜVENSİZ etiket taşıyor — 30 gün içinde durdurulmalı!</div>
                <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 4 }}>
                  {assets.filter(a => a.inspectionLabel === "KIRMIZI").map((a, i) => <span key={a.id}>{i > 0 && " · "}{a.name} ({a.customer.name})</span>)}
                </div>
              </div>
            </div>
          )}
          {yellowCount > 0 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 14, padding: "12px 16px" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>🟡</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>{yellowCount} asansör Sarı etiketli — takip muayenesi gerekli.</div>
              </div>
            </div>
          )}
          {overdueCount > 0 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 14, padding: "12px 16px" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>⏰</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#9a3412" }}>{overdueCount} asansörün periyodik kontrol tarihi geçti!</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── KPI ── */}
      <section className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Toplam asansör" value={assets.length} note="Kayıtlı varlık sayısı" />
        <MetricCard label="Kırmızı etiket" value={redCount} note="Güvensiz — acil aksiyon gerekli" />
        <MetricCard label="Yüksek risk" value={riskyCount} note="Risk skoru ≥ 70 olan varlıklar" />
        <MetricCard label="Kontrol kaydı yok" value={noLabelCount} note="Muayene girilmemiş asansörler" />
      </section>

      {/* ── Etiket filtresi ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { key: "ALL", label: "Tümü", count: assets.length },
          { key: "YESIL",   label: "🟢 Yeşil",   count: assets.filter(a => a.inspectionLabel === "YESIL").length },
          { key: "MAVI",    label: "🔵 Mavi",     count: assets.filter(a => a.inspectionLabel === "MAVI").length },
          { key: "SARI",    label: "🟡 Sarı",     count: assets.filter(a => a.inspectionLabel === "SARI").length },
          { key: "KIRMIZI", label: "🔴 Kırmızı", count: assets.filter(a => a.inspectionLabel === "KIRMIZI").length },
          { key: "YOK",     label: "⚪ Kayıt yok", count: noLabelCount },
        ].map(f => (
          <button key={f.key} onClick={() => setLabelFilter(f.key)} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
            background: labelFilter === f.key ? "#111827" : "#fff",
            color:      labelFilter === f.key ? "#fff"    : "#374151",
            border:     labelFilter === f.key ? "1.5px solid #111827" : "1.5px solid #e5e7eb",
            boxShadow:  labelFilter === f.key ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
          }}>
            {f.label}
            <span style={{
              background: labelFilter === f.key ? "rgba(255,255,255,0.18)" : "#f3f4f6",
              color:      labelFilter === f.key ? "#fff" : "#6b7280",
              borderRadius: 999, padding: "1px 7px", fontSize: 11,
            }}>{f.count}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* ── Asset list ── */}
        <Card
          title="Kayıtlı asansörler"
          subtitle="Muayene etiketi, sonraki kontrol tarihi ve risk skoru her kartta görünür."
        >
          <div className="mb-5">
            <Input
              label="Ara"
              placeholder="Bina, müşteri veya asansör adı"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon="🏢" title="Asansör bulunamadı" desc="Arama kriterini değiştirin veya yeni asansör ekleyin." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map(asset => {
                const risk = asset.riskScore ?? 0;
                const riskTone = risk >= 70 ? "red" : risk >= 45 ? "amber" : "green";
                const labelCfg = asset.inspectionLabel ? LABEL_CFG[asset.inspectionLabel] : null;
                return (
                  <Link key={asset.id} href={`/app/assets/${asset.id}`} className="panel-soft rounded-[24px] p-5 transition duration-200 hover:-translate-y-0.5 block">
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.name}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>{asset.buildingName || "Bina adı yok"} · {asset.customer.name}</div>
                      </div>
                      <Pill tone={riskTone}>Risk {risk}</Pill>
                    </div>

                    {/* ── ETİKET SATIRI ── */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 8, background: labelCfg ? labelCfg.bg : "#f9fafb",
                      border: `1px solid ${labelCfg ? labelCfg.border : "#e5e7eb"}`,
                      borderRadius: 12, padding: "8px 12px", marginBottom: 12,
                    }}>
                      <LabelBadge label={asset.inspectionLabel} />
                      <InspectionCountdown nextAt={asset.nextInspectionAt} />
                    </div>

                    {/* Details */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div style={{ background: "#fff", borderRadius: 14, padding: "10px 12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9ca3af" }}>Kimlik no</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginTop: 4 }}>{asset.elevatorIdNo || "—"}</div>
                      </div>
                      <div style={{ background: "#fff", borderRadius: 14, padding: "10px 12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9ca3af" }}>Konum</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginTop: 4 }}>{asset.locationNote || "—"}</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* ── New asset form ── */}
        <Card
          title="Yeni asansör ekle"
          subtitle="Kritik bilgileri girin. Muayene etiketini Kontrol Takibi bölümünden ekleyin."
          className="h-fit"
          action={<span id="new-asset" />}
        >
          <div className="form-shell">
            <Select
              label="Müşteri"
              value={form.customerId}
              onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))}
            >
              <option value="">Müşteri seçin</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="Asansör adı" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Input label="Bina adı" value={form.buildingName} onChange={e => setForm(p => ({ ...p, buildingName: e.target.value }))} />
            <Input label="Asansör kimlik no" value={form.elevatorIdNo} onChange={e => setForm(p => ({ ...p, elevatorIdNo: e.target.value }))} placeholder="TR-IST-2024-0042" />
            <Input label="Konum notu" value={form.locationNote} onChange={e => setForm(p => ({ ...p, locationNote: e.target.value }))} placeholder="B Blok, zemin kat girişi" />
            <Input label="Risk skoru (0–100)" type="number" min={0} max={100} value={form.riskScore} onChange={e => setForm(p => ({ ...p, riskScore: e.target.value }))} />

            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#1d4ed8" }}>
              💡 Muayene etiketini (Yeşil / Mavi / Sarı / Kırmızı) asansörü kaydettikten sonra <strong>Periyodik Kontrol</strong> menüsünden ekleyin.
            </div>

            <Button onClick={submit} size="lg" disabled={saving || !form.customerId || !form.name}>
              {saving ? "Kaydediliyor..." : "Asansörü oluştur →"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
