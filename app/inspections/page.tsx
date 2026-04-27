"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Asset = { id: string; name: string; elevatorIdNo?: string | null; inspectionLabel?: string | null; nextInspectionAt?: string | null; customer: { name: string } };
type Inspection = {
  id: string; inspectionDate: string; nextDueDate: string;
  inspectionBody?: string | null; inspectorName?: string | null;
  result: string; label: string; deficiencies?: string | null; notes?: string | null;
  asset: { id: string; name: string; customer: { name: string } };
};

const LABEL_MAP: Record<string, { label: string; bg: string; border: string; text: string; icon: string; desc: string }> = {
  YESIL:   { label: "Yeşil",   bg: "bg-emerald-50",  border: "border-emerald-200", text: "text-emerald-700", icon: "🟢", desc: "Kusursuz — Güvenli kullanım" },
  MAVI:    { label: "Mavi",    bg: "bg-blue-50",     border: "border-blue-200",    text: "text-blue-700",    icon: "🔵", desc: "Hafif Kusurlu — 120 gün içinde düzeltilmeli" },
  SARI:    { label: "Sarı",    bg: "bg-amber-50",    border: "border-amber-200",   text: "text-amber-700",   icon: "🟡", desc: "Kusurlu — Takip muayenesi gerekli" },
  KIRMIZI: { label: "Kırmızı", bg: "bg-red-50",      border: "border-red-200",     text: "text-red-700",     icon: "🔴", desc: "GÜVENSİZ — 30 gün içinde durdurulacak!" },
};

const RESULT_MAP: Record<string, string> = {
  UYGUNSUZLUK_YOK: "Uygunsuzluk Yok",
  HAFIF_KUSURLU: "Hafif Kusurlu",
  KUSURLU: "Kusurlu",
  GUVENSIZ: "Güvensiz",
};

function daysLeft(d: string) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); }

