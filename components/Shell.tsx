"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
import TrialCountdown from "./TrialCountdown";
import dynamic from "next/dynamic";
const RoleBadge = dynamic(() => import("./RoleBadge"), { ssr: false });

/* ── Icon ── */
const Ic = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

/* ── Logo ── */
function Logo() {
  return (
    <svg width={36} height={36} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="#0f1829" />
      <rect width="40" height="40" rx="12" fill="url(#lg)" opacity="0.55" />
      <path d="M26 15C26 11.5 23.5 9 20 9C16.5 9 14 11.5 14 15C14 19.5 26 19 26 24C26 27.5 23.5 31 20 31C16.5 31 14 28.5 14 25"
        stroke="white" strokeWidth="3.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ── Navigation ── */
const NAV = [
  { group: "Ana Menü", items: [
    { href: "/app/dashboard",   label: "Dashboard",        icon: "M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-10h8V3h-8z" },
    { href: "/app/work-orders", label: "İş Emirleri",      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4", badge: "7" },
    { href: "/app/customers",   label: "Müşteriler",       icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z" },
    { href: "/app/assets",      label: "Asansörler",       icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
  ]},
  { group: "Saha", items: [
    { href: "/app/maintenance-plans", label: "Bakım Takvimi",     icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" },
    { href: "/app/inspections",       label: "Periyodik Kontrol", icon: "M9 12l2 2 4-4M21 12c0 5-4 9-9 9s-9-4-9-9 4-9 9-9 9 4 9 9z" },
    { href: "/app/technicians",       label: "Teknisyenler",      icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z" },
    { href: "/app/calendar",          label: "Takvim",            icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" },
  ]},
  { group: "Finans", items: [
    { href: "/app/contracts", label: "Sözleşmeler", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" },
    { href: "/app/invoices",  label: "Faturalar",   icon: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3" },
    { href: "/app/stock",     label: "Stok",        icon: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" },
    { href: "/app/reports",   label: "Raporlar",    icon: "M3 3v18h18 M9 17V9 M14 17V5 M19 17v-7" },
  ]},
  { group: "Araçlar", items: [
    { href: "/app/settings",      label: "Ayarlar",          icon: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
    { href: "/app/docs/teklif",   label: "Teklif Şablonu",   icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M9 15h6 M9 11h6" },
    { href: "/app/docs/sozlesme", label: "Sözleşme Şablonu", icon: "M9 12h6 M9 16h6 M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" },
  ]},
];

const ALL_NAV   = NAV.flatMap(g => g.items);
const MOBILE_NAV = ALL_NAV.slice(0, 4);
const SIDEBAR_W  = 256;

export default function Shell({ children }: { children: ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [open, setOpen]     = useState(false);
  const [mob, setMob]       = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const c = () => setMob(window.innerWidth < 1024);
    c();
    window.addEventListener("resize", c);
    return () => window.removeEventListener("resize", c);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const pageTitle = ALL_NAV.find(n => isActive(n.href))?.label ?? "Servisim";
  const isMob = mounted && mob;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f1f2f6", display: "flex",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        position: "fixed", top: 0, left: 0,
        width: SIDEBAR_W, height: "100vh",
        background: "#0d1526",
        display: "flex", flexDirection: "column",
        zIndex: 50, overflowY: "auto", overflowX: "hidden",
        borderRight: "1px solid rgba(255,255,255,0.03)",
        ...(isMob ? {
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.24s cubic-bezier(.4,0,.2,1)",
          boxShadow: open ? "0 0 80px rgba(0,0,0,0.85)" : "none",
        } : {}),
      }}>

        {/* Brand */}
        <div style={{ padding: "20px 18px 16px", display: "flex", alignItems: "center",
          gap: 11, flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <Logo />
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff",
              letterSpacing: "-0.06em", lineHeight: 1 }}>
              Servi<span style={{ color: "#60a5fa" }}>sim</span>
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 3,
              fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Asansör Operasyon
            </div>
          </div>
        </div>

        {/* Technician portal */}
        <div style={{ padding: "12px 12px 4px" }}>
          <Link href="/technician" style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(37,99,235,0.12)",
            border: "1px solid rgba(37,99,235,0.2)",
            borderRadius: 10, padding: "9px 12px", textDecoration: "none",
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 8,
              background: "rgba(37,99,235,0.2)", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
              🛗
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#93c5fd" }}>Teknisyen Portalı</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", marginTop: 1 }}>Saha uygulaması</div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.3)" }}>
              <Ic d="M9 18l6-6-6-6" size={11} />
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ padding: "6px 8px", flex: 1, overflowY: "auto" }}>
          {NAV.map(group => (
            <div key={group.group} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.12)",
                padding: "12px 10px 5px" }}>
                {group.group}
              </div>
              {group.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}
                    className={`nav-item ${active ? "active" : ""}`}>
                    {active && (
                      <span style={{ position: "absolute", left: 0, top: "50%",
                        transform: "translateY(-50%)", width: 3, height: 16,
                        background: "#3b82f6", borderRadius: 3 }} />
                    )}
                    <span style={{
                      width: 15, flexShrink: 0, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      color: active ? "#60a5fa" : "rgba(255,255,255,0.24)",
                    }}>
                      <Ic d={item.icon} size={14} />
                    </span>
                    <span style={{ flex: 1, whiteSpace: "nowrap",
                      overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.label}
                    </span>
                    {(item as { badge?: string }).badge && (
                      <span style={{ fontSize: 9, fontWeight: 800,
                        background: "rgba(239,68,68,0.18)", color: "#f87171",
                        border: "1px solid rgba(239,68,68,0.2)",
                        padding: "2px 6px", borderRadius: 999 }}>
                        {(item as { badge?: string }).badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: "10px", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9,
              background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              AK
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700,
                color: "rgba(255,255,255,0.8)", overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Hesabım
              </div>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.22)", marginTop: 1 }}>Yönetici</div>
            </div>
            <button onClick={logout} title="Çıkış yap"
              style={{ background: "none", border: "none", cursor: "pointer",
                padding: 6, color: "rgba(255,255,255,0.28)", display: "flex",
                borderRadius: 7 }}>
              <Ic d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isMob && open && (
        <div onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
            zIndex: 49, backdropFilter: "blur(3px)" }} />
      )}

      {/* ── MAIN ── */}
      <div style={{ marginLeft: isMob ? 0 : SIDEBAR_W, flex: 1,
        minHeight: "100vh", paddingBottom: isMob ? 64 : 0 }}>

        {/* Header */}
        <header style={{
          position: "sticky", top: 0, zIndex: 30,
          background: "rgba(241,242,246,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(15,23,42,0.07)",
          padding: isMob ? "0 16px" : "0 24px",
          height: 58, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMob && (
              <button onClick={() => setOpen(v => !v)} style={{
                width: 36, height: 36, borderRadius: 9,
                border: "1px solid rgba(15,23,42,0.08)",
                background: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Ic d="M4 6h16M4 12h16M4 18h16" size={16} />
              </button>
            )}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.18em", color: "#94a3b8", marginBottom: 1 }}>
                Workspace
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a",
                letterSpacing: "-0.04em" }}>
                {pageTitle}
              </div>
            </div>
            {!isMob && <RoleBadge />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <button style={{
              width: 36, height: 36, borderRadius: 9, background: "#fff",
              border: "1px solid rgba(15,23,42,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", position: "relative",
            }}>
              <Ic d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0" size={15} />
              <div style={{ position: "absolute", top: 8, right: 8, width: 6, height: 6,
                borderRadius: "50%", background: "#ef4444",
                border: "2px solid #f1f2f6" }} />
            </button>
            <Link href="/app/work-orders" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#2563eb", color: "#fff",
              fontSize: 12.5, fontWeight: 700,
              padding: "8px 16px", borderRadius: 9,
              textDecoration: "none",
              boxShadow: "0 3px 12px rgba(37,99,235,0.3)",
            }}>
              <Ic d="M12 5v14M5 12h14" size={13} />
              {!isMob && "Yeni İş Emri"}
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="page-animate" style={{ padding: isMob ? "16px" : "24px 28px" }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {isMob && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0, height: 64,
          background: "#fff", borderTop: "1px solid rgba(15,23,42,0.06)",
          zIndex: 50, padding: "0 8px",
          display: "flex", alignItems: "center", justifyContent: "space-around",
          boxShadow: "0 -4px 24px rgba(15,23,42,0.06)",
        }}>
          {MOBILE_NAV.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 3, padding: "8px 4px",
                color: active ? "#2563eb" : "#94a3b8",
                fontSize: 9.5, fontWeight: 600, textDecoration: "none",
              }}>
                <Ic d={item.icon} size={20} />
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <button onClick={() => setOpen(true)} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 3, fontSize: 9.5, fontWeight: 600, color: "#94a3b8",
            background: "none", border: "none", cursor: "pointer",
            padding: "8px 4px", fontFamily: "inherit",
          }}>
            <Ic d="M4 6h16M4 12h16M4 18h16" size={20} />
            <span>Daha</span>
          </button>
        </nav>
      )}

      <TrialCountdown />
    </div>
  );
}
