# Değiştirmen Gereken 5 Dosya

Bu zip içindeki dosyaları GitHub reponuzun aynı konumlarına kopyalayıp push edin.

## Dosya Listesi ve Reponuzdaki Yeri

| Bu zip'teki yol | Repodaki yol |
|---|---|
| `components/Shell.tsx` | `components/Shell.tsx` |
| `app/globals.css` | `app/globals.css` |
| `app/layout.tsx` | `app/layout.tsx` |
| `app/app/assets/[id]/page.tsx` | `app/app/assets/[id]/page.tsx` |
| `app/app/assets/[id]/label/page.tsx` | `app/app/assets/[id]/label/page.tsx` |

## Ne Değişti

- **Shell.tsx**: Topbar'dan sayfa başlığı kaldırıldı (çift başlık sorunu çözüldü).
  Sidebar: siyah bg (#0d1117), arama kutusu, PRO badge, trial bar, yeni brand eklendi.
  Topbar: beyaz solid bg, search + bildirim + "Yeni İş Emri" butonu.
- **globals.css**: DM Sans font, nav-item stilleri
- **layout.tsx**: DM Sans font import
- **assets pages**: QR bölümü eklendi
