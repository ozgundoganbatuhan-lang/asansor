import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyAssetShareToken } from "@/lib/asset-share";
import { statusLabel, statusTone, inspectionDueDate, daysBetween } from "@/lib/utils";

export default async function PublicAssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;
  if (!token) notFound();
  const payload = verifyAssetShareToken(token);
  if (!payload || payload.assetId !== id) notFound();

  const asset = await prisma.asset.findFirst({
    where: { id, organizationId: payload.orgId },
    include: {
      customer: { select: { name: true, address: true, phone: true } },
      workOrders: {
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { technician: { select: { name: true } } },
      },
      maintenancePlans: { orderBy: { nextDueAt: "asc" }, take: 2 },
      inspections: { orderBy: { inspectionDate: "desc" }, take: 3 },
      // Include related contracts via ContractAsset join to expose publicly shared documents
      contractAssets: {
        include: {
          contract: {
            select: {
              id: true,
              contractNumber: true,
              fileUrl: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!asset) notFound();

  /**
   * A simple representation of a public document associated with an asset.
   * This type is used to annotate the `documents` array below so that
   * TypeScript infers a strongly typed structure instead of `any`.
   */
  type DocumentItem = {
    id: string;
    number: string;
    fileUrl: string;
    startDate?: Date | string | null;
  };

  // Determine the next inspection deadline and days left based on the most
  // recent inspection label. If no inspection exists we fall back to the
  // maintenance plan's next due date (already calculated below). This helps
  // provide a clear countdown for building managers.
  const latestInspection = asset.inspections[0];
  let labelDue: Date | null = null;
  let labelDaysLeft: number | null = null;
  if (latestInspection) {
    labelDue = inspectionDueDate(new Date(latestInspection.inspectionDate), latestInspection.label);
    labelDaysLeft = daysBetween(labelDue, new Date());
  }

  const nextDue = asset.maintenancePlans[0]?.nextDueAt ? new Date(asset.maintenancePlans[0].nextDueAt).toLocaleDateString("tr-TR") : "Plan yok";
  const inspectionLabel = asset.inspections[0]?.label ?? "Kayıt yok";
  const labelCountdown = labelDaysLeft !== null ? `${labelDaysLeft} gün` : null;

  // Gather public documents (e.g. bakım sözleşmeleri) from related contracts. Only
  // include those with a fileUrl defined. Each item includes the contract
  // number (if any) and file URL.
  const documents: DocumentItem[] = (asset as any).contractAssets
    ?.map((ca: any) => ca.contract)
    ?.filter((c: any) => c?.fileUrl)
    ?.map((c: any) => ({
      id: c.id,
      number: c.contractNumber ?? "Belge",
      fileUrl: c.fileUrl as string,
      startDate: c.startDate,
    })) ?? [];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#06142d_0%,#0b2553_34%,#102d63_100%)] px-4 py-6 text-white md:px-6 md:py-10">
      <div className="mx-auto max-w-[1120px]">
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/10 p-6 shadow-[0_30px_80px_rgba(3,12,33,0.35)] backdrop-blur md:p-8">
          <div className="absolute inset-y-0 right-0 w-[42%] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_56%)]" />
          <div className="relative z-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/66">QR ile servis görünümü</div>
              <h1 className="mt-5 text-3xl font-black tracking-[-0.06em] md:text-[3rem]">{asset.name}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78 md:text-[15px]">{asset.customer.name} · {asset.buildingName || "Bina adı yok"}. Bu sayfa bina yöneticisi ve teknik ekip için son servis hareketlerini, bakım planını ve güncel iletişim bilgisini sade bir dille gösterir.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Badge>{nextDue}</Badge>
                <Badge>{inspectionLabel}</Badge>
                {asset.customer.phone ? <Badge>{asset.customer.phone}</Badge> : null}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <HeroStat label="Bir sonraki bakım" value={nextDue} note="Yaklaşan bakım tarihi" />
              {/* Show the latest inspection label and remaining days until the regulatory deadline. */}
              <HeroStat
                label="Son kontrol etiketi"
                value={`${inspectionLabel}${labelCountdown ? ` · ${labelCountdown}` : ""}`}
                note="Kontrol sonucu ve kalan süre"
              />
              {/* Prefer organisation support phone if provided, otherwise fall back to customer phone. */}
              <HeroStat
                label="İletişim"
                value={process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? asset.customer.phone ?? "—"}
                note="Servis firması irtibatı"
              />
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-[32px] border border-white/10 bg-white/10 p-5 backdrop-blur md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-lg font-black tracking-[-0.03em]">Servis zaman akışı</div>
                <div className="mt-1 text-sm text-white/64">Son servis kayıtları, teknisyen bilgisi ve özet açıklamalar</div>
              </div>
              <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">{asset.workOrders.length} kayıt</div>
            </div>
            <div className="mt-5 space-y-4">
              {asset.workOrders.length === 0 ? <EmptyCard text="Henüz servis kaydı paylaşılmadı." /> : asset.workOrders.map((item: { id: string; code: string; status: string; createdAt: string; note?: string | null; technician?: { name?: string | null } | null }) => (
                <article key={item.id} className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.08))] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-black tracking-[-0.03em]">{item.code}</div>
                      <div className="mt-2 text-sm text-white/64">{new Date(item.createdAt).toLocaleDateString("tr-TR")} · {item.technician?.name || "Teknisyen bilgisi yok"}</div>
                    </div>
                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white/82">
                      {statusLabel(item.status)}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-[18px_1fr] md:items-start">
                    <div className="mt-1 hidden h-3 w-3 rounded-full bg-white/75 md:block" />
                    <div className="rounded-[20px] bg-white/8 px-4 py-4 text-sm leading-7 text-white/76">{item.note || "Servis özeti eklenmedi. Teknik detaylar iç operasyon sisteminde tutulur."}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-white/10 p-5 backdrop-blur md:p-6">
              <div className="text-lg font-black tracking-[-0.03em]">Bina ve ekipman bilgisi</div>
              <div className="mt-5 space-y-3">
                <InfoRow label="Adres" value={asset.customer.address || "Belirtilmedi"} />
                <InfoRow label="Konum notu" value={asset.locationNote || "Belirtilmedi"} />
                <InfoRow label="Asansör kimlik no" value={asset.elevatorIdNo || "Belirtilmedi"} />
                <InfoRow label="Bina" value={asset.buildingName || "Belirtilmedi"} />
              </div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/10 p-5 backdrop-blur md:p-6">
              <div className="text-lg font-black tracking-[-0.03em]">Kontrol ve bakım özeti</div>
              <div className="mt-5 grid gap-3">
                {asset.inspections.length === 0 ? (
                  <EmptyCard text="Periyodik kontrol kaydı bulunmuyor." />
                ) : (
                  asset.inspections.map((inspection: { id: string; inspectionDate: string; label?: string | null; note?: string | null }) => (
                    <div key={inspection.id} className="rounded-[22px] bg-white/8 px-4 py-4 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-bold">
                          {new Date(inspection.inspectionDate).toLocaleDateString("tr-TR")}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                          {inspection.label || "Etiket yok"}
                        </span>
                      </div>
                      <div className="mt-2 text-white/66">
                        {inspection.note || "Not eklenmedi."}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Documents section: list publicly shared contract files */}
            <section className="rounded-[32px] border border-white/10 bg-white/10 p-5 backdrop-blur md:p-6">
              <div className="text-lg font-black tracking-[-0.03em]">Belgeler ve sözleşmeler</div>
              <div className="mt-5 space-y-3">
                {documents.length === 0 ? (
                  <EmptyCard text="Paylaşılan belge bulunmuyor." />
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] bg-white/8 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-white/90">
                          {doc.number || "Belge"}
                        </div>
                        {doc.startDate && (
                          <div className="text-xs text-white/60">
                            {new Date(doc.startDate).toLocaleDateString("tr-TR")}
                          </div>
                        )}
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-[18px] bg-[color:var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-soft)] hover:bg-[color:var(--primary-dark)]"
                      >
                        Görüntüle / İndir
                      </a>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[32px] border border-white p-5 text-[color:var(--foreground)] shadow-[var(--shadow-soft)] md:p-6">
              <div className="text-lg font-black tracking-[-0.03em]">Bu ekran neden var?</div>
              <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
                QR etiket okutulduğunda bina yöneticisi veya teknik ekip son servisleri, yaklaşan bakım tarihini ve iletişim bilgisini hızla görür. İç operasyon notları, mali veriler ve kurum içi detaylar burada paylaşılmaz.
              </p>
              {process.env.NEXT_PUBLIC_SUPPORT_PHONE || asset.customer.phone ? (
                <a
                  href={`tel:${process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? asset.customer.phone}`}
                  className="mt-5 inline-flex rounded-[20px] bg-[color:var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)]"
                >
                  Servis firmasını ara
                </a>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/88 backdrop-blur">{children}</div>;
}

function HeroStat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/50">{label}</div>
      <div className="mt-3 text-xl font-black tracking-[-0.04em] text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-white/68">{note}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[20px] bg-white/8 px-4 py-4 text-sm">
      <span className="text-white/58">{label}</span>
      <span className="max-w-[68%] text-right font-semibold text-white/88">{value}</span>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return <div className="rounded-[22px] bg-white/8 px-4 py-4 text-sm text-white/66">{text}</div>;
}

function labelForStatus(status: string) {
  switch (status) {
    case "DONE":
      return "Tamamlandı";
    case "IN_PROGRESS":
      return "Sahada";
    case "URGENT":
      return "Acil";
    case "CANCELED":
      return "İptal";
    default:
      return "Planlı";
  }
}
