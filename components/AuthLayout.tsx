"use client";
import Link from "next/link";

export function AuthBrand({ light = false }: { light?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <svg width={36} height={36} viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id="alg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={light ? "rgba(255,255,255,0.25)" : "#1e3a8a"}/>
            <stop offset="100%" stopColor={light ? "rgba(255,255,255,0.1)" : "#1d4ed8"}/>
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={light ? "rgba(255,255,255,0.12)" : "url(#alg)"}/>
        <path d="M26 15C26 11.5 23.5 9 20 9C16.5 9 14 11.5 14 15C14 19.5 26 19 26 24C26 27.5 23.5 31 20 31C16.5 31 14 28.5 14 25"
          stroke="white" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
      </svg>
      <div>
        <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-0.06em", color: light ? "#fff" : "#0f172a", lineHeight: 1 }}>
          Servi<span style={{ color: light ? "#93c5fd" : "#2563eb" }}>sim</span>
        </div>
        <div style={{ fontSize: 9, color: light ? "rgba(255,255,255,0.32)" : "#94a3b8", marginTop: 3, fontWeight: 600, letterSpacing: "0.08em" }}>
          ASANSÖR OPERASYON
        </div>
      </div>
    </div>
  );
}

export function AuthLeft({ variant }: { variant: "login" | "register" }) {
  const features = variant === "login"
    ? ["İş emri oluştur ve teknisyene ata", "Teknisyen mobil saha akışı", "QR kod ile servis şeffaflığı", "Periyodik bakım planı & takvim", "Sözleşme & tahsilat takibi"]
    : ["Sınırsız bakım ve iş emri kaydı", "Teknisyen mobil uygulaması", "QR etiket ve servis geçmişi", "Sözleşme & fatura yönetimi", "Rol bazlı ekip erişimi"];

  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: "linear-gradient(155deg, #0c1322 0%, #112240 45%, #1a3a82 100%)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Glows */}
      <div style={{ position: "absolute", top: -120, right: -100, width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -100, left: -80, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.16) 0%, transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "40%", left: "30%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", padding: "36px 40px" }}>
        <AuthBrand light />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 52 }}>
          {variant === "register" && (
            <div style={{
              display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 7,
              background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)",
              color: "#93c5fd", borderRadius: 999, padding: "5px 14px",
              fontSize: 11, fontWeight: 700, marginBottom: 24, letterSpacing: "0.04em",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#60a5fa", display: "inline-block", boxShadow: "0 0 0 3px rgba(96,165,250,0.2)" }} />
              14 gün ücretsiz · Kredi kartı gerekmez
            </div>
          )}

          <h1 style={{ fontSize: 34, fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.05em", margin: "0 0 14px" }}>
            {variant === "login"
              ? <><span>Asansör servisini</span><br /><span style={{ color: "#93c5fd" }}>profesyonelleştirin.</span></>
              : <><span>Dakikalar içinde</span><br /><span style={{ color: "#93c5fd" }}>hazır olun.</span></>}
          </h1>

          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, margin: "0 0 38px", maxWidth: 290 }}>
            {variant === "login"
              ? "Bakım planları, iş emirleri, QR geçmişi ve faturalama — tek sistemde."
              : "Kurulum yok. Kredi kartı gerekmez. İstediğiniz zaman iptal edin."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, color: "rgba(255,255,255,0.72)", fontSize: 13.5, fontWeight: 500 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  background: "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.28)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div style={{ paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.2)", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", fontWeight: 500 }}>Sistem aktif · %99.9 uptime</span>
        </div>
      </div>
    </div>
  );
}

export const AUTH_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
  @keyframes authUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
  @keyframes authErr { 0%,100%{transform:translateX(0)} 25%,75%{transform:translateX(-3px)} 50%{transform:translateX(3px)} }
  @keyframes spin    { to { transform: rotate(360deg); } }

  .auth-card { animation: authUp .38s cubic-bezier(.16,1,.3,1) both; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
  .auth-err  { animation: authErr .28s ease; }
  .spin      { animation: spin .65s linear infinite; display: inline-block; }
  .auth-left { display: flex; }

  .auth-inp {
    width: 100%; height: 44px; padding: 0 14px;
    background: #fff; border: 1.5px solid #e2e8f0;
    border-radius: 10px; font-size: 14px; color: #0f172a;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    box-sizing: border-box; transition: border-color .15s, box-shadow .15s; outline: none;
  }
  .auth-inp::placeholder { color: #94a3b8; }
  .auth-inp:hover  { border-color: #cbd5e1; }
  .auth-inp:focus  { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.10); }

  .auth-btn {
    width: 100%; height: 44px;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #fff; border: none; border-radius: 10px;
    font-size: 14px; font-weight: 700;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    cursor: pointer; letter-spacing: -.01em;
    box-shadow: 0 4px 14px rgba(37,99,235,0.28);
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: transform .12s, box-shadow .15s, opacity .15s;
  }
  .auth-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.38); }
  .auth-btn:disabled { opacity: .55; cursor: not-allowed; }

  .auth-select {
    width: 100%; height: 44px; padding: 0 14px;
    background: #fff; border: 1.5px solid #e2e8f0;
    border-radius: 10px; font-size: 14px; color: #0f172a;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    box-sizing: border-box; outline: none; cursor: pointer;
    transition: border-color .15s;
    -webkit-appearance: none; appearance: none;
  }
  .auth-select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.10); }
`;
