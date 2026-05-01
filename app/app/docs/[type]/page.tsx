"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

/* ─── Teklif template ─── */
const OFFER_HTML = `<div style="font-family:system-ui,sans-serif;max-width:640px;color:#1e293b;">
<h2 style="font-size:22px;font-weight:800;margin:0 0 4px;color:#0f172a;">Asansör Bakım Teklifi</h2>
<p style="color:#64748b;font-size:13px;margin:0 0 24px;">[Tarih]</p>

<p style="margin:0 0 16px;font-size:14px;">Sayın <strong>[Müşteri Adı]</strong>,</p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#334155;">
  <strong>[Firma Adı]</strong> olarak, yönetiminizde bulunan asansörler için hazırladığımız periyodik bakım teklifini sunmaktan memnuniyet duyarız.
</p>

<table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
  <tr style="background:#f8fafc;"><th style="text-align:left;padding:10px 12px;border:1px solid #e2e8f0;color:#64748b;font-weight:600;">Kalem</th><th style="text-align:left;padding:10px 12px;border:1px solid #e2e8f0;color:#64748b;font-weight:600;">Detay</th></tr>
  <tr><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:500;">Bina / Site</td><td style="padding:10px 12px;border:1px solid #e2e8f0;">[Adres]</td></tr>
  <tr style="background:#f8fafc;"><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:500;">Asansör Sayısı</td><td style="padding:10px 12px;border:1px solid #e2e8f0;">[Asansör Sayısı] adet</td></tr>
  <tr><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:500;">Hizmet Kapsamı</td><td style="padding:10px 12px;border:1px solid #e2e8f0;">[Açıklama]</td></tr>
  <tr style="background:#f8fafc;"><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:500;">Periyot</td><td style="padding:10px 12px;border:1px solid #e2e8f0;">Aylık periyodik bakım</td></tr>
  <tr><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:700;color:#2563eb;">Aylık Ücret</td><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:700;font-size:16px;color:#2563eb;">[Aylık Ücret] ₺ + KDV</td></tr>
</table>

<div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:14px 16px;border-radius:6px;margin-bottom:20px;font-size:13px;color:#1d4ed8;">
  <strong>📋 Yasal Uyumluluk:</strong> Tüm bakımlar Asansör İşletme ve Bakım Yönetmeliği (6 Nisan 2019) ve TS EN 13015 standardı kapsamında gerçekleştirilmektedir.
</div>

<p style="font-size:13px;color:#64748b;line-height:1.7;">
  Teklifimizin geçerlilik süresi <strong>30 gündür</strong>. Sorularınız için iletişime geçebilirsiniz.
</p>
<p style="font-size:13px;margin-top:16px;color:#334155;">Saygılarımızla,<br/><strong>[Servis Firması]</strong></p>
</div>`;

/* ─── Sözleşme template ─── */
const CONTRACT_HTML = `<div style="font-family:system-ui,sans-serif;max-width:640px;color:#1e293b;">
<h2 style="font-size:22px;font-weight:800;margin:0 0 4px;color:#0f172a;">Asansör Bakım Sözleşmesi</h2>
<p style="color:#64748b;font-size:13px;margin:0 0 24px;">Sözleşme Tarihi: [Tarih]</p>

<h3 style="font-size:14px;font-weight:700;margin:0 0 8px;color:#0f172a;">1. TARAFLAR</h3>
<table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
  <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:500;width:40%;">Hizmet Veren (Bakım Firması)</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">[Firma Adı]</td></tr>
  <tr style="background:#f8fafc;"><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:500;">Hizmet Alan (Bina Sorumlusu)</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">[Müşteri Adı]</td></tr>
  <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:500;">Bina Adresi</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">[Adres]</td></tr>
</table>

<h3 style="font-size:14px;font-weight:700;margin:16px 0 8px;color:#0f172a;">2. KAPSAM VE SÜRE</h3>
<table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
  <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:500;width:40%;">Sözleşme Süresi</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">[Başlangıç] – [Bitiş]</td></tr>
  <tr style="background:#f8fafc;"><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:500;">Asansör Adedi</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">[Asansör Sayısı] adet</td></tr>
  <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:500;">Bakım Periyodu</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">Ayda 1 kez periyodik bakım</td></tr>
  <tr style="background:#f8fafc;"><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:500;">Hizmet Kapsamı</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">[Hizmetler]</td></tr>
</table>

<h3 style="font-size:14px;font-weight:700;margin:16px 0 8px;color:#0f172a;">3. ÜCRET</h3>
<table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
  <tr style="background:#eff6ff;"><td style="padding:10px 12px;border:1px solid #bfdbfe;font-weight:700;color:#1d4ed8;">Aylık Bakım Ücreti</td><td style="padding:10px 12px;border:1px solid #bfdbfe;font-weight:700;font-size:16px;color:#2563eb;">[Aylık Ücret] ₺ + KDV</td></tr>
</table>

<h3 style="font-size:14px;font-weight:700;margin:16px 0 8px;color:#0f172a;">4. TEKNİK SORUMLU</h3>
<table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
  <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:500;width:40%;">Teknisyen Adı Soyadı</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">[Teknisyen]</td></tr>
  <tr style="background:#f8fafc;"><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:500;">Sertifika No</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">[Sertifika No]</td></tr>
</table>

<div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:14px 16px;border-radius:6px;margin-bottom:20px;font-size:12px;color:#166534;">
  <strong>✓ Yasal Dayanak:</strong> Bu sözleşme Asansör İşletme ve Bakım Yönetmeliği (RG-30411, 6 Nisan 2019) kapsamında hazırlanmıştır.
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:32px;font-size:13px;">
  <div style="border-top:1px solid #e2e8f0;padding-top:12px;">
    <strong>Hizmet Veren</strong><br/>[Firma Adı]<br/><br/>İmza: _______________<br/>Tarih: [Tarih]
  </div>
  <div style="border-top:1px solid #e2e8f0;padding-top:12px;">
    <strong>Hizmet Alan</strong><br/>[Müşteri Adı]<br/><br/>İmza: _______________<br/>Tarih: [Tarih]
  </div>
</div>
</div>`;

