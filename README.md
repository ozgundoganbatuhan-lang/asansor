# 🚀 Asansör Servisim — Deployment Rehberi

## En Hızlı Canlıya Alma: Railway (Önerilen)

Railway, **PostgreSQL dahil** tam stack uygulamaları dakikalar içinde deploy etmenizi sağlar.

### Adım 1 — GitHub'a Push

```bash
git init && git add . && git commit -m "initial"
git remote add origin https://github.com/KULLANICI/asansor-servisim.git
git push -u origin main
```

### Adım 2 — Railway Kurulumu

1. [railway.app](https://railway.app) → GitHub ile kayıt
2. **New Project** → **Deploy from GitHub repo**
3. **Add Service** → **Database** → **PostgreSQL** ekle (DATABASE_URL otomatik gelir)

### Adım 3 — Ortam Değişkenleri

```env
DATABASE_URL         = (Railway PostgreSQL'den otomatik)
JWT_SECRET           = openssl rand -base64 32 ile üret
NEXT_PUBLIC_SITE_URL = https://PROJE.railway.app
```

### Adım 4 — Build Komutu

Railway Settings → Build Command:
```
npx prisma generate && npx prisma migrate deploy && npm run build
```

### Adım 5 — Seed (Railway Shell)

```bash
npx tsx prisma/seed.ts
```

---

## Alternatif: Vercel + Supabase

1. [supabase.com](https://supabase.com) → PostgreSQL bağlantı stringini al
2. `npm i -g vercel && vercel --prod`
3. Ortam değişkenlerini Vercel dashboard'a ekle
4. `npx prisma migrate deploy && npx tsx prisma/seed.ts`

---

## Lokal Geliştirme

```bash
npm install
cp .env.example .env   # DATABASE_URL ve JWT_SECRET gir
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

**Demo Giriş:** slug=`demo` | email=`demo@servisim.app` | şifre=`demo1234`

---

## Maliyet

| Platform | Plan | Maliyet |
|---|---|---|
| Railway Hobby | Uygulama + DB | ~$5-10/ay |
| Vercel Free + Supabase Free | 0$ | Küçük trafik için |

---

## Roadmap

- [ ] PDF fatura (react-pdf)
- [ ] SMS bildirimi (Netgsm)
- [ ] Drag-drop takvim (FullCalendar)
- [ ] Stripe abonelik
- [ ] Teknisyen mobil PWA
