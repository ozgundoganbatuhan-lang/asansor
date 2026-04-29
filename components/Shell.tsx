"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useEffect, useCallback, useRef } from "react";
import TrialCountdown from "./TrialCountdown";
import dynamic from "next/dynamic";
const RoleBadge = dynamic(() => import("./RoleBadge"), { ssr: false });

const I = ({ d, size = 16, stroke = "currentColor", sw = 1.75 }: { d: string; size?: number; stroke?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <defs><linearGradient id="slg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1d4ed8"/><stop offset="100%" stopColor="#7c3aed"/>
      </linearGradient></defs>
      <rect width="36" height="36" rx="10" fill="url(#slg)"/>
      <path d="M23 13C23 10 21 8 18 8C15 8 13 10 13 13C13 16.5 23 17 23 21C23 24 21 28 18 28C15 28 13 26 13 23"
        stroke="white" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

const NAV = [
  { group: "Ana Menü", items: [
    { href: "/app/dashboard",   label: "Dashboard",        icon: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 3h2m4 0h-2m-2-4v2m0 4v2", badge: null },
    { href: "/app/work-orders", label: "İş Emirleri",      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4M9 12h6M9 16h4", badge: "7" },
    { href: "/app/customers",   label: "Müşteriler",       icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75", badge: null },
    { href: "/app/assets",      label: "Asansörler",       icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10", badge: null },
  ]},
  { group: "Saha", items: [
    { href: "/app/maintenance-plans", label: "Bakım Takvimi",     icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z", badge: null },
    { href: "/app/inspections",       label: "Periyodik Kontrol", icon: "M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z", badge: null },
    { href: "/app/technicians",       label: "Teknisyenler",      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", badge: null },
    { href: "/app/calendar",          label: "Takvim",            icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zM8 14h.01M12 14h.01M16 14h.01", badge: null },
  ]},
  { group: "Finans", items: [
    { href: "/app/contracts", label: "Sözleşmeler", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8", badge: null },
    { href: "/app/invoices",  label: "Faturalar",   icon: "M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M9 7h6l2 2v3M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2", badge: null },
    { href: "/app/stock",     label: "Stok",        icon: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16", badge: null },
    { href: "/app/reports",   label: "Raporlar",    icon: "M3 3v18h18M9 17V9M14 17V5M19 17v-7", badge: null },
  ]},
  { group: "Araçlar", items: [
    { href: "/app/docs/teklif",   label: "Teklif Şablonu",   icon: "M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M9 7h6l2 2v3M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M14 12h-4M14 16h-4", badge: null },
    { href: "/app/docs/sozlesme", label: "Sözleşme Şablonu", icon: "M9 12h6M9 16h6M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6", badge: null },
  ]},
];
const ALL_NAV = NAV.flatMap(g => g.items);
const MOBILE_NAV = ALL_NAV.slice(0, 4);
const W = 248;

const NOTIFICATIONS = [
  { id: 1, title: "Acil iş emri oluşturuldu",  body: "IE-2024-0048 · Metropol Yapı AŞ", time: "2dk",  color: "#dc2626", read: false },
  { id: 2, title: "Bakım tarihi yaklaşıyor",    body: "C Blok Asansör · 3 gün kaldı",   time: "15dk", color: "#d97706", read: false },
  { id: 3, title: "Fatura ödendi",              body: "F-2024-0089 · ₺2.160",           time: "1sa",  color: "#059669", read: false },
  { id: 4, title: "Stok uyarısı",              body: "Emniyet Freni — tükendi",          time: "2sa",  color: "#d97706", read: true  },
  { id: 5, title: "Teknisyen göreve başladı",  body: "Fatih Arslan → IE-2024-0042",      time: "3sa",  color: "#2563eb", read: true  },
];

function NavItem({ item, isActive }: { item: typeof ALL_NAV[0]; isActive: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={item.href}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9, marginBottom: 1,
        fontSize: 13, fontWeight: isActive ? 700 : 500, textDecoration: "none",
        color: isActive ? "#fff" : hov ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.45)",
        background: isActive ? "rgba(37,99,235,0.22)" : hov ? "rgba(255,255,255,0.06)" : "transparent",
        transition: "all 0.14s", position: "relative",
      }}>
      {isActive && <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, background: "linear-gradient(180deg,#60a5fa,#2563eb)", borderRadius: 3 }}/>}
      <span style={{ width: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <I d={item.icon} size={14} stroke={isActive ? "#60a5fa" : hov ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)"}/>
      </span>
      <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
      {item.badge && (
        <span style={{ fontSize: 9.5, fontWeight: 700, background: "rgba(239,68,68,0.22)", color: "#f87171", border: "1px solid rgba(239,68,68,0.28)", padding: "1px 6px", borderRadius: 999 }}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQ, setCmdQ] = useState("");
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const cmdInputRef = useRef<HTMLInputElement>(null);
  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    setMounted(true);
    const c = () => setIsMobile(window.innerWidth < 1024);
    c(); window.addEventListener("resize", c);
    return () => window.removeEventListener("resize", c);
  }, []);
  useEffect(() => { setMobileOpen(false); setNotifOpen(false); setCmdOpen(false); }, [pathname]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(v => !v); setCmdQ(""); }
    if (e.key === "Escape") { setCmdOpen(false); setNotifOpen(false); }
  }, []);
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
  useEffect(() => { if (cmdOpen) setTimeout(() => cmdInputRef.current?.focus(), 30); }, [cmdOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const pageTitle = ALL_NAV.find(n => isActive(n.href))?.label ?? "Servisim";
  const cmdFiltered = cmdQ.trim() ? ALL_NAV.filter(i => i.label.toLowerCase().includes(cmdQ.toLowerCase())) : ALL_NAV;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }
  function markAllRead() { setNotifs(prev => prev.map(n => ({ ...n, read: true }))); }

  const mob = mounted && isMobile;

  return (
    <div style={{ minHeight: "100vh", background: "#f1f2f6", display: "flex", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      {/* SIDEBAR */}
      <aside style={{
        position: "fixed", top: 0, left: 0, width: W, height: "100vh",
        background: "#0d1117", display: "flex", flexDirection: "column",
        zIndex: 50, overflowY: "auto", overflowX: "hidden",
        borderRight: "1px solid rgba(255,255,255,0.04)",
        transition: "transform 0.24s cubic-bezier(.4,0,.2,1)",
        ...(mob ? { transform: mobileOpen ? "translateX(0)" : `translateX(-${W}px)`, boxShadow: mobileOpen ? "0 0 80px rgba(0,0,0,0.7)" : "none" } : {}),
      }}>
        {/* Brand */}
        <div style={{ padding: "20px 18px 14px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <Logo size={32}/>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: "-0.05em" }}>Servi<span style={{ color: "#60a5fa" }}>sim</span></div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 1, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Asansör Operasyon</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <span style={{ background: "linear-gradient(135deg,rgba(124,58,237,.4),rgba(37,99,235,.4))", border: "1px solid rgba(124,58,237,.4)", color: "#c4b5fd", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, letterSpacing: "0.06em" }}>PRO</span>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "10px 12px 4px", flexShrink: 0 }}>
          <button onClick={() => { setCmdOpen(true); setCmdQ(""); }}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "8px 12px", cursor: "pointer", fontFamily: "inherit", color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
            <I d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" size={13}/>
            <span style={{ flex: 1, textAlign: "left" }}>Ara...</span>
            <span style={{ fontSize: 9.5, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", padding: "2px 5px", borderRadius: 4 }}>⌘K</span>
          </button>
        </div>

        {/* Technician portal */}
        <div style={{ padding: "6px 12px 4px", flexShrink: 0 }}>
          <Link href="/technician" style={{ display: "flex", alignItems: "center", gap: 9, background: "linear-gradient(135deg,rgba(37,99,235,0.15),rgba(124,58,237,0.15))", border: "1px solid rgba(96,165,250,0.15)", borderRadius: 10, padding: "9px 12px", textDecoration: "none", transition: "all .15s" }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🛗</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "#93c5fd" }}>Teknisyen Portalı</div>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Saha uygulaması</div>
            </div>
            <I d="M9 18l6-6-6-6" size={11} stroke="rgba(255,255,255,0.3)"/>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ padding: "4px 8px", flex: 1, overflowY: "auto" }}>
          {NAV.map(group => (
            <div key={group.group} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)", padding: "8px 10px 4px" }}>{group.group}</div>
              {group.items.map(item => <NavItem key={item.href} item={item} isActive={isActive(item.href)}/>)}
            </div>
          ))}
        </nav>

        {/* Trial */}
        <div style={{ margin: "0 12px 8px", background: "linear-gradient(135deg,rgba(124,58,237,0.18),rgba(37,99,235,0.18))", border: "1px solid rgba(124,58,237,0.22)", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>Deneme süresi</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#c4b5fd" }}>8 gün kaldı</div>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: "43%", height: "100%", background: "linear-gradient(90deg,#7c3aed,#2563eb)", borderRadius: 2, animation: "progress-shimmer 2s ease-in-out infinite" }}/>
          </div>
          <Link href="/app/upgrade" style={{ display: "block", marginTop: 8, fontSize: 11, fontWeight: 700, color: "#93c5fd", textDecoration: "none", textAlign: "center" }}>Pro&apos;ya yükselt →</Link>
        </div>

        {/* User footer */}
        <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>AK</div>
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: "#22c55e", border: "2px solid #0d1117" }}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.82)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Hesabım</div>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>Yönetici</div>
            </div>
            <Link href="/app/settings" style={{ padding: 5, color: "rgba(255,255,255,0.3)", display: "flex", borderRadius: 6 }}>
              <I d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" size={14}/>
            </Link>
            <button onClick={logout} style={{ background: "none", border: "none", cursor: "pointer", padding: 5, color: "rgba(255,255,255,0.3)", display: "flex", borderRadius: 6, fontFamily: "inherit" }}>
              <I d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" size={14}/>
            </button>
          </div>
        </div>
      </aside>

      {mob && mobileOpen && <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 49, backdropFilter: "blur(4px)" }}/>}

      {/* BODY */}
      <div style={{ marginLeft: mob ? 0 : W, flex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", paddingBottom: mob ? 64 : 0 }}>
        <header style={{
          position: "sticky", top: 0, zIndex: 30,
          background: "rgba(241,242,246,0.92)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
          padding: mob ? "0 16px" : "0 28px",
          height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {mob && (
              <button onClick={() => setMobileOpen(v => !v)} style={{ width: 36, height: 36, borderRadius: 9, border: "1px solid rgba(0,0,0,0.08)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <I d="M4 6h16M4 12h16M4 18h16" size={16}/>
              </button>
            )}
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#a1a1aa", marginBottom: 1 }}>Servisim Workspace</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#0d1117", letterSpacing: "-0.03em" }}>{pageTitle}</div>
            </div>
            {!mob && <RoleBadge/>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!mob && (
              <button onClick={() => { setCmdOpen(true); setCmdQ(""); }}
                style={{ display: "flex", alignItems: "center", gap: 7, height: 36, padding: "0 12px", borderRadius: 9, background: "#fff", border: "1px solid rgba(0,0,0,0.07)", cursor: "pointer", color: "#71717a", fontSize: 12.5, fontFamily: "inherit" }}>
                <I d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" size={13}/>
                Ara
                <span style={{ fontSize: 10, background: "#f4f4f5", border: "1px solid #e4e4e7", padding: "1px 5px", borderRadius: 4, color: "#a1a1aa" }}>⌘K</span>
              </button>
            )}
            <button onClick={() => setNotifOpen(v => !v)}
              style={{ position: "relative", width: 36, height: 36, borderRadius: 9, background: notifOpen ? "#eff6ff" : "#fff", border: `1px solid ${notifOpen ? "#bfdbfe" : "rgba(0,0,0,0.07)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s" }}>
              <I d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" size={15} stroke={notifOpen ? "#2563eb" : "currentColor"}/>
              {unread > 0 && <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#ef4444", border: "2px solid #f1f2f6", animation: "pulse-ring 2s ease infinite" }}/>}
            </button>
            <Link href="/app/work-orders" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", fontSize: 12.5, fontWeight: 700, padding: "8px 16px", borderRadius: 9, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}>
              <I d="M12 5v14M5 12h14" size={13} stroke="#fff"/>
              {mob ? "" : "Yeni İş Emri"}
            </Link>
          </div>
        </header>
        <main style={{ padding: mob ? "16px" : "28px 32px", flex: 1 }}>{children}</main>
      </div>

      {/* NOTIFICATION PANEL */}
      {notifOpen && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 60, display: "flex" }}>
          <div onClick={() => setNotifOpen(false)} style={{ flex: 1, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}/>
          <div style={{ width: 360, background: "#fff", boxShadow: "-8px 0 40px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", animation: "slide-in-right .24s cubic-bezier(.16,1,.3,1)" }}>
            <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid #f0f0f2", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0a0a0f" }}>Bildirimler</div>
                {unread > 0 && <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{unread} okunmamış</div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Tümünü oku</button>}
                <button onClick={() => setNotifOpen(false)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e4e4e7", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <I d="M18 6L6 18M6 6l12 12" size={14}/>
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {notifs.map(n => (
                <div key={n.id} onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 20px", borderBottom: "1px solid #f9f9fb", cursor: "pointer", background: n.read ? "transparent" : "#fafbff" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${n.color}15`, border: `1px solid ${n.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, position: "relative" }}>
                    <I d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" size={15} stroke={n.color}/>
                    {!n.read && <div style={{ position: "absolute", top: -2, right: -2, width: 7, height: 7, borderRadius: "50%", background: n.color, border: "1.5px solid #fff" }}/>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: n.read ? 500 : 700, color: "#0a0a0f", marginBottom: 3 }}>{n.title}</div>
                    <div style={{ fontSize: 12.5, color: "#71717a" }}>{n.body}</div>
                    <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 4 }}>{n.time} önce</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* COMMAND PALETTE */}
      {cmdOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget) setCmdOpen(false); }}>
          <div style={{ width: "100%", maxWidth: 540, background: "#fff", borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", overflow: "hidden", animation: "cmd-in .18s cubic-bezier(.16,1,.3,1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px", borderBottom: "1px solid #f0f0f2", height: 52 }}>
              <I d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" size={17} stroke="#a1a1aa"/>
              <input ref={cmdInputRef} value={cmdQ} onChange={e => setCmdQ(e.target.value)}
                placeholder="Ekrana git, müşteri veya işlem ara..."
                style={{ flex: 1, border: "none", outline: "none", fontSize: 15, fontFamily: "inherit", color: "#0a0a0f", background: "transparent" }}/>
              <span style={{ fontSize: 11, background: "#f4f4f5", border: "1px solid #e4e4e7", padding: "2px 6px", borderRadius: 5, color: "#a1a1aa" }}>ESC</span>
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {cmdFiltered.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#a1a1aa", fontSize: 13 }}>Sonuç bulunamadı</div>
              ) : cmdFiltered.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setCmdOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", cursor: "pointer", textDecoration: "none", color: "inherit" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f4f4f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <I d={item.icon} size={14} stroke="#52525b"/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0a0a0f" }}>{item.label}</div>
                    <div style={{ fontSize: 11.5, color: "#a1a1aa" }}>Ekrana git</div>
                  </div>
                  <I d="M9 18l6-6-6-6" size={13} stroke="#d1d5db"/>
                </Link>
              ))}
            </div>
            <div style={{ padding: "8px 16px", borderTop: "1px solid #f0f0f2", display: "flex", gap: 12 }}>
              {[["↵","Seç"],["↑↓","Gezin"],["ESC","Kapat"]].map(([k,v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#a1a1aa" }}>
                  <kbd style={{ background: "#f4f4f5", border: "1px solid #e4e4e7", borderRadius: 4, padding: "1px 5px", fontSize: 10, color: "#71717a" }}>{k}</kbd>
                  {v}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile nav */}
      {mob && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 64, background: "#fff", borderTop: "1px solid rgba(0,0,0,0.07)", zIndex: 40, display: "flex", alignItems: "center", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
          {MOBILE_NAV.map(item => {
            const isA = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, fontSize: 9.5, fontWeight: 600, color: isA ? "#2563eb" : "#a1a1aa", textDecoration: "none", padding: "8px 4px", position: "relative" }}>
                {isA && <div style={{ position: "absolute", top: 0, width: 24, height: 2, borderRadius: 999, background: "#2563eb" }}/>}
                <I d={item.icon} size={18} stroke={isA ? "#2563eb" : "#a1a1aa"}/>
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <button onClick={() => setMobileOpen(true)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, fontSize: 9.5, fontWeight: 600, color: "#a1a1aa", background: "none", border: "none", cursor: "pointer", padding: "8px 4px", fontFamily: "inherit" }}>
            <I d="M4 6h16M4 12h16M4 18h16" size={18} stroke="#a1a1aa"/>
            <span>Daha</span>
          </button>
        </nav>
      )}
      <TrialCountdown/>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-ring    { 0%{transform:scale(1);opacity:.6} 70%{transform:scale(2.2);opacity:0} 100%{transform:scale(2.2);opacity:0} }
        @keyframes slide-in-right { from{transform:translateX(100%)} to{transform:none} }
        @keyframes cmd-in        { from{opacity:0;transform:translateY(-8px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes progress-shimmer { 0%,100%{opacity:1} 50%{opacity:.7} }
        @keyframes srv-spin      { to { transform: rotate(360deg); } }
        @keyframes orb-drift     { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,15px) scale(1.1)} }
        @keyframes orb-drift2    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(15px,-10px) scale(1.08)} }
        @keyframes feedIn        { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
        @keyframes blink         { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes counter-in   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,.12) !important; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 999px; }
      `}}/>
    </div>
  );
}
