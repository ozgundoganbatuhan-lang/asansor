"use client";
import Link from "next/link";

export function AuthBrand({ light = false }: { light?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: light ? "rgba(255,255,255,0.12)" : "linear-gradient(135deg,#2563eb,#1d4ed8)",
        border: light ? "1px solid rgba(255,255,255,0.18)" : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: light ? "none" : "0 3px 10px rgba(37,99,235,0.28)",
      }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: light ? "#fff" : "#111827", letterSpacing: "-0.03em", lineHeight: 1 }}>Servisim</div>
        <div style={{ fontSize: 9, color: light ? "rgba(255,255,255,0.35)" : "#9ca3af", marginTop: 2, fontWeight: 500 }}>Asansör Operasyon</div>
      </div>
    </div>
  );
}

export function AuthLeft({ variant }: { variant: "login" | "register" }) {
  const features = variant === "login"
    ? ["İş emri oluştur ve ata", "Teknisyen mobil akışı", "QR servis şeffaflığı", "Periyodik bakım takvimi", "Sözleşme & tahsilat takibi"]
    : ["Sınırsız bakım ve iş emri kaydı", "Teknisyen mobil uygulaması", "QR etiket ve servis geçmişi", "Sözleşme & fatura yönetimi", "Rol bazlı ekip erişimi"];

  return (
    <div
      className="auth-left"
      style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(150deg,#0f172a 0%,#1e3a8a 55%,#2563eb 100%)",
        flexDirection: "column",
      }}
    >
      {/* Glow effects */}
      <div style={{ position: "absolute", top: -100, right: -80, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.18) 0%,transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -60, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(14,165,233,0.14) 0%,transparent 65%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", padding: "36px 40px" }}>
        <AuthBrand light />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 48 }}>
          {variant === "register" && (
            <div style={{
              display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)",
              color: "#bfdbfe", borderRadius: 999, padding: "4px 13px",
              fontSize: 11, fontWeight: 700, marginBottom: 22, letterSpacing: "0.04em",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#60a5fa", display: "inline-block" }} />
              14 gün ücretsiz · Kredi kartı gerekmez
            </div>
          )}

          <h1 style={{ fontSize: 34, fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.04em", margin: "0 0 14px" }}>
            {variant === "login"
              ? <><span>Asansör servisini</span><br /><span style={{ color: "#93c5fd" }}>profesyonelleştirin.</span></>
              : <><span>Dakikalar içinde</span><br /><span style={{ color: "#93c5fd" }}>hazır olun.</span></>}
          </h1>

          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.48)", lineHeight: 1.75, margin: "0 0 36px", maxWidth: 280 }}>
            {variant === "login"
              ? "Bakım planları, iş emirleri, QR geçmişi ve faturalama — tek sistemde."
              : "Kurulum yok. Kredi kartı gerekmez. İstediğiniz zaman iptal edin."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {features.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.72)", fontSize: 13, fontWeight: 500 }}>
                <div style={{
                  width: 17, height: 17, borderRadius: 4, flexShrink: 0,
                  background: "rgba(96,165,250,0.2)", border: "1px solid rgba(96,165,250,0.32)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div style={{ paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.18)", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", fontWeight: 500 }}>Sistem aktif · %99.9 uptime</span>
        </div>
      </div>
    </div>
  );
}

export const AUTH_CSS = `
  @keyframes authUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
  @keyframes authErr { 0%,100%{transform:translateX(0)} 25%,75%{transform:translateX(-3px)} 50%{transform:translateX(3px)} }
  @keyframes spin    { to { transform: rotate(360deg); } }

  .auth-card { animation: authUp .38s cubic-bezier(.16,1,.3,1) both; }
  .auth-err  { animation: authErr .28s ease; }
  .spin      { animation: spin .65s linear infinite; display: inline-block; }

  .auth-inp {
    width: 100%; height: 42px; padding: 0 13px;
    background: #fff; border: 1.5px solid #e5e7eb;
    border-radius: 8px; font-size: 14px; color: #111827;
    font-family: inherit; box-sizing: border-box;
    transition: border-color .15s, box-shadow .15s; outline: none;
  }
  .auth-inp::placeholder { color: #9ca3af; }
  .auth-inp:hover  { border-color: #d1d5db; }
  .auth-inp:focus  { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.10); }

  .auth-btn {
    width: 100%; height: 42px;
    background: linear-gradient(135deg,#2563eb,#1d4ed8);
    color: #fff; border: none; border-radius: 8px;
    font-size: 14px; font-weight: 700; font-family: inherit;
    cursor: pointer; letter-spacing: -.01em;
    box-shadow: 0 3px 10px rgba(37,99,235,0.25);
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: transform .12s, box-shadow .15s, opacity .15s;
  }
  .auth-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 18px rgba(37,99,235,0.35); }
  .auth-btn:disabled { opacity: .58; cursor: not-allowed; }
`;
