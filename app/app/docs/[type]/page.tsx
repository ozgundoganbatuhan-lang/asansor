"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

/* ── Templates ── */
const TEMPLATES: Record<string, { subject: string; fields: { key: string; label: string; placeholder: string; type?: string; multiline?: boolean }[]; sections: { title: string; content: string }[] }> = {
  teklif: {
    subject: "Asansör Bakım Teklifi",
    fields: [
      { key: "Müşteri Adı",    label: "Müşteri / Firma Adı",  placeholder: "Metropol Yapı AŞ" },
      { key: "Adres",          label: "Bina / Site Adresi",   placeholder: "Atatürk Cad. No:12, İstanbul" },
      { key: "Asansör Sayısı", label: "Asansör Adedi",        placeholder: "4" },
      { key: "Açıklama",       label: "Hizmet Kapsamı",       placeholder: "Aylık periyodik bakım, yağlama ve kontrol", multiline: true },
      { key: "Aylık Ücret",    label: "Aylık Birim Ücret (₺)", placeholder: "2.500" },
      { key: "Tarih",          label: "Teklif Tarihi",        placeholder: new Date().toLocaleDateString("tr-TR"), type: "date" },
      { key: "Servis Firması", label: "Servis Firmanızın Adı", placeholder: "Astek Asansör Servis" },
      { key: "Geçerlilik",     label: "Teklif Geçerlilik Süresi", placeholder: "30 gün" },
    ],
    sections: []
  },
  sozlesme: {
    subject: "Asansör Bakım Sözleşmesi",
    fields: [
      { key: "Firma Adı",      label: "Servis Firması Adı",   placeholder: "Astek Asansör Servis" },
      { key: "Müşteri Adı",    label: "Müşteri / Bina Sorumlusu", placeholder: "Metropol Yapı AŞ" },
      { key: "Adres",          label: "Bina Adresi",          placeholder: "Atatürk Cad. No:12, İstanbul" },
      { key: "Asansör Sayısı", label: "Asansör Adedi",        placeholder: "4" },
      { key: "Başlangıç",      label: "Sözleşme Başlangıç",   placeholder: "01.01.2026", type: "date" },
      { key: "Bitiş",          label: "Sözleşme Bitiş",       placeholder: "31.12.2026", type: "date" },
      { key: "Hizmetler",      label: "Kapsam / Hizmetler",   placeholder: "Aylık periyodik bakım, acil çağrı hizmeti", multiline: true },
      { key: "Aylık Ücret",    label: "Aylık Bakım Ücreti (₺)", placeholder: "2.500" },
      { key: "Teknisyen",      label: "Sorumlu Teknisyen",    placeholder: "Ahmet Yılmaz" },
      { key: "Sertifika No",   label: "Teknisyen Sertifika No", placeholder: "TSE-HYB-12345" },
      { key: "Tarih",          label: "İmza Tarihi",          placeholder: new Date().toLocaleDateString("tr-TR"), type: "date" },
    ],
    sections: []
  }
};

