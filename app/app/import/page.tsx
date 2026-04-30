"use client";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

/* ─── Field definitions ──────────────────────────────────────────────────── */
const CUSTOMER_FIELDS = [
  { key: "customerName", label: "Bina / Müşteri Adı", emoji: "🏢", required: true,
    aliases: ["bina","apt","apartman","müşteri","firma","customer","name","isim","ad "] },
  { key: "contactName",  label: "Yönetici / Yetkili", emoji: "👤", required: false,
    aliases: ["yönetici","yetkili","contact","sorumlu","müdür","ilgili"] },
  { key: "phone",        label: "Telefon",             emoji: "📞", required: false,
    aliases: ["telefon","tel","phone","gsm","cep","yön tel","yön telefon"] },
  { key: "district",     label: "İlçe",                emoji: "📍", required: false,
    aliases: ["ilçe","ilce","district","semt","bölge"] },
  { key: "address",      label: "Adres",               emoji: "🗺️", required: false,
    aliases: ["adres","address","sokak","cadde","mah","mahalle"] },
  { key: "email",        label: "E-posta",             emoji: "✉️", required: false,
    aliases: ["email","e-posta","eposta","mail"] },
  { key: "taxId",        label: "Vergi No",            emoji: "🔢", required: false,
    aliases: ["vergi","tax","vkn","vergi no","vergi kimlik"] },
  { key: "notes",        label: "Notlar",              emoji: "📝", required: false,
    aliases: ["not","notes","açıklama","aciklama","yorum"] },
];

const ASSET_FIELDS = [
  { key: "elevatorIdNo", label: "Asansör Kimlik No (AKN)", emoji: "🏷️", required: false,
    aliases: ["kimlik no","akn","asansör kimlik","elevator id","serial","seri","tescil"] },
  { key: "stops",        label: "Durak Sayısı",            emoji: "🔢", required: false,
    aliases: ["durak","kat","floor","stop","katlı"] },
  { key: "driveType",    label: "Cins / Tahrik Tipi",      emoji: "⚙️", required: false,
    aliases: ["cins","tür","tip","drive","type","tahrik","elektrik","hidrolik"] },
  { key: "brand",        label: "Marka",                   emoji: "🏷️", required: false,
    aliases: ["marka","brand","make","üretici","firma marka"] },
  { key: "capacityKg",   label: "Kapasite (kg)",           emoji: "⚖️", required: false,
    aliases: ["kapasite","kg","capacity","yük","yük kapasitesi"] },
  { key: "locationNote", label: "Konum Notu",              emoji: "📌", required: false,
    aliases: ["konum","kat bilgisi","blok","lokasyon","location"] },
  { key: "assetName",    label: "Asansör Adı (opsiyonel)", emoji: "🛗", required: false,
    aliases: ["asansör adı","asset name","lift name"] },
];

const ALL_FIELDS = [...CUSTOMER_FIELDS, ...ASSET_FIELDS];
const SKIP_KEY   = "__skip__";

type FieldKey = string;
type ParsedRow = Record<string, string>;
type Mapping   = Record<string, FieldKey>; // excelHeader → fieldKey

/* ─── Auto-detect column mapping ─────────────────────────────────────────── */
function autoMap(headers: string[]): Mapping {
  const result: Mapping = {};
  const used = new Set<FieldKey>();

  for (const h of headers) {
    const normalized = h.toLowerCase().trim()
      .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, " ").replace(/\s+/g, " ").trim();

    let bestKey: FieldKey = SKIP_KEY;
    let bestScore = 0;

    for (const f of ALL_FIELDS) {
      if (used.has(f.key)) continue;
      for (const alias of f.aliases) {
        if (normalized.includes(alias) || alias.includes(normalized)) {
          const score = alias.length; // longer alias = more specific = better
          if (score > bestScore) { bestScore = score; bestKey = f.key; }
        }
      }
    }

    result[h] = bestKey;
    if (bestKey !== SKIP_KEY) used.add(bestKey);
  }
  return result;
}

