"use client";
import type React from "react";
import Link from "next/link";

export function AuthBrand({ light = false }: { light?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: light ? "rgba(255,255,255,0.15)" : "linear-gradient(135deg,#2563eb,#1d4ed8)",
        border: light ? "1px solid rgba(255,255,255,0.2)" : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: light ? "none" : "0 4px 12px rgba(37,99,235,0.3)", flexShrink: 0,
      }}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={light ? "#fff" : "#fff"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: light ? "#fff" : "#111827", letterSpacing: "-0.03em", lineHeight: 1 }}>Servisim</div>
        <div style={{ fontSize: 10, color: light ? "rgba(255,255,255,0.4)" : "#9ca3af", marginTop: 2, fontWeight: 500 }}>Asansör Operasyon</div>
      </div>
    </div>
  );
}

export function AuthLeft({ variant }: { variant: "login" | "register" }) {
  return (
    <div className="auth-panel-left">
      {/* Glow effects */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.2) 0%,transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -40, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(14,165,233,0.15) 0%,transparent 65%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>
        <AuthBrand light />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 48 }}>
          {variant === "register" && (
            <div style={{
              display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#bfdbfe", borderRadius: 999, padding: "5px 14px",
              fontSize: 11, fontWeight: 700, marginBottom: 24, letterSpacing: "0.04em",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#60a5fa" }} />
              14 gün ücretsiz · Kredi kartı gerekmez
            </div>
          )}

          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.04em", margin: "0 0 16px" }}>
            {variant === "login"
              ? <><span>Asansör servisini</span><br /><span style={{ color: "#93c5fd" }}>profesyonelleştirin.</span></>
              : <><span>Dakikalar içinde</span><br /><span style={{ color: "#93c5fd" }}>hazır olun.</span></>}
          </h1>

          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.75, margin: "0 0 40px", maxWidth: 280 }}>
            {variant === "login"
              ? "Bakım planları, iş emirleri, sözleşmeler ve QR servis geçmişi — tek sistemde."
              : "Kredi kartı gerekmez. İstediğiniz zaman iptal edin. Türkçe destek."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(variant === "login"
              ? ["İş emri oluştur ve ata", "Teknisyen mobil akışı", "QR servis şeffaflığı", "Periyodik bakım takvimi"]
              : ["Sınırsız bakım ve iş emri kaydı", "Teknisyen mobil uygulaması", "QR etiket ve servis geçmişi", "Sözleşme ve fatura yönetimi", "Rol bazlı ekip erişimi"]
            ).map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 500 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: "rgba(96,165,250,0.2)", border: "1px solid rgba(96,165,250,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div style={{ paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.2)", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>Sistem aktif · %99.9 uptime</span>
        </div>
      </div>
    </div>
  );
}

export const AUTH_CSS = `
  @keyframes authSpin { to { transform: rotate(360deg); } }
  @keyframes authUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
  @keyframes authErr { 0%,100%{transform:translateX(0)} 25%,75%{transform:translateX(-3px)} 50%{transform:translateX(3px)} }
  .spin { animation: authSpin .65s linear infinite; display: inline-block; }
  .auth-card { animation: authUp .4s cubic-bezier(.16,1,.3,1) both; }
  .auth-err  { animation: authErr .3s ease; }
`;
