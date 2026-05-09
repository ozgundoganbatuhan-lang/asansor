"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import OnboardingBeacon from "@/components/OnboardingBeacon";

type Customer = { id: string; name: string };
type Asset = { id: string; name: string; elevatorIdNo?: string | null; customerId?: string };
type ContractAsset = { asset: Asset };
type Contract = {
  id: string; contractNumber?: string | null; status: string;
  startDate: string; endDate?: string | null; autoRenew: boolean;
  monthlyFee: number; technicianName?: string | null;
  hasEncryptionDevice: boolean; notes?: string | null;
  customer: { id: string; name: string };
  assets: ContractAsset[];
  _count: { maintenancePlans: number };
};

const ST: Record<string, { label: string; bg: string; color: string; dot: string; border: string }> = {
  ACTIVE:     { label: "Aktif",         bg: "#E8F5EE", color: "#166534", dot: "#2E7D4F", border: "#9DCFB0" },
  DRAFT:      { label: "Taslak",        bg: "#F5F2EC", color: "#6b7280", dot: "#9ca3af", border: "#e5e7eb" },
  EXPIRED:    { label: "Süresi Doldu",  bg: "#fefce8", color: "#92400e", dot: "#C87800", border: "#fde68a" },
  TERMINATED: { label: "Feshedildi",    bg: "#FCECE8", color: "#C0311A", dot: "#C0311A", border: "#E8A090" },
};
const STATUS_FILTERS = ["ALL", "ACTIVE", "EXPIRED", "DRAFT", "TERMINATED"];

