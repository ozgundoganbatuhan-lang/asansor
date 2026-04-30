# Deploy notları

## Vercel
- Node version: `20.x`
- Build Command: `./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma && npm run build`
- Install Command: `npm install --legacy-peer-deps`
- `DATABASE_URL` olarak Railway'in **public** PostgreSQL URL'sini girin.
- `railway.internal` adresini Vercel'de kullanmayın.

## Railway
- Docker deploy kullanıyorsanız bu repodaki `Dockerfile` yeterlidir.
- Uygulama açılışında önce `prisma migrate deploy`, başarısız olursa `prisma db push --skip-generate` denenir.
- `PORT` değişkeni Railway tarafından verilir; varsayılan 8080 tanımlıdır.

## Kritik hata kaynağı
Önceki hatada Docker `npm install` aşamasında `prisma/schema.prisma` dosyasını image içine kopyalamadan Prisma generate çalıştırdığı için kurulum kırılıyordu. Bu proje sürümünde Docker install katmanı schema'yı önceden kopyalar.
