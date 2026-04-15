export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  keywords: string[];
  cover: string;
  publishedAt: string;
  readingMinutes: number;
  body: { heading: string; paragraphs: string[]; bullets?: string[] }[];
  faq?: { question: string; answer: string }[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "asansor-bakim-takibi-nasil-duzenlenir",
    title: "Asansör bakım takibi nasıl düzenlenir?",
    excerpt: "Aylık bakım döngüsünü dağılmadan yönetmek için operasyon sistemi, ekip akışı ve kanıtlı servis kaydı nasıl kurulmalı?",
    description: "Asansör bakım takibini düzenli, denetlenebilir ve ekipler için kolay hale getirmek isteyen firmalar için pratik rehber.",
    keywords: ["asansör bakım takibi", "asansör bakım programı", "asansör servis yazılımı"],
    cover: "/blog-covers/asansor-bakim-takibi-nasil-duzenlenir.svg",
    publishedAt: "2026-04-05",
    readingMinutes: 6,
    body: [
      {
        heading: "Takip sistemi takvimden fazlasıdır",
        paragraphs: [
          "Asansör bakım takibi sadece tarihlerden ibaret değildir. Hangi asansörün hangi binada olduğu, son bakımın nasıl geçtiği, teknisyenin ne not bıraktığı ve bir sonraki ziyaretin ne zaman planlandığı birlikte görülmelidir.",
          "Birçok firma hâlâ Excel, WhatsApp ve kağıt formlar arasında gidip geliyor. Bu yapı büyüdükçe kontrol kaybı yaratır. İyi bir bakım sistemi iş emrini, servis geçmişini, müşteri bilgisini ve tahsilat görünürlüğünü aynı yerde toplar."
        ],
        bullets: [
          "Bina bazlı görünüm",
          "Aylık bakım planı ve gecikme uyarısı",
          "Teknisyen atama ve rota akışı",
          "Fotoğraf ve imzalı servis kanıtı"
        ]
      },
      {
        heading: "Operasyon ritmini görünür yapın",
        paragraphs: [
          "İyi sistemler sadece veri saklamaz, ritim kurar. Bugün yapılacak işler, geciken bakımlar, bu hafta bitecek sözleşmeler ve tahsilat bekleyen müşteriler ilk ekranda görünmelidir.",
          "Bu ritim kurulmadığında ekip tepki vererek çalışır. Ritim kurulduğunda ise ekip planlı çalışır ve müşteri güveni artar."
        ]
      }
    ],
    faq: [
      { question: "Bakım planı ne sıklıkla gözden geçirilmeli?", answer: "En az haftalık operasyon toplantısında gelecek 7 gün ve geciken işler birlikte kontrol edilmelidir." },
      { question: "Teknisyenlerin sahada hangi bilgiyi görmesi gerekir?", answer: "Adres, bina adı, son servis özeti, yapılacak kontroller ve müşteriyi arama aksiyonu tek ekranda görünmelidir." }
    ]
  },
  {
    slug: "asansor-servis-gecmisi-neden-onemli",
    title: "Asansör servis geçmişi neden önemli?",
    excerpt: "Her ziyaretin geçmişte nasıl sonuçlandığını görmek, tekrar eden arızaları ve müşteri riskini erken yakalamanızı sağlar.",
    description: "Asansör servis geçmişi ekranı neden kritik ve hangi veriler görünmeli?", keywords: ["asansör servis geçmişi", "asansör bakım geçmişi", "servis kaydı"],
    cover: "/blog-covers/asansor-servis-gecmisi-neden-onemli.svg", publishedAt: "2026-04-05", readingMinutes: 5,
    body: [
      { heading: "Geçmişi olmayan ekip her arızayı sıfırdan yaşar", paragraphs: ["Servis geçmişi sayesinde aynı asansörde aynı arızanın kaç kez tekrar ettiğini görebilirsiniz.", "Bu görünürlük müşteriye daha güvenli iletişim kurmanızı ve tekrarlayan maliyetleri azaltmanızı sağlar."], bullets: ["Son ziyaret tarihi", "Yapılan işlem", "Kullanılan parçalar", "Fotoğraf ve imza kanıtı"] },
      { heading: "Bina bazlı görünüm müşteriye de değer verir", paragraphs: ["QR ile açılan bina geçmişi, yönetim tarafına profesyonel bir izlenim verir.", "Bu yalnızca operasyonel değil, ticari bir fark yaratır."] }
    ],
    faq: [{ question: "Servis geçmişinde hangi kayıtlar olmalı?", answer: "Bakım, arıza, muayene, parça değişimi ve müşteri onayı ayrı ayrı görünmelidir." }]
  },
  {
    slug: "asansor-qr-etiket-kullanimi",
    title: "Asansörlerde QR etiket kullanımı nasıl değer yaratır?",
    excerpt: "Tek bir etiketle saha geçmişi, sonraki bakım tarihi ve bina görünürlüğü sunabilirsiniz.",
    description: "QR etiketli asansör servis takibi ile operasyon ve müşteri deneyimi nasıl güçlenir?", keywords: ["asansör qr etiket", "qr etiketli servis takibi", "bina servis geçmişi"],
    cover: "/blog-covers/asansor-qr-etiket-kullanimi.svg", publishedAt: "2026-04-05", readingMinutes: 4,
    body: [
      { heading: "QR etiket sahayı hızlandırır", paragraphs: ["Teknisyen bina girişinde etiketi okutarak doğru asansöre, doğru geçmişe ve doğru iş emrine ulaşabilir.", "Adres aramak, kağıt dosya karıştırmak ve müşteri geçmişini yeniden toplamak gibi sürtünmeleri azaltır."], bullets: ["Doğru kayıt açılışı", "Public servis geçmişi", "Daha hızlı saha başlangıcı"] },
      { heading: "Müşterinin gördüğü ekran da önemlidir", paragraphs: ["QR ekranı güven veren, sade ve markalı olmalıdır.", "Aşırı veri değil, doğru veri görünmelidir: son bakım, bir sonraki plan, servis firması iletişim bilgisi."] }
    ]
  },
  {
    slug: "asansor-periyodik-kontrol-nedir",
    title: "Asansör periyodik kontrol süreci nedir?",
    excerpt: "Yıllık kontrol takibini unutulmaz hale getirmek için süreç akışını yazılım içinde görünür kılın.",
    description: "Asansör periyodik kontrol süreci ve bunun yazılım tarafında nasıl yönetileceği hakkında pratik rehber.", keywords: ["asansör periyodik kontrol", "yıllık asansör kontrolü", "asansör muayene takibi"],
    cover: "/blog-covers/asansor-periyodik-kontrol-nedir.svg", publishedAt: "2026-04-05", readingMinutes: 5,
    body: [
      { heading: "Takvim değil süreç yönetin", paragraphs: ["Periyodik kontrol için yalnızca tarih hatırlatması yetmez. Eksiklerin kapatılması, etiket durumu ve sonraki hedef tarihin ekip tarafından görünür olması gerekir.", "Bu yüzden kontrol kayıtları ayrı modül olarak tutulmalı ve asansör detay ekranına bağlanmalıdır."] },
      { heading: "Risk iletişimi görünür olmalı", paragraphs: ["Kusur etiketi, eksiklik özeti ve sonraki adım teknik ekip ile yönetim ekranlarında aynı doğrulukla görünmelidir."] }
    ]
  },
  {
    slug: "asansor-bakim-sozlesmesi-yonetimi",
    title: "Asansör bakım sözleşmesi yönetimi nasıl kolaylaşır?",
    excerpt: "Sözleşme bitişi, bakım planı ve tahsilat görünürlüğü tek panelde birleştiğinde ekip daha kontrollü büyür.",
    description: "Bakım sözleşmelerini kağıt ve takvim yerine dijital olarak nasıl yönetebilirsiniz?", keywords: ["asansör bakım sözleşmesi", "sözleşme takibi", "bakım anlaşması"],
    cover: "/blog-covers/asansor-bakim-sozlesmesi-yonetimi.svg", publishedAt: "2026-04-05", readingMinutes: 5,
    body: [
      { heading: "Sözleşme bilgisi operasyon bilgisidir", paragraphs: ["Sözleşme başlangıcı, bitişi, aylık bedel ve kapsanan asansörler sahadan kopuk kalmamalıdır.", "Yenileme fırsatı ile gecikme riski aynı veri içinde takip edilmelidir."] },
      { heading: "Yenileme uyarıları satış fırsatıdır", paragraphs: ["Sözleşme bitişine yaklaşan kayıtlar yalnızca operasyon değil, ticari ekip için de görünür olmalıdır."] }
    ]
  },
  {
    slug: "asansor-ariza-kayit-sureci-nasil-iyilestirilir",
    title: "Asansör arıza kayıt süreci nasıl iyileştirilir?",
    excerpt: "Arıza kaydı alındığı andan kapanışa kadar net bir akış kurulmadığında ekip gereksiz telefon trafiğine boğulur.",
    description: "Arıza kaydı alma, teknisyen atama ve servis kapanışı akışını iyileştirmek için öneriler.", keywords: ["asansör arıza kaydı", "iş emri süreci", "arıza yönetimi"],
    cover: "/blog-covers/asansor-ariza-kayit-sureci-nasil-iyilestirilir.svg", publishedAt: "2026-04-05", readingMinutes: 6,
    body: [
      { heading: "Arıza kaydı kısa ve net olmalı", paragraphs: ["İlk kayıt anında sadece gereken bilgiler alınmalı: bina, kişi, telefon, sorun özeti, öncelik.", "Detaylı teknik değerlendirme teknisyen ekranında tamamlanmalıdır."] },
      { heading: "Kapanış kanıtlı olmalı", paragraphs: ["İş bittiğinde fotoğraf, imza, not ve zaman bilgisi tek akışta kaydedilmelidir."] }
    ]
  },
  {
    slug: "asansor-servis-programi-secerken-nelere-bakilmali",
    title: "Asansör servis programı seçerken nelere bakılmalı?",
    excerpt: "Güzel görünen her panel iyi operasyon üretmez. Satın alma öncesi bakmanız gereken kritik alanları sıraladık.",
    description: "Asansör servis yazılımı seçerken bakmanız gereken temel ürün kriterleri.", keywords: ["asansör servis programı", "asansör servis yazılımı", "servis uygulaması"],
    cover: "/blog-covers/asansor-servis-programi-secerken-nelere-bakilmali.svg", publishedAt: "2026-04-05", readingMinutes: 6,
    body: [
      { heading: "Görev akışı test edilmeden karar vermeyin", paragraphs: ["Bir ürünün güzel dashboard göstermesi yeterli değildir. İş emri oluşturmak, teknisyene atamak, rota açmak, fotoğraf yüklemek ve servisi kapatmak gerçekten kolay olmalıdır."], bullets: ["Mobil kullanım", "Servis formu", "Dosya yükleme", "QR ve bina geçmişi"] },
      { heading: "Veri taşıma ve eğitim de önemlidir", paragraphs: ["Excel import, ilk kurulum akışı ve ekip adaptasyonu ürün seçiminde göz ardı edilmemelidir."] }
    ]
  },
  {
    slug: "asansor-servis-firmalari-icin-mobil-uyum",
    title: "Asansör servis firmaları için mobil uyum neden kritik?",
    excerpt: "Teknisyen saha ekranında masaüstü panel görmek istemez. Hızlı, tek elle ve çevrimdışı tolere eden akış gerekir.",
    description: "Asansör servis ekipleri için mobil uyumlu PWA deneyimi neden kritiktir?", keywords: ["mobil servis uygulaması", "asansör teknisyen uygulaması", "pwa servis"],
    cover: "/blog-covers/asansor-servis-firmalari-icin-mobil-uyum.svg", publishedAt: "2026-04-05", readingMinutes: 4,
    body: [
      { heading: "Sahadaki kişi form doldurmak istemez", paragraphs: ["Mobil deneyim liste değil görev odaklı olmalıdır. Bugünkü işler, rota, fotoğraf, imza ve kapatma adımları tek ekranda ilerlemelidir."] },
      { heading: "PWA iyi bir ara aşamadır", paragraphs: ["Mobil uygulama çıkmadan önce güçlü bir PWA yaklaşımı, saha ekiplerinin uygulamayı ana ekrana alarak kullanmasını sağlar."] }
    ]
  },
  {
    slug: "bina-bazli-servis-gecmisi-neden-onemli",
    title: "Bina bazlı servis geçmişi neden önemli?",
    excerpt: "Tek asansör değil, bina portföyü üzerinden düşünmek yönetim deneyimini güçlendirir.",
    description: "Bina bazlı servis geçmişi ile müşteri iletişimi ve operasyon yönetimi nasıl iyileşir?", keywords: ["bina bazlı servis geçmişi", "asansör bina paneli", "servis geçmişi ekranı"],
    cover: "/blog-covers/bina-bazli-servis-gecmisi-neden-onemli.svg", publishedAt: "2026-04-05", readingMinutes: 4,
    body: [
      { heading: "Müşteri tek cihaz değil bina görür", paragraphs: ["Yönetim tarafı çoğu zaman tek bir asansörü değil, bütün binadaki hizmet seviyesini görmek ister.", "Bina bazlı geçmiş bu yüzden yalnızca tasarım tercihi değil, müşteri değeri üretir."] },
      { heading: "Portföy takibi kolaylaşır", paragraphs: ["Bir müşterideki tüm asansörleri ve yakın bakım tarihlerini bir arada görmek saha planlamasını da iyileştirir."] }
    ]
  },
  {
    slug: "asansor-servis-firmasi-icin-seo-fikirleri",
    title: "Asansör servis firması için SEO fikirleri",
    excerpt: "Sadece reklamla büyümek yerine yerel niyet aramalarına uygun içerik üreten firmalar daha sürdürülebilir talep toplar.",
    description: "Asansör servis firmaları için SEO içerik fikirleri ve blog stratejisi.", keywords: ["asansör servis seo", "asansör servis blog", "yerel servis pazarlaması"],
    cover: "/blog-covers/asansor-servis-firmasi-icin-seo-fikirleri.svg", publishedAt: "2026-04-05", readingMinutes: 5,
    body: [
      { heading: "Yerel aramaya uygun içerik üretin", paragraphs: ["Şehir bazlı, süreç bazlı ve yönetmelik bazlı içerikler üretmek hizmet niyetine yakın aramaları yakalamanızı sağlar."] },
      { heading: "Blog ile ürün birbirini beslemeli", paragraphs: ["İçeriğin sonunda demo, QR ekranı veya servis formu gibi ürün özelliklerine bağlanan çağrılar bulunmalıdır."] }
    ]
  },

  // 2026 yılı için eklenen yeni yazılar – trendler ve dijitalleşme üzerine.
  {
    slug: "asansor-servis-portal-2026-trendleri",
    title: "Asansör servis portalı 2026 trendleri",
    excerpt: "Operasyon platformları nasıl evriliyor? 2026'da servis yazılımlarında öne çıkan trendleri derledik.",
    description: "Asansör servis firmaları için yazılım ve teknoloji trendleri. API entegrasyonlarından yapay zekâ destekli rota optimizasyonuna kadar yeni gelişmeler.",
    keywords: ["asansör servis trendleri", "servis yazılımı", "asansör teknoloji 2026"],
    cover: "/blog-covers/asansor-servis-firmalari-icin-mobil-uyum.svg",
    publishedAt: "2026-04-10",
    readingMinutes: 5,
    body: [
      {
        heading: "Yeni nesil API entegrasyonları",
        paragraphs: [
          "2026 yılında operasyon sistemlerinin diğer uygulamalarla konuşması zorunluluk hâline geldi. Muhasebe, ödeme ve IoT cihazlarıyla kurulan API köprüleri veriyi aktarmayı kolaylaştırıyor.",
          "Servisim gibi platformlar açık API'ler sunarak firmaların kendi entegrasyonlarını geliştirmesine imkân veriyor."
        ],
        bullets: [
          "Muhasebe ve CRM entegrasyonları",
          "IoT sensör verisi ile bakım uyarıları",
          "Webhook ve otomasyon"
        ]
      },
      {
        heading: "Yapay zekâ destekli rota optimizasyonu",
        paragraphs: [
          "Teknisyenlerin günlük rotalarının otomatik olarak optimize edilmesi, hem zaman hem yakıt tasarrufu sağlıyor. Yapay zekâ algoritmaları trafik, iş aciliyeti ve teknisyen yetkinliklerini hesaba katıyor.",
          "Bu sayede acil arızalara en yakın uygun teknisyen yönlendirilirken, planlı bakımlar da düzgün sıralanıyor."
        ]
      }
    ],
    faq: [
      {
        question: "Yapay zekâ rota optimizasyonu nasıl çalışır?",
        answer: "Sistem; teknisyen konumu, trafik yoğunluğu, iş önceliği ve geçmiş performans verilerini değerlendirerek en kısa ve verimli rotayı önerir."
      },
      {
        question: "API entegrasyonu neden önemlidir?",
        answer: "Manuel veri aktarımını ortadan kaldırır ve tüm sistemlerinizin senkron çalışmasını sağlar. Bu sayede hem hata oranı düşer hem de iş gücü tasarrufu sağlanır."
      }
    ]
  },
  {
    slug: "dijital-bakim-defteri-nedir",
    title: "Dijital bakım defteri nedir?",
    excerpt: "Kağıt defterleri bırakın, dijital bakım defteri ile servis geçmişini anında görün.",
    description: "Dijital bakım defteri; asansör servisi geçmişini, parçaları ve kontrol sonuçlarını tek platformda tutarak operasyon şeffaflığı sağlar.",
    keywords: ["dijital bakım defteri", "servis geçmişi", "asansör kayıt defteri"],
    cover: "/blog-covers/asansor-servis-gecmisi-neden-onemli.svg",
    publishedAt: "2026-04-08",
    readingMinutes: 4,
    body: [
      {
        heading: "Kağıt defterlerden bulut kayıtlara",
        paragraphs: [
          "Birçok servis firması hâlâ saha kayıtlarını kağıt defterlerde tutuyor. Bu yöntem hem arşiv hem de erişim açısından zorluklar yaratıyor.",
          "Dijital bakım defteri ise tüm servis geçmişini bulut ortamında saklar, QR etiketi ile anında ulaşılabilir ve denetimlerde kolayca paylaşılabilir."
        ],
        bullets: [
          "Erişimi kolaylaştırır",
          "Kayıp ve unutulmayı engeller",
          "Denetim ve raporlama süreçlerini hızlandırır"
        ]
      },
      {
        heading: "Müşteri deneyimini güçlendirir",
        paragraphs: [
          "Yönetici ve bina sakinleri, servis geçmişine diledikleri an erişebilir. Bu şeffaflık hizmet kalitesine olan güveni arttırır.",
          "Servisim gibi platformlarda müşteriye özel portal üzerinden bakım defterini göstermek, firmaya ayrı bir rekabet avantajı sunar."
        ]
      }
    ],
    faq: [
      {
        question: "Dijital bakım defteri yasal olarak geçerli midir?",
        answer: "Elektronik kayıtlar, ilgili yönetmeliklere uygun şekilde saklandığında periyodik kontrol ve bakım süreçlerinde delil olarak kabul edilir."
      }
    ]
  }
];

export function getAllBlogPosts() {
  return BLOG_POSTS;
}

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getRelatedPosts(slug: string, limit = 3) {
  return BLOG_POSTS.filter((post) => post.slug !== slug).slice(0, limit);
}