function money(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n / 100);
}
function daysLeft(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

const F: React.CSSProperties = {
  width: "100%", padding: "8px 12px",
  border: "1px solid #e5e7eb", borderRadius: 8,
  fontSize: 13, fontFamily: "inherit", outline: "none",
  background: "#fff", color: "#111827",
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [fCustomer, setFCustomer] = useState("");
  const [fNumber, setFNumber] = useState("");
  const [fStart, setFStart] = useState(new Date().toISOString().slice(0, 10));
  const [fEnd, setFEnd] = useState("");
  const [fAutoRenew, setFAutoRenew] = useState(true);
  const [fFee, setFFee] = useState("");
  const [fTech, setFTech] = useState("");
  const [fTechCert, setFTechCert] = useState("");
  const [fEncryption, setFEncryption] = useState(false);
  const [fEncNote, setFEncNote] = useState("");
  const [fAssets, setFAssets] = useState<string[]>([]);
  const [fNotes, setFNotes] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const [cRes, cuRes, asRes] = await Promise.all([fetch("/api/contracts"), fetch("/api/customers"), fetch("/api/assets")]);
    const [c, cu, as] = await Promise.all([cRes.json(), cuRes.json(), asRes.json()]);
    setContracts(c.items ?? []); setCustomers(cu.items ?? []); setAssets(as.items ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const customerAssets = useMemo(() => fCustomer ? assets.filter(a => a.customerId === fCustomer) : [], [assets, fCustomer]);
  const filtered = statusFilter === "ALL" ? contracts : contracts.filter(c => c.status === statusFilter);
  const kpis = useMemo(() => ({
    active: contracts.filter(c => c.status === "ACTIVE").length,
    expiring30: contracts.filter(c => c.status === "ACTIVE" && c.endDate && daysLeft(c.endDate) <= 30 && daysLeft(c.endDate) > 0).length,
    totalMonthly: contracts.filter(c => c.status === "ACTIVE").reduce((a, c) => a + c.monthlyFee, 0),
  }), [contracts]);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setCreating(true); setErr(null);
    const res = await fetch("/api/contracts", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ customerId: fCustomer, contractNumber: fNumber || undefined, startDate: fStart, endDate: fEnd || undefined, autoRenew: fAutoRenew, monthlyFee: parseFloat(fFee) || 0, technicianName: fTech || undefined, technicianCert: fTechCert || undefined, hasEncryptionDevice: fEncryption, encryptionNote: fEncNote || undefined, assetIds: fAssets, notes: fNotes || undefined }),
    });
    const data = await res.json(); setCreating(false);
    if (!res.ok) { setErr(data.error ?? "Oluşturulamadı"); return; }
    setSuccess("Sözleşme oluşturuldu ✓"); setShowForm(false);
    setTimeout(() => setSuccess(null), 4000); await load();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <OnboardingBeacon forStep={3} label="👆 Yeni sözleşme oluşturun">
          <button data-tour="new-contract-btn" onClick={() => setShowForm(!showForm)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: showForm ? "#fff" : "#1B1F2B", color: showForm ? "#374151" : "#fff", border: showForm ? "1px solid #e5e7eb" : "none", fontSize: 13, fontWeight: 600, padding: "9px 18px", borderRadius: 9, cursor: "pointer" }}>
            {showForm ? "✕ Kapat" : "+ Yeni Sözleşme"}
          </button>
        </OnboardingBeacon>
      
            {/* Alerts */}
      {err && <div style={{ background: "#FCECE8", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#C0311A", display: "flex", justifyContent: "space-between" }}>{err}<button onClick={() => setErr(null)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "#C0311A" }}>✕</button></div>}
      {success && <div style={{ background: "#E8F5EE", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#166534" }}>{success}</div>}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { label: "Aktif Sözleşme", value: kpis.active, color: "#111827" },
          { label: "30 Günde Bitiyor", value: kpis.expiring30, color: kpis.expiring30 > 0 ? "#B86800" : "#111827" },
          { label: "Aylık Ciro", value: money(kpis.totalMonthly), color: "#111827", small: true },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", color: "#9ca3af", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: k.small ? 20 : 28, fontWeight: 700, color: k.color, letterSpacing: "-1px" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #bfdbfe", borderRadius: 14, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Yeni Bakım Sözleşmesi</div>
          <div style={{ background: "#E4EFF9", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#0F121A", marginBottom: 16 }}>
            <strong>📋 Yasal Dayanaklar:</strong> Asansör İşletme ve Bakım Yönetmeliği (6 Nisan 2019) &amp; TS EN 13015
          </div>
          <form onSubmit={create} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / 3" }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Müşteri *</label>
                <select style={F} value={fCustomer} onChange={e => { setFCustomer(e.target.value); setFAssets([]); }} required>
                  <option value="">— Seçin —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Sözleşme No</label>
                <input style={F} value={fNumber} onChange={e => setFNumber(e.target.value)} placeholder="SZL-2025-001" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Başlangıç *</label>
                <input style={F} type="date" value={fStart} onChange={e => setFStart(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Bitiş</label>
                <input style={F} type="date" value={fEnd} onChange={e => setFEnd(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Aylık Ücret (₺)</label>
                <input style={F} type="number" value={fFee} onChange={e => setFFee(e.target.value)} placeholder="1500" />
              </div>
            </div>

            {fCustomer && customerAssets.length > 0 && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 8 }}>Kapsam Asansörler</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {customerAssets.map(a => (
                    <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 8, border: `1px solid ${fAssets.includes(a.id) ? "#90BEE0" : "#e5e7eb"}`, background: fAssets.includes(a.id) ? "#E4EFF9" : "#fff", cursor: "pointer", fontSize: 13 }}>
                      <input type="checkbox" checked={fAssets.includes(a.id)} onChange={ev => setFAssets(ev.target.checked ? [...fAssets, a.id] : fAssets.filter(x => x !== a.id))} />
                      <span style={{ color: fAssets.includes(a.id) ? "#0F121A" : "#374151" }}>{a.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Teknisyen Adı</label>
                <input style={F} value={fTech} onChange={e => setFTech(e.target.value)} placeholder="Ali Yılmaz" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>TSE/Sertifika No</label>
                <input style={F} value={fTechCert} onChange={e => setFTechCert(e.target.value)} placeholder="TSE-HYB-12345" />
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={fEncryption} onChange={e => setFEncryption(e.target.checked)} />
              <span style={{ color: "#374151" }}>Şifreleme/kısıtlama cihazı mevcut</span>
            </label>
            {fEncryption && <textarea style={{ ...F, minHeight: 60, resize: "vertical" }} value={fEncNote} onChange={e => setFEncNote(e.target.value)} placeholder="Şifreleme cihazı açıklaması…" />}

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5 }}>Notlar</label>
              <textarea style={{ ...F, minHeight: 60, resize: "vertical" }} value={fNotes} onChange={e => setFNotes(e.target.value)} placeholder="Özel koşullar…" />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={fAutoRenew} onChange={e => setFAutoRenew(e.target.checked)} />
              <span style={{ color: "#374151", fontWeight: 500 }}>Otomatik yenileme</span>
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={!fCustomer || creating}
                style={{ background: "#1B1F2B", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, padding: "9px 20px", borderRadius: 9, cursor: "pointer", opacity: (!fCustomer || creating) ? 0.6 : 1 }}>
                {creating ? "Oluşturuluyor…" : "Sözleşme Oluştur →"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ background: "none", border: "1px solid #e5e7eb", color: "#6b7280", fontSize: 13, fontWeight: 600, padding: "9px 16px", borderRadius: 9, cursor: "pointer" }}>
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500,
            cursor: "pointer", border: "1px solid",
            background: statusFilter === s ? "#111827" : "#fff",
            color: statusFilter === s ? "#fff" : "#6b7280",
            borderColor: statusFilter === s ? "#111827" : "#e5e7eb",
          }}>
            {s === "ALL" ? "Tümü" : ST[s]?.label ?? s}
            {s !== "ALL" && <span style={{ marginLeft: 4, opacity: 0.6 }}>({contracts.filter(c => c.status === s).length})</span>}
          </button>
        ))}
      </div>

      {/* Contract list */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <div style={{ width: 28, height: 28, border: "3px solid #e5e7eb", borderTopColor: "#1B1F2B", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Sözleşme bulunamadı.</div>
        ) : filtered.map((c, i) => {
          const st = ST[c.status] ?? ST.DRAFT;
          const days = c.endDate ? daysLeft(c.endDate) : null;
          const expiring = days !== null && days <= 30 && days > 0 && c.status === "ACTIVE";
          return (
            <div key={c.id} style={{
              padding: "14px 18px",
              borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
              borderLeft: `4px solid ${expiring ? "#C87800" : st.dot}`,
              display: "flex", alignItems: "flex-start", gap: 14,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{c.customer.name}</span>
                  {c.contractNumber && <span style={{ fontSize: 11, fontFamily: "monospace", color: "#9ca3af" }}>{c.contractNumber}</span>}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 99, padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }} />
                    {st.label}
                  </span>
                  {expiring && <span style={{ background: "#fefce8", color: "#92400e", border: "1px solid #fde68a", borderRadius: 99, padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>⚠ {days} gün kaldı</span>}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: "#6b7280" }}>
                  <span>📅 {new Date(c.startDate).toLocaleDateString("tr-TR")} — {c.endDate ? new Date(c.endDate).toLocaleDateString("tr-TR") : "Süresiz"}</span>
                  {c.monthlyFee > 0 && <span style={{ fontWeight: 600, color: "#374151" }}>{money(c.monthlyFee)}/ay</span>}
                  {c.technicianName && <span>👷 {c.technicianName}</span>}
                  {c.autoRenew && <span style={{ color: "#2E7D4F" }}>↺ Otomatik yenileme</span>}
                  {c.hasEncryptionDevice && <span style={{ color: "#C87800" }}>🔒 Şifreleme</span>}
                </div>
                {c.assets.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {c.assets.map(ca => (
                      <span key={ca.asset.id} style={{ background: "#E4EFF9", color: "#0F121A", border: "1px solid #bfdbfe", borderRadius: 99, padding: "2px 9px", fontSize: 11, fontWeight: 500 }}>
                        🏢 {ca.asset.name}{ca.asset.elevatorIdNo ? ` #${ca.asset.elevatorIdNo}` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {c.status === "ACTIVE" && (
                <button onClick={async () => { await fetch(`/api/contracts/${c.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "TERMINATED" }) }); await load(); }}
                  style={{ background: "#FCECE8", color: "#C0311A", border: "1px solid #fecaca", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                  Feshet
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Legal info */}
      <div style={{ background: "#F5F2EC", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", color: "#9ca3af", marginBottom: 10 }}>📚 Yasal Zorunluluklar</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {["Aylık bakım zorunlu — En az ayda 1 kez","Yıllık periyodik kontrol — A Tipi Muayene Kuruluşu","Bakım föyü zorunlu — Her bakımda imzalanmalı","Teknik sorumlu beyanı — Sözleşmede zorunlu","Şifreleme beyanı — 2019 yönetmeliği gereği","Mesleki sorumluluk sigortası — Min. 500.000 ₺"].map(t => (
            <div key={t} style={{ display: "flex", gap: 7, fontSize: 12, color: "#6b7280" }}>
              <span style={{ color: "#2E7D4F", flexShrink: 0 }}>✓</span><span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