function buildDoc(type: string, values: Record<string, string>): string {
  const v = (key: string, fallback = `[${key}]`) => values[key]?.trim() || `<span style="background:#fef9c3;padding:1px 4px;border-radius:3px;color:#92400e;">[${key}]</span>`;
  
  if (type === "teklif") return `
<div style="font-family:'DM Sans',system-ui,sans-serif;color:#0f172a;max-width:100%;">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:2px solid #0f172a;margin-bottom:32px;">
    <div>
      <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#64748b;margin-bottom:8px;">BAKIM TEKLİFİ</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.04em;line-height:1;color:#0f172a;">${v("Servis Firması")}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;color:#64748b;">Teklif Tarihi</div>
      <div style="font-size:13px;font-weight:600;color:#0f172a;">${v("Tarih")}</div>
      <div style="margin-top:8px;font-size:11px;color:#64748b;">Geçerlilik</div>
      <div style="font-size:13px;font-weight:600;color:#0f172a;">${v("Geçerlilik")}</div>
    </div>
  </div>

  <!-- Recipient -->
  <div style="background:#f8fafc;border-radius:10px;padding:18px 20px;margin-bottom:28px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">SUNULMUŞTUR</div>
    <div style="font-size:18px;font-weight:800;color:#0f172a;">${v("Müşteri Adı")}</div>
    <div style="font-size:13px;color:#64748b;margin-top:3px;">${v("Adres")}</div>
  </div>

  <!-- Intro -->
  <p style="font-size:14px;line-height:1.75;color:#334155;margin:0 0 28px;">
    Sayın ilgili, <strong>${v("Müşteri Adı")}</strong> yönetiminizde bulunan <strong>${v("Asansör Sayısı")} adet asansör</strong> için hazırladığımız periyodik bakım teklifini sunuyoruz.
  </p>

  <!-- Services table -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:28px;font-size:13px;">
    <thead>
      <tr style="background:#0f172a;color:#fff;">
        <th style="padding:12px 16px;text-align:left;font-weight:600;border-radius:8px 0 0 0;">Hizmet Kalemi</th>
        <th style="padding:12px 16px;text-align:left;font-weight:600;">Adet</th>
        <th style="padding:12px 16px;text-align:right;font-weight:600;border-radius:0 8px 0 0;">Aylık Tutar</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background:#f8fafc;">
        <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;">
          <div style="font-weight:600;color:#0f172a;">Periyodik Bakım Hizmeti</div>
          <div style="font-size:12px;color:#64748b;margin-top:3px;">${v("Açıklama")}</div>
        </td>
        <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;color:#374151;">${v("Asansör Sayısı")} adet</td>
        <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;color:#2563eb;font-size:16px;">₺${v("Aylık Ücret")}/ay</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:14px 16px;font-weight:700;font-size:15px;color:#0f172a;">TOPLAM (+ KDV)</td>
        <td style="padding:14px 16px;text-align:right;font-weight:900;font-size:20px;color:#0f172a;">₺${v("Aylık Ücret")}</td>
      </tr>
    </tbody>
  </table>

  <!-- Legal notice -->
  <div style="background:#eff6ff;border-left:3px solid #2563eb;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:28px;font-size:12px;color:#1d4ed8;line-height:1.6;">
    <strong>📋 Yasal Uyumluluk:</strong> Tüm bakımlar Asansör İşletme ve Bakım Yönetmeliği (RG-30411, 6 Nisan 2019) ve TS EN 13015 standardı kapsamında yürütülmektedir.
  </div>

  <!-- Signature -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0;font-size:13px;">
    <div>
      <div style="font-weight:700;color:#0f172a;margin-bottom:4px;">${v("Servis Firması")}</div>
      <div style="color:#64748b;margin-bottom:32px;">Yetkili İmza</div>
      <div style="border-top:1px solid #94a3b8;padding-top:8px;color:#94a3b8;font-size:11px;">İmza / Kaşe</div>
    </div>
    <div>
      <div style="font-weight:700;color:#0f172a;margin-bottom:4px;">${v("Müşteri Adı")}</div>
      <div style="color:#64748b;margin-bottom:32px;">Onay</div>
      <div style="border-top:1px solid #94a3b8;padding-top:8px;color:#94a3b8;font-size:11px;">İmza / Kaşe / Tarih</div>
    </div>
  </div>
</div>`;

  // Sözleşme
  return `
<div style="font-family:'DM Sans',system-ui,sans-serif;color:#0f172a;max-width:100%;">
  <!-- Header -->
  <div style="text-align:center;padding-bottom:24px;border-bottom:2px solid #0f172a;margin-bottom:32px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#64748b;margin-bottom:8px;">RESMİ SÖZLEŞME</div>
    <div style="font-size:26px;font-weight:900;letter-spacing:-0.03em;color:#0f172a;">ASANSÖR BAKIM SÖZLEŞMESİ</div>
    <div style="font-size:12px;color:#64748b;margin-top:6px;">Sözleşme Tarihi: ${v("Tarih")}</div>
  </div>

  <!-- Parties -->
  <div style="margin-bottom:28px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:12px;">1. TARAFLAR</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div style="background:#f8fafc;border-radius:10px;padding:16px 18px;">
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">HİZMET VEREN</div>
        <div style="font-size:15px;font-weight:800;color:#0f172a;">${v("Firma Adı")}</div>
        <div style="font-size:12px;color:#64748b;margin-top:3px;">Bakım Firması</div>
      </div>
      <div style="background:#f8fafc;border-radius:10px;padding:16px 18px;">
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">HİZMET ALAN</div>
        <div style="font-size:15px;font-weight:800;color:#0f172a;">${v("Müşteri Adı")}</div>
        <div style="font-size:12px;color:#64748b;margin-top:3px;">${v("Adres")}</div>
      </div>
    </div>
  </div>

  <!-- Terms -->
  <div style="margin-bottom:24px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:12px;">2. KAPSAM VE SÜRE</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      ${[["Sözleşme Süresi", `${v("Başlangıç")} – ${v("Bitiş")}`], ["Asansör Adedi", `${v("Asansör Sayısı")} adet`], ["Bakım Periyodu", "Ayda 1 kez (min.) periyodik bakım"], ["Hizmet Kapsamı", v("Hizmetler")]].map(([l, r], i) =>
        `<tr style="${i%2===0?"background:#f8fafc;":""}"><td style="padding:11px 14px;border:1px solid #e2e8f0;font-weight:600;color:#374151;width:40%;">${l}</td><td style="padding:11px 14px;border:1px solid #e2e8f0;color:#0f172a;">${r}</td></tr>`
      ).join("")}
    </table>
  </div>

  <!-- Fee -->
  <div style="margin-bottom:24px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:12px;">3. ÜCRET</div>
    <div style="background:#0f172a;border-radius:10px;padding:18px 20px;display:flex;justify-content:space-between;align-items:center;">
      <div style="color:rgba(255,255,255,.6);font-size:13px;">Aylık Bakım Ücreti (+ KDV)</div>
      <div style="color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.04em;">₺${v("Aylık Ücret")}<span style="font-size:13px;font-weight:400;color:rgba(255,255,255,.5)">/ay</span></div>
    </div>
  </div>

  <!-- Technician -->
  <div style="margin-bottom:24px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:12px;">4. TEKNİK SORUMLU</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:11px 14px;border:1px solid #e2e8f0;font-weight:600;color:#374151;width:40%;">Teknisyen Adı Soyadı</td><td style="padding:11px 14px;border:1px solid #e2e8f0;">${v("Teknisyen")}</td></tr>
      <tr style="background:#f8fafc;"><td style="padding:11px 14px;border:1px solid #e2e8f0;font-weight:600;color:#374151;">Sertifika / TSE No</td><td style="padding:11px 14px;border:1px solid #e2e8f0;">${v("Sertifika No")}</td></tr>
    </table>
  </div>

  <!-- Legal -->
  <div style="background:#f0fdf4;border-left:3px solid #22c55e;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:32px;font-size:12px;color:#166534;line-height:1.6;">
    <strong>✓ Yasal Dayanak:</strong> Bu sözleşme Asansör İşletme ve Bakım Yönetmeliği (RG-30411, 6 Nisan 2019) ve TS EN 13015 standardı kapsamında hazırlanmıştır. Taraflarca imzalandıktan sonra hukuken geçerlilik kazanır.
  </div>

  <!-- Signatures -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;padding-top:28px;border-top:1px solid #e2e8f0;font-size:13px;">
    <div>
      <div style="font-weight:800;color:#0f172a;margin-bottom:4px;">${v("Firma Adı")}</div>
      <div style="font-size:12px;color:#64748b;margin-bottom:40px;">Hizmet Veren — Yetkili İmza</div>
      <div style="border-top:1.5px solid #0f172a;padding-top:8px;font-size:11px;color:#94a3b8;">İmza / Kaşe</div>
    </div>
    <div>
      <div style="font-weight:800;color:#0f172a;margin-bottom:4px;">${v("Müşteri Adı")}</div>
      <div style="font-size:12px;color:#64748b;margin-bottom:40px;">Hizmet Alan — Yetkili İmza</div>
      <div style="border-top:1.5px solid #0f172a;padding-top:8px;font-size:11px;color:#94a3b8;">İmza / Kaşe / Tarih</div>
    </div>
  </div>
