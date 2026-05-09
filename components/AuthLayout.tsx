"use client";

export function AuthBrand({ light = false }: { light?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <svg width={38} height={38} viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id="alg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={light ? "rgba(255,255,255,0.3)" : "#1e3a8a"} />
            <stop offset="100%" stopColor={light ? "rgba(255,255,255,0.1)" : "#0F121A"} />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="12" fill={light ? "rgba(255,255,255,0.1)" : "#0d1526"} />
        <rect width="40" height="40" rx="12" fill="url(#alg)" opacity="0.7" />
        <path d="M26 15C26 11.5 23.5 9 20 9C16.5 9 14 11.5 14 15C14 19.5 26 19 26 24C26 27.5 23.5 31 20 31C16.5 31 14 28.5 14 25"
          stroke="white" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      </svg>
      <div>
        <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.06em",
          color: light ? "#fff" : "#1A1510", lineHeight: 1 }}>
          Servi<span style={{ color: light ? "#93c5fd" : "#1B1F2B" }}>sim</span>
        </div>
        <div style={{ fontSize: 9, color: light ? "rgba(255,255,255,0.3)" : "#9C9080",
          marginTop: 3, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Asansör Operasyon
        </div>
      </div>
    </div>
  );
}

export function AuthLeft({ variant }: { variant: "login" | "register" }) {
  const features = variant === "login"
    ? ["İş emri oluştur ve teknisyene ata", "Teknisyen mobil saha akışı", "QR kod ile servis şeffaflığı", "Periyodik bakım planı ve takvimi", "Sözleşme ve tahsilat takibi"]
    : ["Sınırsız bakım ve iş emri kaydı", "Teknisyen mobil uygulaması", "QR etiket ve servis geçmişi", "Sözleşme ve fatura yönetimi", "Rol bazlı ekip erişimi"];

  return (
    <div className="auth-left" style={{
      position: "relative", overflow: "hidden",
      background: "linear-gradient(155deg, #0d1526 0%, #0f2254 50%, #1a3a8a 100%)",
      flexDirection: "column",
    }}>
      {/* Glow orbs */}
      <div style={{ position: "absolute", top: -100, right: -80, width: 500, height: 500,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.22), transparent 65%)",
        pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -60, width: 400, height: 400,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.18), transparent 65%)",
        pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "35%", left: "20%", width: 300, height: 300,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,233,0.08), transparent 65%)",
        pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, height: "100%",
        display: "flex", flexDirection: "column", padding: "36px 44px" }}>
        <AuthBrand light />

        <div style={{ flex: 1, display: "flex", flexDirection: "column",
          justifyContent: "center", paddingTop: 56 }}>
          {variant === "register" && (
            <div style={{
              display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 7,
              background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.25)",
              color: "#93c5fd", borderRadius: 999, padding: "5px 14px",
              fontSize: 11, fontWeight: 700, marginBottom: 26, letterSpacing: "0.04em",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#60a5fa",
                display: "inline-block", boxShadow: "0 0 0 3px rgba(96,165,250,0.22)" }} />
              14 gün ücretsiz · Kredi kartı gerekmez
            </div>
          )}

          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1.08,
            letterSpacing: "-0.05em", margin: "0 0 16px" }}>
            {variant === "login"
              ? <><span>Asansör servisini</span><br />
                  <span style={{ color: "#93c5fd" }}>profesyonelleştirin.</span></>
              : <><span>Dakikalar içinde</span><br />
                  <span style={{ color: "#93c5fd" }}>hazır olun.</span></>}
          </h1>

          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.44)", lineHeight: 1.8,
            margin: "0 0 40px", maxWidth: 300 }}>
            {variant === "login"
              ? "Bakım planları, iş emirleri, QR geçmişi ve faturalama tek sistemde."
              : "Kurulum yok. Kredi kartı gerekmez. İstediğiniz zaman iptal edin."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12,
                color: "rgba(255,255,255,0.7)", fontSize: 13.5, fontWeight: 500 }}>
                <div style={{
                  width: 19, height: 19, borderRadius: 5, flexShrink: 0,
                  background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width={9} height={9} viewBox="0 0 24 24" fill="none"
                    stroke="#93c5fd" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div style={{ paddingTop: 22, borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2E7D4F",
            boxShadow: "0 0 0 3px rgba(34,197,94,0.22)", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
            Sistem aktif · %99.9 uptime
          </span>
        </div>
      </div>
    </div>
  );
}

export const AUTH_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
  @keyframes authUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
  @keyframes authErr { 0%,100%{transform:translateX(0)} 25%,75%{transform:translateX(-4px)} 50%{transform:translateX(4px)} }
  @keyframes authSpin { to { transform: rotate(360deg); } }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }

  .auth-card { animation: authUp .36s cubic-bezier(.16,1,.3,1) both; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
  .auth-err  { animation: authErr .3s ease; }
  .auth-spin { animation: authSpin .65s linear infinite; display: inline-block; }
  .auth-left { display: flex; }
  @media (max-width: 1023px) { .auth-left { display: none !important; } }

  .auth-inp {
    width: 100%;
    height: 44px;
    padding: 0 14px;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 11px;
    font-size: 14px;
    color: #0f172a;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    box-sizing: border-box;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  .auth-inp::placeholder { color: #94a3b8; }
  .auth-inp:hover { border-color: #cbd5e1; }
  .auth-inp:focus {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12) !important;
  }

  .auth-btn {
    width: 100%;
    height: 44px;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #fff;
    border: none;
    border-radius: 11px;
    font-size: 14px;
    font-weight: 700;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(37,99,235,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all .15s;
  }
  .auth-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 22px rgba(37,99,235,0.4);
  }
  .auth-btn:disabled { opacity: .55; cursor: not-allowed; }

  .auth-select {
    width: 100%;
    height: 44px;
    padding: 0 14px;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 11px;
    font-size: 14px;
    color: #0f172a;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    box-sizing: border-box;
    outline: none;
    cursor: pointer;
    appearance: none;
    transition: border-color .15s;
  }
  .auth-select:focus {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12) !important;
  }
`;
