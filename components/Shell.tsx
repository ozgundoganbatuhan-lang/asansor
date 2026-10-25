"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
import InstallApp from "./InstallApp";

/* ── SVG icon ── */
const Ic = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const I = {
  dash: "M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-10h8V3h-8z",
  wo: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4M9 12l2 2 4-4",
  cust: "M3 21V7l9-4 9 4v14M9 21v-6h6v6M8 10h.01M12 10h.01M16 10h.01",
  lift: "M6 2h12a1 1 0 011 1v18a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1zM12 2v20M8.5 8l1.5-1.5L11.5 8M12.5 16l1.5 1.5 1.5-1.5",
  plan: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zM8 14h3",
  insp: "M9 12l2 2 4-4M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z",
  tech: "M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z",
  cal: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z",
  contract: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8",
  invoice: "M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4",
  stock: "M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8",
  report: "M3 3v18h18M8 17V10M13 17V6M18 17v-4",
  leave: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zM9 15l2 2 4-4",
  expense: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1A1.7 1.7 0 009 19.4a1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1A1.7 1.7 0 009 4.6 1.7 1.7 0 0010 3.1V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8 1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z",
  doc: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 15h6M9 11h6",
  menu: "M4 6h16M4 12h16M4 18h10",
  out: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  field: "M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  x: "M18 6L6 18M6 6l12 12",
};

const NAV = [
  { group: "Operasyon", items: [
    { href: "/app/dashboard", label: "Genel bakış", icon: I.dash },
    { href: "/app/work-orders", label: "İş emirleri", icon: I.wo },
    { href: "/app/customers", label: "Müşteriler", icon: I.cust },
    { href: "/app/assets", label: "Asansörler", icon: I.lift },
  ]},
  { group: "Saha", items: [
    { href: "/app/maintenance-plans", label: "Bakım planı", icon: I.plan },
    { href: "/app/inspections", label: "Periyodik kontrol", icon: I.insp },
    { href: "/app/technicians", label: "Teknisyenler", icon: I.tech },
    { href: "/app/calendar", label: "Takvim", icon: I.cal },
  ]},
  { group: "Finans", items: [
    { href: "/app/contracts", label: "Sözleşmeler", icon: I.contract },
    { href: "/app/invoices", label: "Faturalar", icon: I.invoice },
    { href: "/app/stock", label: "Stok", icon: I.stock },
    { href: "/app/reports", label: "Raporlar", icon: I.report },
  ]},
  { group: "Ekip", items: [
    { href: "/app/hr/leave-requests", label: "İzin talepleri", icon: I.leave },
    { href: "/app/hr/expense-requests", label: "Gider talepleri", icon: I.expense },
  ]},
  { group: "Ayarlar", items: [
    { href: "/app/settings", label: "Firma ayarları", icon: I.settings },
    { href: "/app/docs/teklif", label: "Teklif şablonu", icon: I.doc },
    { href: "/app/docs/sozlesme", label: "Sözleşme şablonu", icon: I.doc },
  ]},
];

const MOB = [NAV[0].items[0], NAV[0].items[1], NAV[0].items[3], NAV[1].items[0]];
const NO_SHELL = ["/auth", "/blog", "/public", "/marketing", "/kvkk", "/terms", "/privacy", "/offline", "/service-forms"];
const ROLE: Record<string, string> = { OWNER: "Firma sahibi", MANAGER: "Yönetici", TECHNICIAN: "Teknisyen", OFFICE: "Ofis", MEMBER: "Ekip üyesi" };

type Me = { name: string | null; email: string | null; role: string; orgName: string | null };
type Ent = { isTrial: boolean; isExpired: boolean; daysLeft: number };

