"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
import TrialCountdown from "./TrialCountdown";
import dynamic from "next/dynamic";
const RoleBadge = dynamic(() => import("./RoleBadge"), { ssr: false });

const I = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <defs><linearGradient id="lg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1d4ed8"/><stop offset="100%" stopColor="#7c3aed"/>
      </linearGradient></defs>
      <rect width="36" height="36" rx="10" fill="url(#lg)"/>
      <path d="M23 13C23 10 21 8 18 8C15 8 13 10 13 13C13 16.5 23 17 23 21C23 24 21 28 18 28C15 28 13 26 13 23"
        stroke="white" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

const NAV = [
  { group: "Ana", items: [
    { href: "/app/dashboard",   label: "Dashboard",       icon: "M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-10h8V3h-8z" },
    { href: "/app/work-orders", label: "İş Emirleri",     icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4", badge: "7" },
    { href: "/app/customers",   label: "Müşteriler",      icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z" },
    { href: "/app/assets",      label: "Asansörler",      icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
  ]},
  { group: "Saha", items: [
    { href: "/app/maintenance-plans", label: "Bakım Takvimi",     icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" },
    { href: "/app/inspections",       label: "Periyodik Kontrol", icon: "M9 12l2 2 4-4 M21 12c0 5-4 9-9 9s-9-4-9-9 4-9 9-9 9 4 9 9z" },
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
    { href: "/app/docs/teklif",    label: "Teklif Şablonu",    icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M9 15h6 M9 11h6" },
    { href: "/app/docs/sozlesme",  label: "Sözleşme Şablonu",  icon: "M9 12h6 M9 16h6 M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" },
  ]},
];

const ALL_NAV = NAV.flatMap(g => g.items);
const MOBILE_NAV = ALL_NAV.slice(0, 4);
const W = 248;

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const c = () => setIsMobile(window.innerWidth < 1024);
    c(); window.addEventListener("resize", c);
    return () => window.removeEventListener("resize", c);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const pageTitle = ALL_NAV.find(n => active(n.href))?.label ?? "Servisim";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }
  const mob = mounted && isMobile;

  return (
    <div style={{ minHeight:"100vh", background:"#f1f2f6", display:"flex", fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" }}>
      {/* SIDEBAR */}
      <aside style={{
        position:"fixed", top:0, left:0, width:W, height:"100vh",
        background:"#0d1117", display:"flex", flexDirection:"column",
        zIndex:40, overflowY:"auto", overflowX:"hidden",
        borderRight:"1px solid rgba(255,255,255,0.04)",
        ...(mob ? {
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition:"transform 0.22s cubic-bezier(.4,0,.2,1)",
          boxShadow: open ? "0 0 80px rgba(0,0,0,0.7)" : "none",
        } : {}),
      }}>
        {/* Logo */}
        <div style={{ padding:"20px 18px 14px", display:"flex", alignItems:"center", gap:12, flexShrink:0, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <Logo size={32}/>
          <div>
            <div style={{ fontSize:15, fontWeight:900, color:"#fff", letterSpacing:"-0.05em" }}>
              Servi<span style={{ color:"#60a5fa" }}>sim</span>
            </div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:2, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" }}>
              Asansör Operasyon
            </div>
          </div>
        </div>

        {/* Technician portal */}
        <div style={{ padding:"10px 12px 4px", flexShrink:0 }}>
          <Link href="/technician" style={{
            display:"flex", alignItems:"center", gap:9,
            background:"linear-gradient(135deg,rgba(37,99,235,0.18),rgba(124,58,237,0.18))",
            border:"1px solid rgba(96,165,250,0.18)", borderRadius:10, padding:"9px 12px",
            textDecoration:"none", transition:"all 0.15s",
          }}>
            <span style={{ fontSize:16, flexShrink:0 }}>🛗</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11.5, fontWeight:800, color:"#93c5fd" }}>Teknisyen Portalı</div>
              <div style={{ fontSize:9.5, color:"rgba(255,255,255,0.3)", marginTop:1 }}>Saha uygulaması</div>
            </div>
            <I d="M9 18l6-6-6-6" size={11}/>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ padding:"4px 8px", flex:1, overflowY:"auto" }}>
          {NAV.map(group => (
            <div key={group.group} style={{ marginBottom:10 }}>
              <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(255,255,255,0.16)", padding:"8px 10px 4px" }}>
                {group.group}
              </div>
              {group.items.map(item => {
                const isA = active(item.href);
                return (
                  <Link key={item.href} href={item.href} data-active={isA} style={{
                    display:"flex", alignItems:"center", gap:10,
                    padding:"8px 10px", borderRadius:9, marginBottom:1,
                    fontSize:13, fontWeight: isA ? 700 : 500,
                    color: isA ? "#fff" : "rgba(255,255,255,0.48)",
                    background: isA ? "rgba(37,99,235,0.2)" : "transparent",
                    textDecoration:"none", transition:"all 0.12s", position:"relative",
                  }}
                  onMouseEnter={e => { if (!isA) { (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color="rgba(255,255,255,0.8)"; }}}
                  onMouseLeave={e => { if (!isA) { (e.currentTarget as HTMLElement).style.background="transparent"; (e.currentTarget as HTMLElement).style.color="rgba(255,255,255,0.48)"; }}}
                  >
                    {isA && <span style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:3, height:18, background:"linear-gradient(180deg,#60a5fa,#2563eb)", borderRadius:3 }}/>}
                    <span style={{ width:16, color: isA ? "#60a5fa" : "rgba(255,255,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <I d={item.icon} size={14}/>
                    </span>
                    <span style={{ flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.label}</span>
                    {(item as { badge?: string }).badge && (
                      <span style={{ fontSize:9.5, fontWeight:700, background:"rgba(239,68,68,0.2)", color:"#f87171", border:"1px solid rgba(239,68,68,0.25)", padding:"1px 6px", borderRadius:999 }}>
                        {(item as { badge?: string }).badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding:"10px", borderTop:"1px solid rgba(255,255,255,0.05)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, padding:"6px 8px" }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#1d4ed8,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff", flexShrink:0 }}>
              AK
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.82)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>Hesabım</div>
              <div style={{ fontSize:9.5, color:"rgba(255,255,255,0.28)", marginTop:1 }}>Yönetici</div>
            </div>
            <Link href="/app/settings" title="Ayarlar" style={{ padding:5, color:"rgba(255,255,255,0.3)", display:"flex" }}>
              <I d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" size={14}/>
            </Link>
            <button onClick={logout} style={{ background:"none", border:"none", cursor:"pointer", padding:5, color:"rgba(255,255,255,0.3)", display:"flex" }}>
              <I d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" size={14}/>
            </button>
          </div>
        </div>
      </aside>

      {mob && open && <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:39, backdropFilter:"blur(4px)" }}/>}

      {/* BODY */}
      <div style={{ marginLeft: mob ? 0 : W, flex:1, minHeight:"100vh", paddingBottom: mob ? 64 : 0 }}>
        <header style={{
          position:"sticky", top:0, zIndex:30,
          background:"rgba(241,242,246,0.9)", backdropFilter:"blur(20px)",
          borderBottom:"1px solid rgba(0,0,0,0.05)",
          padding: mob ? "0 16px" : "0 28px",
          height:58, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {mob && (
              <button onClick={() => setOpen(v => !v)} style={{ width:36, height:36, borderRadius:9, border:"1px solid rgba(0,0,0,0.07)", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <I d="M4 6h16M4 12h16M4 18h16" size={16}/>
              </button>
            )}
            <div>
              <div style={{ fontSize:9.5, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.14em", color:"#a1a1aa", marginBottom:1 }}>Workspace</div>
              <div style={{ fontSize:15, fontWeight:900, color:"#0d1117", letterSpacing:"-0.03em" }}>{pageTitle}</div>
            </div>
            {!mob && <RoleBadge/>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button style={{ width:36, height:36, borderRadius:9, background:"#fff", border:"1px solid rgba(0,0,0,0.06)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative" }}>
              <I d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0" size={15}/>
              <div style={{ position:"absolute", top:7, right:7, width:7, height:7, borderRadius:"50%", background:"#ef4444", border:"2px solid #f1f2f6" }}/>
            </button>
            <Link href="/app/work-orders" style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#0d1117", color:"#fff", fontSize:12.5, fontWeight:700, padding:"8px 16px", borderRadius:9, textDecoration:"none", whiteSpace:"nowrap" }}>
              <I d="M12 5v14M5 12h14" size={13}/>{mob ? "" : "Yeni İş Emri"}
            </Link>
          </div>
        </header>
        <main style={{ padding: mob ? "16px" : "28px 32px" }}>{children}</main>
      </div>

      {mob && (
        <nav style={{ position:"fixed", bottom:0, left:0, right:0, height:64, background:"#fff", borderTop:"1px solid rgba(0,0,0,0.06)", zIndex:40, padding:"0 8px", display:"flex", alignItems:"center", justifyContent:"space-around", boxShadow:"0 -4px 20px rgba(0,0,0,0.05)" }}>
          {MOBILE_NAV.map(item => {
            const isA = active(item.href);
            return (
              <Link key={item.href} href={item.href} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, padding:"8px 4px", color: isA ? "#2563eb" : "#a1a1aa", fontSize:9.5, fontWeight:600, textDecoration:"none" }}>
                <I d={item.icon} size={19}/><span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <button onClick={() => setOpen(true)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, fontSize:9.5, fontWeight:600, color:"#a1a1aa", background:"none", border:"none", cursor:"pointer", padding:"8px 4px", fontFamily:"inherit" }}>
            <I d="M4 6h16M4 12h16M4 18h16" size={19}/><span>Daha</span>
          </button>
        </nav>
      )}
      <TrialCountdown/>
    </div>
  );
}
