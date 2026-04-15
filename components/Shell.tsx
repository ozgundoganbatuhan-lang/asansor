"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
import TrialCountdown from "./TrialCountdown";
import dynamic from "next/dynamic";
const RoleBadge = dynamic(() => import("./RoleBadge"), { ssr: false });

const I = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV = [
  { href: "/app/dashboard",         label: "Kontrol Merkezi",  icon: "M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-10h8V3h-8z",        badge: null },
  { href: "/app/work-orders",       label: "İş Emirleri",      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4M9 5a2 2 0 012-2h2a2 2 0 012 2", badge: null },
  { href: "/app/assets",            label: "Asansörler",       icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10", badge: null },
  { href: "/app/customers",         label: "Müşteriler",       icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75", badge: null },
  { href: "/app/maintenance-plans", label: "Bakım Planları",   icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z", badge: null },
  { href: "/app/contracts",         label: "Sözleşmeler",      icon: "M8 3h8l5 5v11a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2zm8 0v5h5", badge: null },
  { href: "/app/invoices",          label: "Faturalar",        icon: "M12 2H2v20l4-4h14V8M7 9h5M7 13h3", badge: null },
  { href: "/app/reports",           label: "Raporlar",         icon: "M18 20V10M12 20V4M6 20v-6", badge: null },
  { href: "/app/technicians",       label: "Teknisyenler",     icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z", badge: null },
  { href: "/app/settings",          label: "Ayarlar",          icon: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z", badge: null },
];

const MOBILE_NAV = [
  NAV[0], NAV[1], NAV[2], NAV[3],
];

const NAV_GROUPS = [
  { label: "Operasyon", items: NAV.slice(0, 6) },
  { label: "Finans & Ekip", items: [NAV[6], NAV[7], NAV[8]] },
  { label: "Sistem", items: [NAV[9]] },
];

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const pageTitle = NAV.find(n => active(n.href))?.label ?? "Servisim";

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <Link href="/app/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(37,99,235,0.35)", flexShrink: 0,
            }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>Servisim</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2, fontWeight: 500 }}>Asansör Operasyon</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", padding: "10px 12px 4px" }}>
                {group.label}
              </div>
              {group.items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-nav-item${active(item.href) ? " active" : ""}`}
                >
                  <span className="nav-icon"><I d={item.icon} size={15} /></span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button onClick={logout} className="sidebar-nav-item" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span className="nav-icon">
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" />
              </svg>
            </span>
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* ── OVERLAY ── */}
      <div className={`sidebar-overlay${sidebarOpen ? " show" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* ── APP BODY ── */}
      <div className="app-body">

        {/* Topbar */}
        <header className="app-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setSidebarOpen(v => !v)}
              style={{
                display: "none", alignItems: "center", justifyContent: "center",
                width: 36, height: 36, borderRadius: "var(--r-md)",
                border: "1.5px solid var(--border)", background: "#fff",
                cursor: "pointer", color: "var(--foreground)",
              }}
              className="mobile-menu-btn"
            >
              <I d="M4 6h16M4 12h16M4 18h16" size={16} />
            </button>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.02em" }}>{pageTitle}</div>
            </div>
            <RoleBadge />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/app/work-orders" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
              <I d="M12 5v14M5 12h14" size={13} />
              Yeni İş Emri
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="app-content">
          {children}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="mobile-bar">
        {MOBILE_NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 3, padding: "6px 4px", borderRadius: "var(--r-md)",
              color: active(item.href) ? "var(--primary)" : "var(--muted-2)",
              fontSize: 10, fontWeight: 600, textDecoration: "none",
              background: active(item.href) ? "var(--primary-soft)" : "transparent",
            }}
          >
            <I d={item.icon} size={18} />
            <span>{item.label.split(" ")[0]}</span>
          </Link>
        ))}
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 3, padding: "6px 4px", borderRadius: "var(--r-md)",
            color: "var(--muted-2)", fontSize: 10, fontWeight: 600,
            background: "none", border: "none", cursor: "pointer",
          }}
        >
          <I d="M4 6h16M4 12h16M4 18h16" size={18} />
          <span>Menü</span>
        </button>
      </nav>

      <TrialCountdown />

      <style>{`
        @media (max-width: 1023px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