export default function InspectionsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [items, setItems] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form
  const [fAsset, setFAsset] = useState("");
  const [fDate, setFDate] = useState(new Date().toISOString().slice(0, 10));
  const [fNext, setFNext] = useState(() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); });
  const [fBody, setFBody] = useState("");
  const [fInspector, setFInspector] = useState("");
  const [fResult, setFResult] = useState("UYGUNSUZLUK_YOK");
  const [fDeficiencies, setFDeficiencies] = useState("");
  const [fNotes, setFNotes] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const [iRes, aRes] = await Promise.all([fetch("/api/inspections"), fetch("/api/assets")]);
    const [i, a] = await Promise.all([iRes.json(), aRes.json()]);
    setItems(i.items ?? []);
    setAssets(a.items ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setCreating(true); setErr(null);
    const res = await fetch("/api/inspections", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ assetId: fAsset, inspectionDate: fDate, nextDueDate: fNext, inspectionBody: fBody || undefined, inspectorName: fInspector || undefined, result: fResult, deficiencies: fDeficiencies || undefined, notes: fNotes || undefined }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setErr(data.error ?? "Hata"); return; }
    setSuccess("Muayene kaydedildi ✓"); setShowForm(false);
    setTimeout(() => setSuccess(null), 4000);
    await load();
  }

  // Upcoming inspections from assets
  const upcoming = useMemo(() => {
    return assets
      .filter(a => a.nextInspectionAt)
      .sort((a, b) => new Date(a.nextInspectionAt!).getTime() - new Date(b.nextInspectionAt!).getTime())
      .slice(0, 10);
  }, [assets]);

  const overdue = upcoming.filter(a => daysLeft(a.nextInspectionAt!) <= 0);
  const dueSoon = upcoming.filter(a => daysLeft(a.nextInspectionAt!) > 0 && daysLeft(a.nextInspectionAt!) <= 60);

  const inp = "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none";
  const lbl = "block text-xs font-semibold uppercase tracking-wide text-gray-500";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Periyodik Kontrol Takibi</h1>
          <p className="text-sm text-gray-500">TSE / A Tipi Muayene Kuruluşu yıllık periyodik kontrolleri</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm">
          {showForm ? "✕ Kapat" : "+ Muayene Kaydet"}
        </button>
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      {/* Alerts */}
      {(overdue.length > 0 || dueSoon.length > 0) && (
        <div className="space-y-2">
          {overdue.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <span className="text-lg mt-0.5">🔴</span>
              <div>
                <div className="text-sm font-bold text-red-800">{overdue.length} asansörün periyodik kontrolü gecikti!</div>
                <div className="text-xs text-red-700 mt-1">{overdue.map((a, i) => <span key={a.id}>{i > 0 && " · "}{a.name} ({a.customer.name})</span>)}</div>
              </div>
            </div>
          )}
          {dueSoon.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <span className="text-lg mt-0.5">🟡</span>
              <div>
                <div className="text-sm font-bold text-amber-800">{dueSoon.length} asansörün muayene tarihi 60 gün içinde!</div>
                <div className="text-xs text-amber-700 mt-1">{dueSoon.map((a, i) => <span key={a.id}>{i > 0 && " · "}{a.name} — {daysLeft(a.nextInspectionAt!)} gün</span>)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Etiket açıklama */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(LABEL_MAP).map(([k, v]) => (
          <div key={k} className={`rounded-xl border ${v.border} ${v.bg} p-3`}>
            <div className="flex items-center gap-2 mb-1"><span>{v.icon}</span><span className={`text-xs font-bold ${v.text}`}>{v.label} Etiket</span></div>
            <div className="text-xs text-gray-600">{v.desc}</div>
          </div>
        ))}
      </div>

      {/* New inspection form */}
      {showForm && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-6">
          <div className="mb-4 text-base font-bold text-blue-900">Periyodik Kontrol Sonucu Kaydet</div>
          <div className="mb-4 rounded-xl border border-blue-100 bg-white px-4 py-3 text-xs text-blue-700">
            ⚖️ Yıllık kontrol ücretini bina sorumlusu öder. A Tipi Muayene Kuruluşu: TSE, SZUTEST, AND Muayene veya TÜRKAK akrediteli kuruluş.
          </div>
          <form onSubmit={create} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <label className={lbl}>Asansör <span className="text-blue-500">*</span></label>
              <select className={inp} value={fAsset} onChange={e => setFAsset(e.target.value)} required>
                <option value="">— Seçin —</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name} — {a.customer.name}{a.elevatorIdNo ? ` (#${a.elevatorIdNo})` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Muayene Tarihi <span className="text-blue-500">*</span></label>
              <input className={inp} type="date" value={fDate} onChange={e => setFDate(e.target.value)} required />
            </div>
            <div>
              <label className={lbl}>Bir Sonraki Muayene <span className="text-blue-500">*</span></label>
              <input className={inp} type="date" value={fNext} onChange={e => setFNext(e.target.value)} required />
            </div>
            <div>
              <label className={lbl}>Muayene Kuruluşu</label>
              <input className={inp} value={fBody} onChange={e => setFBody(e.target.value)} placeholder="TSE, SZUTEST, AND Muayene…" />
            </div>
            <div>
              <label className={lbl}>Muayene Mühendisi</label>
              <input className={inp} value={fInspector} onChange={e => setFInspector(e.target.value)} placeholder="Mühendis adı" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={`${lbl} mb-2`}>Kontrol Sonucu / Etiket</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { v: "UYGUNSUZLUK_YOK", label: "Yeşil Etiket", desc: "Kusursuz", bg: "emerald" },
                  { v: "HAFIF_KUSURLU", label: "Mavi Etiket", desc: "Hafif Kusurlu", bg: "blue" },
                  { v: "KUSURLU", label: "Sarı Etiket", desc: "Kusurlu", bg: "amber" },
                  { v: "GUVENSIZ", label: "Kırmızı Etiket", desc: "Güvensiz", bg: "red" },
                ].map(opt => (
                  <label key={opt.v} className={`flex cursor-pointer items-start gap-2 rounded-xl border-2 p-3 transition-all ${fResult === opt.v ? `border-${opt.bg}-400 bg-${opt.bg}-50` : "border-gray-200 bg-white hover:bg-gray-50"}`}>
                    <input type="radio" name="result" value={opt.v} checked={fResult === opt.v} onChange={e => setFResult(e.target.value)} className="mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-gray-800">{opt.label}</div>
                      <div className="text-xs text-gray-500">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            {fResult !== "UYGUNSUZLUK_YOK" && (
              <div className="sm:col-span-2">
                <label className={lbl}>Tespit Edilen Eksiklikler</label>
                <textarea className={`${inp} resize-none`} rows={3} value={fDeficiencies} onChange={e => setFDeficiencies(e.target.value)} placeholder="Kapı emniyet kontağı arızalı, ray yağlaması yetersiz…" />
              </div>
            )}
            <div className={fResult !== "UYGUNSUZLUK_YOK" ? "" : "sm:col-span-2"}>
              <label className={lbl}>Notlar</label>
              <textarea className={`${inp} resize-none`} rows={2} value={fNotes} onChange={e => setFNotes(e.target.value)} placeholder="Ek notlar…" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
              <button type="submit" disabled={!fAsset || creating}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 shadow-sm">
                {creating ? "Kaydediliyor…" : "Muayene Kaydını Oluştur →"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inspection history */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <div className="font-semibold text-gray-900">Muayene Geçmişi</div>
          <div className="text-xs text-gray-400">{items.length} kayıt</div>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">Henüz muayene kaydı yok.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map(i => {
              const lb = LABEL_MAP[i.label] ?? LABEL_MAP.YESIL;
              return (
                <div key={i.id} className="px-5 py-4 hover:bg-gray-50 flex flex-wrap gap-4 items-start">
                  <div className={`flex-shrink-0 w-24 rounded-xl border ${lb.border} ${lb.bg} px-2 py-2 text-center`}>
                    <div className="text-xl">{lb.icon}</div>
                    <div className={`text-xs font-bold ${lb.text} mt-0.5`}>{lb.label}</div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Link href={`/app/assets`} className="font-semibold text-gray-900 hover:text-blue-600">{i.asset.name}</Link>
                    <div className="text-xs text-gray-500 mt-0.5">{i.asset.customer.name}</div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                      <span>📅 {new Date(i.inspectionDate).toLocaleDateString("tr-TR")}</span>
                      <span className="text-blue-600">→ Sonraki: {new Date(i.nextDueDate).toLocaleDateString("tr-TR")}</span>
                      {i.inspectionBody && <span>🏢 {i.inspectionBody}</span>}
                      {i.inspectorName && <span>👷 {i.inspectorName}</span>}
                    </div>
                    {i.result !== "UYGUNSUZLUK_YOK" && i.deficiencies && (
                      <div className="mt-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-1.5 text-xs text-amber-800">
                        <strong>Eksiklikler:</strong> {i.deficiencies}
                      </div>
                    )}
                  </div>
                  <div className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${lb.border} ${lb.text} ${lb.bg}`}>
                    {RESULT_MAP[i.result]}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
