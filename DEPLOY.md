# Deploy notları

Bu sürüm yalnızca Vercel sunucusuz ortamı ve Neon PostgreSQL veritabanı ile dağıtım için tasarlanmıştır. Önceki Railway tabanlı dağıtım yöntemleri kaldırılmıştır.

## Vercel

- **Node sürümü:** `20.x`
- **Install Command:** `npm install --legacy-peer-deps`
- **Build Command:** `npx prisma generate --schema=./prisma/schema.prisma && npm run build`
- **Çalışma zamanı:** Next.js App Router Vercel üzerinde sunucusuz fonksiyonlar olarak derlenir. Ek bir Docker veya container kurulumu gerekmez.
- **Ortam Değişkenleri:**
  - `DATABASE_URL`: Neon PostgreSQL bağlantı dizesi. Neon SSL gerektirir; bağlantı dizesinin sonuna `sslmode=require` eklediğinizden emin olun. Örnek: `postgresql://<kullanici>:<sifre>@<host>/<veritabani>?sslmode=require`.
  - `JWT_SECRET`: JSON Web Token imzalama anahtarı.
  - `NEXT_PUBLIC_APP_URL`: Uygulamanızın kök URL'si (ör. `https://servisim.vercel.app`).
  - Opsiyonel: `RESEND_API_KEY`, `NEXT_PUBLIC_WHATSAPP_URL`, `NEXT_PUBLIC_DEMO_VIDEO_URL`.

## Veritabanı (Neon)

Servisim, Prisma ORM üzerinden PostgreSQL veritabanı kullanır. Yerel geliştirme için dahi Neon kullanmanız önerilir; Neon ücretsiz katman sunar ve TLS/SSL üzerinden güvenli bağlantı sağlar. Neon üzerinde bir veritabanı oluşturun ve `DATABASE_URL` değişkenine uygun bağlantı dizesini yazın.

## Notlar

Bu projede Docker tabanlı bir deploy akışı bulunmaz. Tüm dağıtım süreci Vercel'in kendi altyapısı ve fonksiyonları üzerinden ilerler. Gereksiz yere uzun süre çalışan container'lar oluşturmanıza gerek yoktur.