function initials(s: string) {
  return s.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toLocaleUpperCase("tr")).join("");
}

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [ent, setEnt] = useState<Ent | null>(null);
  const shell = !NO_SHELL.some(p => pathname.startsWith(p));

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!shell) return;
    fetch("/api/me").then(r => (r.ok ? r.json() : null)).then(d => d && setMe(d)).catch(() => {});
    fetch("/api/entitlements").then(r => (r.ok ? r.json() : null)).then(d => d && setEnt(d)).catch(() => {});
  }, [shell]);

  if (!shell) return <>{children}</>;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const who = me?.name || me?.email || "";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  return (
    <div className="sh">
      <aside className={`sh-side${open ? " is-open" : ""}`} aria-label="Ana menü">
        <div className="sh-brand">
          <span className="sh-logo" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="2.5" width="14" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M9 8.5l3-3 3 3M9 15.5l3 3 3-3" stroke="var(--sidebar-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="sh-brand-t">
            <b>Servisim</b>
            <small>{me?.orgName || "Asansör servis"}</small>
          </span>
          <button className="sh-close" onClick={() => setOpen(false)} aria-label="Menüyü kapat"><Ic d={I.x} /></button>
        </div>

        <Link href="/technician" className="sh-field">
          <Ic d={I.field} size={15} />
          <span>Saha ekranı</span>
          <em>Teknisyen</em>
        </Link>

        <nav className="sh-nav">
          {NAV.map(g => (
            <div key={g.group} className="sh-group">
              <div className="sh-group-t">{g.group}</div>
              {g.items.map(it => {
                const on = isActive(it.href);
                return (
                  <Link key={it.href} href={it.href} className={`sh-link${on ? " on" : ""}`} aria-current={on ? "page" : undefined}>
                    <Ic d={it.icon} size={15} />
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sh-foot">
          {ent?.isTrial && (
            <Link href="/app/upgrade" className={`sh-trial${ent.isExpired ? " is-over" : ""}`}>
              <span className="sh-trial-row">
                <b>{ent.isExpired ? "Deneme süresi bitti" : "Ücretsiz deneme"}</b>
                {!ent.isExpired && <span>{ent.daysLeft} gün kaldı</span>}
              </span>
              <span className="sh-bar"><i style={{ width: `${Math.max(6, Math.min(100, ((7 - ent.daysLeft) / 7) * 100))}%` }} /></span>
              <span className="sh-trial-cta">{ent.isExpired ? "Planı seçin →" : "Planları gör →"}</span>
            </Link>
          )}
          <InstallApp className="sh-install" />
          <div className="sh-user">
            <span className="sh-av">{who ? initials(who) : "·"}</span>
            <span className="sh-user-t">
              <b>{who || "Hesabım"}</b>
              <small>{me ? ROLE[me.role] ?? me.role : ""}</small>
            </span>
            <button onClick={logout} className="sh-icon-btn" title="Çıkış yap" aria-label="Çıkış yap"><Ic d={I.out} size={15} /></button>
          </div>
        </div>
      </aside>

      {open && <div className="sh-scrim" onClick={() => setOpen(false)} />}

      <div className="sh-main">
        <header className="sh-top">
          <button className="sh-icon-btn" onClick={() => setOpen(true)} aria-label="Menüyü aç"><Ic d={I.menu} size={19} /></button>
          <span className="sh-top-t">Servisim</span>
          <InstallApp className="sh-install-top" label="Yükle" />
        </header>
        <main key={pathname} className="sh-page">{children}</main>
      </div>

      <nav className="sh-tabs" aria-label="Hızlı menü">
        {MOB.map(it => {
          const on = isActive(it.href);
          return (
            <Link key={it.href} href={it.href} className={on ? "on" : ""} aria-current={on ? "page" : undefined}>
              <Ic d={it.icon} size={19} />
              <span>{it.label.split(" ")[0]}</span>
            </Link>
          );
        })}
        <button onClick={() => setOpen(true)}>
          <Ic d={I.menu} size={19} />
          <span>Menü</span>
        </button>
      </nav>
    </div>
  );
}
