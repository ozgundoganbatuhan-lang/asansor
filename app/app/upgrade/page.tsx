"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, Textarea, Pill } from "@/components/ui";

type Entitlements = { isExpired: boolean; isTrial: boolean; canWrite: boolean; trialEndsAt: string; planTier: string; daysLeft: number };

const PLANS = [
  {
    id: "STARTER",
    name: "Başlangıç",
    subtitle: "1–3 teknisyenli küçük ekipler",
    price: "₺990",
    period: "/ay",
    highlight: false,
    features: [
      "Müşteri ve asansör kaydı (sınırsız)",
      "İş emirleri ve bakım planları",
      "Takvim ve atama",
      "Temel raporlar (CSV)",
      "E-posta desteği",
    ],
    cta: "Bu Paketi Seç",
  },
  {
    id: "PRO",
    name: "Pro",
    subtitle: "Büyüyen saha operasyonları",
    price: "₺2.490",
    period: "/ay",
    highlight: true,
    features: [
      "Başlangıç paketinin tümü",
      "Stok ve parça yönetimi",
      "Faturalama (PDF çıktı)",
      "Sözleşme ve periyodik kontrol",
            "WhatsApp öncelikli destek",
    ],
    cta: "En Çok Tercih Edilen",
  },
  {
    id: "ENTERPRISE",
    name: "Kurumsal",
    subtitle: "Çok şube / büyük filolar",
    price: "Teklif",
    period: "",
    highlight: false,
    features: [
      "Pro paketinin tümü",
      "Çok lokasyon desteği",
      "Özel entegrasyonlar (API)",
      "Onboarding eğitimi",
      "SLA garantili öncelikli destek",
      "Özel fiyatlandırma",
    ],
    cta: "Teklif Al",
  },
];

export default function UpgradePage() {
  const [ent, setEnt] = useState<Entitlements | null>(null);
  const [sent, setSent] = useState<{ id: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("PRO");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [monthlyJobs, setMonthlyJobs] = useState("");
  const [technicianCount, setTechnicianCount] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch("/api/entitlements")
      .then((r) => r.json())
      .then((j) => setEnt(j.ent))
      .catch(() => null);
  }, []);

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/purchase-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          monthlyJobs: monthlyJobs ? Number(monthlyJobs) : undefined,
          technicianCount: technicianCount ? Number(technicianCount) : undefined,
          city: city || undefined,
          note: `[${selectedPlan}] ${note}`.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gönderilemedi");
      setSent(json.item);
    } catch (e: any) {
      setErr(e.message ?? "Hata");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plan Seçin</h1>
          <p className="mt-1 text-sm text-slate-500">
            İhtiyacınıza uygun paketi belirleyin. Satış ekibimiz sizi arayarak süreci tamamlar.
          </p>
        </div>
        {ent && (
          <Pill tone={ent.isExpired ? "warning" : ent.isTrial ? "neutral" : "blue"}>
            {ent.isExpired
              ? "Deneme Bitti"
              : ent.isTrial
              ? `Deneme: ${ent.daysLeft} gün`
              : "Aktif"}
          </Pill>
        )}
      </div>

      {/* Trial expired banner */}
      {ent?.isExpired && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <div className="text-sm font-semibold text-amber-900">Deneme süreniz doldu — sistemin salt-okunur moddasınız</div>
              <div className="mt-0.5 text-xs text-amber-700">
                Aşağıdaki formu doldurun; satış ekibimiz 1 iş günü içinde sizi arar ve aktivasyonu yapar.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={[
              "relative flex flex-col rounded-2xl border p-5 text-left transition-all",
              selectedPlan === plan.id
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-offset-1"
                : plan.highlight
                ? "border-blue-200 bg-white shadow-sm"
                : "border-slate-200 bg-white",
            ].join(" ")}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                  Popüler
                </div>
              </div>
            )}
            {selectedPlan === plan.id && (
              <div className="absolute right-3 top-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                  <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
            )}
            <div className="text-sm font-bold text-slate-900">{plan.name}</div>
            <div className="mt-0.5 text-xs text-slate-400">{plan.subtitle}</div>
            <div className="mt-4 flex items-baseline gap-0.5">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900">{plan.price}</span>
              {plan.period && <span className="text-xs text-slate-400">{plan.period}</span>}
            </div>
            <ul className="mt-4 flex flex-col gap-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                  <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Contact form */}
      <Card
        title="Satın Alma Talebi"
        subtitle={`"${PLANS.find((p) => p.id === selectedPlan)?.name}" paketi seçildi — bilgilerinizi bırakın, sizi arayalım.`}
      >
        {sent ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-6 w-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="text-base font-bold text-emerald-900">Talebiniz alındı!</div>
            <div className="mt-1.5 text-sm text-emerald-700">
              Satış ekibimiz en geç 1 iş günü içinde sizi arayacak.
            </div>
            <div className="mt-3 rounded-lg bg-emerald-100 px-4 py-2 font-mono text-xs text-emerald-800">
              Talep No: {sent.id}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Yetkili Ad Soyad *" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ad Soyad" />
            <Input label="E-posta *" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="firma@example.com" />
            <Input label="Telefon *" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xx xxx xx xx" />
            <Input label="Şehir" value={city} onChange={(e) => setCity(e.target.value)} placeholder="İstanbul" />
            <Input label="Aylık ortalama iş emri sayısı" value={monthlyJobs} onChange={(e) => setMonthlyJobs(e.target.value)} placeholder="Örn. 50" />
            <Input label="Kaç teknisyeniniz var?" value={technicianCount} onChange={(e) => setTechnicianCount(e.target.value)} placeholder="Örn. 5" />
            <div className="md:col-span-2">
              <Textarea
                label="Ek not (isteğe bağlı)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Özel ihtiyaçlarınızı veya sorularınızı yazabilirsiniz…"
              />
            </div>
            {err && <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{err}</div>}
            <div className="md:col-span-2 flex items-center gap-4">
              <Button onClick={submit} disabled={loading || !fullName || !email || !phone}>
                {loading ? "Gönderiliyor…" : "Talebi Gönder →"}
              </Button>
              <a
                href="https://wa.me/905551234567?text=Servisim%20plan%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.117 1.529 5.845L0 24l6.335-1.509A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.487-5.19-1.343l-.373-.213-3.762.896.952-3.672-.234-.386A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                WhatsApp ile yaz
              </a>
            </div>
          </div>
        )}
      </Card>

      <p className="text-xs text-slate-400">
        KVKK: Bu form ile gönderdiğiniz bilgiler yalnızca sizinle iletişime geçmek ve teklif oluşturmak amacıyla işlenir.{" "}
        <a href="/kvkk" className="underline hover:text-slate-600">Aydınlatma metni</a>
      </p>
    </div>
  );
}
