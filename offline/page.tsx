export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[color:var(--background)] px-6 py-16">
      <div className="max-w-md rounded-[32px] border border-[color:var(--border)] bg-white p-8 text-center shadow-[var(--shadow-soft)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--surface-soft)] text-2xl">📡</div>
        <h1 className="text-2xl font-black text-[color:var(--foreground)]">Bağlantı şu an yok</h1>
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
          Uygulama bağlantı geri geldiğinde tekrar senkronize olur. Saha ekipleri için temel ekranlar çevrimdışı toleransla çalışacak şekilde hazırlanıyor.
        </p>
      </div>
    </main>
  );
}
