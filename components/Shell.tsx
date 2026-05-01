"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
import dynamic from "next/dynamic";
const RoleBadge = dynamic(() => import("./RoleBadge"), { ssr: false });

/* ─── tiny icon helper ─── */
function Ic({ d, size = 15, stroke = "currentColor" }: { d: string; size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ─── nav structure ─── */
const NAV = [
  { group: "Ana Menü", items: [
    { href: "/app/dashboard",         label: "Dashboard",         section: "ASTEK",          icon: "M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-10h8V3h-8z" },
    { href: "/app/work-orders",       label: "İş Emirleri",       section: "OPERASYON",      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4", badge: "7" },
    { href: "/app/customers",         label: "Müşteriler",        section: "PORTFÖY",        icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z" },
    { href: "/app/assets",            label: "Asansörler",        section: "SERVİSİM FİLO",  icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
  ]},
  { group: "Saha", items: [
    { href: "/app/maintenance-plans", label: "Bakım Takvimi",     section: "SAHA",           icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" },
    { href: "/app/inspections",       label: "Periyodik Kontrol", section: "SAHA",           icon: "M9 12l2 2 4-4M21 12c0 5-4 9-9 9s-9-4-9-9 4-9 9-9 9 4 9 9z" },
    { href: "/app/technicians",       label: "Teknisyenler",      section: "SAHA",           icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z" },
    { href: "/app/calendar",          label: "Takvim",            section: "SAHA",           icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" },
  ]},
  { group: "Finans", items: [
    { href: "/app/contracts",         label: "Sözleşmeler",       section: "FİNANS",         icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" },
    { href: "/app/invoices",          label: "Faturalar",         section: "FİNANS",         icon: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3" },
    { href: "/app/stock",             label: "Stok",              section: "FİNANS",         icon: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" },
    { href: "/app/reports",           label: "Raporlar",          section: "FİNANS",         icon: "M3 3v18h18 M9 17V9 M14 17V5 M19 17v-7" },
  ]},
  { group: "Araçlar", items: [
    { href: "/app/settings",          label: "Ayarlar",           section: "SİSTEM",         icon: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
    { href: "/app/docs/teklif",       label: "Teklif Şablonu",   section: "ARAÇLAR",        icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M9 15h6 M9 11h6" },
    { href: "/app/docs/sozlesme",     label: "Sözleşme Şablonu", section: "ARAÇLAR",        icon: "M9 12h6 M9 16h6 M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" },
  ]},
];

const ALL_ITEMS = NAV.flatMap(g => g.items);
const MOB_ITEMS = ALL_ITEMS.slice(0, 4);
const SW = 248; /* sidebar width — matches HTML: 248px */

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [sideOpen, setSideOpen]   = useState(false);
  const [isMobile, setIsMobile]   = useState(false);
  const [mounted,  setMounted]    = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  useEffect(() => { setSideOpen(false); }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const mob = mounted && isMobile;

  /* topbar breadcrumb */
  const activeItem = ALL_ITEMS.find(i => isActive(i.href));
  const crumbSection = activeItem?.section ?? "ASTEK";
  const crumbPage    = activeItem?.label   ?? "Servisim";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f9fafb",  /* --gray-50 from HTML design */
      display: "flex",
      fontFamily: "'DM Sans','Plus Jakarta Sans',system-ui,sans-serif",
    }}>

      {/* ═══════════ SIDEBAR ═══════════ */}
      {/* Matches HTML: width:248px, background:#0d1117, border-right:1px solid #1e2d3d */}
      <aside style={{
        position: "fixed", top: 0, left: 0,
        width: SW, height: "100vh",
        background: "#0d1117",
        display: "flex", flexDirection: "column",
        zIndex: 50,
        borderRight: "1px solid #1e2d3d",
        overflowY: "auto", overflowX: "hidden",
        scrollbarWidth: "none",
        ...(mob ? {
          transform: sideOpen ? "translateX(0)" : `translateX(-${SW}px)`,
          transition: "transform 0.24s cubic-bezier(.4,0,.2,1)",
          boxShadow: sideOpen ? "4px 0 40px rgba(0,0,0,0.6)" : "none",
        } : {}),
      } as React.CSSProperties}>

        {/* ── Brand ── */}
        {/* Matches HTML .sidebar-logo: padding 18px 16px 14px, border-bottom #1e2d3d */}
        <div style={{
          padding: "18px 16px 14px",
          display: "flex", alignItems: "center", gap: 10,
          borderBottom: "1px solid #1e2d3d", flexShrink: 0,
        }}>
          {/* .logo-icon: 34px, background #3b82f6, border-radius 8px, font-size 15px */}
          <div style={{
            width: 34, height: 34, background: "#3b82f6", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 15, color: "#fff", flexShrink: 0,
          }}>S</div>
          {/* .logo-info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* .logo-name: font-size 14px, color #3b82f6, font-weight 700 */}
            <div style={{ fontSize: 14, fontWeight: 700, color: "#3b82f6", letterSpacing: "-0.3px", lineHeight: 1 }}>
              Servisim
            </div>
            {/* .logo-sub: 9.5px, uppercase, #8b9ab0 */}
            <div style={{ fontSize: 9.5, fontWeight: 500, color: "#8b9ab0",
              letterSpacing: "0.5px", textTransform: "uppercase", lineHeight: 1, marginTop: 3 }}>
              Asansör Operasyon
            </div>
          </div>
          {/* .logo-pro: bg #1c2333, color #e2e8f0, 9px, 700 */}
          <span style={{ background: "#1c2333", color: "#e2e8f0", fontSize: 9,
            fontWeight: 700, padding: "2px 7px", borderRadius: 4,
            letterSpacing: "0.5px", flexShrink: 0 }}>PRO</span>
        </div>

        {/* ── Search ── */}
        {/* .sidebar-search: padding 10px 12px, border-bottom #1e2d3d */}
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #1e2d3d", flexShrink: 0 }}>
          {/* .sidebar-search-input: bg #1c2333, border #1e2d3d, radius 6px */}
          <div style={{
            width: "100%", background: "#1c2333", border: "1px solid #1e2d3d",
            borderRadius: 6, padding: "7px 10px",
            display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="#8b9ab0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span style={{ fontSize: 12, color: "#8b9ab0", flex: 1 }}>Ara...</span>
            <kbd style={{ fontSize: 10, color: "#8b9ab0", background: "rgba(255,255,255,0.07)",
              borderRadius: 3, padding: "1px 5px", fontFamily: "monospace" }}>⌘K</kbd>
          </div>
        </div>

        {/* ── Technician card ── */}
        {/* .technician-card: margin 10px 12px, gradient #1e3a8a→#3b82f6, radius 10px */}
        <div style={{ margin: "10px 12px", flexShrink: 0 }}>
          <Link href="/technician" style={{
            display: "flex", alignItems: "center", gap: 9,
            background: "linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%)",
            borderRadius: 10, padding: "10px 12px", textDecoration: "none",
          }}>
            {/* .tech-icon: 32px, bg rgba(255,255,255,.2), radius 6px */}
            <div style={{ width: 32, height: 32, background: "rgba(255,255,255,0.2)",
              borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              {/* .tech-title: 12px, 600, white */}
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>
                Teknisyen Portalı
              </div>
              {/* .tech-sub: 10px, rgba white 70% */}
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                Saha uygulaması
              </div>
            </div>
            {/* .tech-arrow */}
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginLeft: "auto" }}>›</span>
          </Link>
        </div>

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          {NAV.map(group => (
            <div key={group.group}>
              {/* .nav-section-label: 9.5px, 600, #8b9ab0, uppercase, padding 16px 16px 6px */}
              <div style={{ fontSize: 9.5, fontWeight: 600, color: "#8b9ab0",
                letterSpacing: "0.8px", textTransform: "uppercase",
                padding: "16px 16px 6px" }}>
                {group.group}
              </div>
              {group.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}
                    /* .nav-item: padding 7px 12px, margin 1px 8px, radius 6px
                       active: bg #1d2d50, color #e2e8f0
                       hover:  bg #1c2333, color #e2e8f0
                       default: color #8b9ab0 */
                    className={`nav-item${active ? " active" : ""}`}
                    style={{ margin: "1px 8px" }}>
                    {active && (
                      <span style={{ position: "absolute", left: 0, top: "50%",
                        transform: "translateY(-50%)", width: 3, height: 16,
                        background: "#3b82f6", borderRadius: 3 }} />
                    )}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke={active ? "#60a5fa" : "#8b9ab0"}
                      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                      style={{ flexShrink: 0 }}>
                      <path d={item.icon} />
                    </svg>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                    {(item as { badge?: string }).badge && (
                      /* .nav-badge: bg #ef4444, white, 10px, 700, 18px circle */
                      <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff",
                        fontSize: 10, fontWeight: 700, width: 18, height: 18,
                        borderRadius: "50%", display: "flex", alignItems: "center",
                        justifyContent: "center", flexShrink: 0 }}>
                        {(item as { badge?: string }).badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Bottom ── */}
        {/* .sidebar-bottom: margin-top auto, border-top #1e2d3d */}
        <div style={{ marginTop: "auto", borderTop: "1px solid #1e2d3d", flexShrink: 0 }}>

          {/* Trial banner */}
          {/* .trial-banner: margin 12px, bg #1c2333, radius 10px, padding 10px 12px */}
          <div style={{ margin: "12px", background: "#1c2333",
            borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between",
              fontSize: 11, marginBottom: 6 }}>
              <span style={{ color: "#e2e8f0", fontWeight: 500 }}>Deneme süresi</span>
              <span style={{ color: "#8b9ab0" }}>8 gün kaldı</span>
            </div>
            {/* .trial-bar: height 4px, bg rgba(255,255,255,.1) */}
            <div style={{ height: 4, background: "rgba(255,255,255,0.1)",
              borderRadius: 99, overflow: "hidden" }}>
              {/* .trial-progress: bg #3b82f6, width 73% */}
              <div style={{ height: "100%", width: "73%",
                background: "#3b82f6", borderRadius: 99 }} />
            </div>
            {/* .trial-upgrade: 11px, 600, #3b82f6 */}
            <Link href="/app/upgrade" style={{ display: "block", fontSize: 11,
              fontWeight: 600, color: "#3b82f6", marginTop: 8, textDecoration: "none" }}>
              Pro&apos;ya yükselt →
            </Link>
          </div>

          {/* User row */}
          {/* .user-row: padding 10px 12px */}
          <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 9 }}>
            {/* .user-avatar: 32px, gradient #6366f1→#8b5cf6, radius 50% */}
            <div style={{ width: 32, height: 32, flexShrink: 0,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>
              AK
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* .user-name: 12px, 600, #e2e8f0 */}
              <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Hesabım
              </div>
              {/* .user-role: 10px, #8b9ab0 */}
              <div style={{ fontSize: 10, color: "#8b9ab0" }}>
                <RoleBadge />
              </div>
            </div>
            {/* .user-actions: gap 4px */}
            <div style={{ display: "flex", gap: 4 }}>
              <Link href="/app/settings" title="Ayarlar"
                style={{ background: "none", border: "none", cursor: "pointer",
                  color: "#8b9ab0", padding: 4, borderRadius: 4, display: "flex",
                  textDecoration: "none" }}>
                <Ic d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" size={13} />
              </Link>
              <button onClick={logout} title="Çıkış"
                style={{ background: "none", border: "none", cursor: "pointer",
                  color: "#8b9ab0", padding: 4, borderRadius: 4, display: "flex" }}>
                <Ic d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" size={13} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mob && sideOpen && (
        <div onClick={() => setSideOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
            zIndex: 49, backdropFilter: "blur(2px)" }} />
      )}

      {/* ═══════════ MAIN ═══════════ */}
      <div style={{
        marginLeft: mob ? 0 : SW,
        flex: 1, display: "flex", flexDirection: "column",
        minHeight: "100vh",
        paddingBottom: mob ? 64 : 0,
      }}>

        {/* ── Topbar ── */}
        {/* Matches HTML: background white, border-bottom #e5e7eb, height 58px, padding 0 24px */}
        <header style={{
          position: "sticky", top: 0, zIndex: 30,
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: mob ? "0 16px" : "0 24px",
          height: 58,
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 16,
          flexShrink: 0,
        }}>
          {/* Left: hamburger (mob) + breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
            {mob && (
              <button onClick={() => setSideOpen(v => !v)}
                style={{ width: 36, height: 36, borderRadius: 8,
                  border: "1px solid #e5e7eb", background: "#fff",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "#6b7280", flexShrink: 0 }}>
                <Ic d="M4 6h16M4 12h16M4 18h16" size={16} />
              </button>
            )}
            {/* .topbar-breadcrumb */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* .crumb-section: 10px, 600, #9ca3af, uppercase, letter-spacing .5px */}
              <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af",
                letterSpacing: "0.5px", textTransform: "uppercase" }}>
                {crumbSection}
              </div>
              {/* .crumb-page: 18px, 700, #111827, line-height 1.1 */}
              <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", lineHeight: 1.1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {crumbPage}
              </div>
            </div>
          </div>

          {/* Right: search + notification + CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* .topbar-search: bg #f3f4f6, border #e5e7eb, radius 8px, padding 6px 12px */}
            {!mob && (
              <div style={{ display: "flex", alignItems: "center", gap: 6,
                background: "#f3f4f6", border: "1px solid #e5e7eb",
                borderRadius: 8, padding: "6px 12px", cursor: "pointer", minWidth: 160 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <span style={{ fontSize: 12, color: "#6b7280", flex: 1 }}>Hızlı ara</span>
                <kbd style={{ fontSize: 10, color: "#9ca3af", background: "#e5e7eb",
                  borderRadius: 3, padding: "1px 5px", fontFamily: "monospace" }}>⌘K</kbd>
              </div>
            )}
            {/* .topbar-notif: 36px, border #e5e7eb, radius 8px */}
            <button style={{ width: 36, height: 36, background: "none",
              border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#6b7280", position: "relative" }}>
              <Ic d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0" size={15} />
              <div style={{ position: "absolute", top: 8, right: 8, width: 6, height: 6,
                borderRadius: "50%", background: "#ef4444", border: "2px solid #fff" }} />
            </button>
            {/* .btn-primary: bg #111827, white, radius 8px, 13px 600 */}
            <Link href="/app/work-orders" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#111827", color: "#fff",
              fontSize: 13, fontWeight: 600, padding: "8px 16px",
              borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap",
            }}>
              <Ic d="M12 5v14M5 12h14" size={13} stroke="#fff" />
              {!mob && "Yeni İş Emri"}
            </Link>
          </div>
        </header>

        {/* ── Content ── */}
        {/* .content: padding 24px, overflow-y auto */}
        <main className="page-animate" style={{ flex: 1, padding: mob ? "16px" : "24px" }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {mob && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 64,
          background: "#fff", borderTop: "1px solid #e5e7eb", zIndex: 50,
          display: "flex", alignItems: "center" }}>
          {MOB_ITEMS.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 3, padding: "8px 4px",
                color: active ? "#2563eb" : "#9ca3af",
                fontSize: 9.5, fontWeight: 600, textDecoration: "none",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.75"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <button onClick={() => setSideOpen(true)}
            style={{ flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 3, fontSize: 9.5, fontWeight: 600, color: "#9ca3af",
              background: "none", border: "none", cursor: "pointer",
              padding: "8px 4px", fontFamily: "inherit" }}>
            <Ic d="M4 6h16M4 12h16M4 18h16" size={20} />
            <span>Daha</span>
          </button>
        </nav>
      )}
    </div>
  );
}
