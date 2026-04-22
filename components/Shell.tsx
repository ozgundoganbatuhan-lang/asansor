"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useEffect, CSSProperties } from "react";
import TrialCountdown from "./TrialCountdown";
import dynamic from "next/dynamic";
const RoleBadge = dynamic(() => import("./RoleBadge"), { ssr: false });

const I = ({ d, size = 15 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV_GROUPS = [
  {
    label: "Operasyon",
    items: [
      { href: "/app/dashboard",         label: "Kontrol Merkezi",  icon: "M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-10h8V3h-8z" },
      { href: "/app/work-orders",       label: "İş Emirleri",      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4" },
      { href: "/app/assets",            label: "Asansörler",       icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
      { href: "/app/customers",         label: "Müşteriler",       icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z" },
      { href: "/app/maintenance-plans", label: "Bakım Planları",   icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" },
      { href: "/app/contracts",         label: "Sözleşmeler",      icon: "M8 3h8l5 5v11a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2zm8 0v5h5" },
    ],
  },
  {
    label: "Finans & Ekip",
    items: [
      { href: "/app/invoices",    label: "Faturalar",    icon: "M12 2H2v20l4-4h14V8L12 2zm0 0v6h6" },
      { href: "/app/reports",     label: "Raporlar",     icon: "M18 20V10M12 20V4M6 20v-6" },
      { href: "/app/technicians", label: "Teknisyenler", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z" },
      { href: "/app/stock",       label: "Stok",         icon: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/app/settings", label: "Ayarlar", icon: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
    ],
  },
];

const ALL_NAV   = NAV_GROUPS.flatMap(g => g.items);
const MOBILE_NAV = ALL_NAV.slice(0, 4);
const SIDEBAR_W  = 232;

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open,     setOpen]     = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const pageTitle = ALL_NAV.find(n => active(n.href))?.label ?? "Servisim";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  /* ── Inline-style guarantees (override any CSS loading failures) ── */
  const mobile = mounted && isMobile;

  const sidebarStyle: CSSProperties = {
    position:     "fixed",
    top:          0,
    left:         0,
    width:        SIDEBAR_W,
    height:       "100vh",
    background:   "#0f172a",
    borderRight:  "1px solid rgba(255,255,255,0.05)",
    display:      "flex",
    flexDirection:"column",
    zIndex:       40,
    overflowY:    "auto",
    overflowX:    "hidden",
    ...(mobile
      ? {
          transform:  open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.22s cubic-bezier(.4,0,.2,1)",
          boxShadow:  open ? "0 0 40px rgba(0,0,0,0.35)" : "none",
        }
      : {}),
  };

  const bodyStyle: CSSProperties = {
    marginLeft:  mobile ? 0 : SIDEBAR_W,
    minHeight:   "100vh",
    background:  "#f9fafb",
    paddingBottom: mobile ? 62 : 0,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>

      {/* ── SIDEBAR ── */}
      <aside style={sidebarStyle}>
        {/* Logo */}
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <Link href="/app/dashboard" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(37,99,235,0.35)",
            }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>Servisim</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", marginTop: 2, fontWeight: 500 }}>Asansör Operasyon</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ padding: 8, flex: 1, overflowY: "auto" }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 2 }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.18)",
                padding: "10px 12px 4px",
              }}>
                {group.label}
              </div>
              {group.items.map(item => {
                const isActive = active(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex", alignItems: "center", gap: 9,
                      padding: "8px 10px", borderRadius: 8,
                      fontSize: 13, fontWeight: isActive ? 600 : 500,
                      color: isActive ? "#fff" : "rgba(255,255,255,0.52)",
                      background: isActive ? "rgba(37,99,235,0.22)" : "transparent",
                      textDecoration: "none", transition: "all 0.12s",
                      width: "100%",
                    }}
                  >
                    <span style={{
                      width: 15, height: 15, flexShrink: 0,
                      color: isActive ? "#60a5fa" : "rgba(255,255,255,0.35)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <I d={item.icon} />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer / logout */}
        <div style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <button
            onClick={logout}
            style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "8px 10px", borderRadius: 8,
              fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.35)",
              background: "none", border: "none", cursor: "pointer",
              width: "100%", textAlign: "left", transition: "all 0.12s",
            }}
          >
            <span style={{ width: 15, height: 15, display: "flex", alignItems: "center", flexShrink: 0 }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </span>
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* ── OVERLAY ── */}
      {mobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.52)",
            zIndex: 39, backdropFilter: "blur(3px)",
          }}
        />
      )}

      {/* ── APP BODY ── */}
      <div style={bodyStyle}>
        {/* Topbar */}
        <header style={{
          position: "sticky", top: 0, zIndex: 30,
          background: "rgba(249,250,251,0.95)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          backdropFilter: "blur(12px)",
          padding: mobile ? "0 16px" : "0 24px",
          height: 54,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {mobile && (
              <button
                onClick={() => setOpen(v => !v)}
                aria-label="Menüyü aç"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 34, height: 34, borderRadius: 8,
                  border: "1.5px solid rgba(0,0,0,0.08)", background: "#fff",
                  cursor: "pointer", color: "#111827", flexShrink: 0,
                }}
              >
                <I d="M4 6h16M4 12h16M4 18h16" size={16} />
              </button>
            )}
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
              {pageTitle}
            </div>
            <RoleBadge />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              href="/app/work-orders"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "#2563eb", color: "#fff",
                fontSize: 12, fontWeight: 700,
                padding: "7px 14px", borderRadius: 7,
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                whiteSpace: "nowrap",
              }}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Yeni İş Emri
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main style={{ padding: mobile ? 16 : 24 }}>
          {children}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      {mobile && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          height: 62, background: "#fff",
          borderTop: "1px solid rgba(0,0,0,0.07)", zIndex: 40,
          padding: "0 8px",
          display: "flex", alignItems: "center", justifyContent: "space-around",
        }}>
          {MOBILE_NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 3, padding: "6px 4px", borderRadius: 8,
                color: active(item.href) ? "#2563eb" : "#9ca3af",
                fontSize: 9, fontWeight: 600, textDecoration: "none",
                background: active(item.href) ? "#eff6ff" : "transparent",
              }}
            >
              <I d={item.icon} size={18} />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          ))}
          <button
            onClick={() => setOpen(true)}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 3, fontSize: 9, fontWeight: 600, color: "#9ca3af",
              background: "none", border: "none", cursor: "pointer", padding: "6px 4px",
            }}
          >
            <I d="M4 6h16M4 12h16M4 18h16" size={18} />
            <span>Menü</span>
          </button>
        </nav>
      )}

      <TrialCountdown />
    </div>
  );
}
