"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, orgSlug }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data?.error ?? "Giriş başarısız");
    router.push("/app/dashboard");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "white", letterSpacing: -1 }}>
              servisim<span style={{ color: "#3b82f6" }}>.</span>
            </div>
          </Link>
          <div style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>Asansör servis yönetim platformu</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 36 }}>
          <h1 style={{ color: "white", fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Giriş Yapın</h1>

          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", color: "#94a3b8", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Firma Kısa Adı <span style={{ color: "#3b82f6" }}>*</span>
              </label>
              <input style={inp} value={orgSlug} onChange={e => setOrgSlug(e.target.value)} placeholder="ornek-servis" required />
            </div>
            <div>
              <label style={{ display: "block", color: "#94a3b8", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                E-posta <span style={{ color: "#3b82f6" }}>*</span>
              </label>
              <input style={inp} value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="ali@firmaniz.com" required />
            </div>
            <div>
              <label style={{ display: "block", color: "#94a3b8", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Şifre <span style={{ color: "#3b82f6" }}>*</span>
              </label>
              <input style={inp} value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" required />
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", color: "#f87171", fontSize: 14 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              background: loading ? "#1e3a8a" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "white", border: "none", borderRadius: 10, padding: "14px",
              fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1, marginTop: 4,
              boxShadow: "0 4px 20px rgba(37,99,235,0.3)",
            }}>
              {loading ? "Giriş yapılıyor..." : "Giriş Yap →"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, color: "#475569", fontSize: 14 }}>
          Hesabınız yok mu?{" "}
          <Link href="/auth/register" style={{ color: "#60a5fa", fontWeight: 700, textDecoration: "none" }}>
            Ücretsiz Başlayın
          </Link>
        </div>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
  padding: "11px 14px", color: "white", fontSize: 14, outline: "none",
  boxSizing: "border-box",
};
