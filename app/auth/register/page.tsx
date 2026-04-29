"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLeft, AuthBrand, AUTH_CSS } from "@/components/AuthLayout";

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}

function RegisterForm() {
  const router = useRouter();
  const [step, setStep]           = useState<1|2>(1);
  const [orgName, setOrgName]     = useState("");
  const [orgSlug, setOrgSlug]     = useState("");
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  // Checkboxes - NOT disabled-gated, validated on submit instead
  const [kvkk, setKvkk]           = useState(false);
  const [terms, setTerms]         = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [error, setError]         = useState<string|null>(null);
  const [loading, setLoading]     = useState(false);
  const [isMobile, setIsMobile]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function slugify(v: string) {
    return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }

  function goStep2(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) { setError("Firma adı gereklidir."); return; }
    if (!orgSlug.trim()) { setError("Kısa ad gereklidir."); return; }
    setError(null);
    setStep(2);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Validate checkboxes here instead of disabling the button
    if (!kvkk) { setError("KVKK Aydınlatma Metni'ni kabul etmelisiniz."); return; }
    if (!terms) { setError("Kullanım Koşulları'nı kabul etmelisiniz."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: orgName,
          organizationSlug: orgSlug,
          vertical: "ELEVATOR",
          name: name || undefined,
          email,
          phone: phone || undefined,
          password,
          marketingConsent: marketing,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (!res.ok) { setError(data?.error ?? "Kayıt başarısız."); return; }
      if (data.needsVerification) router.push("/auth/check-email");
      else { router.push("/app/dashboard?welcome=1"); router.refresh(); }
    } catch {
      setLoading(false);
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    }
  }

  return (
    <div style={{ ...S.page, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
      <style>{AUTH_CSS}</style>
      {!isMobile && <AuthLeft variant="register" />}

      <div style={S.right}>
        <div className="auth-card" style={S.card}>


          {/* Step progress */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {([1, 2] as const).map(n => (
                <div key={n} style={{ flex: 1, height: 3, borderRadius: 10, background: n <= step ? "#2563eb" : "#e4e8ee", transition: "background .3s" }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
              Adım {step}/2 — {step === 1 ? "Firma bilgileri" : "Hesap bilgileri"}
            </span>
          </div>

          <div style={S.hd}>
            <h1 style={S.h1}>{step === 1 ? "Firmanızı oluşturun" : "Hesabınızı oluşturun"}</h1>
            <p style={S.sub}>{step === 1 ? "Bakım yönetim sisteminizi kuralım." : "Giriş için kullanacağınız bilgiler."}</p>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={goStep2} style={S.form}>
              <Field label="Firma Adı">
                <input className="auth-inp" value={orgName} autoFocus required
                  onChange={e => { setOrgName(e.target.value); if (!orgSlug) setOrgSlug(slugify(e.target.value)); }}
                  placeholder="Örnek Asansör Servisi" />
              </Field>
              <Field label="Kısa Ad (URL)">
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#c0c8d4", pointerEvents: "none", fontWeight: 500, whiteSpace: "nowrap" }}>
                    servisim.app/
                  </span>
                  <input className="auth-inp" value={orgSlug} required
                    style={{ paddingLeft: 96 }}
                    onChange={e => setOrgSlug(slugify(e.target.value))}
                    placeholder="ornek-servis" />
                </div>
                <p style={{ fontSize: 11, color: "#c0c8d4", margin: "5px 0 0" }}>Sadece küçük harf, rakam ve tire</p>
              </Field>
              {error && <ErrBox msg={error} />}
              <button type="submit" className="auth-btn" style={{ marginTop: 4 }}>
                Devam Et →
              </button>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form onSubmit={onSubmit} style={S.form}>
              <Field label="Ad Soyad">
                <input className="auth-inp" value={name} autoFocus
                  onChange={e => setName(e.target.value)} placeholder="Ali Yılmaz" />
              </Field>
              <Field label="E-posta *">
                <input className="auth-inp" type="email" value={email} required
                  onChange={e => setEmail(e.target.value)} placeholder="ali@firmaniz.com" />
              </Field>
              <Field label="Telefon">
                <input className="auth-inp" type="tel" value={phone}
                  onChange={e => setPhone(e.target.value)} placeholder="05XX XXX XX XX" />
              </Field>
              <Field label="Şifre *">
                <div style={{ position: "relative" }}>
                  <input className="auth-inp" type={showPass ? "text" : "password"} value={password} required minLength={8}
                    style={{ paddingRight: 44 }}
                    onChange={e => setPassword(e.target.value)} placeholder="En az 8 karakter" />
                  <EyeBtn show={showPass} toggle={() => setShowPass(p => !p)} />
                </div>
              </Field>

              {/* Consent — documents + checkboxes */}
              <ConsentSection
                kvkk={kvkk} setKvkk={setKvkk}
                terms={terms} setTerms={setTerms}
                marketing={marketing} setMarketing={setMarketing}
              />

              {error && <ErrBox msg={error} />}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(null); }}
                  style={{ width: 46, height: 46, background: "#f4f5f7", border: "1px solid #e4e8ee", borderRadius: 10, fontSize: 16, fontWeight: 700, color: "#4b5a6e", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ←
                </button>
                {/* Button is ALWAYS enabled — validation happens inside onSubmit */}
                <button type="submit" disabled={loading} className="auth-btn" style={{ flex: 1, height: 46, padding: 0 }}>
                  {loading ? <><Spin /> Oluşturuluyor…</> : "Hesap Oluştur →"}
                </button>
              </div>
            </form>
          )}

          <p style={S.sw}>
            Hesabınız var mı?{" "}
            <Link href="/auth/login" style={S.lnk}>Giriş yapın →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Consent Section ─── */
function ConsentSection({ kvkk, setKvkk, terms, setTerms, marketing, setMarketing }: {
  kvkk: boolean; setKvkk: (v: boolean) => void;
  terms: boolean; setTerms: (v: boolean) => void;
  marketing: boolean; setMarketing: (v: boolean) => void;
}) {
  const DOCS = [
    { emoji: "🔒", label: "KVKK Aydınlatma Metni", href: "/kvkk", summary: "Kişisel verilerinizin nasıl işlendiğini ve haklarınızı açıklar." },
    { emoji: "📄", label: "Kullanım Koşulları", href: "/terms", summary: "Platform kullanım şartlarını ve abonelik kurallarını içerir." },
    { emoji: "🔐", label: "Gizlilik Politikası", href: "/privacy", summary: "Çerez kullanımı ve veri saklama sürelerini açıklar." },
  ];
  return (
    <div style={{ borderRadius: 14, border: "1px solid #e4e8ee", overflow: "hidden" }}>
      <div style={{ background: "#f8fafc", padding: "12px 14px 10px", borderBottom: "1px solid #f0f2f5" }}>
        <p style={{ margin: "0 0 10px", fontSize: 10.5, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
          Sözleşmeler — Lütfen okuyun
        </p>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 7 }}>
          {DOCS.map(d => (
            <a key={d.href} href={d.href} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", borderRadius: 10, border: "1px solid #e4e8ee", background: "#fff", textDecoration: "none" }}>
              <span style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>{d.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>{d.label}</span>
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{d.summary}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column" as const, gap: 10, background: "#fff" }}>
        {/* No `required` on hidden inputs — validation done in JS */}
        <ChkItem checked={kvkk} onChange={setKvkk} required>
          <strong style={{ color: "#0f1623" }}>KVKK Aydınlatma Metni</strong>&apos;ni okudum; kişisel verilerimin işlenmesini kabul ediyorum.
        </ChkItem>
        <ChkItem checked={terms} onChange={setTerms} required>
          <strong style={{ color: "#0f1623" }}>Kullanım Koşulları</strong> ve <strong style={{ color: "#0f1623" }}>Gizlilik Politikası</strong>&apos;nı kabul ediyorum.
        </ChkItem>
        <ChkItem checked={marketing} onChange={setMarketing}>
          Ürün güncellemeleri ve kampanya duyurularını almak istiyorum.{" "}
          <span style={{ fontSize: 10.5, color: "#c0c8d4" }}>(isteğe bağlı)</span>
        </ChkItem>
      </div>
    </div>
  );
}

function ChkItem({ checked, onChange, required, children }: { checked: boolean; onChange: (v: boolean) => void; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
      {/* Visual-only custom checkbox — click on label toggles it */}
      <div onClick={() => onChange(!checked)}
        style={{ marginTop: 2, width: 17, height: 17, borderRadius: 5, border: checked ? "none" : "1.5px solid #d0d7e2", background: checked ? "#2563eb" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s", boxShadow: checked ? "0 2px 6px rgba(37,99,235,.3)" : "none" }}>
        {checked && <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
      </div>
      {/* NOTE: no required attribute — prevents browser blocking submit with invisible tooltip */}
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }} />
      <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
        {children}
        {required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </span>
    </label>
  );
}

/* ─── Shared helpers ─── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 7 }}>{label}</label>
      {children}
    </div>
  );
}
function EyeBtn({ show, toggle }: { show: boolean; toggle: () => void }) {
  return (
    <button type="button" tabIndex={-1} onClick={toggle}
      style={{ position: "absolute" as const, right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, display: "flex" }}>
      {show
        ? <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" /></svg>
        : <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
    </button>
  );
}
function ErrBox({ msg }: { msg: string }) {
  return (
    <div className="auth-err" style={{ display: "flex", alignItems: "center", gap: 9, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", color: "#dc2626", fontSize: 13, fontWeight: 500 }}>
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
      {msg}
    </div>
  );
}
function Spin() {
  return <span className="spin" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%" }} />;
}

const S: Record<string, React.CSSProperties> = {
  page:  { minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" },
  right: { display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 32px", background: "#f8fafc", overflowY: "auto" },
  card:  { width: "100%", maxWidth: 440, paddingTop: 8 },
  hd:    { marginBottom: 22 },
  h1:    { fontSize: 24, fontWeight: 900, color: "#0f1623", letterSpacing: "-0.04em", margin: "0 0 5px", lineHeight: 1.1 },
  sub:   { fontSize: 13, color: "#94a3b8", margin: 0 },
  form:  { display: "flex", flexDirection: "column", gap: 14 },
  sw:    { textAlign: "center", marginTop: 20, color: "#94a3b8", fontSize: 13 },
  lnk:   { color: "#2563eb", fontWeight: 700, textDecoration: "none" },
};
