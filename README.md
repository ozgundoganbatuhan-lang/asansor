# Servisim — Asansör Servis Yönetim SaaS

## Kurulum

### 1. Bağımlılıkları kur
```bash
npm install
```

### 2. .env dosyasını oluştur
```bash
cp .env.example .env
```
`.env` dosyasını düzenle, Neon connection string'ini yapıştır.

### 3. Veritabanı tablolarını oluştur (Neon)
```bash
npx prisma db push
```

### 4. Geliştirme sunucusunu başlat
```bash
npm run dev
```

---

## Git'e Push Etme (ZIP'ten güncelleme)

ZIP'i indirip dosyaları mevcut git reponuza kopyalamanız gerekir:

### macOS / Linux
```bash
# ZIP'i Downloads'a indirdin, git repon ~/Desktop/servisim'de
cd ~/Downloads
unzip asansor-servisim-v11-final.zip

# Git reponun içine kopyala (reponu sil değil, üstüne yaz)
cp -r asansor-servisim-repo/. ~/Desktop/servisim/

cd ~/Desktop/servisim
git add -A
git status
git commit -m "feat: v11"
git push
```

### Windows (PowerShell)
```powershell
# ZIP'i çıkart, sonra:
Copy-Item -Recurse -Force "C:\Users\Sen\Downloads\asansor-servisim-repo\*" "C:\Users\Sen\Desktop\servisim\"

cd C:\Users\Sen\Desktop\servisim
git add -A
git status
git commit -m "feat: v11"
git push
```

---

## Vercel Ortam Değişkenleri

Vercel → Settings → Environment Variables:

| Değişken | Değer |
|----------|-------|
| `DATABASE_URL` | Neon connection string (`?sslmode=require` ile) |
| `JWT_SECRET` | Güçlü rastgele string |
| `NEXT_PUBLIC_SITE_URL` | https://asansor.teknix.tech |

---

## Neon Veritabanı Kurulumu (ilk kurulum)

1. neon.tech → New Project → Region: **Frankfurt (eu-central-1)**
2. Connection string'i kopyala
3. `.env` dosyasına yapıştır
4. `npx prisma db push` çalıştır → tüm tablolar otomatik oluşur
5. Vercel'deki `DATABASE_URL`'i güncelle → Redeploy

## Vercel'de Neon Migration (tablo güncelleme)

Yeni tablo/alan eklendiğinde (v11 gibi):
```bash
# Yerelde .env'de Neon URL varsa:
npx prisma db push
```

Ya da Neon → SQL Editor'da çalıştır:
```sql
-- prisma/v11-migration.sql içeriğini buraya yapıştır
```
