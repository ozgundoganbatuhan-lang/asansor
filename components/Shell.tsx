"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
import dynamic from "next/dynamic";
const RoleBadge = dynamic(() => import("./RoleBadge"), { ssr: false });

/* ── tiny SVG icon ── */
const Ic = ({ d, size = 14 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV = [
  { group: "Ana Menü", items: [
    { href: "/app/dashboard",   label: "Dashboard",         icon: "M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-10h8V3h-8z" },
    { href: "/app/work-orders", label: "İş Emirleri",       icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4", badge: "7" },
    { href: "/app/customers",   label: "Müşteriler",        icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z" },
    { href: "/app/assets",      label: "Asansörler",        icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
  ]},
  { group: "Saha", items: [
    { href: "/app/maintenance-plans", label: "Bakım Takvimi",      icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" },
    { href: "/app/inspections",       label: "Periyodik Kontrol",  icon: "M9 12l2 2 4-4M21 12c0 5-4 9-9 9s-9-4-9-9 4-9 9-9 9 4 9 9z" },
    { href: "/app/technicians",       label: "Teknisyenler",       icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z" },
    { href: "/app/calendar",          label: "Takvim",             icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" },
  ]},
  { group: "Finans", items: [
    { href: "/app/contracts", label: "Sözleşmeler",  icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" },
    { href: "/app/invoices",  label: "Faturalar",    icon: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3" },
    { href: "/app/stock",     label: "Stok",         icon: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" },
    { href: "/app/reports",   label: "Raporlar",     icon: "M3 3v18h18 M9 17V9 M14 17V5 M19 17v-7" },
  ]},
];

const W = 252;
const ALL = NAV.flatMap(g => g.items);
const MOB = ALL.slice(0, 4);

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen]       = useState(false);
  const [isMob, setIsMob]     = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const upd = () => setIsMob(window.innerWidth < 1024);
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const mob = mounted && isMob;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  /* ── shared sidebar styles ── */
  const S = {
    root: { minHeight:"100vh", background:"#f8fafc", display:"flex" as const,
      fontFamily:"'DM Sans','Plus Jakarta Sans',system-ui,sans-serif" },

    /* sidebar */
    sb: {
      position:"fixed" as const, top:0, left:0, width:W, height:"100vh",
      background:"#0d1117", display:"flex" as const, flexDirection:"column" as const,
      zIndex:50, borderRight:"1px solid rgba(255,255,255,0.05)",
      overflowY:"auto" as const, scrollbarWidth:"none" as const,
      ...(mob ? {
        transform: open ? "translateX(0)" : `translateX(-${W}px)`,
        transition:"transform 0.24s cubic-bezier(.4,0,.2,1)",
        boxShadow: open ? "0 0 80px rgba(0,0,0,0.8)" : "none",
      } : {}),
    } as React.CSSProperties,

    /* brand row */
    brand: { padding:"18px 16px 14px", display:"flex", alignItems:"center",
      gap:10, borderBottom:"1px solid rgba(255,255,255,0.05)", flexShrink:0 } as React.CSSProperties,
    logoBox: { width:34, height:34, background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
      borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:15, fontWeight:800, color:"#fff", flexShrink:0, letterSpacing:"-0.04em" } as React.CSSProperties,
    logoName: { fontSize:14, fontWeight:800, color:"#3b82f6", letterSpacing:"-0.03em", lineHeight:1 } as React.CSSProperties,
    logoSub:  { fontSize:9, fontWeight:600, color:"rgba(255,255,255,0.2)",
      letterSpacing:"0.5px", textTransform:"uppercase" as const, marginTop:2 } as React.CSSProperties,
    proBadge: { background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.4)",
      fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:4,
      letterSpacing:"0.5px", flexShrink:0 } as React.CSSProperties,

    /* search */
    searchWrap: { padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,0.05)", flexShrink:0 } as React.CSSProperties,
    searchBox:  { display:"flex", alignItems:"center", gap:7,
      background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)",
      borderRadius:6, padding:"7px 10px", cursor:"pointer" } as React.CSSProperties,

    /* technician card */
    techWrap: { padding:"10px 12px 4px", flexShrink:0 } as React.CSSProperties,
    techCard: { display:"flex", alignItems:"center", gap:9,
      background:"linear-gradient(135deg,rgba(29,78,216,0.35),rgba(37,99,235,0.2))",
      border:"1px solid rgba(37,99,235,0.25)", borderRadius:10, padding:"10px 12px",
      textDecoration:"none" } as React.CSSProperties,
    techIcon: { width:30, height:30, borderRadius:7, background:"rgba(37,99,235,0.35)",
      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 } as React.CSSProperties,

    /* nav section label */
    secLabel: { fontSize:9.5, fontWeight:600, letterSpacing:"0.8px",
      textTransform:"uppercase" as const, color:"rgba(255,255,255,0.18)",
      padding:"14px 10px 5px" } as React.CSSProperties,

    /* nav item base */
    navBase: { display:"flex", alignItems:"center", gap:9, padding:"7px 10px",
      borderRadius:7, fontSize:12.5, fontWeight:500, textDecoration:"none",
      position:"relative" as const, marginBottom:1, transition:"all 0.1s" } as React.CSSProperties,

    /* bottom */
    bottom: { marginTop:"auto", borderTop:"1px solid rgba(255,255,255,0.05)", flexShrink:0 } as React.CSSProperties,
    trialWrap: { margin:"12px 12px 4px", background:"rgba(255,255,255,0.04)",
      borderRadius:10, padding:"10px 12px" } as React.CSSProperties,
    userRow: { padding:"8px 12px 12px", display:"flex", alignItems:"center", gap:9 } as React.CSSProperties,
    avatar:  { width:32, height:32, background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
      borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:11, fontWeight:700, color:"#fff", flexShrink:0 } as React.CSSProperties,

    /* topbar */
    topbar: { position:"sticky" as const, top:0, zIndex:30, background:"#fff",
      borderBottom:"1px solid #e5e7eb", height:56,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding: mob ? "0 16px" : "0 28px", gap:12, flexShrink:0 } as React.CSSProperties,
  };

  return (
    <div style={S.root}>

      {/* ════ SIDEBAR ════ */}
      <aside style={S.sb}>

        {/* Brand */}
        <div style={S.brand}>
          <div style={S.logoBox}>S</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={S.logoName}>Servisim</div>
            <div style={S.logoSub}>Asansör Operasyon</div>
          </div>
          <span style={S.proBadge}>PRO</span>
        </div>

        {/* Search */}
        <div style={S.searchWrap}>
          <div style={S.searchBox}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.22)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.22)", flex:1 }}>Ara...</span>
            <kbd style={{ fontSize:9.5, color:"rgba(255,255,255,0.18)",
              background:"rgba(255,255,255,0.06)", borderRadius:3, padding:"1px 5px", fontFamily:"monospace" }}>
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Technician portal card */}
        <div style={S.techWrap}>
          <Link href="/technician" style={S.techCard}>
            <div style={S.techIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11.5, fontWeight:700, color:"#93c5fd", lineHeight:1.2 }}>
                Teknisyen Portalı
              </div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginTop:2 }}>Saha uygulaması</div>
            </div>
            <span style={{ color:"rgba(255,255,255,0.25)", fontSize:15 }}>›</span>
          </Link>
        </div>

        {/* Nav groups */}
        <nav style={{ padding:"4px 8px", flex:1, overflowY:"auto", scrollbarWidth:"none" }}>
          {NAV.map(group => (
            <div key={group.group}>
              <div style={S.secLabel}>{group.group}</div>
              {group.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} style={{
                    ...S.navBase,
                    background: active ? "rgba(37,99,235,0.16)" : "transparent",
                    color: active ? "#fff" : "rgba(255,255,255,0.35)",
                    fontWeight: active ? 700 : 500,
                  }}
                    onMouseEnter={e => { if(!active)(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color="rgba(255,255,255,0.75)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background=active?"rgba(37,99,235,0.16)":"transparent"; (e.currentTarget as HTMLElement).style.color=active?"#fff":"rgba(255,255,255,0.35)"; }}
                  >
                    {/* Active indicator */}
                    {active && (
                      <span style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)",
                        width:3, height:16, background:"#3b82f6", borderRadius:3 }} />
                    )}
                    {/* Icon */}
                    <span style={{ width:14, display:"flex", alignItems:"center", justifyContent:"center",
                      color: active ? "#60a5fa" : "rgba(255,255,255,0.22)", flexShrink:0 }}>
                      <Ic d={item.icon} size={14} />
                    </span>
                    {/* Label */}
                    <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {item.label}
                    </span>
                    {/* Badge */}
                    {(item as { badge?: string }).badge && (
                      <span style={{ fontSize:9, fontWeight:800,
                        background:"rgba(239,68,68,0.2)", color:"#f87171",
                        border:"1px solid rgba(239,68,68,0.22)",
                        padding:"2px 7px", borderRadius:999, flexShrink:0 }}>
                        {(item as { badge?: string }).badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div style={S.bottom}>
          {/* Trial banner */}
          <div style={S.trialWrap}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:6 }}>
              <span style={{ color:"rgba(255,255,255,0.65)", fontWeight:500 }}>Deneme süresi</span>
              <span style={{ color:"rgba(255,255,255,0.3)" }}>8 gün kaldı</span>
            </div>
            <div style={{ height:4, background:"rgba(255,255,255,0.08)", borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", width:"73%", background:"#3b82f6", borderRadius:99 }} />
            </div>
            <Link href="/app/upgrade" style={{ display:"block", fontSize:11, fontWeight:700,
              color:"#60a5fa", marginTop:8, textDecoration:"none" }}>
              Pro&apos;ya yükselt →
            </Link>
          </div>

          {/* User row */}
          <div style={S.userRow}>
            <div style={S.avatar}>AK</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.75)",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                Hesabım
              </div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.22)" }}>
                <RoleBadge />
              </div>
            </div>
            <div style={{ display:"flex", gap:2 }}>
              <Link href="/app/settings" title="Ayarlar"
                style={{ background:"none", border:"none", cursor:"pointer",
                  color:"rgba(255,255,255,0.25)", padding:5, borderRadius:6,
                  display:"flex", alignItems:"center", textDecoration:"none" }}>
                <Ic d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" size={13} />
              </Link>
              <button onClick={logout} title="Çıkış"
                style={{ background:"none", border:"none", cursor:"pointer",
                  color:"rgba(255,255,255,0.25)", padding:5, borderRadius:6, display:"flex" }}>
                <Ic d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" size={13} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay (mobile) */}
      {mob && open && (
        <div onClick={() => setOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)",
            zIndex:49, backdropFilter:"blur(3px)" }} />
      )}

      {/* ════ MAIN ════ */}
      <div style={{ marginLeft: mob ? 0 : W, flex:1, display:"flex",
        flexDirection:"column", minHeight:"100vh", paddingBottom: mob ? 64 : 0 }}>

        {/* ── Topbar ── */}
        <header style={S.topbar}>
          {/* Left */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {mob && (
              <button onClick={() => setOpen(v => !v)}
                style={{ width:36, height:36, borderRadius:8, border:"1px solid #e5e7eb",
                  background:"#fff", cursor:"pointer", display:"flex",
                  alignItems:"center", justifyContent:"center", color:"#374151" }}>
                <Ic d="M4 6h16M4 12h16M4 18h16" size={16} />
              </button>
            )}
            {/* Role badge only – page title lives on each page itself */}
            <RoleBadge />
          </div>

          {/* Right */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {!mob && (
              <div style={{ display:"flex", alignItems:"center", gap:6,
                background:"#f3f4f6", border:"1px solid #e5e7eb", borderRadius:8,
                padding:"6px 14px", cursor:"pointer", minWidth:160 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <span style={{ fontSize:12.5, color:"#6b7280", flex:1 }}>Hızlı ara</span>
                <kbd style={{ fontSize:10, color:"#9ca3af", background:"#e5e7eb",
                  borderRadius:3, padding:"1px 5px", fontFamily:"monospace" }}>⌘K</kbd>
              </div>
            )}
            {/* Notification */}
            <button style={{ width:36, height:36, background:"#fff",
              border:"1px solid #e5e7eb", borderRadius:8, display:"flex",
              alignItems:"center", justifyContent:"center", cursor:"pointer",
              color:"#6b7280", position:"relative" }}>
              <Ic d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0" size={15} />
              <div style={{ position:"absolute", top:8, right:8, width:6, height:6,
                borderRadius:"50%", background:"#ef4444", border:"2px solid #fff" }} />
            </button>
            {/* CTA */}
            <Link href="/app/work-orders" style={{
              display:"inline-flex", alignItems:"center", gap:6,
              background:"#111827", color:"#fff", fontSize:12.5, fontWeight:700,
              padding:"8px 16px", borderRadius:8, textDecoration:"none", whiteSpace:"nowrap",
            }}>
              <Ic d="M12 5v14M5 12h14" size={13} />
              {!mob && "Yeni İş Emri"}
            </Link>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="page-animate" style={{ flex:1, padding: mob ? "20px 16px" : "28px 32px" }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {mob && (
        <nav style={{ position:"fixed", bottom:0, left:0, right:0, height:64,
          background:"#fff", borderTop:"1px solid #e5e7eb", zIndex:50,
          display:"flex", alignItems:"center" }}>
          {MOB.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", gap:3, padding:"8px 4px",
                color: active ? "#2563eb" : "#9ca3af",
                fontSize:9.5, fontWeight:600, textDecoration:"none",
              }}>
                <Ic d={item.icon} size={20} />
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <button onClick={() => setOpen(true)}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", gap:3, fontSize:9.5, fontWeight:600,
              color:"#9ca3af", background:"none", border:"none", cursor:"pointer",
              padding:"8px 4px", fontFamily:"inherit" }}>
            <Ic d="M4 6h16M4 12h16M4 18h16" size={20} />
            <span>Daha</span>
          </button>
        </nav>
      )}
    </div>
  );
}