/* ─── Parse Excel/CSV buffer → headers + rows ─────────────────────────────── */
function parseBuffer(buf: ArrayBuffer): { headers: string[]; rows: ParsedRow[] } {
  const wb = XLSX.read(buf, { type: "array", raw: false, cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  if (data.length < 2) throw new Error("Dosya en az 2 satır içermelidir (başlık + veri).");

  const headers = (data[0] as unknown[]).map(h => String(h ?? "").trim()).filter(Boolean);
  const rows: ParsedRow[] = [];

  for (let r = 1; r < data.length; r++) {
    const raw = data[r] as unknown[];
    const row: ParsedRow = {};
    let hasValue = false;
    headers.forEach((h, i) => {
      const val = String(raw[i] ?? "").trim();
      if (val) { row[h] = val; hasValue = true; }
    });
    if (hasValue) rows.push(row);
  }

  return { headers, rows };
}

/* ─── Map raw rows → ImportRow objects ──────────────────────────────────── */
function applyMapping(rows: ParsedRow[], mapping: Mapping): Record<string, string>[] {
  return rows.map(raw => {
    const out: Record<string, string> = {};
    for (const [h, key] of Object.entries(mapping)) {
      if (key !== SKIP_KEY && raw[h]) out[key] = raw[h];
    }
    return out;
  });
}

/* ─── Pill component ─────────────────────────────────────────────────────── */
function Pill({ children, color }: { children: React.ReactNode; color: "blue"|"green"|"gray"|"red"|"amber" }) {
  const map = {
    blue:  "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    gray:  "bg-[#f4f5f7] text-[#64748b] border-[#e2e8f0]",
    red:   "bg-red-50 text-red-600 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${map[color]}`}>
      {children}
    </span>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function ImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  type Stage = "upload" | "mapping" | "preview" | "done";
  const [stage, setStage]           = useState<Stage>("upload");
  const [fileName, setFileName]     = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [headers, setHeaders]       = useState<string[]>([]);
  const [rawRows, setRawRows]       = useState<ParsedRow[]>([]);
  const [mapping, setMapping]       = useState<Mapping>({});
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<Record<string, unknown> | null>(null);

  const handleFile = useCallback((file: File) => {
    setParseError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buf = e.target!.result as ArrayBuffer;
        const { headers: h, rows: r } = parseBuffer(buf);
        setHeaders(h);
        setRawRows(r);
        setMapping(autoMap(h));
        setStage("mapping");
      } catch (err) {
        setParseError("Dosya okunamadı: " + String(err));
      }
    };
    reader.onerror = () => setParseError("Dosya okuma hatası.");
    reader.readAsArrayBuffer(file);
  }, []);

  const mappedRows = applyMapping(rawRows, mapping);

  async function doImport() {
    setLoading(true);
    try {
      const res = await fetch("/api/import/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: mappedRows }),
      });
      const data = await res.json().catch(() => ({ ok: false, error: "Bilinmeyen hata" }));
      setResult(data);
      setStage("done");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStage("upload"); setFileName(""); setHeaders([]); setRawRows([]);
    setMapping({}); setResult(null); setParseError(null);
  }

  const mappedCustomerCount = new Set(
    mappedRows.map(r => r.customerName?.toLowerCase()).filter(Boolean)
  ).size;
  const mappedAssetCount = mappedRows.filter(r => r.customerName).length;

  // ── Upload stage ──────────────────────────────────────────────────────────
  if (stage === "upload") return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/app/customers" className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#64748b] hover:bg-[#f4f5f7] transition-colors">
          ← Geri
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0f1623]">Excel / CSV Yükleme</h1>
          <p className="text-sm text-[#64748b]">Müşteri ve asansör verilerini Excel veya CSV ile toplu aktarın.</p>
        </div>
      </div>

      {/* Format card */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_4px_rgba(15,22,35,.06)]">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94a3b8] mb-4">Desteklenen Sütunlar</div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wide mb-2">MÜŞTERİ BİLGİLERİ</div>
            {CUSTOMER_FIELDS.map(f => (
              <div key={f.key} className="flex items-center gap-2 py-1 border-b border-[#f4f5f7] last:border-0">
                <span className="text-sm w-5">{f.emoji}</span>
                <span className="text-xs text-[#0f1623] font-medium flex-1">{f.label}</span>
                {f.required
                  ? <Pill color="blue">Zorunlu</Pill>
                  : <Pill color="gray">Opsiyonel</Pill>}
              </div>
            ))}
          </div>
          <div>
            <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wide mb-2">ASANSÖR BİLGİLERİ</div>
            {ASSET_FIELDS.map(f => (
              <div key={f.key} className="flex items-center gap-2 py-1 border-b border-[#f4f5f7] last:border-0">
                <span className="text-sm w-5">{f.emoji}</span>
                <span className="text-xs text-[#0f1623] font-medium flex-1">{f.label}</span>
                <Pill color="gray">Opsiyonel</Pill>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800 leading-relaxed">
          <strong>💡 HDS / Mevcut Excel formatı desteklenmektedir.</strong><br/>
          Başlık satırı hangi sütun olursa olsun otomatik eşleştirilir.
          Her satır = 1 asansör + bağlı müşteri (aynı bina adı tekrar ederse müşteri tek kayıt olarak tutulur).
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="rounded-2xl border-2 border-dashed border-[#d0d7e2] bg-white p-12 text-center hover:border-blue-300 hover:bg-[#f0f7ff] transition-all cursor-pointer"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}>
        <div className="text-5xl mb-4">📂</div>
        <div className="text-sm font-bold text-[#0f1623] mb-1">Excel veya CSV sürükleyin</div>
        <div className="text-xs text-[#94a3b8]">.xlsx · .xls · .csv — maksimum 10 MB</div>
        {fileName && <div className="mt-3 text-xs font-semibold text-blue-600">📄 {fileName}</div>}
      </div>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {parseError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">{parseError}</div>
      )}
    </div>
  );

  // ── Mapping stage ─────────────────────────────────────────────────────────
  if (stage === "mapping") return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={reset} className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#64748b] hover:bg-[#f4f5f7] transition-colors">
          ← Yeni Dosya
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight text-[#0f1623]">Sütun Eşleştirme</h1>
          <p className="text-sm text-[#64748b]">{rawRows.length} satır · {fileName}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#e2e8f0] bg-white overflow-hidden shadow-[0_1px_4px_rgba(15,22,35,.06)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f2f5] bg-[#f8f9fb]">
          <div>
            <div className="text-sm font-bold text-[#0f1623]">Her sütunu bir alana eşleştirin</div>
            <div className="text-xs text-[#64748b] mt-0.5">Otomatik tespit yapıldı — değiştirmek için açılır menüden seçin</div>
          </div>
          <button onClick={() => setStage("preview")}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-colors">
            Önizlemeye Geç →
          </button>
        </div>

        <div className="divide-y divide-[#f0f2f5]">
          {headers.map(h => {
            const preview = rawRows.slice(0, 3).map(r => r[h]).filter(Boolean).join(", ");
            const currentKey = mapping[h] ?? SKIP_KEY;
            const isAuto = autoMap([h])[h] !== SKIP_KEY;
            return (
              <div key={h} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#0f1623]">{h}</div>
                  <div className="text-[11px] text-[#94a3b8] truncate mt-0.5">{preview || "—"}</div>
                </div>
                <div className="flex items-center gap-2">
                  {isAuto && currentKey !== SKIP_KEY && (
                    <span className="text-[10px] text-green-600 font-bold bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                      ✓ Otomatik
                    </span>
                  )}
                  <select
                    value={currentKey}
                    onChange={e => setMapping(m => ({ ...m, [h]: e.target.value }))}
                    className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-medium text-[#0f1623] focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]">
                    <option value={SKIP_KEY}>— Atla —</option>
                    <optgroup label="MÜŞTERİ">
                      {CUSTOMER_FIELDS.map(f => <option key={f.key} value={f.key}>{f.emoji} {f.label}</option>)}
                    </optgroup>
                    <optgroup label="ASANSÖR">
                      {ASSET_FIELDS.map(f => <option key={f.key} value={f.key}>{f.emoji} {f.label}</option>)}
                    </optgroup>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── Preview stage ─────────────────────────────────────────────────────────
  if (stage === "preview") {
    const hasCustomerName = Object.values(mapping).includes("customerName");
    return (
      <div className="max-w-5xl space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setStage("mapping")} className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#64748b] hover:bg-[#f4f5f7] transition-colors">
            ← Eşleştirmeye Dön
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black tracking-tight text-[#0f1623]">Önizleme</h1>
            <div className="flex items-center gap-3 mt-1">
              <Pill color="blue">~{mappedCustomerCount} müşteri</Pill>
              <Pill color="green">{mappedAssetCount} asansör</Pill>
              <span className="text-xs text-[#94a3b8]">{rawRows.length} satır</span>
            </div>
          </div>
          {!hasCustomerName && (
            <div className="text-xs text-red-600 font-semibold bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              ⚠ "Bina / Müşteri Adı" sütunu eşleştirilmedi
            </div>
          )}
          <button onClick={doImport} disabled={loading || !hasCustomerName}
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors">
            {loading ? "Yükleniyor…" : `${rawRows.length} Satırı Aktar →`}
          </button>
        </div>

        {/* Active mapping summary */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(mapping).filter(([, v]) => v !== SKIP_KEY).map(([h, key]) => {
            const field = ALL_FIELDS.find(f => f.key === key);
            return (
              <span key={h} className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1 text-xs font-medium text-[#0f1623]">
                <span>{field?.emoji}</span>
                <span className="text-[#94a3b8]">{h}</span>
                <span>→</span>
                <span className="font-bold">{field?.label}</span>
              </span>
            );
          })}
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-white overflow-hidden shadow-[0_1px_4px_rgba(15,22,35,.06)]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#f0f2f5] bg-[#f8f9fb]">
                  <th className="px-3 py-2.5 text-left font-bold text-[#94a3b8] uppercase tracking-widest">#</th>
                  {Object.entries(mapping).filter(([, v]) => v !== SKIP_KEY).map(([h, key]) => {
                    const f = ALL_FIELDS.find(ff => ff.key === key);
                    return (
                      <th key={h} className="px-3 py-2.5 text-left font-bold text-[#94a3b8] uppercase tracking-widest whitespace-nowrap">
                        {f?.emoji} {f?.label ?? key}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rawRows.slice(0, 15).map((row, i) => (
                  <tr key={i} className="border-b border-[#f4f5f7] last:border-0 hover:bg-[#f9fafb]">
                    <td className="px-3 py-2 text-[#94a3b8]">{i + 1}</td>
                    {Object.entries(mapping).filter(([, v]) => v !== SKIP_KEY).map(([h]) => (
                      <td key={h} className="px-3 py-2 text-[#0f1623] max-w-[180px] truncate">
                        {row[h] || <span className="text-[#d0d7e2]">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rawRows.length > 15 && (
            <div className="px-5 py-3 border-t border-[#f0f2f5] text-xs text-[#94a3b8] text-center bg-[#f8f9fb]">
              … ve {rawRows.length - 15} satır daha gösterilmiyor
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Done stage ────────────────────────────────────────────────────────────
  const r = result as any;
  return (
    <div className="max-w-xl">
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-[0_1px_4px_rgba(15,22,35,.06)] text-center space-y-6">
        <div className="text-5xl">{r?.errors?.length === 0 ? "✅" : "⚠️"}</div>
        <div>
          <h2 className="text-xl font-black text-[#0f1623] mb-4">
            {r?.errors?.length === 0 ? "İçe Aktarma Tamamlandı!" : "Kısmen Tamamlandı"}
          </h2>
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div className="text-center">
              <div className="text-2xl font-black text-blue-600">{r?.customersCreated ?? 0}</div>
              <div className="text-xs text-[#64748b] font-medium mt-1">Yeni Müşteri</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-green-600">{r?.assetsCreated ?? 0}</div>
              <div className="text-xs text-[#64748b] font-medium mt-1">Asansör</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-amber-500">{r?.skipped ?? 0}</div>
              <div className="text-xs text-[#64748b] font-medium mt-1">Atlandı</div>
            </div>
          </div>
          {(r?.customersReused ?? 0) > 0 && (
            <p className="text-xs text-[#64748b] mt-3">
              {r.customersReused} mevcut müşteriye asansör eklendi.
            </p>
          )}
        </div>

        {r?.errors?.length > 0 && (
          <div className="text-left rounded-xl border border-amber-200 bg-amber-50 p-4 max-h-40 overflow-y-auto">
            <div className="text-xs font-bold text-amber-800 mb-2 uppercase tracking-wide">Hatalı Satırlar ({r.errors.length})</div>
            {r.errors.map((e: string, i: number) => (
              <div key={i} className="text-xs text-amber-700 py-0.5">• {e}</div>
            ))}
          </div>
        )}

        <div className="flex justify-center gap-3">
          <button onClick={reset}
            className="rounded-xl border border-[#e2e8f0] px-5 py-2.5 text-sm font-semibold text-[#64748b] hover:bg-[#f4f5f7] transition-colors">
            Yeni Yükleme
          </button>
          <button onClick={() => router.push("/app/customers")}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 shadow-sm transition-colors">
            Müşterilere Git →
          </button>
          <button onClick={() => router.push("/app/assets")}
            className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-purple-700 shadow-sm transition-colors">
            Asansörlere Git →
          </button>
        </div>
      </div>
    </div>
  );
}
