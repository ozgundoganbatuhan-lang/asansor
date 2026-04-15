"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PhotoUploader from "@/components/PhotoUploader";
import SignaturePad from "@/components/SignaturePad";
import { buildGoogleMapsDirections } from "@/lib/maps";
import { Button, Card, ErrorBanner, Input, PageHeader, Pill, Select, Spinner, Textarea } from "@/components/ui";

type WorkOrder = {
  id: string;
  code: string;
  status: string;
  type: string;
  priority?: string | null;
  note?: string | null;
  laborCost: number;
  serviceFee: number;
  scheduledAt?: string | null;
  completedAt?: string | null;
  customer: { id: string; name: string; phone?: string | null; address?: string | null; email?: string | null };
  asset?: { id: string; name: string; buildingName?: string | null; locationNote?: string | null; elevatorIdNo?: string | null } | null;
  technician?: { id: string; name: string; phone?: string | null } | null;
  partsUsed: Array<{ id: string; quantity: number; part: { id: string; name: string; price?: number | null } }>;
  invoice?: { id: string; number: string; status: string } | null;
};

type Evidence = {
  startedAt?: string | null;
  endedAt?: string | null;
  serviceOutcome?: string | null;
  summary?: string | null;
  signoffName?: string | null;
  customerContact?: string | null;
  locationNote?: string | null;
  signatureDataUrl?: string | null;
};

type Attachment = { id: string; url: string; originalName: string; size: number };

type Technician = { id: string; name: string };
type Asset = { id: string; name: string; buildingName?: string | null };

type StatusTone = "neutral" | "amber" | "red" | "green";

const statuses = [
  ["PENDING", "Planlı", "neutral"],
  ["IN_PROGRESS", "Devam ediyor", "amber"],
  ["URGENT", "Acil", "red"],
  ["DONE", "Tamamlandı", "green"],
  ["CANCELED", "İptal", "neutral"],
] as const;

function money(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format((value ?? 0) / 100);
}

