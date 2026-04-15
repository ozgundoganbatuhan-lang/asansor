"use client";
import Link from "next/link";
import { getAllBlogPosts } from "@/lib/blog";
import { useState, useEffect } from "react";

const WA = "https://wa.me/4915566196266?text=Servisim%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum";

const OUTCOMES = [
  { icon: "⚡", title: "Operasyon tek merkezde", desc: "WhatsApp, Excel ve telefon trafiğini tek akışta toplayın. Ofis aynı ekrandan görsün, teknisyen aynı kaydın üstünde çalışsın." },
  { icon: "📱", title: "Teknisyen mobil akışı", desc: "İş emri, rota, fotoğraf, not ve imza sahada gereksiz adım olmadan ilerlesin. Ana ekrana yüklenebilir PWA." },
  { icon: "📅", title: "Bakım ritmi kaçmasın", desc: "Periyodik planlar otomatik iş emrine dönüşsün. Unutulan ziyaretler ve son dakika stresi azalsın." },
  { icon: "🔒", title: "Müşteri güveni güçlensin", desc: "QR geçmişi, servis özeti ve kanıtlı kapanış sayesinde bina yönetimi ne yapıldığını net görsün." },
];

const MODULES = [
  { color: "#2563eb", bg: "#eff6ff", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4", title: "İş emirleri & dispatch", desc: "Arıza, bakım ve keşif taleplerini kaydedin, önceliklendirin, doğru teknisyene atayın." },
  { color: "#7c3aed", bg: "#f5f3ff", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z", title: "Mobil saha akışı", desc: "Teknisyenler işi açar, lokasyona gider, fotoğraf çeker, notu girer ve imza alır." },
  { color: "#059669", bg: "#ecfdf5", icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z", title: "Bakım planı otomasyonu", desc: "Aylık ve yıllık ritmi bir kez tanımlayın; sistem zamanı gelince işi oluştursun." },
  { color: "#dc2626", bg: "#fef2f2", icon: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM17 14h3v3h-3zM14 17h3v3h-3z", title: "QR etiket & geçmiş", desc: "Her asansör için benzersiz kayıt. Bina yöneticisi QR okutunca geçmiş ve bakım özeti açılsın." },
  { color: "#d97706", bg: "#fffbeb", icon: "M8 3h8l5 5v11a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2zm8 0v5h5", title: "Sözleşme & tahsilat", desc: "Bakım sözleşmelerini, yenilemeleri ve servis fatura akışını dağılmadan takip edin." },
  { color: "#0891b2", bg: "#ecfeff", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z", title: "Rol bazlı ekip", desc: "Ofis, yönetici ve teknisyen için farklı görünüm. Herkes sadece görmesi gerekeni görsün." },
];

const STEPS = [
  { n: "01", title: "Çağrı kayda girer", desc: "Ofis saniyeler içinde iş emri açar; müşteri, bina, cihaz ve öncelik tek formda toplanır." },
  { n: "02", title: "Teknisyen işi alır", desc: "Saha ekibi rota, adres, geçmiş kayıt ve yapılacaklar listesine tek ekrandan erişir." },
  { n: "03", title: "Servis tamamlanır", desc: "Fotoğraflar, notlar ve müşteri imzası iş emrinin altında toplanır." },
  { n: "04", title: "Kapanış ve fatura", desc: "Ofis sonucu anında görür; geciken takip işleri azalır, akış öngörülebilir hale gelir." },
];

const PERSONAS = [
  { emoji: "🔧", role: "Saha ekibi", desc: "Az dokunuşlu mobil deneyim. Büyük butonlar, net görev akışı, fotoğraf ve imza odaklı.", items: ["Günlük iş listesi", "Rota & navigasyon", "Fotoğraf yükleme", "İmza ekranı"] },
  { emoji: "🖥️", role: "Ofis & operasyon", desc: "Dağınık kayıtları toparlayan kontrol merkezi. Kimin nerede, hangi iş gecikmiş — tek bakışta.", items: ["Açık iş emirleri", "Teknisyen durumu", "Gecikme uyarıları", "Bakım takvimi"] },
  { emoji: "🏢", role: "Bina yöneticisi", desc: "QR üzerinden anlaşılır geçmiş görünümü. Yapılan işi göstermek kolaylaşır, güven kuvvetlenir.", items: ["QR servis geçmişi", "Son bakım tarihi", "Servis özeti", "Firma bilgisi"] },
];

const FAQ = [
  { q: "Servisim kimler için tasarlandı?", a: "Asansör bakım ve servis firmaları için. Özellikle birden fazla teknisyenle çalışan, bakım planı ve arıza akışını tek merkezde toplamak isteyen ekiplerde değer üretir." },
  { q: "Teknisyenler sahada nasıl kullanıyor?", a: "Her teknisyen işlerini mobil akışla açar; rota, iş detayı, fotoğraf, not ve imza sahada tamamlanır. PWA sayesinde uygulama gibi kullanılır." },
  { q: "QR etiket ne sağlıyor?", a: "Her asansörü dijital kayda bağlar. Geçmişi, son bakım bilgisini ve servis özetini daha görünür hale getirir. Bina yöneticisi okutarak tüm tarihe anında ulaşır." },
  { q: "Sadece arıza yönetimi mi?", a: "Hayır. Arıza, periyodik bakım, yıllık kontrol, revizyon ve sözleşme bağlantılı saha süreçlerini aynı omurgada yönetmek için kurgulandı." },
  { q: "Veri güvenliği nasıl sağlanıyor?", a: "Tüm veriler şifreli bağlantıyla iletilir, sunucu tarafında güvenli depolanır. Rol bazlı erişim kontrolü ile her kullanıcı sadece görmesi gereken veriyi görür." },
];

function Ico({ d, s = 18, c = "currentColor" }: { d: string; s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}
function WaIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>;
}

function DashMockup() {
  const rows = [
    { code: "#1042", name: "Merkez AVM",   type: "Bakım",   tech: "Mehmet Y.", status: "Atandı",     sc: "#059669", sb: "#d1fae5" },
    { code: "#1041", name: "Kule Res.",     type: "Arıza",   tech: "Ali K.",    status: "Yolda",      sc: "#d97706", sb: "#fef3c7" },
    { code: "#1040", name: "Star Plaza",    type: "Kontrol", tech: "Ahmet D.", status: "Tamamlandı", sc: "#2563eb", sb: "#eff6ff" },
    { code: "#1039", name: "Panorama Apt.", type: "Bakım",   tech: "—",         status: "Bekliyor",   sc: "#dc2626", sb: "#fef2f2" },
  ];
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.10)", fontSize: 12 }}>
      <div style={{ background: "#1f2937", padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
        {["#ef4444","#f59e0b","#22c55e"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
        <div style={{ flex: 1, background: "#374151", borderRadius: 5, height: 20, marginLeft: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#9ca3af", fontSize: 10 }}>app.servisim.com/dashboard</span>
        </div>
      </div>
      <div style={{ display: "flex", height: 310 }}>
        <div style={{ width: 44, background: "#111827", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 10 }}>S</span>
          </div>
          {[0,1,2,3].map(i => <div key={i} style={{ width: 28, height: 28, borderRadius: 7, background: i === 0 ? "rgba(37,99,235,0.25)" : "rgba(255,255,255,0.06)", border: i === 0 ? "1px solid rgba(37,99,235,0.4)" : "none" }} />)}
        </div>
        <div style={{ flex: 1, background: "#f9fafb", padding: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7, marginBottom: 10 }}>
            {[{l:"Aktif",v:"24",c:"#2563eb"},{l:"Acil",v:"3",c:"#dc2626"},{l:"Bakım",v:"8",c:"#059669"},{l:"Gelir",v:"₺42K",c:"#7c3aed"}].map(s => (
              <div key={s.l} style={{ background: "#fff", borderRadius: 8, padding: "7px 9px", border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: s.c, letterSpacing: "-0.03em" }}>{s.v}</div>
                <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 1, fontWeight: 600 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ padding: "6px 12px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>Aktif İş Emirleri</span>
              <span style={{ fontSize: 9, color: "#2563eb", fontWeight: 600 }}>Tümünü gör →</span>
            </div>
            {rows.map((r, i) => (
              <div key={i} style={{ padding: "6px 12px", borderBottom: i < 3 ? "1px solid #f9fafb" : "none", display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontFamily: "monospace", fontSize: 9, color: "#9ca3af", width: 30, fontWeight: 600 }}>{r.code}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#111827", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                <span style={{ fontSize: 9, color: "#6b7280", width: 42 }}>{r.type}</span>
                <span style={{ fontSize: 9, color: "#6b7280", width: 48, overflow: "hidden", textOverflow: "ellipsis" }}>{r.tech}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: r.sc, background: r.sb, padding: "2px 6px", borderRadius: 999, whiteSpace: "nowrap" }}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileMockup() {
  return (
    <div style={{ width: 182, margin: "0 auto", background: "#111827", borderRadius: 30, padding: "9px 7px", boxShadow: "0 28px 56px rgba(0,0,0,0.32)", border: "5px solid #1f2937" }}>
      <div style={{ background: "#f9fafb", borderRadius: 22, overflow: "hidden", height: 330, position: "relative", fontFamily: "system-ui,sans-serif" }}>
        <div style={{ background: "#2563eb", padding: "9px 13px 7px", color: "#fff" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "-0.02em" }}>Servisim</div>
          <div style={{ fontSize: 9, opacity: 0.65, marginTop: 1 }}>Mehmet Y. · Bugün 6 iş</div>
        </div>
        <div style={{ padding: 8 }}>
          {[
            { name: "Merkez AVM",    addr: "Kat 2 - A Kapı",  type: "Bakım",   urgent: false },
            { name: "Kule Residans", addr: "B Blok Asansör", type: "Arıza",   urgent: true  },
            { name: "Star Plaza",    addr: "Zemin Kat",       type: "Kontrol", urgent: false },
          ].map((j, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "9px 11px", marginBottom: 5, border: j.urgent ? "1.5px solid #fca5a5" : "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>{j.name}</div>
                  <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>{j.addr}</div>
                </div>
                <span style={{ fontSize: 8, fontWeight: 700, color: j.urgent ? "#dc2626" : "#059669", background: j.urgent ? "#fef2f2" : "#ecfdf5", padding: "2px 6px", borderRadius: 999 }}>{j.type}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-around", padding: "7px 0" }}>
          {["🏠","📋","📍","👤"].map((icon, i) => <div key={i} style={{ fontSize: 13, opacity: i === 0 ? 1 : 0.32 }}>{icon}</div>)}
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const posts = getAllBlogPosts().slice(0, 3);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const s = {
    section:   { maxWidth: 1200, margin: "0 auto", padding: "72px 24px" } as React.CSSProperties,
    eyebrow:   { fontSize: 11, fontWeight: 800 as const, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#2563eb", marginBottom: 10 },
    h2:        { fontSize: "clamp(24px,3vw,38px)", fontWeight: 800 as const, letterSpacing: "-0.04em", lineHeight: 1.1, color: "#111827", margin: "0 0 12px" },
    sub:       { fontSize: 15, lineHeight: 1.7, color: "#6b7280", margin: 0 },
  };

  return (
    <div style={{ background: "#fff", color: "#111827", fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif", overflowX: "hidden" }}>

      {/* NAVBAR */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: scrolled ? "rgba(255,255,255,0.97)" : "#fff", borderBottom: scrolled ? "1px solid #e5e7eb" : "1px solid transparent", backdropFilter: "blur(20px)", transition: "all 0.2s" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <div style={{ width: 31, height: 31, borderRadius: 8, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(37,99,235,0.28)" }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1 }}>Servisim</div>
              <div style={{ fontSize: 9, color: "#9ca3af", lineHeight: 1, marginTop: 1 }}>Asansör Operasyon</div>
            </div>
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: 2 }} className="lp-desktnav">
            {[["Ürün","#urun"],["Modüller","#moduller"],["Nasıl çalışır","#akis"],["SSS","#sss"],["Blog","/blog"]].map(([l,h]) => (
              <a key={l} href={h} style={{ fontSize: 13, fontWeight: 500, color: "#6b7280", textDecoration: "none", padding: "5px 10px", borderRadius: 6, transition: "all 0.12s" }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = "#111827"; (e.target as HTMLElement).style.background = "#f3f4f6"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = "#6b7280"; (e.target as HTMLElement).style.background = "transparent"; }}
              >{l}</a>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/auth/login" className="lp-loginbtn" style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textDecoration: "none", padding: "7px 12px", borderRadius: 7 }}>Giriş yap</Link>
            <Link href="/auth/register" style={{ background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 700, padding: "8px 16px", borderRadius: 8, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, boxShadow: "0 3px 12px rgba(37,99,235,0.28)" }}>
              Ücretsiz başla
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7l7 7-7 7"/></svg>
            </Link>
            <button onClick={() => setMobileMenu(v => !v)} className="lp-hambtn" style={{ display: "none", padding: 7, borderRadius: 7, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer" }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2} strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "10px 24px 14px" }}>
            {[["Ürün","#urun"],["Modüller","#moduller"],["Nasıl çalışır","#akis"],["SSS","#sss"],["Blog","/blog"]].map(([l,h]) => (
              <a key={l} href={h} onClick={() => setMobileMenu(false)} style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", padding: "9px 0", borderBottom: "1px solid #f3f4f6", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        )}
      </header>

      {/* HERO */}
      <section style={s.section}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }} className="lp-herogrid">
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 999, padding: "5px 13px", marginBottom: 22 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", letterSpacing: "0.01em" }}>Asansör servis ekipleri için</span>
            </div>
            <h1 style={{ fontSize: "clamp(32px,4.5vw,50px)", fontWeight: 900, lineHeight: 1.06, letterSpacing: "-0.04em", color: "#111827", margin: "0 0 18px" }}>
              Saha ekibinizi kontrol edin,{" "}
              <span style={{ background: "linear-gradient(135deg,#2563eb,#0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>bakım ritmini koruyun,</span>{" "}
              müşterinizi etkileyin.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: "#6b7280", margin: "0 0 28px", maxWidth: 480 }}>
              Servisim; arıza ve bakım iş emirlerini, teknisyen mobil akışını, QR tabanlı servis şeffaflığını ve sözleşme takibini tek platformda birleştirir.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
              <Link href="/auth/register" style={{ background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700, padding: "11px 22px", borderRadius: 9, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, boxShadow: "0 5px 18px rgba(37,99,235,0.32)" }}>
                14 gün ücretsiz dene
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7l7 7-7 7"/></svg>
              </Link>
              <a href={WA} target="_blank" rel="noopener noreferrer" style={{ background: "#fff", border: "1.5px solid #e5e7eb", color: "#374151", fontSize: 14, fontWeight: 600, padding: "11px 22px", borderRadius: 9, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <WaIcon /> WhatsApp ile bilgi al
              </a>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              {["Kredi kartı gerekmez","Kurulum yok","Türkçe destek","PWA · mobil hazır"].map(t => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6b7280" }}>
                  <svg width={14} height={14} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#d1fae5" stroke="#a7f3d0" strokeWidth="1"/><path d="M5 8l2 2 4-4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", inset: -40, background: "radial-gradient(circle at 55% 40%,rgba(37,99,235,0.07) 0%,transparent 70%)", pointerEvents: "none" }} />
            <DashMockup />
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", padding: "64px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ maxWidth: 520, marginBottom: 36 }}>
            <div style={s.eyebrow}>Değer önerisi</div>
            <h2 style={s.h2}>Servis operasyonunuzun her adımı tek sistemde.</h2>
            <p style={s.sub}>Ofisteki koordinasyonu hızlandırır, sahayı kolaylaştırır, müşteriye güven veren şeffaflık kurar.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }} className="lp-g4">
            {OUTCOMES.map(o => (
              <div key={o.title} style={{ background: "#fff", borderRadius: 14, padding: "18px 16px", border: "1px solid #e5e7eb", transition: "all 0.14s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(37,99,235,0.10)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                <div style={{ fontSize: 22, marginBottom: 9 }}>{o.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 5, letterSpacing: "-0.02em" }}>{o.title}</div>
                <p style={{ fontSize: 12, lineHeight: 1.6, color: "#6b7280", margin: 0 }}>{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT */}
      <section id="urun" style={s.section}>
        {/* Technician */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 52, alignItems: "center", marginBottom: 68 }} className="lp-featgrid">
          <div>
            <div style={s.eyebrow}>Teknisyen deneyimi</div>
            <h2 style={s.h2}>Sahada hızlı karar verdiren, gereksiz adımı azaltan mobil uygulama.</h2>
            <p style={{ ...s.sub, marginBottom: 20 }}>Adres, geçmiş servis, yapılacaklar, fotoğraf, not ve imza aynı iş emrinin içinde toplanır.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {["İş emrine tek dokunuşla erişim","Lokasyon ve rota görünümü","Fotoğraf & servis kanıtı","Müşteri imzasıyla kapanış"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: 7, background: "#f9fafb", borderRadius: 8, padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#374151", border: "1px solid #e5e7eb" }}>
                  <svg width={13} height={13} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><path d="M3 8l3 3 7-7" stroke="#2563eb" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "linear-gradient(135deg,#111827 0%,#1e3a8a 100%)", borderRadius: 20, padding: "36px 20px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 360 }}>
            <MobileMockup />
          </div>
        </div>

        {/* QR */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 52, alignItems: "center" }} className="lp-featgrid lp-featreverse">
          <div style={{ background: "linear-gradient(135deg,#eff6ff,#dbeafe)", borderRadius: 18, padding: 28, border: "1px solid #bfdbfe" }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 8px 24px rgba(37,99,235,0.11)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>Servis Geçmişi</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em" }}>Merkez AVM</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>B Blok · Asansör #2</div>
                </div>
                <div style={{ width: 34, height: 34, background: "#eff6ff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏢</div>
              </div>
              <div style={{ background: "#059669", color: "#fff", borderRadius: 7, padding: "7px 11px", fontSize: 11, fontWeight: 700, marginBottom: 11, display: "flex", alignItems: "center", gap: 5 }}>
                <span>✓</span> Son bakım: 3 gün önce tamamlandı
              </div>
              {[{l:"Teknisyen",v:"Mehmet Yılmaz"},{l:"İşlem",v:"Periyodik bakım + yağlama"},{l:"Sonraki",v:"Mayıs 2026"}].map(r => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "5px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ color: "#9ca3af" }}>{r.l}</span>
                  <span style={{ fontWeight: 600, color: "#111827" }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={s.eyebrow}>Güven & görünürlük</div>
            <h2 style={s.h2}>QR tabanlı servis geçmişiyle müşterinize ne yaptığınızı açıkça gösterin.</h2>
            <p style={{ ...s.sub, marginBottom: 20 }}>Bina yöneticileri için güven iletişim netliğinden doğar. QR etiket her asansörü dijital geçmişe bağlar.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[{i:"🏢",t:"Cihaz bazlı kayıt düzeni"},{i:"📋",t:"Son bakım ve servis görünümü"},{i:"⭐",t:"Daha profesyonel müşteri deneyimi"},{i:"🔒",t:"Belirsizlik ve şikayet riskini azaltan yapı"}].map(x => (
                <div key={x.t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 500, color: "#374151" }}>
                  <span style={{ width: 30, height: 30, background: "#f9fafb", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, border: "1px solid #e5e7eb" }}>{x.i}</span>
                  {x.t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="moduller" style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", padding: "68px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ maxWidth: 520, marginBottom: 36 }}>
            <div style={s.eyebrow}>Ürünün omurgası</div>
            <h2 style={s.h2}>Doğru kurgulanmış modüller, güçlü operasyon disiplini.</h2>
            <p style={s.sub}>Her modül aynı hedef için çalışır: saha ile ofis arasındaki kopukluğu azaltmak ve işi öngörülebilir kılmak.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }} className="lp-g3">
            {MODULES.map(m => (
              <div key={m.title} style={{ background: "#fff", borderRadius: 14, padding: "18px 16px", border: "1px solid #e5e7eb", transition: "all 0.14s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, color: m.color }}>
                  <Ico d={m.icon} s={17} c={m.color} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 5, letterSpacing: "-0.02em" }}>{m.title}</div>
                <p style={{ fontSize: 12, lineHeight: 1.6, color: "#6b7280", margin: 0 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="akis" style={s.section}>
        <div style={{ maxWidth: 520, marginBottom: 44 }}>
          <div style={s.eyebrow}>Nasıl çalışır?</div>
          <h2 style={s.h2}>İlk çağrıdan servis kapanışına kadar tek omurga.</h2>
          <p style={s.sub}>Süreç dağılmadığında ekip sakin çalışır, ofis hızlı karar verir, müşteriye güçlü bir profesyonellik hissi yansır.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }} className="lp-g4">
          {STEPS.map((step, i) => (
            <div key={step.n} style={{ background: "#fff", borderRadius: 14, padding: "18px 16px", border: "1px solid #e5e7eb" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: i === 0 ? "linear-gradient(135deg,#2563eb,#0ea5e9)" : "#f9fafb", border: i === 0 ? "none" : "1.5px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: i === 0 ? "#fff" : "#9ca3af", marginBottom: 12 }}>
                {step.n}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", marginBottom: 5, lineHeight: 1.3 }}>{step.title}</div>
              <p style={{ fontSize: 12, lineHeight: 1.6, color: "#6b7280", margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PERSONAS */}
      <section style={{ background: "#111827", padding: "68px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ maxWidth: 520, marginBottom: 36 }}>
            <div style={{ ...s.eyebrow, color: "#60a5fa" }}>Kimin için?</div>
            <h2 style={{ ...s.h2, color: "#fff" }}>Servisim herkesin rolünü net görür.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }} className="lp-g3">
            {PERSONAS.map(p => (
              <div key={p.role} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "22px 20px", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 26, marginBottom: 9 }}>{p.emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#60a5fa", marginBottom: 6 }}>{p.role}</div>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.52)", marginBottom: 16 }}>{p.desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {p.items.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.72)" }}>
                      <svg width={13} height={13} viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      {posts.length > 0 && (
        <section style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", padding: "68px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, gap: 16, flexWrap: "wrap" }}>
              <div style={{ maxWidth: 440 }}>
                <div style={s.eyebrow}>Operasyon rehberleri</div>
                <h2 style={s.h2}>Sektöre konuşan içerik.</h2>
              </div>
              <Link href="/blog" style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>Tüm yazılar →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }} className="lp-g3">
              {posts.map(post => (
                <Link key={post.slug} href={`/blog/${post.slug}`} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #e5e7eb", textDecoration: "none", display: "block", transition: "all 0.14s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 32px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                  <div style={{ height: 106, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>📋</div>
                  <div style={{ padding: "16px 17px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{post.readingMinutes} dk okuma</div>
                    <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1.35, margin: "0 0 5px" }}>{post.title}</h3>
                    <p style={{ fontSize: 12, lineHeight: 1.55, color: "#6b7280", margin: "0 0 10px" }}>{post.excerpt}</p>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>Devamını oku →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section id="sss" style={s.section}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 56, alignItems: "start" }} className="lp-faqgrid">
          <div style={{ position: "sticky", top: 76 }}>
            <div style={s.eyebrow}>SSS</div>
            <h2 style={s.h2}>Karar verirken en çok sorulanlar.</h2>
            <p style={{ ...s.sub, marginBottom: 22 }}>Başka sorunuz var mı? WhatsApp'tan bize ulaşın.</p>
            <a href={WA} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25d366", color: "#fff", fontSize: 13, fontWeight: 700, padding: "10px 18px", borderRadius: 9, textDecoration: "none" }}>
              <WaIcon /> Soru sormak istiyorum
            </a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {FAQ.map((item, idx) => (
              <div key={item.q} style={{ background: openFaq === idx ? "#f9fafb" : "#fff", borderRadius: 10, border: "1.5px solid", borderColor: openFaq === idx ? "#bfdbfe" : "#e5e7eb", overflow: "hidden", transition: "border-color 0.15s" }}>
                <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} style={{ width: "100%", padding: "15px 17px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, textAlign: "left" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>{item.q}</span>
                  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: "transform 0.2s", transform: openFaq === idx ? "rotate(180deg)" : "none" }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {openFaq === idx && <div style={{ padding: "0 17px 14px", fontSize: 13, lineHeight: 1.7, color: "#6b7280" }}>{item.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#111827", padding: "68px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "5px 14px", marginBottom: 20 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em" }}>14 GÜN ÜCRETSİZ · KREDİ KARTI GEREKMEz</span>
          </div>
          <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1.05, color: "#fff", margin: "0 0 14px" }}>
            Daha profesyonel, daha kontrollü bir servis operasyonu kurun.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.48)", margin: "0 auto 28px", maxWidth: 460 }}>
            Saha ekibinize hız, ofis ekibinize kontrol ve müşterinize net servis görünürlüğü — tek sistemde.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth/register" style={{ background: "#fff", color: "#111827", fontSize: 14, fontWeight: 800, padding: "12px 24px", borderRadius: 9, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
              Ücretsiz hesap oluştur
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M5 12h14m-7-7l7 7-7 7"/></svg>
            </Link>
            <a href={WA} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.13)", color: "#fff", fontSize: 14, fontWeight: 600, padding: "12px 24px", borderRadius: 9, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
              <WaIcon /> WhatsApp ile görüş
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#111827", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "28px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>Servisim</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>Asansör servis firmaları için mobil ekip yönetimi ve operasyon platformu.</div>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[["Gizlilik","/privacy"],["Kullanım Koşulları","/terms"],["KVKK","/kvkk"],["Blog","/blog"]].map(([l,h]) => (
              <Link key={l} href={h} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .lp-desktnav{display:flex}
        .lp-loginbtn{display:inline-block}
        .lp-hambtn{display:none!important}
        @media(max-width:900px){
          .lp-desktnav{display:none!important}
          .lp-loginbtn{display:none!important}
          .lp-hambtn{display:flex!important}
          .lp-herogrid{grid-template-columns:1fr!important;gap:32px!important}
          .lp-featgrid{grid-template-columns:1fr!important;gap:28px!important}
          .lp-featreverse>:first-child{order:2}.lp-featreverse>:last-child{order:1}
          .lp-g4{grid-template-columns:1fr 1fr!important}
          .lp-g3{grid-template-columns:1fr 1fr!important}
          .lp-faqgrid{grid-template-columns:1fr!important}
        }
        @media(max-width:520px){
          .lp-g4{grid-template-columns:1fr!important}
          .lp-g3{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  );
}
