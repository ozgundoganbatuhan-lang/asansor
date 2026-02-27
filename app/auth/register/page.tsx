"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();

  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function slugify(val: string) {
    return val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationName,
        organizationSlug,
        vertical: "ELEVATOR",
        name: name || undefined,
        email,
        password,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data?.error ?? "Kayıt başarısız. Lütfen tekrar deneyin.");
      return;
    }

    router.push("/app/dashboard");
    router.refresh();
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0f1e",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      <div style={{ width: "100%", maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "white", letterSpacing: -1 }}>
              servisim<span style={{ color: "#3b82f6" }}>.</span>
            </div>
          </Link>
          <div style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>
            Asansör servis yönetim platformu
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: 36,
        }}>
          <h1 style={{ color: "white", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
            Hesap Oluşturun
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>
            14 gün ücretsiz, kredi kartı gerekmez.
          </p>

          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Firma Adı" required>
              <input
                style={inputStyle}
                value={organizationName}
                onChange={(e) => {
                  setOrganizationName(e.target.value);
                  if (!organizationSlug) setOrganizationSlug(slugify(e.target.value));
                }}
                placeholder="Örnek Asansör Servisi"
                required
              />
            </Field>

            <Field label="Firma Kısa Adı (URL)" hint="Sadece a-z, 0-9 ve - karakterleri" required>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  color: "#475569", fontSize: 13, pointerEvents: "none",
                }}>servisim.app/</span>
                <input
                  style={{ ...inputStyle, paddingLeft: 110 }}
                  value={organizationSlug}
                  onChange={(e) => setOrganizationSlug(slugify(e.target.value))}
                  placeholder="ornek-servis"
                  required
                />
              </div>
            </Field>

            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />

            <Field label="Ad Soyad">
              <input
                style={inputStyle}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ali Yılmaz"
              />
            </Field>

            <Field label="E-posta Adresi" required>
              <input
                style={inputStyle}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="ali@firmaniz.com"
                required
              />
            </Field>

            <Field label="Şifre" required>
              <input
                style={inputStyle}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="En az 8 karakter"
                minLength={8}
                required
              />
            </Field>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 10, padding: "12px 16px",
                color: "#f87171", fontSize: 14,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "#1e3a8a" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "white", border: "none", borderRadius: 10,
                padding: "14px", fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginTop: 4,
                boxShadow: "0 4px 20px rgba(37,99,235,0.3)",
              }}
            >
              {loading ? "Oluşturuluyor..." : "Hesap Oluştur →"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, color: "#475569", fontSize: 14 }}>
          Zaten hesabınız var mı?{" "}
          <Link href="/auth/login" style={{ color: "#60a5fa", fontWeight: 700, textDecoration: "none" }}>
            Giriş Yapın
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, required, children }: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{ display: "block", color: "#94a3b8", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#3b82f6", marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  padding: "11px 14px",
  color: "white",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};
