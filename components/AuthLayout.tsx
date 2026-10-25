"use client";

export function AuthBrand({ light = false }: { light?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center",
        background: "linear-gradient(140deg,#2b3246,#151924)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.1)" }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="2.5" width="14" height="19" rx="2.5" stroke="#F5F2EC" strokeWidth="1.8" />
          <path d="M9 8.5l3-3 3 3M9 15.5l3 3 3-3" stroke="#F0B43C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div>
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.03em", color: light ? "#F5F2EC" : "#12151d", lineHeight: 1 }}>Servisim</div>
        <div style={{ fontSize: 10, color: light ? "rgba(245,242,236,0.5)" : "#8a8272", marginTop: 3, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Asansör servis
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
      background: "radial-gradient(700px 420px at 90% 0%, rgba(240,180,60,.16), transparent 60%), #12151d",
      flexDirection: "column",
    }}>
      <div className="auth-shaft" aria-hidden><i /></div>

      <div style={{ position: "relative", zIndex: 1, height: "100%",
        display: "flex", flexDirection: "column", padding: "36px 44px" }}>
        <AuthBrand light />

        <div style={{ flex: 1, display: "flex", flexDirection: "column",
          justifyContent: "center", paddingTop: 56 }}>
          {variant === "register" && (
            <div style={{
              display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 7,
              background: "rgba(240,180,60,0.12)", border: "1px solid rgba(240,180,60,0.3)",
              color: "#F0B43C", borderRadius: 999, padding: "5px 14px",
              fontSize: 11, fontWeight: 700, marginBottom: 26, letterSpacing: "0.04em",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#F0B43C",
                display: "inline-block", boxShadow: "none" }} />
              7 gün ücretsiz · Kredi kartı gerekmez
            </div>
          )}

          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1.08,
            letterSpacing: "-0.05em", margin: "0 0 16px" }}>
            {variant === "login"
              ? <><span>Asansör servisini</span><br />
                  <span style={{ color: "#F0B43C" }}>profesyonelleştirin.</span></>
              : <><span>Dakikalar içinde</span><br />
                  <span style={{ color: "#F0B43C" }}>hazır olun.</span></>}
          </h1>

          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.44)", lineHeight: 1.8,
            margin: "0 0 40px", maxWidth: 300 }}>
            {variant === "login"
              ? "Bakım planları, iş emirleri, QR geçmişi ve faturalama tek sistemde."
              : "Kredi kartı gerekmez. 7 gün tüm özellikler açık; deneme bitince verileriniz silinmez."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12,
                color: "rgba(255,255,255,0.7)", fontSize: 13.5, fontWeight: 500 }}>
                <div style={{
                  width: 19, height: 19, borderRadius: 5, flexShrink: 0,
                  background: "rgba(240,180,60,0.14)", border: "1px solid rgba(240,180,60,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width={9} height={9} viewBox="0 0 24 24" fill="none"
                    stroke="#F0B43C" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
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
          <span style={{ fontSize: 12, color: "rgba(245,242,236,0.5)", fontWeight: 500 }}>Sorunuz mu var? 0545 169 63 88 · asansor@teknix.tech</span>
        </div>
      </div>
    </div>
  );
}

export const AUTH_CSS = `
  
  @keyframes authUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
  @keyframes authErr { 0%,100%{transform:translateX(0)} 25%,75%{transform:translateX(-4px)} 50%{transform:translateX(4px)} }
  @keyframes authSpin { to { transform: rotate(360deg); } }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }

  .auth-card { animation: authUp .36s cubic-bezier(.16,1,.3,1) both; font-family: 'DM Sans', system-ui, sans-serif; }
  .auth-err  { animation: authErr .3s ease; }
  .auth-spin { animation: authSpin .65s linear infinite; display: inline-block; }
  .auth-left { display: flex; }
  .auth-shaft { position:absolute; right:56px; top:0; bottom:0; width:120px; border-left:1px solid rgba(255,255,255,.06); border-right:1px solid rgba(255,255,255,.06); pointer-events:none; }
  .auth-shaft::before,.auth-shaft::after { content:""; position:absolute; top:0; bottom:0; width:2px; background:repeating-linear-gradient(180deg,rgba(255,255,255,.12) 0 12px,transparent 12px 18px); }
  .auth-shaft::before { left:16px; } .auth-shaft::after { right:16px; }
  .auth-shaft i { position:absolute; left:26px; right:26px; height:84px; border-radius:8px; background:linear-gradient(180deg,rgba(243,240,234,.16),rgba(243,240,234,.06)); box-shadow:inset 0 0 0 1px rgba(255,255,255,.1); animation: authRide 14s cubic-bezier(.22,1,.36,1) infinite; }
  @keyframes authRide { 0%,10%{top:70%} 30%,40%{top:12%} 60%,70%{top:44%} 100%{top:70%} }
  @media (prefers-reduced-motion: reduce) { .auth-shaft i { animation:none; top:44%; } }
  @media (max-width: 1023px) { .auth-left { display: none !important; } }

  .auth-inp {
    width: 100%;
    height: 44px;
    padding: 0 14px;
    background: #fff;
    border: 1.5px solid #D6D0C4;
    border-radius: 11px;
    font-size: 14px;
    color: #12151d;
    font-family: 'DM Sans', system-ui, sans-serif;
    box-sizing: border-box;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  .auth-inp::placeholder { color: #9a927f; }
  .auth-inp:hover { border-color: #B8B0A0; }
  .auth-inp:focus {
    border-color: #12151d !important;
    box-shadow: 0 0 0 3px rgba(240,180,60,0.28) !important;
  }

  .auth-btn {
    width: 100%;
    height: 44px;
    background: #12151d;
    color: #fff;
    border: none;
    border-radius: 11px;
    font-size: 14px;
    font-weight: 700;
    font-family: 'DM Sans', system-ui, sans-serif;
    cursor: pointer;
    box-shadow: 0 6px 16px -8px rgba(18,21,29,.6);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all .15s;
  }
  .auth-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px -10px rgba(18,21,29,.7);
  }
  .auth-btn:disabled { opacity: .55; cursor: not-allowed; }

  .auth-select {
    width: 100%;
    height: 44px;
    padding: 0 14px;
    background: #fff;
    border: 1.5px solid #D6D0C4;
    border-radius: 11px;
    font-size: 14px;
    color: #12151d;
    font-family: 'DM Sans', system-ui, sans-serif;
    box-sizing: border-box;
    outline: none;
    cursor: pointer;
    appearance: none;
    transition: border-color .15s;
  }
  .auth-select:focus {
    border-color: #12151d !important;
    box-shadow: 0 0 0 3px rgba(240,180,60,0.28) !important;
  }
`;
