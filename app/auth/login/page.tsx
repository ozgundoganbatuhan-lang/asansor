"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLeft, AuthBrand, AUTH_CSS } from "@/components/AuthLayout";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res  = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (!res.ok) { setError(data?.error ?? "Giriş başarısız"); return; }
      if (data.emailVerified === false) { router.push("/auth/check-email"); return; }
      router.push("/app/dashboard"); router.refresh();
    } catch {
      setLoading(false);
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      <style>{AUTH_CSS}</style>

      {!isMobile && <AuthLeft variant="login" />}

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 32px", background: "#f8fafc", overflowY: "auto",
      }}>
        <div className="auth-card" style={{ width: "100%", maxWidth: 400 }}>
          {/* Mobile brand */}
          {isMobile && (
            <div style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}>
              <AuthBrand />
            </div>
          )}

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.04em", margin: "0 0 6px", lineHeight: 1.1 }}>
              Giriş Yapın
            </h1>
            <p style={{ fontSize: 13.5, color: "#64748b", margin: 0 }}>
              Hesabınıza erişmek için bilgilerinizi girin.
            </p>
          </div>

          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="E-posta Adresi">
              <input
                className="auth-inp" type="email" value={email} required autoFocus
                onChange={e => setEmail(e.target.value)} placeholder="ali@firmaniz.com"
              />
            </Field>

            <Field label="Şifre">
              <div style={{ position: "relative" }}>
                <input
                  className="auth-inp" type={showPass ? "text" : "password"} value={password} required
                  style={{ paddingRight: 44 }}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPass(p => !p)} style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, display: "flex",
                }}>
                  {showPass
                    ? <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" /></svg>
                    : <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  }
                </button>
              </div>
            </Field>

            {error && (
              <div className="auth-err" style={{
                display: "flex", alignItems: "flex-start", gap: 9,
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 10, padding: "11px 14px",
                color: "#dc2626", fontSize: 13,
              }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="auth-btn" style={{ marginTop: 4 }}>
              {loading
                ? <><span className="spin" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%" }} />Giriş yapılıyor…</>
                : "Giriş Yap →"
              }
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 22, color: "#64748b", fontSize: 13.5 }}>
            Hesabınız yok mu?{" "}
            <Link href="/auth/register" style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>
              Ücretsiz başlayın →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#64748b", letterSpacing: "0.04em", marginBottom: 7 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