function fmtDate(value?: string | null, withTime = true) {
  if (!value) return "—";
  return new Date(value).toLocaleString("tr-TR", withTime ? undefined : { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function WorkOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<WorkOrder | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [evidence, setEvidence] = useState<Evidence>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "info">("success");

  const [form, setForm] = useState({ status: "PENDING", technicianId: "", assetId: "", scheduledAt: "", note: "", laborCost: "0", serviceFee: "0" });

  async function load() {
    const [itemRes, techRes, evidenceRes, attachmentRes] = await Promise.all([
      fetch(`/api/work-orders/${params.id}`),
      fetch(`/api/technicians`),
      fetch(`/api/work-orders/${params.id}/evidence`),
      fetch(`/api/work-orders/${params.id}/attachments`),
    ]);
    const itemData = await itemRes.json();
    if (!itemRes.ok) {
      setError(itemData.error ?? "İş emri yüklenemedi.");
      return;
    }
    setItem(itemData.item);
    setForm({
      status: itemData.item.status,
      technicianId: itemData.item.technician?.id ?? "",
      assetId: itemData.item.asset?.id ?? "",
      scheduledAt: itemData.item.scheduledAt ? itemData.item.scheduledAt.slice(0, 16) : "",
      note: itemData.item.note ?? "",
      laborCost: String((itemData.item.laborCost ?? 0) / 100),
      serviceFee: String((itemData.item.serviceFee ?? 0) / 100),
    });
    setTechnicians((await techRes.json()).items ?? []);
    setEvidence((await evidenceRes.json()).item ?? {});
    setAttachments((await attachmentRes.json()).items ?? []);

    if (itemData.item.customer?.id) {
      const assetsRes = await fetch(`/api/assets?customerId=${itemData.item.customer.id}`);
      const assetsData = await assetsRes.json();
      setAssets(assetsData.items ?? []);
    }
  }

  useEffect(() => {
    void load();
  }, [params.id]);

  const mapsUrl = useMemo(
    () => buildGoogleMapsDirections({ address: item?.customer.address, label: `${item?.asset?.buildingName ?? ""} ${item?.asset?.name ?? ""}` }),
    [item],
  );
  const currentStatusTone = statuses.find((status) => status[0] === item?.status)?.[2] as StatusTone | undefined;

  const totalCost = useMemo(() => {
    if (!item) return 0;
    return item.laborCost + item.serviceFee + item.partsUsed.reduce((sum, usage) => sum + (usage.part.price ?? 0) * usage.quantity, 0);
  }, [item]);

  const completionChecklist = useMemo(
    () => [
      { label: "Teknisyen atandı", done: Boolean(form.technicianId) },
      { label: "Planlanan saat girildi", done: Boolean(form.scheduledAt) },
      { label: "Servis özeti yazıldı", done: Boolean((evidence.summary ?? "").trim()) },
      { label: "Fotoğraf yüklendi", done: attachments.length > 0 },
      { label: "İmza alındı", done: Boolean(evidence.signatureDataUrl) },
    ],
    [attachments.length, evidence.signatureDataUrl, evidence.summary, form.scheduledAt, form.technicianId],
  );

  const completionRate = Math.round((completionChecklist.filter((item) => item.done).length / completionChecklist.length) * 100);

  async function saveOrder() {
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/work-orders/${params.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: form.status,
        technicianId: form.technicianId || null,
        assetId: form.assetId || null,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
        note: form.note || null,
        laborCost: Math.round(Number(form.laborCost || 0) * 100),
        serviceFee: Math.round(Number(form.serviceFee || 0) * 100),
        completedAt: form.status === "DONE" ? new Date().toISOString() : null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "İş emri kaydedilemedi.");
      return;
    }
    setMessageTone("success");
    setMessage("Operasyon kartı güncellendi.");
    await load();
  }

  async function saveEvidence() {
    setError(null);
    const res = await fetch(`/api/work-orders/${params.id}/evidence`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(evidence),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Servis kanıtı kaydedilemedi.");
      return;
    }
    setMessageTone("success");
    setMessage("Servis kanıtı ve imza kaydedildi.");
  }

  function quickStatus(nextStatus: string) {
    setForm((prev) => ({ ...prev, status: nextStatus }));
    setMessageTone("info");
    setMessage(nextStatus === "IN_PROGRESS" ? "Durum devam ediyor olarak hazırlandı. Kaydettiğinizde iş emrine işlenecek." : "Durum tamamlandı olarak hazırlandı. Kaydettiğinizde kapanış zamanı da atanacak.");
  }

  if (!item) {
    return <div className="flex min-h-[50vh] items-center justify-center">{error ? <ErrorBanner msg={error} /> : <Spinner />}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[linear-gradient(135deg,#06142d_0%,#0d2f6e_55%,#1456f0_100%)] p-6 text-white shadow-[var(--shadow-hard)] md:p-8">
        <div className="absolute inset-y-0 right-0 w-[42%] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_55%)]" />
        <div className="relative z-10 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/70">Saha operasyon kartı</div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-[-0.06em] md:text-[3rem]">{item.code}</h1>
              <Pill tone={currentStatusTone ?? "neutral"} className="bg-white/90 text-slate-800">{statuses.find((status) => status[0] === item.status)?.[1] ?? item.status}</Pill>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/78 md:text-[15px]">{item.customer.name} · {item.asset?.buildingName || "Bina adı yok"} · {item.asset?.name || "Asansör atanmadı"}. Saha kapanışı, fotoğraf yükleme, imza ve servis formu tek akışta yönetilir.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="rounded-[22px] border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/16">Rota aç</a>
              <Link href={`/service-forms/${item.id}`} target="_blank" className="rounded-[22px] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--primary)] shadow-[var(--shadow-soft)]">Servis formu</Link>
              {item.customer.phone ? <a href={`tel:${item.customer.phone}`} className="rounded-[22px] border border-white/15 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/8">Müşteriyi ara</a> : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            <MetricBox label="Hazırlık skoru" value={`%${completionRate}`} note="Kanıtlı kapanış için gerekli alanların doluluk oranı" strong />
            <MetricBox label="Tahmini maliyet" value={money(totalCost)} note="İşçilik, servis ve parça toplamı" />
            <MetricBox label="Planlanan zaman" value={form.scheduledAt ? fmtDate(new Date(form.scheduledAt).toISOString()) : "Henüz yok"} note={item.technician?.name || "Teknisyen atanmadı"} />
          </div>
        </div>
      </section>

      <PageHeader
        eyebrow="Premium workflow"
        title="İş emri deneyimi"
        subtitle="Operasyon, servis kanıtı ve görsel kayıt aynı sayfada. Saha ekibi tek bakışta ne yapacağını anlar, ofis ekibi de kapanışı güvenle izler."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="soft" onClick={() => quickStatus("IN_PROGRESS")}>Şimdi başlat</Button>
            <Button variant="secondary" onClick={() => quickStatus("DONE")}>Kapatmaya hazırla</Button>
          </div>
        }
      />

      {error && <ErrorBanner msg={error} />}
      {message && <div className={`rounded-[22px] border px-4 py-3 text-sm font-semibold ${messageTone === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-blue-100 bg-blue-50 text-blue-700"}`}>{message}</div>}

      <div className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card
            title="Operasyon kartı"
            subtitle="İş emrinin atama, tarih ve maliyet ayarlarını güncelle. Karmaşayı azaltmak için yalnızca gerçekten karar gerektiren alanlar burada tutuldu."
            action={<Pill tone="blue">{item.type}</Pill>}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Select label="Durum" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
                {statuses.map((status) => <option key={status[0]} value={status[0]}>{status[1]}</option>)}
              </Select>
              <Select label="Teknisyen" value={form.technicianId} onChange={(e) => setForm((prev) => ({ ...prev, technicianId: e.target.value }))}>
                <option value="">Teknisyen seçin</option>
                {technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}
              </Select>
              <Select label="Asansör" value={form.assetId} onChange={(e) => setForm((prev) => ({ ...prev, assetId: e.target.value }))}>
                <option value="">Asansör seçin</option>
                {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}{asset.buildingName ? ` · ${asset.buildingName}` : ""}</option>)}
              </Select>
              <Input label="Planlanan tarih" type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((prev) => ({ ...prev, scheduledAt: e.target.value }))} />
              <Input label="İşçilik (₺)" type="number" value={form.laborCost} onChange={(e) => setForm((prev) => ({ ...prev, laborCost: e.target.value }))} />
              <Input label="Servis ücreti (₺)" type="number" value={form.serviceFee} onChange={(e) => setForm((prev) => ({ ...prev, serviceFee: e.target.value }))} />
              <div className="md:col-span-2">
                <Textarea label="İş emri notu" value={form.note} onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))} />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={saveOrder} disabled={saving}>{saving ? "Kaydediliyor..." : "Operasyonu kaydet"}</Button>
              <Button variant="soft" onClick={() => setForm((prev) => ({ ...prev, note: `${prev.note ? `${prev.note.trim()}\n` : ""}Yerinde kontrol tamamlandı.` }))}>Hazır not ekle</Button>
            </div>
          </Card>

          <Card
            tone="soft"
            title="Servis kanıtı ve onay"
            subtitle="Zaman, sonuç, özet, muhatap ve imza aynı blokta toplanır. Kapanış kalitesi yükselsin diye akış olabildiğince kısa tutuldu."
            action={<div className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[color:var(--primary)] shadow-[var(--shadow-xs)]">Kanıtlı kapanış</div>}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Başlangıç saati" type="datetime-local" value={evidence.startedAt ? evidence.startedAt.slice(0, 16) : ""} onChange={(e) => setEvidence((prev) => ({ ...prev, startedAt: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
              <Input label="Bitiş saati" type="datetime-local" value={evidence.endedAt ? evidence.endedAt.slice(0, 16) : ""} onChange={(e) => setEvidence((prev) => ({ ...prev, endedAt: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
              <Input label="Servis sonucu" value={evidence.serviceOutcome ?? ""} onChange={(e) => setEvidence((prev) => ({ ...prev, serviceOutcome: e.target.value }))} placeholder="Bakım tamamlandı / parça bekleniyor" />
              <Input label="Onaylayan kişi" value={evidence.signoffName ?? ""} onChange={(e) => setEvidence((prev) => ({ ...prev, signoffName: e.target.value }))} placeholder="Bina yöneticisi" />
              <Input label="Sahadaki muhatap" value={evidence.customerContact ?? ""} onChange={(e) => setEvidence((prev) => ({ ...prev, customerContact: e.target.value }))} />
              <Input label="Konum notu" value={evidence.locationNote ?? ""} onChange={(e) => setEvidence((prev) => ({ ...prev, locationNote: e.target.value }))} />
              <div className="md:col-span-2">
                <Textarea label="Servis özeti" value={evidence.summary ?? ""} onChange={(e) => setEvidence((prev) => ({ ...prev, summary: e.target.value }))} placeholder="Yapılan işlem, tespit edilen durum ve önerilen aksiyonlar" />
              </div>
              <div className="md:col-span-2">
                <SignaturePad value={evidence.signatureDataUrl} onChange={(signatureDataUrl) => setEvidence((prev) => ({ ...prev, signatureDataUrl }))} />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={saveEvidence}>Kanıtı kaydet</Button>
              <Button variant="secondary" onClick={() => setEvidence((prev) => ({ ...prev, summary: item.note ?? prev.summary }))}>İş emri notunu özet alanına al</Button>
            </div>
          </Card>

          <Card title="Fotoğraf kanıtları" subtitle="URL alanı yerine doğrudan çekim ve yükleme. Görseller cihazda sıkıştırılır, ardından iş emrine bağlanır.">
            <PhotoUploader workOrderId={item.id} onUploaded={(newItems) => setAttachments((prev) => [...newItems, ...prev])} />
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {attachments.length === 0 ? <p className="text-sm text-[color:var(--muted)]">Henüz fotoğraf yüklenmedi.</p> : attachments.map((attachment) => (
                <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-[26px] border border-[color:var(--border)] bg-white shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5">
                  <div className="relative">
                    <img src={attachment.url} alt={attachment.originalName} className="h-52 w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.72))] px-4 pb-3 pt-10 text-xs font-bold text-white/90">Görsel kanıt</div>
                  </div>
                  <div className="space-y-1 p-4">
                    <div className="line-clamp-2 text-sm font-semibold text-[color:var(--foreground)]">{attachment.originalName}</div>
                    <div className="text-xs text-[color:var(--muted)]">Yüklenen dosya · Yeni sekmede aç</div>
                  </div>
                </a>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Kapanış hazırlığı" subtitle="Kaliteli servis kaydı için kalan eksikler ve hızlı aksiyonlar." action={<Pill tone={completionRate >= 80 ? "green" : completionRate >= 50 ? "amber" : "red"}>%{completionRate}</Pill>}>
            <div className="rounded-[22px] bg-[color:var(--surface-soft)] p-3">
              <div className="h-2 overflow-hidden rounded-full bg-white/80">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#1456f0,#5ca9ff)] transition-all" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {completionChecklist.map((entry) => (
                <div key={entry.label} className="flex items-center justify-between gap-4 rounded-[20px] bg-[color:var(--surface-soft-2)] px-4 py-3 text-sm">
                  <span className="font-medium text-[color:var(--foreground)]">{entry.label}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${entry.done ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{entry.done ? "Tamam" : "Eksik"}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Müşteri ve konum" subtitle="Sahada hızlı erişim için gereken iletişim bilgileri ve adres detayları.">
            <div className="space-y-4">
              <InfoLine label="Müşteri" value={item.customer.name} />
              <InfoLine label="Telefon" value={item.customer.phone || "—"} />
              <InfoLine label="Adres" value={item.customer.address || "—"} />
              <InfoLine label="Asansör" value={item.asset?.name || "—"} />
              <InfoLine label="Bina" value={item.asset?.buildingName || "—"} />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {item.customer.phone ? <a href={`tel:${item.customer.phone}`} className="rounded-[20px] border border-[color:var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)]">Müşteriyi ara</a> : null}
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="rounded-[20px] bg-[color:var(--surface-soft)] px-4 py-2.5 text-sm font-semibold text-[color:var(--primary)]">Google Maps ile git</a>
            </div>
          </Card>

          <Card title="Finans ve stok görünümü" subtitle="Bu iş emrinin sahadaki mali etkisi ve kullanılan parçalar." action={item.invoice ? <Pill tone="green">{item.invoice.number}</Pill> : <Pill tone="gray">Fatura yok</Pill>}>
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniMetric label="İşçilik" value={money(item.laborCost)} />
              <MiniMetric label="Servis" value={money(item.serviceFee)} />
              <MiniMetric label="Parçalar" value={money(item.partsUsed.reduce((sum, usage) => sum + (usage.part.price ?? 0) * usage.quantity, 0))} />
              <MiniMetric label="Toplam" value={money(totalCost)} strong />
            </div>
            <div className="mt-5 space-y-3">
              {item.partsUsed.length === 0 ? <p className="text-sm text-[color:var(--muted)]">Parça eklenmedi.</p> : item.partsUsed.map((usage) => (
                <div key={usage.id} className="flex items-center justify-between gap-4 rounded-[22px] bg-[color:var(--surface-soft-2)] px-4 py-3 text-sm">
                  <div>
                    <div className="font-semibold text-[color:var(--foreground)]">{usage.part.name}</div>
                    <div className="text-[color:var(--muted)]">Adet: {usage.quantity}</div>
                  </div>
                  <div className="font-bold text-[color:var(--foreground)]">{usage.part.price ? money(usage.part.price * usage.quantity) : "—"}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, note, strong = false }: { label: string; value: string; note: string; strong?: boolean }) {
  return (
    <div className={`rounded-[28px] border border-white/10 ${strong ? "bg-white/14" : "bg-white/10"} p-5 backdrop-blur`}>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/54">{label}</div>
      <div className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-white/72">{note}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[20px] bg-[color:var(--surface-soft-2)] px-4 py-3 text-sm">
      <span className="text-[color:var(--muted)]">{label}</span>
      <span className="max-w-[70%] text-right font-semibold text-[color:var(--foreground)]">{value}</span>
    </div>
  );
}

function MiniMetric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`rounded-[22px] border px-4 py-4 ${strong ? "border-[color:var(--border-strong)] bg-[color:var(--surface-soft)]" : "border-[color:var(--border)] bg-white"}`}>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--muted-2)]">{label}</div>
      <div className="mt-3 text-xl font-black tracking-[-0.04em] text-[color:var(--foreground)]">{value}</div>
    </div>
  );
}
