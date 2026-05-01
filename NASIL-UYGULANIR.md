# GitHub Reponuza Uygulama Talimatı

Bu zip'i açtığınızda "final-repo" adlı bir klasör çıkacak.
Bu klasörün İÇİNDEKİ dosyaları GitHub reponuzdaki
aynı dosyaların ÜSTÜNE KOPYALAYIN, sonra push edin.

## Değişen Dosyalar:

1. components/Shell.tsx         → sidebar + topbar tamamen yeniden yazıldı
2. app/globals.css              → DM Sans font, renkler, nav-item
3. app/layout.tsx               → DM Sans font import
4. app/app/contracts/page.tsx   → inline styles, Tailwind kaldırıldı
5. app/app/invoices/page.tsx    → inline styles, Tailwind kaldırıldı
6. app/app/maintenance-plans/page.tsx → inline styles, Tailwind kaldırıldı
7. app/app/inspections/page.tsx → inline styles, Tailwind kaldırıldı
8. app/app/assets/[id]/page.tsx → QR bölümü eklendi
9. app/app/assets/[id]/label/page.tsx → yeniden tasarlandı

## Adımlar:

1. Bu zip'i aç → "final-repo" klasörü çıkar
2. Her dosyayı GitHub reponuzdaki aynı yola kopyala
3. git add . && git commit -m "design update" && git push
4. Vercel otomatik deploy eder
