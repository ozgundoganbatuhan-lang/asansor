"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { buildGoogleMapsDirections } from "@/lib/maps";
import {
  Button,
  Card,
  ErrorBanner,
  PageHeader,
  Pill,
  Spinner,
  StatLine,
} from "@/components/ui";
import MiniMap from "@/components/MiniMap";
import {
  statusLabel,
  statusTone,
  inspectionDueDate,
  daysBetween,
} from "@/lib/utils";

// Tip tanımları
type AssetHistory = {
  id: string;
  name: string;
  buildingName?: string | null;
  locationNote?: string | null;
  elevatorIdNo?: string | null;
  riskScore?: number | null;
  nextInspectionAt?: string | null;
  customer: {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
  };
  workOrders: Array<{
    id: string;
    code: string;
    type: string;
    status: string;
    createdAt: string;
    technician?: { name: string | null } | null;
  }>;
  inspections: Array<{
    id: string;
    inspectionDate: string;
    label: string;
    result: string;
  }>;
  maintenancePlans: Array<{
    id: string;
    nextDueAt: string;
    name?: string | null;
  }>;
};

/**
 * Asansör detay sayfası.
 * Bu sayfa, seçilen asansörün geçmişini ve risk durumunu kullanıcıya gösterir.
 * Yıllık kontrol etiketlerinin son tarihi ve kalan gün sayısı hesaplanır ve gösterilir.
 */
