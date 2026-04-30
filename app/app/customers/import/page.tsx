"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Column mapping: Excel header -> field name
const COLUMNS = [
  { field: "name",        label: "Firma / Müşteri Adı", required: true,  example: "ABC Apartman Yönetimi" },
  { field: "contactName", label: "Yetkili Kişi",         required: false, example: "Ali Yılmaz" },
  { field: "phone",       label: "Telefon",              required: false, example: "0212 555 55 55" },
  { field: "email",       label: "E-posta",              required: false, example: "yonetim@abc.com" },
  { field: "address",     label: "Adres",                required: false, example: "Atatürk Cad. No:1 Kadıköy" },
  { field: "taxId",       label: "Vergi No",             required: false, example: "1234567890" },
  { field: "identityNo",  label: "TC Kimlik No",         required: false, example: "12345678901" },
  { field: "notes",       label: "Notlar",               required: false, example: "Özel notlar…" },
];

type ParsedRow = Record<string, string>;
type ImportResult = { created: number; skipped: number; errors: string[] };

export default function ImportCustomersPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage]         = useState<"upload"|"preview"|"done">("upload");
  const [rows, setRows]           = useState<ParsedRow[]>([]);
  const [fileName, setFileName]   = useState("");
  const [parseError, setParseError] = useState<string|null>(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<ImportResult|null>(null);

  // Parse CSV or XLSX-exported-as-CSV
  function parseFile(file: File) {
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) { setParseError("Dosya okunamadı."); return; }
      try {
        const parsed = parseCSV(text);
        if (parsed.length === 0) { setParseError("Dosya boş veya tanınamadı."); return; }
        setRows(parsed);
        setStage("preview");
      } catch (err) {
        setParseError("Dosya ayrıştırılamadı: " + String(err));
      }
    };
    reader.onerror = () => setParseError("Dosya okunurken hata oluştu.");
    reader.readAsText(file, "utf-8");
  }

  function parseCSV(text: string): ParsedRow[] {
    // Normalize line endings
    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim());
    if (lines.length < 2) throw new Error("En az başlık + 1 veri satırı gereklidir.");

    // Split by tab or semicolon or comma
    const delim = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
    const headers = splitLine(lines[0], delim).map(h => h.toLowerCase().trim()
      .replace(/firma.*ad[ıi]/g, "name").replace(/müşteri.*ad[ıi]/g, "name")
      .replace(/yetkili/g, "contactName").replace(/telefon/g, "phone")
      .replace(/e.?posta|email/g, "email").replace(/adres/g, "address")
      .replace(/vergi/g, "taxId").replace(/tc.*kimlik|kimlik.*no/g, "identityNo")
      .replace(/not/g, "notes")
    );

    return lines.slice(1).map(line => {
      const cells = splitLine(line, delim);
      const row: ParsedRow = {};
      headers.forEach((h, i) => { if (cells[i]?.trim()) row[h] = cells[i].trim(); });
      return row;
    }).filter(r => r.name || r.contactName); // skip completely empty rows
  }

  function splitLine(line: string, delim: string): string[] {
    const result: string[] = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === delim && !inQ) { result.push(cur); cur = ""; continue; }
      cur += ch;
    }
    result.push(cur);
    return result;
  }

  async function doImport() {
    setLoading(true);
    const res = await fetch("/api/customers/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const data = await res.json().catch(() => ({ created: 0, skipped: 0, errors: ["Bilinmeyen hata"] }));
    setLoading(false);
    setResult(data);
    setStage("done");
  }

  function downloadTemplate() {
    const header = COLUMNS.map(c => c.label).join(",");
    const example = COLUMNS.map(c => `"${c.example}"`).join(",");
    const csv = [header, example].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "musteri-sablonu.csv"; a.click();
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/app/customers" className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#64748b] hover:bg-[#f4f5f7] transition-colors">
          ← Müşteriler
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0f1623]">Toplu Müşteri Yükleme</h1>
          <p className="text-sm text-[#64748b]">Excel veya CSV dosyasıyla müşterileri toplu içe aktarın.</p>
        </div>
      </div>

      {/* STAGE: Upload */}
      {stage === "upload" && (
        <div className="space-y-4">
          {/* Template download */}
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_4px_rgba(15,22,35,.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-[#0f1623] mb-1">📋 Şablon İndir</div>
                <p className="text-xs text-[#64748b] leading-relaxed">
                  CSV şablonunu indirin, Excel&apos;de doldurun ve buraya yükleyin.<br/>
                  Excel&apos;den kayıt ederken <strong>CSV (UTF-8)</strong> formatını seçin.
                </p>
              </div>
              <button onClick={downloadTemplate}
                className="shrink-0 rounded-xl border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-semibold text-[#2563eb] hover:bg-[#eff6ff] hover:border-blue-200 transition-colors">
                ⬇ Şablon İndir
              </button>
            </div>
          </div>

          {/* Column guide */}
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_4px_rgba(15,22,35,.06)]">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94a3b8] mb-3">Sütun Kılavuzu</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f0f2f5]">
                    <th className="text-left px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Sütun Adı</th>
                    <th className="text-left px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Örnek</th>
                    <th className="text-left px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Zorunlu</th>
                  </tr>
                </thead>
                <tbody>
                  {COLUMNS.map(c => (
                    <tr key={c.field} className="border-b border-[#f4f5f7] last:border-0">
                      <td className="px-3 py-2 font-semibold text-[#0f1623]">{c.label}</td>
                      <td className="px-3 py-2 text-[#64748b] font-mono text-xs">{c.example}</td>
                      <td className="px-3 py-2">
                        {c.required
                          ? <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 border border-red-200">Zorunlu</span>
                          : <span className="inline-flex items-center rounded-full bg-[#f4f5f7] px-2 py-0.5 text-[11px] font-semibold text-[#94a3b8]">Opsiyonel</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Drop zone */}
          <div className="rounded-2xl border-2 border-dashed border-[#d0d7e2] bg-white p-10 text-center hover:border-blue-300 hover:bg-[#f0f7ff] transition-all cursor-pointer"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); }}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFileName(f.name); parseFile(f); } }}>
            <div className="text-4xl mb-3">📂</div>
            <div className="text-sm font-bold text-[#0f1623] mb-1">CSV dosyasını sürükleyin veya tıklayın</div>
            <div className="text-xs text-[#94a3b8]">.csv, .txt — Excel&apos;den &quot;CSV UTF-8&quot; olarak kaydedin</div>
            {fileName && <div className="mt-3 text-xs font-semibold text-blue-600">{fileName}</div>}
          </div>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) { setFileName(f.name); parseFile(f); } }} />

          {parseError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">{parseError}</div>
          )}
        </div>
      )}

      {/* STAGE: Preview */}
      {stage === "preview" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_1px_4px_rgba(15,22,35,.06)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f2f5]">
              <div>
                <div className="text-sm font-bold text-[#0f1623]">Önizleme</div>
                <div className="text-xs text-[#64748b] mt-0.5">{rows.length} kayıt bulundu • İlk 10 satır gösteriliyor</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setStage("upload"); setRows([]); setFileName(""); }}
                  className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#64748b] hover:bg-[#f4f5f7] transition-colors">
                  ← Geri
                </button>
                <button onClick={doImport} disabled={loading}
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm">
                  {loading ? "İçe Aktarılıyor…" : `${rows.length} Müşteri İçe Aktar →`}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#f0f2f5] bg-[#f8f9fb]">
                    <th className="px-4 py-2.5 text-left font-bold text-[#94a3b8] uppercase tracking-widest">#</th>
                    {COLUMNS.map(c => (
                      <th key={c.field} className="px-4 py-2.5 text-left font-bold text-[#94a3b8] uppercase tracking-widest whitespace-nowrap">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b border-[#f4f5f7] last:border-0 hover:bg-[#f9fafb]">
                      <td className="px-4 py-2.5 text-[#94a3b8]">{i + 1}</td>
                      {COLUMNS.map(c => (
                        <td key={c.field} className="px-4 py-2.5 text-[#0f1623] max-w-[160px] truncate">
                          {row[c.field] || <span className="text-[#d0d7e2]">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 10 && (
              <div className="px-5 py-3 border-t border-[#f0f2f5] text-xs text-[#94a3b8] text-center">
                … ve {rows.length - 10} satır daha
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE: Done */}
      {stage === "done" && result && (
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-[0_1px_4px_rgba(15,22,35,.06)] text-center space-y-6">
          <div className="text-5xl">{result.errors.length === 0 ? "✅" : "⚠️"}</div>
          <div>
            <h2 className="text-xl font-black text-[#0f1623] mb-2">
              {result.errors.length === 0 ? "İçe Aktarma Tamamlandı!" : "Kısmen Tamamlandı"}
            </h2>
            <div className="flex justify-center gap-8 mt-4">
              <div className="text-center">
                <div className="text-2xl font-black text-green-600">{result.created}</div>
                <div className="text-xs text-[#64748b] font-medium mt-1">Oluşturuldu</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-amber-600">{result.skipped}</div>
                <div className="text-xs text-[#64748b] font-medium mt-1">Atlandı</div>
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="text-left rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-xs font-bold text-amber-800 mb-2 uppercase tracking-wide">Hatalı Satırlar</div>
              {result.errors.map((e, i) => (
                <div key={i} className="text-xs text-amber-700 py-0.5">{e}</div>
              ))}
            </div>
          )}

          <div className="flex justify-center gap-3">
            <button onClick={() => { setStage("upload"); setRows([]); setFileName(""); setResult(null); }}
              className="rounded-xl border border-[#e2e8f0] px-5 py-2.5 text-sm font-semibold text-[#64748b] hover:bg-[#f4f5f7] transition-colors">
              Yeni Yükleme
            </button>
            <button onClick={() => router.push("/app/customers")}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 shadow-sm transition-colors">
              Müşterilere Git →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
