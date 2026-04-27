import Link from "next/link";

export const metadata = {
  title: "Gizlilik Politikası — Servisim",
  description: "Servisim'in gizlilik politikası: çerezler, veri toplama ve kullanıcı hakları.",
};

const S = {
  page:  { minHeight:"100vh", background:"#f8fafc", padding:"48px 24px", fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" } as React.CSSProperties,
  wrap:  { maxWidth:840, margin:"0 auto" } as React.CSSProperties,
  card:  { background:"#fff", border:"1px solid #e4e8ee", borderRadius:20, padding:"48px 52px" } as React.CSSProperties,
  h1:    { fontSize:28, fontWeight:900, color:"#0f1623", letterSpacing:"-0.04em", margin:"0 0 6px" } as React.CSSProperties,
  meta:  { fontSize:13, color:"#94a3b8", margin:"0 0 40px" } as React.CSSProperties,
  h2:    { fontSize:15.5, fontWeight:800, color:"#0f1623", margin:"32px 0 10px" } as React.CSSProperties,
  p:     { fontSize:13.5, color:"#4b5a6e", lineHeight:1.85, margin:"0 0 10px" } as React.CSSProperties,
  ul:    { fontSize:13.5, color:"#4b5a6e", lineHeight:1.85, paddingLeft:22, margin:"0 0 10px" } as React.CSSProperties,
  table: { width:"100%", borderCollapse:"collapse" as const, fontSize:12.5, color:"#4b5a6e", marginBottom:16 } as React.CSSProperties,
};
const Td = ({ children, head }: { children: React.ReactNode; head?: boolean }) => (
  <td style={{ border:"1px solid #e4e8ee", padding:"8px 12px", background: head ? "#f8fafc" : "#fff",
    fontWeight: head ? 700 : 400, color: head ? "#0f1623" : "#4b5a6e", verticalAlign:"top" }}>
    {children}
  </td>
);

export default function PrivacyPage() {
  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>
      <div style={S.wrap}>
        <Link href="/auth/register" style={{ display:"inline-flex", alignItems:"center", gap:6, color:"#64748b", fontSize:13, fontWeight:600, textDecoration:"none", marginBottom:28 }}>
          ← Kayıt sayfasına dön
        </Link>
        <div style={S.card}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:18, marginBottom:8 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:"#fdf4ff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>🔐</div>
            <div>
              <h1 style={S.h1}>Gizlilik Politikası</h1>
              <p style={S.meta}>Çerezler, veri toplama ve kullanıcı hakları — Son güncelleme: Ocak 2025</p>
            </div>
          </div>
          <hr style={{ border:"none", borderTop:"1px solid #f0f2f5", margin:"0 0 32px" }}/>

          <h2 style={S.h2}>1. Genel Bakış</h2>
          <p style={S.p}>
            Servisim olarak gizliliğinize saygı duyuyoruz. Bu Gizlilik Politikası, servisim.app alan adı üzerinden
            sunulan platformu kullandığınızda hangi verileri topladığımızı, bunları nasıl kullandığımızı ve
            haklarınızın neler olduğunu açıklar.
          </p>
          <p style={S.p}>
            KVKK kapsamındaki haklarınız ve veri sorumlusuna ilişkin ayrıntılı bilgi için{" "}
            <Link href="/kvkk" style={{ color:"#2563eb" }}>KVKK Aydınlatma Metni</Link>'ni inceleyiniz.
          </p>

          <h2 style={S.h2}>2. Topladığımız Veriler</h2>

          <h2 style={{ ...S.h2, fontSize:13.5, margin:"16px 0 8px" }}>2a. Hesap Oluşturma Sırasında</h2>
          <ul style={S.ul}>
            <li>Ad-soyad ve e-posta adresi</li>
            <li>Firma adı ve faaliyet sektörü</li>
            <li>Telefon numarası (isteğe bağlı)</li>
            <li>Şifrelenmiş parola (bcrypt; düz metin saklanmaz)</li>
          </ul>

          <h2 style={{ ...S.h2, fontSize:13.5, margin:"16px 0 8px" }}>2b. Platform Kullanımı Sırasında</h2>
          <ul style={S.ul}>
            <li>Oluşturulan iş emirleri, müşteri ve asansör kayıtları, bakım planları</li>
            <li>Yüklenen belgeler ve fotoğraflar</li>
            <li>Oturum tokeni (httpOnly çerez, 7 gün geçerli)</li>
          </ul>

          <h2 style={{ ...S.h2, fontSize:13.5, margin:"16px 0 8px" }}>2c. Teknik Veriler</h2>
          <ul style={S.ul}>
            <li>IP adresi ve yaklaşık coğrafi konum (ülke/şehir düzeyi)</li>
            <li>Tarayıcı ve işletim sistemi bilgisi</li>
            <li>Sayfa erişim günlükleri ve hata raporları</li>
          </ul>

          <h2 style={S.h2}>3. Çerez Politikası</h2>
          <table style={S.table}>
            <thead>
              <tr><Td head>Çerez Adı</Td><Td head>Tür</Td><Td head>Amaç</Td><Td head>Süre</Td></tr>
            </thead>
            <tbody>
              <tr><Td>servisim_token</Td><Td>Zorunlu (httpOnly)</Td><Td>Oturum kimlik doğrulama</Td><Td>7 gün</Td></tr>
              <tr><Td>servisim_prefs</Td><Td>İşlevsel</Td><Td>Dil, tema, tablo görünümü tercihleri</Td><Td>30 gün</Td></tr>
            </tbody>
          </table>
          <p style={S.p}>
            Üçüncü taraf izleme veya reklamcılık çerezi kullanılmamaktadır. Analitik veriler yalnızca
            sunucu tarafı günlük analizi yöntemiyle toplanır; tarayıcıya herhangi bir analitik kodu yüklenmez.
          </p>

          <h2 style={S.h2}>4. Verilerin Kullanım Amaçları</h2>
          <ul style={S.ul}>
            <li><strong>Hizmet sunumu:</strong> Platforma erişim, iş emri yönetimi, bakım takibi</li>
            <li><strong>İşlemsel iletişim:</strong> E-posta doğrulama, parola sıfırlama, fatura bildirimleri</li>
            <li><strong>Güvenlik:</strong> Yetkisiz erişim tespiti, oturum yönetimi</li>
            <li><strong>Yasal yükümlülükler:</strong> Fatura ve muhasebe kayıtlarının tutulması</li>
            <li><strong>Ürün geliştirme:</strong> Anonim kullanım istatistikleri (kişisel veri içermez)</li>
            <li><strong>Pazarlama (rıza ile):</strong> Kampanya ve yenilik duyuruları — yalnızca onay verenler için</li>
          </ul>

          <h2 style={S.h2}>5. Üçüncü Taraflarla Paylaşım</h2>
          <p style={S.p}>
            Verileriniz hiçbir şekilde reklamcı veya veri komisyoncularına satılmaz ya da kiralanmaz.
            Aşağıdaki alt işlemcilerle yalnızca hizmet sunumu amacıyla paylaşılır:
          </p>
          <table style={S.table}>
            <thead>
              <tr><Td head>Hizmet</Td><Td head>Sağlayıcı</Td><Td head>Amaç</Td></tr>
            </thead>
            <tbody>
              <tr><Td>Barındırma & CDN</Td><Td>Vercel</Td><Td>Uygulama sunucusu ve içerik dağıtımı</Td></tr>
              <tr><Td>Veritabanı</Td><Td>Neon / Supabase</Td><Td>Güvenli veri depolama</Td></tr>
              <tr><Td>E-posta</Td><Td>Resend</Td><Td>İşlemsel e-posta (doğrulama, bildirim)</Td></tr>
              <tr><Td>Ödeme</Td><Td>Stripe</Td><Td>Abonelik ve faturalandırma</Td></tr>
            </tbody>
          </table>

          <h2 style={S.h2}>6. Veri Güvenliği</h2>
          <ul style={S.ul}>
            <li>Tüm veri aktarımı TLS 1.2+ ile şifrelenir</li>
            <li>Veritabanı şifreli ve yedekli altyapıda barındırılır</li>
            <li>Oturum tokenları httpOnly çerezlerde tutulur; JavaScript erişimine kapalıdır</li>
            <li>Veri ihlali tespitinden itibaren 72 saat içinde KVKK Kurulu'na bildirim yapılır; etkilenen kullanıcılar gecikmeksizin bilgilendirilir</li>
          </ul>

          <h2 style={S.h2}>7. Uluslararası Veri Aktarımı</h2>
          <p style={S.p}>
            Alt işlemcilerin bir kısmı Türkiye dışında (AB veya ABD) konumlanmaktadır. Söz konusu aktarımlar
            KVKK madde 9 uyarınca standart sözleşme maddeleri (SCC) veya AB yeterlilik kararı ile güvence altına alınmıştır.
          </p>

          <h2 style={S.h2}>8. Çocukların Gizliliği</h2>
          <p style={S.p}>
            Servisim yalnızca 18 yaş ve üzeri bireyler ile ticari kuruluşlara yönelik bir B2B platformudur.
            18 yaşından küçüklere ait veri bilerek toplanmamaktadır. Böyle bir durumun farkına varılması hâlinde
            ilgili veriler derhal silinecektir.
          </p>

          <h2 style={S.h2}>9. Hesap Silme ve Veri Taşınabilirliği</h2>
          <ul style={S.ul}>
            <li><strong>Hesap silme:</strong> Ayarlar menüsünden veya destek@servisim.app adresine yazarak hesabınızı silebilirsiniz. Aktif aboneliğin iptal edilmesi gerekir.</li>
            <li><strong>Veri taşınabilirliği:</strong> JSON veya CSV formatında veri dışa aktarma talebi 30 gün içinde karşılanır.</li>
            <li><strong>Silme süreci:</strong> Hesap silme işleminden 90 gün sonra tüm kişisel veriler kalıcı olarak silinir; yalnızca yasal saklama zorunluluğu olan kayıtlar (vergi belgeleri vb.) istisnadır.</li>
          </ul>

          <h2 style={S.h2}>10. Politika Güncellemeleri</h2>
          <p style={S.p}>
            Bu politika güncellendiğinde kayıtlı e-posta adresinize bildirim yapılır. Güncel politikaya her zaman
            <a href="/privacy" style={{ color:"#2563eb" }}> servisim.app/privacy</a> adresinden ulaşabilirsiniz.
          </p>

          <div style={{ marginTop:40, padding:"16px 20px", background:"#fdf4ff", borderRadius:12, border:"1px solid #e9d5ff", fontSize:13, color:"#7e22ce", lineHeight:1.7 }}>
            <strong>📧 Gizlilik ile ilgili talepleriniz için:</strong><br/>
            <a href="mailto:kvkk@servisim.app" style={{ color:"#7e22ce", fontWeight:600 }}>kvkk@servisim.app</a>
            {" "}— başvurular 30 gün içinde yanıtlanır.
          </div>
        </div>
      </div>
    </div>
  );
}
