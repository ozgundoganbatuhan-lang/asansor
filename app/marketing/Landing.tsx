import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .grain {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .mesh {
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 80% 50% at 20% 20%, rgba(37,99,235,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(16,185,129,0.08) 0%, transparent 50%),
            radial-gradient(ellipse 40% 60% at 50% 0%, rgba(59,130,246,0.1) 0%, transparent 50%);
        }

        .badge {
          display: inline-flex; align-items: center; gap: 6px;
          border: 1px solid rgba(59,130,246,0.3);
          background: rgba(59,130,246,0.08);
          color: #60a5fa;
          padding: 5px 14px; border-radius: 100px;
          font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
        }

        .badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #3b82f6;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .hero-title {
          font-size: clamp(42px, 7vw, 88px);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -3px;
          background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-accent {
          background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white; padding: 14px 28px;
          border-radius: 10px; font-weight: 700; font-size: 15px;
          text-decoration: none; transition: all 0.2s;
          box-shadow: 0 0 0 1px rgba(59,130,246,0.3), 0 8px 32px rgba(37,99,235,0.3);
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 0 1px rgba(59,130,246,0.5), 0 12px 40px rgba(37,99,235,0.4);
        }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.8); padding: 14px 28px;
          border-radius: 10px; font-weight: 600; font-size: 15px;
          text-decoration: none; transition: all 0.2s;
          background: rgba(255,255,255,0.04);
        }
        .btn-ghost:hover {
          border-color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.08);
          color: white;
        }

        .stat-card {
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          border-radius: 16px; padding: 28px;
          backdrop-filter: blur(10px);
        }

        .feature-card {
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02);
          border-radius: 20px; padding: 32px;
          transition: all 0.3s;
          position: relative; overflow: hidden;
        }
        .feature-card:hover {
          border-color: rgba(59,130,246,0.3);
          background: rgba(59,130,246,0.04);
          transform: translateY(-2px);
        }
        .feature-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent);
          opacity: 0; transition: opacity 0.3s;
        }
        .feature-card:hover::before { opacity: 1; }

        .feature-icon {
          width: 48px; height: 48px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(59,130,246,0.1);
          border: 1px solid rgba(59,130,246,0.2);
          font-size: 22px; margin-bottom: 20px;
        }

        .section-label {
          font-family: 'DM Mono', monospace;
          font-size: 11px; font-weight: 500;
          letter-spacing: 2px; text-transform: uppercase;
          color: #3b82f6;
        }

        .divider {
          border: none; border-top: 1px solid rgba(255,255,255,0.06);
        }

        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 0 32px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(10,15,30,0.85);
          backdrop-filter: blur(20px);
        }

        .nav-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px;
        }

        .logo {
          font-size: 20px; font-weight: 900; letter-spacing: -0.5px;
          color: white; text-decoration: none;
        }
        .logo span { color: #3b82f6; }

        .screen-mock {
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          background: rgba(15,20,40,0.8);
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
        }

        .screen-bar {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.02);
        }

        .screen-dot { width: 10px; height: 10px; border-radius: 50%; }

        .kpi-row {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 12px; padding: 20px;
        }

        .kpi-box {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 16px;
        }

        .pill {
          display: inline-block;
          padding: 2px 8px; border-radius: 100px;
          font-size: 10px; font-weight: 700;
        }

        .pill-green { background: rgba(16,185,129,0.15); color: #34d399; }
        .pill-red { background: rgba(239,68,68,0.15); color: #f87171; }
        .pill-amber { background: rgba(245,158,11,0.15); color: #fbbf24; }

        .table-row {
          display: grid; grid-template-columns: 1fr 1.5fr 1fr 0.8fr;
          padding: 12px 20px; gap: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          align-items: center; font-size: 12px;
        }

        .cta-section {
          background: linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(6,182,212,0.08) 100%);
          border: 1px solid rgba(59,130,246,0.2);
          border-radius: 24px; padding: 64px;
          text-align: center; position: relative; overflow: hidden;
        }
        .cta-section::before {
          content: '';
          position: absolute; top: -50%; left: -50%; right: -50%; bottom: -50%;
          background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(37,99,235,0.1) 0%, transparent 70%);
        }

        @media (max-width: 768px) {
          .kpi-row { grid-template-columns: repeat(2, 1fr); }
          .hero-title { letter-spacing: -2px; }
          .cta-section { padding: 40px 24px; }
          .nav { padding: 0 16px; }
        }
      `}</style>

      <div className="grain" />

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="logo">servisim<span>.</span></a>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/auth/login" className="btn-ghost" style={{ padding: "8px 20px", fontSize: 14 }}>
              Giriş Yap
            </Link>
            <Link href="/auth/register" className="btn-primary" style={{ padding: "8px 20px", fontSize: 14 }}>
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: 80 }}>
        <div className="mesh" />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "80px 32px", width: "100%" }}>
          <div style={{ maxWidth: 800 }}>
            <div className="badge" style={{ marginBottom: 32 }}>
              <div className="badge-dot" />
              Türkiye&apos;nin Asansör Servis Platformu
            </div>

            <h1 className="hero-title" style={{ marginBottom: 24 }}>
              Asansör<br />
              servisinizi<br />
              <span className="hero-accent">dijitalleştirin.</span>
            </h1>

            <p style={{ fontSize: 18, color: "#94a3b8", lineHeight: 1.7, maxWidth: 560, marginBottom: 48 }}>
              İş emirleri, bakım planları, teknisyen takibi ve faturalama —
              hepsi tek platformda. Kağıtsız, hatasız, her yerden erişilebilir.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 64 }}>
              <Link href="/auth/register" className="btn-primary">
                14 Gün Ücretsiz Dene
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link href="/auth/login" className="btn-ghost">
                Hesabınıza Giriş Yapın
              </Link>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 32 }}>
              {[
                { n: "2.400+", label: "Aktif Asansör" },
                { n: "180+", label: "Servis Firması" },
                { n: "%99.9", label: "Uptime" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "white" }}>{s.n}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard mockup */}
          <div style={{ marginTop: 80 }} className="screen-mock">
            <div className="screen-bar">
              <div className="screen-dot" style={{ background: "#ff5f57" }} />
              <div className="screen-dot" style={{ background: "#febc2e" }} />
              <div className="screen-dot" style={{ background: "#28c840" }} />
              <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, maxWidth: 200, marginLeft: 8 }} />
            </div>
            <div className="kpi-row">
              {[
                { label: "Müşteri", val: "148", pill: null },
                { label: "Aktif İş Emri", val: "23", pill: <span className="pill pill-amber">4 Acil</span> },
                { label: "Gecikmiş Bakım", val: "3", pill: <span className="pill pill-red">Kritik</span> },
                { label: "Bu Ay Gelir", val: "₺48.200", pill: <span className="pill pill-green">↑ %12</span> },
              ].map((k) => (
                <div key={k.label} className="kpi-box">
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 6 }}>{k.val}</div>
                  {k.pill}
                </div>
              ))}
            </div>
            <div style={{ padding: "0 20px 8px" }}>
              <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Son İş Emirleri</div>
              {[
                { code: "WO-25-00847", customer: "Emek Sitesi Yönetimi", status: "Acil", pill: "pill-red", tech: "A.Yılmaz" },
                { code: "WO-25-00846", customer: "Merkez AVM", status: "Devam", pill: "pill-amber", tech: "M.Demir" },
                { code: "WO-25-00845", customer: "Güneş Rezidans", status: "Bitti", pill: "pill-green", tech: "K.Şahin" },
              ].map((row) => (
                <div key={row.code} className="table-row">
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "#60a5fa" }}>{row.code}</div>
                  <div style={{ color: "#cbd5e1", fontSize: 12 }}>{row.customer}</div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>{row.tech}</div>
                  <div><span className={`pill ${row.pill}`}>{row.status}</span></div>
                </div>
              ))}
            </div>
            <div style={{ height: 16 }} />
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* FEATURES */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div className="section-label" style={{ marginBottom: 16 }}>Özellikler</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: -1, color: "white" }}>
            Servis firmanız için<br />ihtiyacınız olan her şey
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {[
            {
              icon: "📋",
              title: "İş Emri Yönetimi",
              desc: "Arıza, periyodik bakım, yıllık muayene ve revizyon emirlerini oluşturun. Teknisyen atayın, parça ekleyin, durumu takip edin.",
            },
            {
              icon: "🔔",
              title: "Otomatik Bakım Planları",
              desc: "Aylık, 3 aylık veya yıllık bakım planları tanımlayın. Geciken bakımlar için otomatik uyarı alın.",
            },
            {
              icon: "📱",
              title: "SMS Bildirimleri",
              desc: "Teknisyen atandığında otomatik SMS. Müşteriye 'teknisyen yolda' bildirimi. Netgsm entegrasyonu.",
            },
            {
              icon: "🧾",
              title: "Proforma Fatura",
              desc: "İş emrinden tek tıkla fatura. Parça, işçilik ve KDV otomatik hesaplanır. PDF olarak yazdırın.",
            },
            {
              icon: "📦",
              title: "Stok Takibi",
              desc: "Yedek parça stoklarını yönetin. Minimum stok uyarıları. İş emirlerine parça eklendiğinde otomatik düşüm.",
            },
            {
              icon: "📊",
              title: "Raporlar & Analitik",
              desc: "Aylık iş emri özeti, teknisyen performansı, gelir raporları. CSV ile dışa aktarın.",
            },
          ].map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "white", marginBottom: 12 }}>{f.title}</h3>
              <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div className="section-label" style={{ marginBottom: 16 }}>Nasıl Çalışır</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: -1, color: "white" }}>
            5 dakikada başlayın
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
          {[
            { n: "01", title: "Hesap Açın", desc: "Firma adınız ve e-postanızla 30 saniyede kayıt olun." },
            { n: "02", title: "Müşteri & Asansör Ekleyin", desc: "Müşterilerinizi ve asansör bilgilerini sisteme girin." },
            { n: "03", title: "İş Emri Oluşturun", desc: "Arıza veya bakım için iş emri açın, teknisyen atayın." },
            { n: "04", title: "Takip & Fatura", desc: "Durumu güncelleyin, tamamlandığında faturayı oluşturun." },
          ].map((s) => (
            <div key={s.n} style={{ position: "relative" }}>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 64, fontWeight: 700, color: "rgba(59,130,246,0.1)", lineHeight: 1, marginBottom: 16 }}>{s.n}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "white", marginBottom: 10 }}>{s.title}</h3>
              <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* PRICING */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div className="section-label" style={{ marginBottom: 16 }}>Fiyatlandırma</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: -1, color: "white" }}>
            Şeffaf fiyatlandırma
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, maxWidth: 900, margin: "0 auto" }}>
          {[
            {
              name: "Başlangıç",
              price: "₺990",
              period: "/ ay",
              desc: "Küçük servis firmaları için",
              features: ["50 asansör", "3 teknisyen", "İş emri & bakım planları", "SMS bildirimleri", "Temel raporlar"],
              cta: "Ücretsiz Başla",
              highlight: false,
            },
            {
              name: "Profesyonel",
              price: "₺2.490",
              period: "/ ay",
              desc: "Büyüyen servis firmaları için",
              features: ["Sınırsız asansör", "Sınırsız teknisyen", "Her şey dahil", "Öncelikli destek", "API erişimi"],
              cta: "14 Gün Ücretsiz Dene",
              highlight: true,
            },
          ].map((p) => (
            <div
              key={p.name}
              style={{
                border: p.highlight ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.07)",
                background: p.highlight ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.02)",
                borderRadius: 20, padding: 36, position: "relative",
              }}
            >
              {p.highlight && (
                <div style={{
                  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  background: "linear-gradient(135deg, #2563eb, #0284c7)",
                  color: "white", padding: "4px 16px", borderRadius: 100,
                  fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                }}>
                  En Popüler
                </div>
              )}
              <div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>{p.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: "white" }}>{p.price}</span>
                <span style={{ color: "#64748b", fontSize: 14 }}>{p.period}</span>
              </div>
              <div style={{ color: "#64748b", fontSize: 13, marginBottom: 28 }}>{p.desc}</div>
              <ul style={{ listStyle: "none", marginBottom: 32, display: "flex", flexDirection: "column", gap: 10 }}>
                {p.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#cbd5e1" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className={p.highlight ? "btn-primary" : "btn-ghost"}
                style={{ display: "block", textAlign: "center", width: "100%" }}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>


      {/* Accounting Integration */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px 96px" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(59,130,246,0.06) 100%)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 24,
          padding: "clamp(32px, 5vw, 64px)",
          display: "flex",
          flexWrap: "wrap",
          gap: 48,
          alignItems: "center",
        }}>
          <div style={{ flex: "1 1 400px" }}>
            <div className="section-label" style={{ marginBottom: 16 }}>Muhasebe Entegrasyonu</div>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 900, letterSpacing: -1.5, color: "white", marginBottom: 20, lineHeight: 1.1 }}>
              Muhasebecileriniz<br />her şeyi tek ekrandan yönetir.
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
              Servisim üzerindeki tüm iş emirleri, faturalar ve harcama kalemleri
              muhasebe yazılımınızla doğrudan senkronize olur. Manuel veri girişi,
              hatalı excel aktarımı ya da ay sonu panik sona erer —
              muhasebecileriniz istediği zaman güncel, doğru ve eksiksiz verilere erişir.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
              {["Paraşüt", "Logo GO", "Mikro", "Luca", "e-Fatura", "e-Arşiv", "Özel API"].map((b) => (
                <span key={b} style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 100,
                  padding: "6px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#c7d2fe",
                }}>{b}</span>
              ))}
            </div>
            <Link href="/auth/register" className="btn-primary" style={{ display: "inline-flex" }}>
              Entegrasyonu Keşfet
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
          <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: "🔄", title: "Otomatik Senkronizasyon", desc: "Yeni fatura oluşturulduğunda muhasebe yazılımınıza anında iletilir." },
              { icon: "📊", title: "Gerçek Zamanlı Raporlar", desc: "Aylık ciro, KDV özetleri ve gider raporları tek tıkla hazır." },
              { icon: "✅", title: "GİB Uyumlu", desc: "e-Fatura ve e-Arşiv altyapısı ile yasal gereklilikleri otomatik karşılayın." },
              { icon: "🔐", title: "Güvenli Erişim", desc: "Muhasebecilerinize sadece mali verilere özel erişim izni tanımlayın." },
            ].map((f) => (
              <div key={f.title} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "16px 20px",
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{f.icon}</span>
                <div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{f.title}</div>
                  <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* CTA */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px 96px" }}>
        <div className="cta-section">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="section-label" style={{ marginBottom: 20 }}>Hemen Başlayın</div>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 56px)", fontWeight: 900, letterSpacing: -2, color: "white", marginBottom: 20 }}>
              14 gün ücretsiz,<br />kredi kartı gerekmez.
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 16, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
              Hemen kayıt olun, demo verilerle sistemi keşfedin. Beğenirseniz planınızı seçin.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              <Link href="/auth/register" className="btn-primary" style={{ fontSize: 16, padding: "16px 32px" }}>
                Ücretsiz Hesap Oluştur
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link href="/auth/login" className="btn-ghost" style={{ fontSize: 16, padding: "16px 32px" }}>
                Giriş Yap
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px", textAlign: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" className="logo" style={{ fontSize: 16 }}>servisim<span>.</span></a>
          <div style={{ color: "#334155", fontSize: 13 }}>© 2025 Servisim. Tüm hakları saklıdır.</div>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="/auth/login" style={{ color: "#475569", fontSize: 13, textDecoration: "none" }}>Giriş</a>
            <a href="/auth/register" style={{ color: "#475569", fontSize: 13, textDecoration: "none" }}>Kayıt</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
