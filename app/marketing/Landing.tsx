import Link from "next/link";

const features = [
  {
    icon: "📋",
    title: "İş Emirleri",
    desc: "Arıza, periyodik bakım, yıllık muayene — tüm talepleri tek ekranda oluştur, ata ve takip et.",
  },
  {
    icon: "🏗️",
    title: "Asansör Envanteri",
    desc: "Bina, durak, kapasite, kontrol ünitesi, seri no ve risk skoru ile eksiksiz kayıt.",
  },
  {
    icon: "👷",
    title: "Teknisyen Yönetimi",
    desc: "Bölge bazlı atama, sertifika takibi ve anlık durum bilgisi.",
  },
  {
    icon: "🔩",
    title: "Stok & Parça",
    desc: "Minimum stok uyarısı, tedarikçi ve fiyat bilgisiyle parça yönetimi.",
  },
  {
    icon: "🧾",
    title: "Faturalama",
    desc: "İş emrinden tek tıkla fatura oluştur, KDV hesapla, ödeme takibi yap.",
  },
  {
    icon: "📊",
    title: "Raporlar & CSV",
    desc: "Operasyon ve finans özetleri, tüm veriler CSV olarak dışa aktarılabilir.",
  },
];

const stats = [
  { value: "5 dk", label: "Kurulum süresi" },
  { value: "30 gün", label: "Ücretsiz deneme" },
  { value: "0", label: "Kredi kartı gerekmez" },
  { value: "%100", label: "Türkçe arayüz" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <path d="M15 3v9a3 3 0 01-6 0V3" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-gray-900">Servisim</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Giriş Yap
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-20 pt-20 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            Asansör servisleri için özel tasarlandı
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Asansör servis yönetimini
            <br />
            <span className="text-blue-600">tek ekranda</span> yapın
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            İş emirleri, bakım planları, teknisyen atamaları, stok ve faturalama — hepsi bir arada.
            Kurumsal panelle sahanızı ve ofisinizi senkronize edin.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/auth/register"
              className="w-full rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-lg hover:bg-blue-700 transition-colors sm:w-auto"
            >
              30 Gün Ücretsiz Dene
            </Link>
            <Link
              href="/auth/login"
              className="w-full rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors sm:w-auto"
            >
              Demo hesabıyla giriş yap
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-500">Kredi kartı gerekmez · Kurulum 5 dakika · Türkçe destek</p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold tracking-tight text-blue-600">{s.value}</div>
                <div className="mt-1 text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Asansör servisi için ihtiyacınız olan her şey
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500">
              Küçük ve orta ölçekli servis firmaları için kurumsal düzeyde araçlar.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="mb-4 text-3xl">{f.icon}</div>
                <h3 className="mb-2 text-base font-bold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white">
            Bugün başlayın, 30 gün boyunca ücretsiz kullanın
          </h2>
          <p className="mt-4 text-blue-100">
            Kayıt sırasında kredi kartı bilgisi istenmez. İstediğiniz zaman iptal edebilirsiniz.
          </p>
          <Link
            href="/auth/register"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-base font-bold text-blue-700 hover:bg-blue-50 transition-colors shadow-sm"
          >
            Hemen Üye Ol →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Servisim — Asansör Teknik Servis Yönetimi</p>
          <p className="mt-1 text-xs">KVKK uyumlu · Verileriniz Türkiye'de barındırılır</p>
        </div>
      </footer>
    </div>
  );
}
