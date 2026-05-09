"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
import dynamic from "next/dynamic";
const RoleBadge = dynamic(() => import("./RoleBadge"), { ssr: false });

/* ── SVG icon ── */
const Ic = ({ d, size = 15 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    style={{ display:"inline-flex", flexShrink:0, verticalAlign:"middle" }}>
    <path d={d} />
  </svg>
);

const NAV = [
  { group:"Ana Menü", items:[
    { href:"/app/dashboard",   label:"Dashboard",    icon:"M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-10h8V3h-8z" },
    { href:"/app/work-orders", label:"İş Emirleri",  icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4M9 12l2 2 4-4", badge:"7" },
    { href:"/app/customers",   label:"Müşteriler",   icon:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z" },
    { href:"/app/assets",      label:"Asansörler",   icon:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
  ]},
  { group:"Saha", items:[
    { href:"/app/maintenance-plans", label:"Bakım Takvimi",     icon:"M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" },
    { href:"/app/inspections",       label:"Periyodik Kontrol", icon:"M9 12l2 2 4-4M21 12c0 5-4 9-9 9s-9-4-9-9 4-9 9-9 9 4 9 9z" },
    { href:"/app/technicians",       label:"Teknisyenler",      icon:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z" },
    { href:"/app/calendar",          label:"Takvim",            icon:"M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" },
  ]},
  { group:"Finans", items:[
    { href:"/app/contracts", label:"Sözleşmeler", icon:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" },
    { href:"/app/invoices",  label:"Faturalar",   icon:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3" },
    { href:"/app/stock",     label:"Stok",        icon:"M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" },
    { href:"/app/reports",   label:"Raporlar",    icon:"M3 3v18h18 M9 17V9 M14 17V5 M19 17v-7" },
  ]},
  { group:"Personel", items:[
    { href:"/app/hr/leave-requests",   label:"İzin Talepleri",  icon:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { href:"/app/hr/expense-requests", label:"Gider Talepleri", icon:"M9 14l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  ]},
  { group:"Araçlar", items:[
    { href:"/app/settings",      label:"Ayarlar",          icon:"M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
    { href:"/app/docs/teklif",   label:"Teklif Şablonu",   icon:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M9 15h6 M9 11h6" },
    { href:"/app/docs/sozlesme", label:"Sözleşme Şablonu", icon:"M9 12h6 M9 16h6 M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" },
  ]},
];

const ALL  = NAV.flatMap(g => g.items);
const MOB4 = ALL.slice(0, 4);
const SW   = 252;
const NO_SHELL = ["/auth","/blog","/public","/marketing","/kvkk","/terms","/privacy","/offline","/service-forms"];

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open,    setOpen]    = useState(false);
  const [isMob,   setIsMob]   = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const upd = () => setIsMob(window.innerWidth < 1024);
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  if (NO_SHELL.some(p => pathname.startsWith(p))) return <>{children}</>;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const mob = mounted && isMob;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  return (
    <>
      <style>{`
        html,body{margin:0;padding:0;}
        .snl{
          display:flex;align-items:center;gap:9px;
          padding:7px 11px;margin:1px 10px;border-radius:7px;
          text-decoration:none;font-size:13px;font-weight:500;
          color:var(--sidebar-text);position:relative;
          transition:background .1s,color .1s;
        }
        .snl:hover{background:var(--sidebar-hover);color:var(--sidebar-text-active);}
        .snl.on{background:var(--sidebar-active);color:var(--sidebar-text-active);font-weight:600;}
        .snl .snl-dot{
          position:absolute;left:0;top:50%;transform:translateY(-50%);
          width:3px;height:18px;background:var(--sidebar-accent);
          border-radius:0 3px 3px 0;
        }
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:99px;}
        .snav-group{
          font-size:9.5px;font-weight:700;color:rgba(245,242,236,0.3);
          letter-spacing:1px;text-transform:uppercase;padding:14px 16px 5px;
        }
        .snav-group:first-child{padding-top:8px;}
      `}</style>

      {/* ══ SIDEBAR ══ */}
      <aside style={{
        position:"fixed", top:0, left:0, width:SW, height:"100vh",
        background:"var(--sidebar-bg)",
        display:"flex", flexDirection:"column",
        zIndex:60, borderRight:"1px solid var(--sidebar-border)",
        overflowY:"auto", overflowX:"hidden", scrollbarWidth:"none",
        ...(mob ? {
          transform: open ? "translateX(0)" : `translateX(-${SW}px)`,
          transition:"transform .24s cubic-bezier(.4,0,.2,1)",
          boxShadow: open ? "4px 0 40px rgba(0,0,0,.5)" : "none",
        } : {}),
      } as React.CSSProperties}>

        {/* Brand */}
        <div style={{
          padding:"18px 16px 14px",
          display:"flex", alignItems:"center", gap:10,
          borderBottom:"1px solid var(--sidebar-border)", flexShrink:0,
        }}>
          <div style={{
            width:36, height:36,
            background:"linear-gradient(135deg,#1B1F2B,#2A3040)",
            borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center",
            border:"2px solid var(--sidebar-border)", flexShrink:0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="3" width="14" height="18" rx="2.5" stroke="#F5F2EC" strokeWidth="1.8"/>
              <path d="M9 8l3-3 3 3M9 16l3 3 3-3" stroke="#F0C060" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:15, fontWeight:800, color:"#F5F2EC", letterSpacing:"-0.3px", lineHeight:1 }}>Servisim</div>
            <div style={{ fontSize:9.5, fontWeight:600, color:"rgba(245,242,236,0.4)", letterSpacing:"0.8px", textTransform:"uppercase", marginTop:3 }}>Asansör Operasyon</div>
          </div>
          <span style={{
            background:"rgba(240,192,96,0.15)", color:"#F0C060",
            fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:4,
            letterSpacing:"0.5px", border:"1px solid rgba(240,192,96,0.3)", flexShrink:0,
          }}>PRO</span>
        </div>

        {/* Search */}
        <div style={{ padding:"10px 12px", borderBottom:"1px solid var(--sidebar-border)", flexShrink:0 }}>
          <div style={{
            display:"flex", alignItems:"center", gap:8,
            background:"rgba(255,255,255,0.05)", border:"1px solid var(--sidebar-border)",
            borderRadius:7, padding:"7px 10px", cursor:"pointer",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(245,242,236,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-flex", flexShrink:0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span style={{ fontSize:12, color:"rgba(245,242,236,0.3)", flex:1 }}>Ara...</span>
            <kbd style={{ fontSize:10, color:"rgba(245,242,236,0.25)", background:"rgba(255,255,255,0.06)", borderRadius:3, padding:"1px 5px", fontFamily:"monospace" }}>⌘K</kbd>
          </div>
        </div>

        {/* Teknisyen portalı link */}
        <div style={{ margin:"10px 12px", flexShrink:0 }}>
          <Link href="/technician" style={{
            display:"flex", alignItems:"center", gap:9,
            background:"rgba(240,192,96,0.12)",
            border:"1px solid rgba(240,192,96,0.25)",
            borderRadius:9, padding:"10px 12px", textDecoration:"none",
          }}>
            <div style={{
              width:30, height:30,
              background:"rgba(240,192,96,0.2)", borderRadius:7,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F0C060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-flex", flexShrink:0 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#F0C060", lineHeight:1.2 }}>Teknisyen Portalı</div>
              <div style={{ fontSize:10, color:"rgba(240,192,96,0.6)", marginTop:2 }}>Saha uygulaması</div>
            </div>
            <span style={{ color:"rgba(240,192,96,0.5)", fontSize:14 }}>›</span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:"auto", scrollbarWidth:"none" as const, paddingBottom:8 }}>
          {NAV.map(group => (
            <div key={group.group}>
              <div className="snav-group">{group.group}</div>
              {group.items.map(item => {
                const on = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} className={`snl${on ? " on" : ""}`}>
                    {on && <span className="snl-dot" />}
                    <span style={{
                      width:15, height:15, display:"inline-flex", alignItems:"center",
                      justifyContent:"center", flexShrink:0,
                      color: on ? "#F0C060" : "rgba(245,242,236,0.4)",
                    }}>
                      <Ic d={item.icon} size={15} />
                    </span>
                    <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>
                      {item.label}
                    </span>
                    {(item as {badge?:string}).badge && (
                      <span style={{
                        marginLeft:"auto", background:"#C0311A", color:"#fff",
                        fontSize:10, fontWeight:700, minWidth:18, height:18,
                        borderRadius:9, padding:"0 5px",
                        display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                      }}>
                        {(item as {badge?:string}).badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ flexShrink:0, borderTop:"1px solid var(--sidebar-border)" }}>
          {/* Trial bar */}
          <div style={{ margin:"12px 12px 4px", background:"rgba(255,255,255,0.05)", borderRadius:9, padding:"10px 12px", border:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:6 }}>
              <span style={{ color:"rgba(245,242,236,0.7)", fontWeight:600 }}>Deneme süresi</span>
              <span style={{ color:"rgba(245,242,236,0.4)" }}>8 gün kaldı</span>
            </div>
            <div style={{ height:4, background:"rgba(255,255,255,0.08)", borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", width:"73%", background:"#F0C060", borderRadius:99 }} />
            </div>
            <Link href="/app/upgrade" style={{ display:"block", fontSize:11, fontWeight:700, color:"#F0C060", marginTop:8, textDecoration:"none" }}>
              Pro&apos;ya yükselt →
            </Link>
          </div>
          {/* User row */}
          <div style={{ padding:"10px 12px", display:"flex", alignItems:"center", gap:9 }}>
            <div style={{
              width:32, height:32, borderRadius:"50%", flexShrink:0,
              background:"linear-gradient(135deg,#C87800,#F0C060)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12, fontWeight:800, color:"#fff",
            }}>AK</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"rgba(245,242,236,0.85)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>Hesabım</div>
              <div style={{ fontSize:10, color:"rgba(245,242,236,0.4)" }}><RoleBadge /></div>
            </div>
            <div style={{ display:"flex", gap:4 }}>
              <Link href="/app/settings" title="Ayarlar" style={{ color:"rgba(245,242,236,0.4)", padding:4, borderRadius:4, display:"inline-flex", alignItems:"center", textDecoration:"none" }}>
                <Ic d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" size={13} />
              </Link>
              <button onClick={logout} title="Çıkış" style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(245,242,236,0.4)", padding:4, borderRadius:4, display:"inline-flex", alignItems:"center" }}>
                <Ic d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" size={13} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mob && open && (
        <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:59, backdropFilter:"blur(2px)" }} />
      )}

      {/* ══ MAIN CONTENT ══ */}
      <div style={{
        position:"fixed", top:0,
        left: mob ? 0 : SW,
        right: 0, bottom: 0,
        overflowY:"auto",
        background:"var(--background)",
        paddingBottom: mob ? 64 : 0,
        zIndex:10,
      }}>
        {/* Top bar (mobile only) */}
        {mob && (
          <div style={{
            position:"sticky", top:0, zIndex:20,
            background:"var(--sidebar-bg)", borderBottom:"1px solid var(--sidebar-border)",
            padding:"12px 16px", display:"flex", alignItems:"center", gap:12,
          }}>
            <button onClick={() => setOpen(true)} style={{
              background:"rgba(255,255,255,0.07)", border:"1px solid var(--sidebar-border)",
              borderRadius:7, width:36, height:36, display:"flex", alignItems:"center",
              justifyContent:"center", cursor:"pointer", color:"#F5F2EC",
            }}>
              <Ic d="M4 6h16M4 12h16M4 18h16" size={18} />
            </button>
            <div style={{ fontSize:15, fontWeight:800, color:"#F5F2EC" }}>Servisim</div>
          </div>
        )}
        <main className="page-animate" style={{ padding: mob ? "20px 16px" : "28px 32px" }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {mob && (
        <nav style={{
          position:"fixed", bottom:0, left:0, right:0, height:64,
          background:"var(--sidebar-bg)", borderTop:"1px solid var(--sidebar-border)",
          zIndex:50, display:"flex", alignItems:"center",
        }}>
          {MOB4.map(item => {
            const on = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", gap:3, padding:"8px 4px",
                color: on ? "#F0C060" : "rgba(245,242,236,0.35)",
                fontSize:9.5, fontWeight:600, textDecoration:"none",
              }}>
                <Ic d={item.icon} size={20} />
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <button onClick={() => setOpen(true)} style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center",
            justifyContent:"center", gap:3, fontSize:9.5, fontWeight:600,
            color:"rgba(245,242,236,0.35)", background:"none", border:"none",
            cursor:"pointer", padding:"8px 4px", fontFamily:"inherit",
          }}>
            <Ic d="M4 6h16M4 12h16M4 18h16" size={20} />
            <span>Daha</span>
          </button>
        </nav>
      )}
    </>
  );
}