</div>`;
}

export default function DocEditorPage() {
  const router  = useRouter();
  const params  = useParams<{ type: string }>();
  const type    = params?.type ?? "";
  const isTeklif = type === "teklif";
  const template = TEMPLATES[type];

  const [values,   setValues]   = useState<Record<string, string>>({});
  const [to,       setTo]       = useState("");
  const [status,   setStatus]   = useState<{ ok: boolean; msg: string } | null>(null);
  const [sending,  setSending]  = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!template) router.push("/app/settings");
    setValues({});
    setStatus(null);
  }, [type, template, router]);

  const html = useMemo(() => buildDoc(type, values), [type, values]);

  const fields   = template?.fields ?? [];
  const filled   = fields.filter(f => values[f.key]?.trim()).length;
  const pct      = fields.length ? Math.round((filled / fields.length) * 100) : 100;
  const allFilled = filled === fields.length;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setSending(true); setStatus(null);
    try {
      const res  = await fetch("/api/docs/send", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, to, subject: template?.subject, html }),
      });
      const data = await res.json();
      if (res.ok) { setStatus({ ok: true, msg: `✓ Belge ${to} adresine gönderildi.` }); setTo(""); }
      else setStatus({ ok: false, msg: data.error ?? "Hata oluştu" });
    } catch (err: unknown) {
      setStatus({ ok: false, msg: err instanceof Error ? err.message : "Hata" });
    } finally { setSending(false); }
  }

  if (!template) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden",
      fontFamily: "'DM Sans','Plus Jakarta Sans',system-ui,sans-serif",
      background: "#f1f5f9", margin: "-28px -32px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:none; } }
        .doc-field-input { transition: border-color .15s, box-shadow .15s; }
        .doc-field-input:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,.15) !important; outline: none; }
        .doc-field-input::placeholder { color: #cbd5e1; }
        .send-btn:hover:not(:disabled) { background: #1d4ed8 !important; }
        .send-btn:disabled { opacity: .55; cursor: not-allowed; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "0 24px", height: 56, display: "flex", alignItems: "center",
        justifyContent: "space-between", flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => router.back()}
            style={{ background: "none", border: "none", cursor: "pointer",
              color: "#64748b", display: "flex", alignItems: "center", gap: 5,
              fontSize: 13, fontWeight: 500, padding: "5px 0" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ display: "inline-flex", flexShrink: 0 }}>
              <polyline points="15,18 9,12 15,6"/>
            </svg>
            Geri
          </button>
          <div style={{ width: 1, height: 20, background: "#e2e8f0" }} />
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.12em", color: "#94a3b8" }}>Araçlar / </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
              {isTeklif ? "Teklif Şablonu" : "Sözleşme Şablonu"}
            </span>
          </div>
        </div>

        {/* Progress + send */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 120, height: 5, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`,
                background: allFilled ? "#22c55e" : "#2563eb",
                borderRadius: 99, transition: "width .3s, background .3s" }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700,
              color: allFilled ? "#16a34a" : "#64748b" }}>
              {filled}/{fields.length} alan
            </span>
          </div>
          <button
            disabled={!to || sending}
            form="send-form"
            type="submit"
            className="send-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: 7,
              background: "#2563eb", color: "#fff", border: "none",
              fontSize: 13, fontWeight: 700, padding: "8px 18px",
              borderRadius: 9, cursor: "pointer", transition: "background .15s" }}>
            {sending ? (
              <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.35)",
                borderTopColor: "#fff", borderRadius: "50%",
                animation: "spin .6s linear infinite" }} />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ display: "inline-flex", flexShrink: 0 }}>
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9"/>
              </svg>
            )}
            {sending ? "Gönderiliyor…" : "Gönder"}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* LEFT — fields panel */}
        <div style={{ width: 320, flexShrink: 0, background: "#fff",
          borderRight: "1px solid #e2e8f0",
          overflowY: "auto", display: "flex", flexDirection: "column" }}>

          {/* Status */}
          {status && (
            <div style={{ margin: "12px 16px 0",
              background: status.ok ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${status.ok ? "#bbf7d0" : "#fecaca"}`,
              color: status.ok ? "#166534" : "#b91c1c",
              borderRadius: 9, padding: "10px 14px", fontSize: 12, fontWeight: 500 }}>
              {status.msg}
            </div>
          )}

          {/* Fields */}
          <div style={{ padding: "20px 16px 0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", color: "#94a3b8", marginBottom: 16 }}>
              📝 Belge Alanları
            </div>
            {fields.map((f, i) => (
              <div key={f.key}
                style={{ marginBottom: 16, animation: `slideIn .2s ease ${i * 0.04}s both` }}>
                <label style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "center", fontSize: 11, fontWeight: 700, color: "#374151",
                  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {f.label}
                  {values[f.key]?.trim() && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                      style={{ display: "inline-flex", flexShrink: 0 }}>
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  )}
                </label>
                {f.multiline ? (
                  <textarea
                    className="doc-field-input"
                    style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0",
                      borderRadius: 9, fontSize: 12.5, fontFamily: "inherit", resize: "vertical",
                      minHeight: 70, color: "#0f172a", background: activeField === f.key ? "#fafafe" : "#fff",
                      borderColor: activeField === f.key ? "#2563eb" : values[f.key]?.trim() ? "#bbf7d0" : "#e2e8f0",
                      boxSizing: "border-box" }}
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ""}
                    onFocus={() => setActiveField(f.key)}
                    onBlur={() => setActiveField(null)}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    className="doc-field-input"
                    type={f.type ?? "text"}
                    style={{ width: "100%", padding: "9px 12px", border: "1.5px solid",
                      borderRadius: 9, fontSize: 12.5, fontFamily: "inherit",
                      color: "#0f172a", boxSizing: "border-box",
                      background: activeField === f.key ? "#fafafe" : "#fff",
                      borderColor: activeField === f.key ? "#2563eb" : values[f.key]?.trim() ? "#bbf7d0" : "#e2e8f0" }}
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ""}
                    onFocus={() => setActiveField(f.key)}
                    onBlur={() => setActiveField(null)}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Send form */}
          <form id="send-form" onSubmit={send}
            style={{ padding: "20px 16px 24px",
              borderTop: "1px solid #f1f5f9", marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", color: "#94a3b8", marginBottom: 14 }}>
              📧 E-posta ile Gönder
            </div>
            <input
              className="doc-field-input"
              type="email" required
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0",
                borderRadius: 9, fontSize: 12.5, fontFamily: "inherit",
                color: "#0f172a", boxSizing: "border-box", marginBottom: 10 }}
              placeholder="yonetici@bina.com"
              value={to}
              onChange={e => setTo(e.target.value)}
            />
            <button type="submit" disabled={!to || sending} className="send-btn"
              style={{ width: "100%", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 7, background: "#2563eb", color: "#fff",
                border: "none", fontSize: 13, fontWeight: 700,
                padding: "10px 16px", borderRadius: 9, cursor: "pointer" }}>
              {sending ? (
                <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .6s linear infinite" }} />Gönderiliyor…</>
              ) : "📤 Belgeyi Gönder"}
            </button>
          </form>
        </div>

        {/* RIGHT — document preview */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px",
          display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* Document paper */}
          <div ref={previewRef}
            style={{ width: "100%", maxWidth: 720,
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 8px 40px rgba(15,23,42,.12), 0 2px 8px rgba(15,23,42,.06)",
              padding: "52px 56px",
              minHeight: 900,
            }}>
            {/* Watermark if not all filled */}
            {!allFilled && (
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", top: "30%", left: "50%",
                  transform: "translate(-50%,-50%) rotate(-30deg)",
                  fontSize: 72, fontWeight: 900, color: "rgba(226,232,240,.35)",
                  letterSpacing: "-0.04em", pointerEvents: "none",
                  userSelect: "none", whiteSpace: "nowrap", zIndex: 0 }}>
                  TASLAK
                </div>
              </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>

          {/* Action buttons below doc */}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => window.print()}
              style={{ display: "inline-flex", alignItems: "center", gap: 6,
                background: "#fff", color: "#374151", border: "1px solid #e2e8f0",
                fontSize: 12.5, fontWeight: 600, padding: "8px 16px",
                borderRadius: 8, cursor: "pointer" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ display: "inline-flex", flexShrink: 0 }}>
                <polyline points="6,9 6,2 18,2 18,9"/>
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Yazdır / PDF
            </button>
            <button
              disabled={!allFilled}
              onClick={() => {
                const blob = new Blob([`<html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;padding:40px;}</style></head><body>${html}</body></html>`], { type: "text/html" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                a.download = `${isTeklif ? "teklif" : "sozlesme"}-${Date.now()}.html`; a.click();
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6,
                background: allFilled ? "#0f172a" : "#f1f5f9",
                color: allFilled ? "#fff" : "#94a3b8",
                border: "none", fontSize: 12.5, fontWeight: 600,
                padding: "8px 16px", borderRadius: 8, cursor: allFilled ? "pointer" : "not-allowed" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ display: "inline-flex", flexShrink: 0 }}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              İndir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
