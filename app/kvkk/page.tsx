import Link from "next/link";

export const metadata = {
  title: "KVKK Aydınlatma Metni — Servisim",
  description: "6698 sayılı KVKK kapsamında kişisel verilerin işlenmesine ilişkin aydınlatma metni.",
};

const S = {
  page:  { minHeight:"100vh", background:"#f8fafc", padding:"48px 24px", fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" } as React.CSSProperties,
  wrap:  { maxWidth:840, margin:"0 auto" } as React.CSSProperties,
  card:  { background:"#fff", border:"1px solid #e4e8ee", borderRadius:20, padding:"48px 52px" } as React.CSSProperties,
  h1:    { fontSize:28, fontWeight:900, color:"#0f1623", letterSpacing:"-0.04em", margin:"0 0 6px" } as React.CSSProperties,
  meta:  { fontSize:13, color:"#94a3b8", margin:"0 0 40px" } as React.CSSProperties,
  h2:    { fontSize:15.5, fontWeight:800, color:"#0f1623", margin:"32px 0 10px" } as React.CSSProperties,
  h3:    { fontSize:13.5, fontWeight:700, color:"#0f1623", margin:"18px 0 6px" } as React.CSSProperties,
  p:     { fontSize:13.5, color:"#4b5a6e", lineHeight:1.85, margin:"0 0 10px" } as React.CSSProperties,
  ul:    { fontSize:13.5, color:"#4b5a6e", lineHeight:1.85, paddingLeft:22, margin:"0 0 10px" } as React.CSSProperties,
  table: { width:"100%", borderCollapse:"collapse" as const, fontSize:12.5, color:"#4b5a6e", marginBottom:16 } as React.CSSProperties,
  badge: { display:"inline-block", padding:"3px 9px", borderRadius:6, fontSize:11.5, fontWeight:700 } as React.CSSProperties,
};
const Td = ({ children, head }: { children: React.ReactNode; head?: boolean }) => (
  <td style={{ border:"1px solid #e4e8ee", padding:"8px 12px", background: head ? "#f8fafc" : "#fff",
    fontWeight: head ? 700 : 400, color: head ? "#0f1623" : "#4b5a6e", verticalAlign:"top" }}>
    {children}
  </td>
);

export default function KVKKPage() {
  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>
      <div style={S.wrap}>
        <Link href="/auth/register" style={{ display:"inline-flex", alignItems:"center", gap:6, color:"#64748b", fontSize:13, fontWeight:600, textDecoration:"none", marginBottom:28 }}>
          ← Kayıt sayfasına dön
        </Link>
        <div style={S.card}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:18, marginBottom:8 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>🔒</div>
            <div>
              <h1 style={S.h1}>KVKK Aydınlatma Metni</h1>
              <p style={S.meta}>6698 Sayılı Kişisel Verilerin Korunması Kanunu m.10 — Son güncelleme: Ocak 2025</p>
            </div>
          </div>
          <hr style={{ border:"none", borderTop:"1px solid #f0f2f5", margin:"0 0 32px" }}/>

          {/* 1 */}
          <h2 style={S.h2}>1. Veri Sorumlusu</h2>
          <p style={S.p}>
            Bu aydınlatma metni, 6698 Sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") madde 10 uyarınca,
            Servisim Yazılım Teknolojileri Ltd. Şti. ("Servisim", "Şirket") tarafından hazırlanmıştır.
          </p>
          <div style={{ background:"#f8fafc", borderRadius:12, border:"1px solid #e4e8ee", padding:"14px 18px", fontSize:13, color:"#4b5a6e", lineHeight:1.8 }}>
            <strong style={{ color:"#0f1623" }}>Veri Sorumlusu:</strong> Servisim Yazılım Teknolojileri Ltd. Şti.<br/>
            <strong style={{ color:"#0f1623" }}>Adres:</strong> İstanbul, Türkiye<br/>
            <strong style={{ color:"#0f1623" }}>E-posta:</strong> <a href="mailto:kvkk@servisim.app" style={{ color:"#2563eb" }}>kvkk@servisim.app</a><br/>
            <strong style={{ color:"#0f1623" }}>KVKK Kayıt No:</strong> VERBİS kaydı tamamlanma sürecindedir.
          </div>

          {/* 2 */}
          <h2 style={S.h2}>2. İşlenen Kişisel Veri Kategorileri</h2>
          <table style={S.table}>
            <thead>
              <tr><Td head>Kategori</Td><Td head>Veri Türleri</Td><Td head>İşlenme Amacı</Td></tr>
            </thead>
            <tbody>
              <tr><Td>Kimlik</Td><Td>Ad-soyad, unvan</Td><Td>Hesap oluşturma, sözleşme ifası</Td></tr>
              <tr><Td>İletişim</Td><Td>E-posta, telefon numarası</Td><Td>Bildirimler, destek, doğrulama</Td></tr>
              <tr><Td>Firma / Organizasyon</Td><Td>Firma adı, sektör, vergi kimliği</Td><Td>Platform konfigürasyonu, faturalandırma</Td></tr>
              <tr><Td>Hesap Güvenliği</Td><Td>Şifrelenmiş parola (bcrypt), oturum tokeni</Td><Td>Kimlik doğrulama, yetkisiz erişim önleme</Td></tr>
              <tr><Td>Platform Kullanım</Td><Td>İş emirleri, bakım planları, müşteri kayıtları</Td><Td>Hizmet sunumu, raporlama</Td></tr>
              <tr><Td>Teknik</Td><Td>IP adresi, tarayıcı/cihaz bilgisi, günlükler</Td><Td>Güvenlik, hata ayıklama</Td></tr>
              <tr><Td>Ticari</Td><Td>Ödeme geçmişi, abonelik planı (kart verisi saklanmaz)</Td><Td>Faturalandırma (Stripe üzerinden)</Td></tr>
            </tbody>
          </table>
          <p style={{ ...S.p, fontSize:12, color:"#94a3b8" }}>* Kredi kartı bilgileri Servisim sunucularında tutulmaz; PCI-DSS Level 1 sertifikalı Stripe tarafından işlenir.</p>

          {/* 3 */}
          <h2 style={S.h2}>3. Hukuki İşleme Dayanak ve Amaçlar</h2>
          <table style={S.table}>
            <thead>
              <tr><Td head>Amaç</Td><Td head>KVKK m.5 Hukuki Dayanak</Td></tr>
            </thead>
            <tbody>
              <tr><Td>Kullanıcı hesabının oluşturulması ve yönetimi</Td><Td>Sözleşmenin kurulması ve ifası (m.5/2-c)</Td></tr>
              <tr><Td>Abonelik ve faturalandırma işlemleri</Td><Td>Sözleşmenin ifası (m.5/2-c); Kanuni yükümlülük (VUK m.230)</Td></tr>
              <tr><Td>Güvenlik, erişim denetimi ve log tutma</Td><Td>Meşru menfaat (m.5/2-f)</Td></tr>
              <tr><Td>E-posta ile teknik bildirimler</Td><Td>Sözleşmenin ifası (m.5/2-c)</Td></tr>
              <tr><Td>Ürün güncellemeleri ve pazarlama e-postaları</Td><Td>Açık rıza (m.5/1) — kayıt formunda onay alınır</Td></tr>
              <tr><Td>Hukuki uyumluluk ve ihtilaf çözümü</Td><Td>Hakkın tesisi / kullanımı / korunması (m.5/2-e)</Td></tr>
            </tbody>
          </table>

          {/* 4 */}
          <h2 style={S.h2}>4. Yurt İçi ve Yurt Dışı Aktarımlar</h2>
          <p style={S.p}>Kişisel verileriniz aşağıdaki alt işlemcilere aktarılmaktadır. Yurt dışı aktarımlar KVKK m.9 kapsamında standart sözleşme maddeleri (SCC) veya yeterlilik kararı ile güvence altına alınmaktadır.</p>
          <table style={S.table}>
            <thead>
              <tr><Td head>Alıcı / Alt İşlemci</Td><Td head>Amaç</Td><Td head>Konum</Td><Td head>Güvence</Td></tr>
            </thead>
            <tbody>
              <tr><Td>Vercel Inc.</Td><Td>Barındırma ve içerik dağıtım</Td><Td>ABD / AB</Td><Td>DPA + SCC</Td></tr>
              <tr><Td>Neon / Supabase</Td><Td>Veritabanı</Td><Td>AB / ABD</Td><Td>DPA + SCC</Td></tr>
              <tr><Td>Resend Inc.</Td><Td>İşlemsel e-posta gönderimi</Td><Td>ABD</Td><Td>DPA + SCC</Td></tr>
              <tr><Td>Stripe Inc.</Td><Td>Ödeme işleme</Td><Td>ABD / AB</Td><Td>PCI-DSS L1 + DPA</Td></tr>
            </tbody>
          </table>

          {/* 5 */}
          <h2 style={S.h2}>5. Saklama Süreleri</h2>
          <table style={S.table}>
            <thead>
              <tr><Td head>Veri / Kayıt Türü</Td><Td head>Süre</Td><Td head>Dayanak</Td></tr>
            </thead>
            <tbody>
              <tr><Td>Hesap ve profil bilgileri</Td><Td>Hesap silindi + 30 gün</Td><Td>Sözleşmesel</Td></tr>
              <tr><Td>İş emirleri ve bakım kayıtları</Td><Td>Sözleşme bitimi + 3 yıl</Td><Td>TTK m.82</Td></tr>
              <tr><Td>Fatura ve ödeme kayıtları</Td><Td>10 yıl</Td><Td>VUK m.253</Td></tr>
              <tr><Td>Güvenlik günlükleri (loglar)</Td><Td>180 gün</Td><Td>Meşru menfaat</Td></tr>
              <tr><Td>Çerezler (oturum)</Td><Td>Oturum sonu (7 gün maks.)</Td><Td>Açık rıza / Teknik zorunluluk</Td></tr>
            </tbody>
          </table>

          {/* 6 */}
          <h2 style={S.h2}>6. KVKK m.11 Kapsamındaki Haklarınız</h2>
          <p style={S.p}>KVKK madde 11 uyarınca aşağıdaki haklara sahipsiniz:</p>
          <ul style={S.ul}>
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmiş ise buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmiş ise düzeltilmesini isteme</li>
            <li>Hukuki dayanakların ortadan kalkması hâlinde silinmesini / yok edilmesini isteme</li>
            <li>Düzeltme ve silme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme</li>
            <li>Yalnızca otomatik sistemlerle analiz edilmesi sonucu aleyhte karar çıkmasına itiraz etme</li>
            <li>Kanuna aykırı işlenme nedeniyle zarara uğraması hâlinde zararın giderilmesini talep etme</li>
          </ul>
          <p style={S.p}>
            Başvurularınızı <a href="mailto:kvkk@servisim.app" style={{ color:"#2563eb" }}>kvkk@servisim.app</a> adresine
            yazılı olarak iletebilirsiniz. Başvurular 30 gün içinde yanıtlanır. Yanıt tatmin edici bulunmazsa
            <strong> Kişisel Verileri Koruma Kurulu</strong>'na şikâyette bulunma hakkınız saklıdır.
          </p>

          {/* 7 */}
          <h2 style={S.h2}>7. Teknik ve İdari Güvenlik Önlemleri</h2>
          <ul style={S.ul}>
            <li>Tüm veri iletimi TLS 1.2+ şifrelemesi ile korunur</li>
            <li>Parolalar bcrypt (maliyet faktörü 10) ile hashlenerek saklanır; düz metin parola tutulmaz</li>
            <li>Oturum tokenları httpOnly çerezlerde tutulur; XSS erişimine kapalıdır</li>
            <li>Veritabanında satır düzeyinde güvenlik (RLS) uygulanmaktadır</li>
            <li>Günlük yedeklemeler şifreli olarak depolanmaktadır</li>
            <li>Çalışan erişimleri en az yetki ilkesine göre kısıtlanmıştır</li>
          </ul>

          {/* 8 */}
          <h2 style={S.h2}>8. Değişiklikler</h2>
          <p style={S.p}>
            Bu metin zaman zaman güncellenebilir. Önemli değişikliklerde kayıtlı e-posta adresinize bildirim yapılır.
            Güncel metne her zaman <a href="/kvkk" style={{ color:"#2563eb" }}>servisim.app/kvkk</a> adresinden ulaşabilirsiniz.
          </p>

          <div style={{ marginTop:40, padding:"16px 20px", background:"#f0fdf4", borderRadius:12, border:"1px solid #bbf7d0", fontSize:13, color:"#15803d", lineHeight:1.7 }}>
            <strong>📧 Veri Sorumlusuna Ulaşın:</strong><br/>
            KVKK başvuruları için: <a href="mailto:kvkk@servisim.app" style={{ color:"#15803d", fontWeight:600 }}>kvkk@servisim.app</a><br/>
            Genel destek için: <a href="mailto:destek@servisim.app" style={{ color:"#15803d", fontWeight:600 }}>destek@servisim.app</a>
          </div>
        </div>
      </div>
    </div>
  );
}
