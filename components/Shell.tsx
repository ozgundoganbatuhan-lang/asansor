"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
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
      { href: "/app/invoices",     label: "Faturalar",    icon: "M12 2H2v20l4-4h14V8L12 2zm0 0v6h6" },
      { href: "/app/reports",      label: "Raporlar",     icon: "M18 20V10M12 20V4M6 20v-6" },
      { href: "/app/technicians",  label: "Teknisyenler", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z" },
      { href: "/app/stock",        label: "Stok",         icon: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/app/settings", label: "Ayarlar", icon: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
    ],
  },
];

const ALL_NAV = NAV_GROUPS.flatMap(g => g.items);
const MOBILE_NAV = ALL_NAV.slice(0, 4);

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const pageTitle = ALL_NAV.find(n => active(n.href))?.label ?? "Servisim";

  useEffect(() => { setOpen(false); }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar${open ? " open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
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
        <nav className="sidebar-nav">
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 2 }}>
              <div className="sidebar-nav-group-label">{group.label}</div>
              {group.items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-nav-item${active(item.href) ? " active" : ""}`}
                >
                  <span className="nav-icon"><I d={item.icon} /></span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer / logout */}
        <div className="sidebar-footer">
          <button onClick={logout} className="sidebar-nav-item" style={{ width: "100%", color: "rgba(255,255,255,0.35)" }}>
            <span className="nav-icon">
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </span>
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* ── OVERLAY ── */}
      <div className={`sidebar-overlay${open ? " show" : ""}`} onClick={() => setOpen(false)} />

      {/* ── APP BODY ── */}
      <div className="app-body">
        {/* Topbar */}
        <header className="app-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setOpen(v => !v)}
              className="mobile-topbar-btn"
              aria-label="Menüyü aç"
            >
              <I d="M4 6h16M4 12h16M4 18h16" size={16} />
            </button>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.02em" }}>
              {pageTitle}
            </div>
            <RoleBadge />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              href="/app/work-orders"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "var(--primary)", color: "#fff",
                fontSize: 12, fontWeight: 700,
                padding: "7px 14px", borderRadius: 7,
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
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
        <main className="app-content">
          {children}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="mobile-bottom-nav">
        {MOBILE_NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 3, padding: "6px 4px", borderRadius: 8,
              color: active(item.href) ? "var(--primary)" : "var(--muted-2)",
              fontSize: 9, fontWeight: 600, textDecoration: "none",
              background: active(item.href) ? "var(--blue-50)" : "transparent",
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
            gap: 3, fontSize: 9, fontWeight: 600, color: "var(--muted-2)",
            background: "none", border: "none", cursor: "pointer", padding: "6px 4px",
          }}
        >
          <I d="M4 6h16M4 12h16M4 18h16" size={18} />
          <span>Menü</span>
        </button>
      </nav>

      <TrialCountdown />
    </div>
  );
}
