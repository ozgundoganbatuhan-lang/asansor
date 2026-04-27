import Link from "next/link";

export const metadata = {
  title: "Kullanım Koşulları — Servisim",
  description: "Servisim platformunu kullanım koşulları ve hizmet sözleşmesi.",
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

export default function TermsPage() {
  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>
      <div style={S.wrap}>
        <Link href="/auth/register" style={{ display:"inline-flex", alignItems:"center", gap:6, color:"#64748b", fontSize:13, fontWeight:600, textDecoration:"none", marginBottom:28 }}>
          ← Kayıt sayfasına dön
        </Link>
        <div style={S.card}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:18, marginBottom:8 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>📄</div>
            <div>
              <h1 style={S.h1}>Kullanım Koşulları</h1>
              <p style={S.meta}>Servisim Hizmet Sözleşmesi — Son güncelleme: Ocak 2025</p>
            </div>
          </div>
          <hr style={{ border:"none", borderTop:"1px solid #f0f2f5", margin:"0 0 32px" }}/>

          <h2 style={S.h2}>1. Taraflar ve Kapsam</h2>
          <p style={S.p}>
            Bu Kullanım Koşulları ("Sözleşme"), Servisim Yazılım Teknolojileri Ltd. Şti. ("Servisim") ile
            platforma kaydolan kişi veya tüzel kişi ("Kullanıcı") arasındaki hukuki ilişkiyi düzenler.
            Kayıt butonuna tıklandığında bu Sözleşme kabul edilmiş sayılır.
          </p>

          <h2 style={S.h2}>2. Hizmet Tanımı</h2>
          <p style={S.p}>
            Servisim, asansör servis firmalarına yönelik iş emri yönetimi, bakım planı takibi,
            müşteri ve sözleşme yönetimi, stok ve faturalandırma işlevlerini kapsayan bulut tabanlı bir SaaS platformudur.
          </p>

          <h2 style={S.h2}>3. Hesap Güvenliği</h2>
          <p style={S.p}>
            Kullanıcı, hesap kimlik bilgilerinin gizliliğini korumakla yükümlüdür. Hesap üzerinden gerçekleştirilen
            tüm eylemlerden Kullanıcı sorumludur. Güvenlik ihlalinin fark edilmesi hâlinde
            <a href="mailto:destek@servisim.app" style={{ color:"#2563eb" }}> destek@servisim.app</a> adresine
            derhal bildirilmelidir.
          </p>

          <h2 style={S.h2}>4. Abonelik ve Fiyatlandırma</h2>
          <p style={S.p}>
            Servisim üç abonelik planı sunar. Tüm fiyatlar KDV hariçtir; yıllık ödemede %20 indirim uygulanır.
          </p>
          <table style={S.table}>
            <thead>
              <tr><Td head>Plan</Td><Td head>Aylık Fiyat</Td><Td head>Başlıca Özellikler</Td></tr>
            </thead>
            <tbody>
              <tr><Td>Başlangıç</Td><Td>₺990 / ay</Td><Td>İş emirleri, bakım planları, temel raporlar</Td></tr>
              <tr><Td>Pro</Td><Td>₺2.490 / ay</Td><Td>+ Stok yönetimi, e-fatura, öncelikli destek</Td></tr>
              <tr><Td>Kurumsal</Td><Td>Teklif alın</Td><Td>+ Çoklu lokasyon, API erişimi, SLA garantisi</Td></tr>
            </tbody>
          </table>
          <ul style={S.ul}>
            <li>Yeni hesaplar için <strong>14 günlük ücretsiz deneme</strong> sunulur; kredi kartı gerekmez.</li>
            <li>Ödemeler Stripe üzerinden güvenli biçimde gerçekleştirilir; kart bilgisi Servisim sunucularında saklanmaz.</li>
            <li>Abonelik her dönem başında otomatik yenilenir.</li>
            <li>İptal işlemi mevcut dönem bitmeden gerçekleştirilirse ücret iadesi yapılmaz; dönem sonuna kadar hizmet sağlanmaya devam eder.</li>
            <li>6502 sayılı TKHK kapsamındaki tüketici cayma hakkı, B2B SaaS aboneliklerinde uygulanamaz.</li>
          </ul>

          <h2 style={S.h2}>5. Fiyat Değişiklikleri</h2>
          <p style={S.p}>
            Servisim, abonelik fiyatlarını 30 gün önceden kayıtlı e-posta adresinize bildirim yaparak değiştirebilir.
            Yeni fiyatı kabul etmemek için aboneliği bildirim süresi içinde iptal etme hakkınız saklıdır.
          </p>

          <h2 style={S.h2}>6. Veri Sahipliği</h2>
          <p style={S.p}>
            Platforma girilen tüm veriler (müşteri kayıtları, iş emirleri, faturalar vb.) Kullanıcıya aittir.
            Servisim, bu verileri yalnızca hizmet sunumu amacıyla işler; üçüncü taraflara satmaz veya kiralamaz.
            Hesap silindikten 90 gün sonra veriler kalıcı olarak silinir (yasal saklama zorunluluğu olan kayıtlar hariç).
          </p>

          <h2 style={S.h2}>7. Yasaklı Kullanımlar</h2>
          <p style={S.p}>Aşağıdaki eylemler kesinlikle yasaktır:</p>
          <ul style={S.ul}>
            <li>Platformun yasadışı amaçlarla veya üçüncü kişileri zarara uğratmak için kullanılması</li>
            <li>Yetkisiz erişim girişimi, tersine mühendislik veya kaynak kod çıkarma</li>
            <li>Otomatik araçlarla platformu aşırı yükleme (DDoS benzeri eylemler)</li>
            <li>KVKK veya diğer kişisel veri mevzuatını ihlal eden veri girişi</li>
            <li>Başkasının kimliğini taklit etme</li>
          </ul>

          <h2 style={S.h2}>8. Fikri Mülkiyet</h2>
          <p style={S.p}>
            Platform yazılımı, tasarımı, markası ve içeriği Servisim mülkiyetindedir ve Türk fikir ve sanat eserleri
            mevzuatı ile uluslararası hukuk kapsamında korunmaktadır. Kullanıcıya yalnızca bu Sözleşme çerçevesinde
            sınırlı, devredilemez, münhasır olmayan bir kullanım lisansı verilmektedir.
          </p>

          <h2 style={S.h2}>9. Garanti Reddi ve Sorumluluk Sınırı</h2>
          <p style={S.p}>
            Platform "olduğu gibi" sunulmaktadır. Servisim, kesintisiz veya hatasız çalışmayı taahhüt etmemekle birlikte
            %99,5 çalışma süresi hedefler; planlı bakım için 24 saat önceden bildirim yapılır.
          </p>
          <p style={S.p}>
            Servisim'in herhangi bir talep için azami sorumluluğu, ihlalden önceki 12 aylık dönemde ödenen abonelik
            ücretiyle sınırlıdır. Türk Borçlar Kanunu'nun emredici hükümleri ve 6502 sayılı TKHK tüketici hakları
            bu sınırdan etkilenmez.
          </p>

          <h2 style={S.h2}>10. Sözleşmenin Sona Ermesi</h2>
          <ul style={S.ul}>
            <li><strong>Kullanıcı tarafından:</strong> Hesap Ayarları üzerinden dilediğiniz zaman iptal edilebilir.</li>
            <li><strong>Servisim tarafından:</strong> Bu Sözleşme'nin ağır ihlali veya ödeme temerrüdü hâlinde, 14 günlük yazılı bildirimden sonra hesap askıya alınabilir ya da kapatılabilir.</li>
            <li>Sona erme tarihinden itibaren 90 gün içinde verilerinizi dışa aktarabilirsiniz; sonrasında veriler silinir.</li>
          </ul>

          <h2 style={S.h2}>11. Değişiklikler</h2>
          <p style={S.p}>
            Önemli değişiklikler 14 gün önceden e-posta ile bildirilir. Değişikliklerin yürürlüğe girmesinden
            sonra platformu kullanmaya devam etmek yeni koşulların kabul edildiği anlamına gelir.
          </p>

          <h2 style={S.h2}>12. Uygulanacak Hukuk ve Yetki</h2>
          <p style={S.p}>
            Bu Sözleşme Türk hukukuna tabidir. Uyuşmazlıklarda İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri
            yetkilidir. 6502 sayılı TKHK kapsamındaki tüketiciler için tüketici hakem heyeti başvuru hakkı saklıdır.
          </p>

          <div style={{ marginTop:40, padding:"16px 20px", background:"#eff6ff", borderRadius:12, border:"1px solid #bfdbfe", fontSize:13, color:"#1e40af", lineHeight:1.7 }}>
            <strong>📧 Sorularınız için:</strong><br/>
            Hukuki talepler: <a href="mailto:legal@servisim.app" style={{ color:"#1e40af", fontWeight:600 }}>legal@servisim.app</a><br/>
            Genel destek: <a href="mailto:destek@servisim.app" style={{ color:"#1e40af", fontWeight:600 }}>destek@servisim.app</a>
          </div>
        </div>
      </div>
    </div>
  );
}