const F: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  border: "1.5px solid #e2e8f0", borderRadius: 9,
  fontSize: 13, fontFamily: "inherit", outline: "none",
  background: "#fff", color: "#0f172a",
};

export default function DocEditorPage() {
  const router = useRouter();
  const params = useParams<{ type: string }>();
  const type = params.type ?? "";
  const isTeklif = type === "teklif";
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  const defaultHtml = isTeklif ? OFFER_HTML : type === "sozlesme" ? CONTRACT_HTML : "";

  useEffect(() => {
    if (type === "teklif") setSubject("Asansör Bakım Teklifi");
    else if (type === "sozlesme") setSubject("Asansör Bakım Sözleşmesi");
    else router.push("/app/settings");
    setValues({});
    setStatus(null);
  }, [type, router]);

  const placeholders = useMemo(() => {
    const regex = /\[([^\]]+)\]/g;
    const found = new Set<string>();
    let m;
    while ((m = regex.exec(defaultHtml))) found.add(m[1]);
    return Array.from(found);
  }, [defaultHtml]);

  const finalHtml = useMemo(() => {
    let html = defaultHtml;
    for (const key of placeholders) {
      const val = values[key] ?? `[${key}]`;
      const escaped = key.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      html = html.replace(new RegExp(`\\[${escaped}\\]`, "g"), val);
    }
    return html;
  }, [defaultHtml, placeholders, values]);

  const filledCount = placeholders.filter(p => values[p] && values[p].trim()).length;
  const progress = placeholders.length ? Math.round((filledCount / placeholders.length) * 100) : 100;

  async function sendDoc(e: React.FormEvent) {
    e.preventDefault();
    setSending(true); setStatus(null);
    try {
      const res = await fetch("/api/docs/send", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, to, subject, html: finalHtml }),
      });
      const data = await res.json();
      if (!res.ok) setStatus(data.error || "Hata");
      else { setStatus("✓ E-posta gönderildi."); setTo(""); }
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : "Hata");
    } finally { setSending(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input:focus,select:focus,textarea:focus{border-color:#2563eb!important;box-shadow:0 0 0 3px rgba(37,99,235,.12)!important;}`}</style>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.18em", color: "#94a3b8", marginBottom: 6 }}>Araçlar</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.05em",
            color: "#0f172a", lineHeight: 1.05, margin: 0 }}>
            {isTeklif ? "Teklif Şablonu" : "Sözleşme Şablonu"}
          </h1>
          <p style={{ marginTop: 6, fontSize: 13.5, color: "#64748b", lineHeight: 1.6 }}>
            {isTeklif
              ? "Alanları doldurun, profesyonel teklifinizi müşteriye e-posta ile gönderin."
              : "Alanları doldurun, yasal uyumlu bakım sözleşmenizi oluşturun ve gönderin."}
          </p>
        </div>
        <button onClick={() => setShowPreview(v => !v)}
          style={{ display: "inline-flex", alignItems: "center", gap: 7,
            background: showPreview ? "#111827" : "#fff",
            color: showPreview ? "#fff" : "#374151",
            border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600,
            padding: "9px 18px", borderRadius: 9, cursor: "pointer" }}>
          {showPreview ? "← Düzenlemeye dön" : "Önizle →"}
        </button>
      </div>

      {status && (
        <div style={{
          background: status.startsWith("✓") ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${status.startsWith("✓") ? "#bbf7d0" : "#fecaca"}`,
          color: status.startsWith("✓") ? "#166534" : "#b91c1c",
          borderRadius: 10, padding: "12px 16px", fontSize: 13, marginBottom: 20,
        }}>{status}</div>
      )}

      {showPreview ? (
        /* ── PREVIEW MODE ── */
        <div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 14, padding: "32px 40px", marginBottom: 20,
            boxShadow: "0 4px 20px rgba(15,23,42,.06)" }}>
            <div dangerouslySetInnerHTML={{ __html: finalHtml }} />
          </div>
          <button onClick={() => setShowPreview(false)}
            style={{ background: "#2563eb", color: "#fff", border: "none",
              fontSize: 13, fontWeight: 700, padding: "10px 24px",
              borderRadius: 9, cursor: "pointer" }}>
            ← Düzenlemeye dön
          </button>
        </div>
      ) : (
        /* ── EDIT MODE ── */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 440px", gap: 24, alignItems: "start" }}>

          {/* Left: form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Progress bar */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                fontSize: 12, marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: "#374151" }}>Alan doldurma ilerlemesi</span>
                <span style={{ color: progress === 100 ? "#22c55e" : "#6b7280",
                  fontWeight: 700 }}>{filledCount}/{placeholders.length}</span>
              </div>
              <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`,
                  background: progress === 100 ? "#22c55e" : "#2563eb",
                  borderRadius: 99, transition: "width 0.3s" }} />
              </div>
            </div>

            {/* Template fields */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 12, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827",
                marginBottom: 16 }}>📝 Şablon Alanları</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {placeholders.map(ph => (
                  <div key={ph}>
                    <label style={{ fontSize: 11, fontWeight: 700,
                      color: "#6b7280", display: "block", marginBottom: 5,
                      textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {ph}
                    </label>
                    <input
                      style={{ ...F,
                        borderColor: values[ph] ? "#bbf7d0" : "#e2e8f0",
                        background: values[ph] ? "#f0fdf4" : "#fff",
                      }}
                      placeholder={`[${ph}] alanını doldurun...`}
                      value={values[ph] ?? ""}
                      onChange={e => setValues(v => ({ ...v, [ph]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Send form */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 12, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827",
                marginBottom: 16 }}>📧 E-posta ile Gönder</div>
              <form onSubmit={sendDoc} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280",
                    display: "block", marginBottom: 5, textTransform: "uppercase",
                    letterSpacing: "0.05em" }}>Alıcı E-Posta *</label>
                  <input style={F} type="email" placeholder="yonetici@example.com"
                    value={to} onChange={e => setTo(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280",
                    display: "block", marginBottom: 5, textTransform: "uppercase",
                    letterSpacing: "0.05em" }}>Konu *</label>
                  <input style={F} value={subject}
                    onChange={e => setSubject(e.target.value)} required />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button type="submit" disabled={sending || !to}
                    style={{ flex: 1, background: "#2563eb", color: "#fff",
                      border: "none", fontSize: 13, fontWeight: 700,
                      padding: "10px 18px", borderRadius: 9, cursor: "pointer",
                      opacity: (!to || sending) ? 0.6 : 1, display: "flex",
                      alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {sending ? (
                      <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)",
                        borderTopColor: "#fff", borderRadius: "50%",
                        animation: "spin .7s linear infinite" }} /> Gönderiliyor...</>
                    ) : "📤 E-posta Gönder"}
                  </button>
                  <button type="button" onClick={() => setShowPreview(true)}
                    style={{ background: "#f8fafc", color: "#374151",
                      border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600,
                      padding: "10px 16px", borderRadius: 9, cursor: "pointer" }}>
                    Önizle
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right: live preview panel */}
          <div style={{ position: "sticky", top: 24 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 14, overflow: "hidden",
              boxShadow: "0 4px 20px rgba(15,23,42,.06)" }}>
              {/* Preview header */}
              <div style={{ padding: "12px 18px", background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0", display: "flex",
                alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                  Canlı Önizleme
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
                </div>
              </div>
              {/* Preview content */}
              <div style={{ padding: "24px 28px", maxHeight: 600,
                overflowY: "auto", fontSize: 12, lineHeight: 1.6 }}>
                <div dangerouslySetInnerHTML={{ __html: finalHtml }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
