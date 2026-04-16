# Servisim

Asansör servis firmaları için Next.js tabanlı operasyon yönetim uygulaması.

## Kurulum

```bash
npm install --legacy-peer-deps
npm run dev
```

## Production

```bash
npm run build
npm run start
```

## Gerekli environment variables

- DATABASE_URL
- JWT_SECRET
- NEXT_PUBLIC_APP_URL
- RESEND_API_KEY (opsiyonel)
- NEXT_PUBLIC_WHATSAPP_URL (opsiyonel)
- NEXT_PUBLIC_DEMO_VIDEO_URL (opsiyonel)

## Deploy

Uygulamayı Vercel üzerinde Neon PostgreSQL ile dağıtmak için aşağıdaki ayarları kullanın:

- **Vercel:** Bu depo bir `vercel.json` dosyası içerir. `installCommand` olarak `npm install --legacy-peer-deps` ve `buildCommand` olarak `npx prisma generate --schema=./prisma/schema.prisma && next build` tanımlıdır.
- **PostgreSQL (Neon):** `DATABASE_URL` ortam değişkenini [Neon](https://neon.tech/) hizmetinden aldığınız bağlantı dizesiyle doldurun. Neon SSL gerektirir; bağlantı dizesi sonuna `sslmode=require` ekleyin. Örnek: `postgresql://<username>:<password>@<host>/<db>?sslmode=require`.
- **Diğer ortam değişkenleri:** `JWT_SECRET`, `NEXT_PUBLIC_APP_URL` gibi değerleri `.env.example` dosyasını temel alarak doldurun.

Railway ya da başka bir container tabanlı servis bu proje için artık gerekli değildir; uygulama serverless işlevler üzerinden çalışır ve veritabanı bağlantısını Neon üzerinden yapar.