export default function AssetDetailPage() {
  const params = useParams<{ id: string }>();
  const [asset, setAsset] = useState<AssetHistory | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Asansör geçmişini yükle
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/assets/${params.id}/history`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Asansör yüklenemedi.");
        return;
      }
      setAsset(data.item);
    })();
  }, [params.id]);

  // Google harita yönlendirme bağlantısı oluştur
  const mapsUrl = useMemo(
    () =>
      buildGoogleMapsDirections({
        address: asset?.customer.address,
        label: `${asset?.buildingName ?? ""} ${asset?.name ?? ""}`,
      }),
    [asset]
  );

  if (error) {
    return <ErrorBanner msg={error} />;
  }
  if (!asset) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Risk puanı ve tonu
  const risk = asset.riskScore ?? 0;
  const riskTone = risk >= 70 ? "red" : risk >= 45 ? "amber" : "green";

  // Son periyodik kontrol etiketi ve kalan süre hesaplama
  const latestInspection =
    asset.inspections.length > 0 ? asset.inspections[0] : null;
  let inspectionDue: Date | null = null;
  let daysLeft: number | null = null;
  if (latestInspection) {
    const dueDate = inspectionDueDate(
      new Date(latestInspection.inspectionDate),
      latestInspection.label
    );
    inspectionDue = dueDate;
    if (dueDate) {
      daysLeft = daysBetween(dueDate, new Date());
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={asset.name}
        subtitle={`${asset.customer.name} · ${
          asset.buildingName || "Bina adı yok"
        } · ${asset.locationNote || "Konum notu yok"}`}
        action={
          <div className="flex flex-wrap gap-3">
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              <Button variant="secondary">Google Maps rota</Button>
            </a>
            <Link href={`/app/assets/${asset.id}/label`}>
              <Button>QR etiketi</Button>
            </Link>
          </div>
        }
      />
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          {/* Varlık özeti */}
          <Card
            tone="soft"
            title="Varlık özeti"
            subtitle="Kimlik, müşteri ve kontrol ritmini bu karttan okuyun."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[26px] bg-[linear-gradient(135deg,#07152d,#1456f0)] p-5 text-white shadow-[var(--shadow-soft)] md:col-span-2">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/50">
                  Risk görünümü
                </div>
                <div className="mt-3 flex items-center gap-3 text-3xl font-black tracking-[-0.05em]">
                  {risk}
                  <Pill tone={riskTone}>
                    {riskTone === "red"
                      ? "Yüksek"
                      : riskTone === "amber"
                      ? "İzlenmeli"
                      : "Kontrollü"}
                  </Pill>
                </div>
                <div className="mt-2 text-sm text-white/75">
                  Servis geçmişi ve saha kayıtları ile güncellenen operasyon
                  puanı.
                </div>
              </div>
              <StatLine
                label="Asansör kimlik no"
                value={asset.elevatorIdNo || "—"}
              />
              <StatLine
                label="Yaklaşan kontrol"
                value={
                  inspectionDue
                    ? `${inspectionDue.toLocaleDateString(
                        "tr-TR"
                      )} (${daysLeft} gün)`
                    : asset.nextInspectionAt
                    ? new Date(asset.nextInspectionAt).toLocaleDateString(
                        "tr-TR"
                      )
                    : "Plan yok"
                }
              />
              <StatLine label="Müşteri" value={asset.customer.name} />
              <StatLine label="Telefon" value={asset.customer.phone || "—"} />
            </div>
          </Card>

          {/* Plan ve kontrol özeti */}
          <Card
            title="Plan ve kontrol özeti"
            subtitle="Bakım ve yıllık kontrol akışını sade timeline ile izle."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {/* Bakım planı listesi */}
              <div className="rounded-[22px] bg-[color:var(--surface-soft-2)] p-4">
                <div className="text-sm font-bold text-[color:var(--foreground)]">
                  Bakım planı
                </div>
                <div className="mt-3 space-y-3 text-sm text-[color:var(--muted)]">
                  {asset.maintenancePlans.length === 0 ? (
                    <p>Plan bulunamadı.</p>
                  ) : (
                    asset.maintenancePlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="rounded-[18px] bg-white px-4 py-3 shadow-[var(--shadow-xs)]"
                      >
                        {new Date(plan.nextDueAt).toLocaleDateString(
                          "tr-TR"
                        )} {" "}
                        · {plan.name || "Periyodik bakım"}
                      </div>
                    ))
                  )}
                </div>
              </div>
              {/* Periyodik kontroller listesi */}
              <div className="rounded-[22px] bg-[color:var(--surface-soft-2)] p-4">
                <div className="text-sm font-bold text-[color:var(--foreground)]">
                  Periyodik kontroller
                </div>
                <div className="mt-3 space-y-3 text-sm text-[color:var(--muted)]">
                  {asset.inspections.length === 0 ? (
                    <p>Kontrol kaydı bulunamadı.</p>
                  ) : (
                    asset.inspections.map((inspection) => (
                      <div
                        key={inspection.id}
                        className="rounded-[18px] bg-white px-4 py-3 shadow-[var(--shadow-xs)]"
                      >
                        {new Date(inspection.inspectionDate).toLocaleDateString(
                          "tr-TR"
                        )} {" "}
                        · {inspection.label}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
          {/* Konum haritası */}
          <Card
            title="Konum haritası"
            subtitle="Müşteri adresi Google Maps üzerinde"
          >
            <MiniMap
              destination={{
                address: asset.customer.address || undefined,
                latitude: undefined,
                longitude: undefined,
                label: `${asset.buildingName ?? ""} ${asset.name}`,
              }}
            />
          </Card>
        </div>
        {/* Servis akışı */}
        <Card
          title="Servis akışı"
          subtitle="İş emirleri tarih sırasıyla aynı görünümde. QR ve public geçmiş deneyimini besleyen çekirdek kayıt burası."
        >
          <div className="space-y-3">
            {asset.workOrders.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">
                Bu asansör için iş emri görünmüyor.
              </p>
            ) : (
              asset.workOrders.map((item) => (
                <Link
                  key={item.id}
                  href={`/app/work-orders/${item.id}`}
                  className="flex flex-col gap-4 rounded-[24px] border border-[color:var(--border)] bg-white p-4 transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-soft-2)] md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="text-sm font-black text-[color:var(--foreground)]">
                      {item.code}
                    </div>
                    <div className="mt-1 text-sm text-[color:var(--muted)]">
                      {new Date(item.createdAt).toLocaleDateString(
                        "tr-TR"
                      )} {" "}
                      · {item.technician?.name || "Teknisyen atanmamış"}
                    </div>
                    <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-2)]">
                      {item.type}
                    </div>
                  </div>
                  <Pill tone={statusTone(item.status)}>
                    {statusLabel(item.status)}
                  </Pill>
                </Link>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}