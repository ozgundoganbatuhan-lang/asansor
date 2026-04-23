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

/* Asansör şaft logosu — tasarımdan */
function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="9" fill="url(#slg)" />
      <defs>
        <linearGradient id="slg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f1a2e" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <path d="M23 13C23 10 21 8 18 8C15 8 13 10 13 13C13 16.5 23 17 23 21C23 24 21 28 18 28C15 28 13 26 13 23"
        stroke="white" strokeWidth="3.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const NAV_GROUPS = [
  {
    label: "Ana Menü",
    items: [
      { href: "/app/dashboard",         label: "Dashboard",        icon: "M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-10h8V3h-8z", badge: null },
      { href: "/app/work-orders",       label: "İş Emirleri",      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4", badge: "7" },
      { href: "/app/customers",         label: "Müşteriler",       icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z", badge: null },
      { href: "/app/assets",            label: "Asansörler",       icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10", badge: null },
    ],
  },
  {
    label: "Planlama",
    items: [
      { href: "/app/maintenance-plans", label: "Bakım Takvimi",    icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z", badge: null },
      { href: "/app/inspections",       label: "Periyodik Kontrol",icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4", badge: null },
      { href: "/app/reports",           label: "Raporlar",         icon: "M18 20V10M12 20V4M6 20v-6", badge: null },
    ],
  },
  {
    label: "Saha",
    items: [
      { href: "/app/technicians",       label: "Teknisyenler",     icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z", badge: null },
      { href: "/app/calendar",          label: "Takvim",           icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z", badge: null },
    ],
  },
  {
    label: "Finans",
    items: [
      { href: "/app/contracts",         label: "Sözleşmeler",      icon: "M8 3h8l5 5v11a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2zm8 0v5h5", badge: null },
      { href: "/app/invoices",          label: "Faturalar",        icon: "M12 2H2v20l4-4h14V8L12 2zm0 0v6h6", badge: null },
      { href: "/app/stock",             label: "Stok",             icon: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16", badge: null },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/app/settings", label: "Ayarlar", icon: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z", badge: null },
    ],
  },
];

const ALL_NAV    = NAV_GROUPS.flatMap(g => g.items);
const MOBILE_NAV = ALL_NAV.slice(0, 4);
const SIDEBAR_W  = 228;

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

  const active    = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const pageTitle = ALL_NAV.find(n => active(n.href))?.label ?? "Servisim";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  const mobile = mounted && isMobile;

  const sidebarStyle: CSSProperties = {
    position: "fixed", top: 0, left: 0,
    width: SIDEBAR_W, height: "100vh",
    background: "#0f172a",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    display: "flex", flexDirection: "column",
    zIndex: 40, overflowY: "auto", overflowX: "hidden",
    ...(mobile ? {
      transform: open ? "translateX(0)" : "translateX(-100%)",
      transition: "transform 0.22s cubic-bezier(.4,0,.2,1)",
      boxShadow: open ? "0 0 40px rgba(0,0,0,0.35)" : "none",
    } : {}),
  };

  const bodyStyle: CSSProperties = {
    marginLeft: mobile ? 0 : SIDEBAR_W,
    minHeight: "100vh",
    background: "#f4f4f7",
    paddingBottom: mobile ? 62 : 0,
  };

  return (
    <div className="app-shell" style={{ minHeight: "100vh", background: "#f4f4f7" }}>

      {/* ── SIDEBAR ── */}
      <aside style={sidebarStyle}>
        {/* Logo */}
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMark size={32} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>
              Servi<span style={{ color: "#60a5fa" }}>sim</span>
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.30)", marginTop: 2, fontWeight: 500 }}>Asansör Operasyon</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "10px 10px", flex: 1, overflowY: "auto" }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 2 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", padding: "10px 10px 4px" }}>
                {group.label}
              </div>
              {group.items.map(item => {
                const isActive = active(item.href);
                return (
                  <Link key={item.href} href={item.href} style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "8px 10px", borderRadius: 9, marginBottom: 1,
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#fff" : "rgba(255,255,255,0.50)",
                    background: isActive ? "rgba(37,99,235,0.18)" : "transparent",
                    textDecoration: "none", transition: "all 0.12s",
                    borderLeft: `2.5px solid ${isActive ? "#3b82f6" : "transparent"}`,
                  }}
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.82)"; }}}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.50)"; }}}
                  >
                    <span style={{ width: 15, height: 15, flexShrink: 0, color: isActive ? "#60a5fa" : "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", opacity: isActive ? 1 : 0.7 }}>
                      <I d={item.icon} />
                    </span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(239,68,68,0.18)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)", padding: "1px 7px", borderRadius: 999 }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 9, cursor: "pointer", transition: "all 0.12s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              AK
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Hesabım</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.30)", marginTop: 1 }}>Yönetici</div>
            </div>
            <button onClick={logout} title="Çıkış" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.30)", display: "flex", alignItems: "center", transition: "color 0.12s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.70)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.30)"; }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── OVERLAY (mobile) ── */}
      {mobile && open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.52)", zIndex: 39, backdropFilter: "blur(3px)" }} />
      )}

      {/* ── APP BODY ── */}
      <div style={bodyStyle}>
        {/* Topbar */}
        <header style={{
          position: "sticky", top: 0, zIndex: 30,
          background: "rgba(244,244,247,0.95)",
          borderBottom: "1px solid #e4e4e7",
          backdropFilter: "blur(16px)",
          padding: mobile ? "0 16px" : "0 28px",
          height: 54,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {mobile && (
              <button onClick={() => setOpen(v => !v)} aria-label="Menüyü aç" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, border: "1.5px solid rgba(0,0,0,0.08)", background: "#fff", cursor: "pointer", color: "#0a0a0f", flexShrink: 0 }}>
                <I d="M4 6h16M4 12h16M4 18h16" size={16} />
              </button>
            )}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#a1a1aa", marginBottom: 1 }}>Servisim</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0f", letterSpacing: "-0.02em" }}>{pageTitle}</div>
            </div>
            <RoleBadge />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Notification bell */}
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#fff", border: "1px solid #e4e4e7", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", transition: "all 0.12s" }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <div style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: "#ef4444", border: "2px solid #f4f4f7" }} />
            </div>
            {/* New work order */}
            <Link href="/app/work-orders" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff",
              fontSize: 12.5, fontWeight: 700,
              padding: "8px 16px", borderRadius: 10,
              textDecoration: "none",
              boxShadow: "0 2px 10px rgba(37,99,235,0.28)",
              transition: "all 0.14s", whiteSpace: "nowrap",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(37,99,235,0.40)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(37,99,235,0.28)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
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
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 62, background: "#fff", borderTop: "1px solid rgba(0,0,0,0.07)", zIndex: 40, padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
          {MOBILE_NAV.map(item => (
            <Link key={item.href} href={item.href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "6px 4px", borderRadius: 8, color: active(item.href) ? "#2563eb" : "#9ca3af", fontSize: 9, fontWeight: 600, textDecoration: "none", background: active(item.href) ? "#eff6ff" : "transparent" }}>
              <I d={item.icon} size={18} />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          ))}
          <button onClick={() => setOpen(true)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, fontSize: 9, fontWeight: 600, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: "6px 4px" }}>
            <I d="M4 6h16M4 12h16M4 18h16" size={18} />
            <span>Menü</span>
          </button>
        </nav>
      )}

      <TrialCountdown />
    </div>
  );
}
