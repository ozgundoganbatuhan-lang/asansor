import PrintButton from "@/components/PrintButton";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readWorkOrderEvidence } from "@/lib/work-order-evidence";
import { listWorkOrderAttachments } from "@/lib/work-order-attachments";

export default async function ServiceFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      asset: true,
      technician: true,
      partsUsed: { include: { part: true } },
    },
  });
  if (!workOrder) notFound();

  const evidence = await readWorkOrderEvidence(workOrder.organizationId, workOrder.id);
  const attachments = await listWorkOrderAttachments(workOrder.organizationId, workOrder.id);
  const totalParts = workOrder.partsUsed.reduce((sum: number, usage: { quantity: number; part: { price?: number | null } }) => sum + ((usage.part.price ?? 0) * usage.quantity), 0);
  const total = workOrder.laborCost + workOrder.serviceFee + totalParts;

  return (
    <main className="mx-auto max-w-[1100px] px-5 py-8 print:max-w-none print:px-0 print:py-0">
      <div className="panel overflow-hidden rounded-[40px] print:rounded-none print:border-0 print:shadow-none">
        <section className="relative overflow-hidden border-b border-[color:var(--border)] bg-[linear-gradient(135deg,#06142d_0%,#0d2f6e_55%,#1456f0_100%)] px-7 py-8 text-white print:bg-white print:text-[color:var(--foreground)] md:px-9">
          <div className="absolute inset-y-0 right-0 w-[36%] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_58%)] print:hidden" />
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/55 print:text-[color:var(--muted-2)]">Servis formu</div>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] print:text-[color:var(--foreground)]">{workOrder.code}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78 print:text-[color:var(--muted)]">{workOrder.customer.name} · {workOrder.asset?.buildingName || "Bina adı yok"} · {workOrder.asset?.name || "Asansör atanmadı"}</p>
            </div>
            <div className="flex flex-wrap gap-3 print:hidden">
              <PrintButton className="rounded-[22px] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--primary)] shadow-[var(--shadow-soft)]" />
            </div>
          </div>
        </section>

        <div className="p-7 md:p-9">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <section className="space-y-6">
              <section className="rounded-[30px] bg-[color:var(--surface-soft)] p-6">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--muted-2)]">Servis özeti</div>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[color:var(--foreground)]">Kanıtlı saha kapanışı</h2>
                <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">Bu form müşteri, bina yöneticisi ve iç operasyon ekibi için ortak özet görevi görür. Yapılan iş, zaman damgaları, kullanılan parçalar ve görsel kanıt tek sayfada toplanır.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Stat label="Başlangıç" value={fmtDate(evidence.startedAt)} />
                  <Stat label="Bitiş" value={fmtDate(evidence.endedAt)} />
                  <Stat label="Sonuç" value={evidence.serviceOutcome || "—"} />
                  <Stat label="Onaylayan" value={evidence.signoffName || "—"} />
                  <Stat label="Muhatap" value={evidence.customerContact || "—"} />
                  <Stat label="Teknisyen" value={workOrder.technician?.name || "Atanmadı"} />
                </div>
              </section>

              <section className="rounded-[30px] border border-[color:var(--border)] p-6">
                <div className="text-lg font-black tracking-[-0.03em] text-[color:var(--foreground)]">Detaylı açıklama</div>
                <div className="mt-4 rounded-[24px] bg-[color:var(--surface-soft-2)] p-5 text-sm leading-7 text-[color:var(--foreground-soft)]">
                  {evidence.summary || workOrder.note || "Servis özeti girilmedi."}
                </div>
              </section>

              <section className="rounded-[30px] border border-[color:var(--border)] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-lg font-black tracking-[-0.03em] text-[color:var(--foreground)]">Kullanılan parçalar</div>
                    <div className="mt-1 text-sm text-[color:var(--muted)]">Parça kullanımı ve tahmini mali etkisi</div>
                  </div>
                  <div className="rounded-full bg-[color:var(--surface-soft)] px-4 py-2 text-sm font-bold text-[color:var(--primary)]">Toplam {money(totalParts)}</div>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {workOrder.partsUsed.length === 0 ? <p className="text-sm text-[color:var(--muted)]">Parça kaydı girilmedi.</p> : workOrder.partsUsed.map((usage: { id: string; quantity: number; part: { name: string; price?: number | null } }) => (
                    <div key={usage.id} className="rounded-[24px] bg-[color:var(--surface-soft-2)] p-4 text-sm">
                      <div className="font-bold text-[color:var(--foreground)]">{usage.part.name}</div>
                      <div className="mt-1 text-[color:var(--muted)]">Adet: {usage.quantity}</div>
                      <div className="mt-3 text-base font-extrabold text-[color:var(--foreground)]">{usage.part.price ? money(usage.part.price * usage.quantity) : "—"}</div>
                    </div>
                  ))}
                </div>
              </section>
            </section>

            <section className="space-y-6">
              <section className="rounded-[30px] border border-[color:var(--border)] p-6">
                <div className="text-lg font-black tracking-[-0.03em] text-[color:var(--foreground)]">Temel bilgiler</div>
                <div className="mt-5 space-y-3">
                  <Info label="Müşteri" value={workOrder.customer.name} />
                  <Info label="Telefon" value={workOrder.customer.phone || "—"} />
                  <Info label="Adres" value={workOrder.customer.address || "—"} />
                  <Info label="Asansör" value={workOrder.asset?.name || "—"} />
                  <Info label="Bina" value={workOrder.asset?.buildingName || "—"} />
                  <Info label="Planlanan tarih" value={fmtDate(workOrder.scheduledAt)} />
                </div>
              </section>

              <section className="rounded-[30px] border border-[color:var(--border)] p-6">
                <div className="text-lg font-black tracking-[-0.03em] text-[color:var(--foreground)]">Finans özeti</div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Stat label="İşçilik" value={money(workOrder.laborCost)} />
                  <Stat label="Servis" value={money(workOrder.serviceFee)} />
                  <Stat label="Parçalar" value={money(totalParts)} />
                  <Stat label="Toplam" value={money(total)} strong />
                </div>
              </section>

              {evidence.signatureDataUrl ? (
                <section className="rounded-[30px] border border-[color:var(--border)] p-6">
                  <div className="text-lg font-black tracking-[-0.03em] text-[color:var(--foreground)]">Dijital onay</div>
                  <div className="mt-4 overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-white p-4">
                    <img src={evidence.signatureDataUrl} alt="İmza" className="h-auto w-full rounded-[18px] object-contain" />
                  </div>
                </section>
              ) : null}
            </section>
          </div>

          <section className="mt-6 rounded-[30px] border border-[color:var(--border)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-lg font-black tracking-[-0.03em] text-[color:var(--foreground)]">Ekli fotoğraflar</div>
                <div className="mt-1 text-sm text-[color:var(--muted)]">Servis öncesi, sonrası ve yerinde çekilen kanıtlar</div>
              </div>
              <div className="rounded-full bg-[color:var(--surface-soft)] px-4 py-2 text-sm font-bold text-[color:var(--primary)]">{attachments.length} görsel</div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {attachments.length === 0 ? <p className="text-sm text-[color:var(--muted)]">Fotoğraf yüklenmedi.</p> : attachments.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-white">
                  <img src={item.url} alt={item.originalName} className="h-52 w-full object-cover" />
                  <div className="p-4">
                    <div className="line-clamp-2 text-sm font-semibold text-[color:var(--foreground)]">{item.originalName}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function fmtDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("tr-TR");
}

function money(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format((value ?? 0) / 100);
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[20px] bg-[color:var(--surface-soft-2)] px-4 py-3 text-sm">
      <span className="text-[color:var(--muted)]">{label}</span>
      <span className="max-w-[70%] text-right font-semibold text-[color:var(--foreground)]">{value}</span>
    </div>
  );
}

function Stat({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`rounded-[22px] px-4 py-4 ${strong ? "border border-[color:var(--border-strong)] bg-[color:var(--surface-soft)]" : "bg-[color:var(--surface-soft-2)]"}`}>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[color:var(--muted-2)]">{label}</div>
      <div className="mt-2 text-base font-black tracking-[-0.03em] text-[color:var(--foreground)]">{value}</div>
    </div>
  );
}
