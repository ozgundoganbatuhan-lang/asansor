"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, Textarea, Pill } from "@/components/ui";

type Entitlements = { isExpired: boolean; isTrial: boolean; canWrite: boolean; trialEndsAt: string; planTier: string };
type PurchaseRequest = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  monthlyJobs?: number | null;
  technicianCount?: number | null;
  city?: string | null;
  note?: string | null;
  status: string;
  createdAt: string;
};

export default function UpgradePage() {
  const [ent, setEnt] = useState<Entitlements | null>(null);
  const [sent, setSent] = useState<PurchaseRequest | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [monthlyJobs, setMonthlyJobs] = useState("");
  const [technicianCount, setTechnicianCount] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch("/api/entitlements").then(r => r.json()).then(j => setEnt(j.ent)).catch(() => null);
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
          note: note || undefined,
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

  const daysLeft = ent ? Math.max(0, Math.ceil((new Date(ent.trialEndsAt).getTime() - Date.now()) / (1000*60*60*24))) : null;

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plan / Satın Alma</h1>
          <p className="mt-1 text-slate-600">
            Asansör Servisi operasyonunuz için uygun paketi belirleyelim. Şu an otomatik ödeme yok — talebinizi alıp sizi arıyoruz.
          </p>
        </div>
        {ent ? (
          <Pill tone={ent.isExpired ? "warning" : "neutral"}>
            {ent.isExpired ? "Read-only" : ent.isTrial ? `Deneme: ${daysLeft} gün` : "Aktif"}
          </Pill>
        ) : null}
      </div>

      <Card title="Paketler" subtitle="KOBİ’ler için sade fiyatlandırma — bugün sadece talep alıyoruz.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border p-4">
            <div className="text-sm font-semibold">Başlangıç</div>
            <div className="mt-1 text-xs text-slate-500">Küçük ekipler</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5">
              <li>İş emri + müşteri + cihaz</li>
              <li>Takvim ve atama</li>
              <li>Temel rapor</li>
            </ul>
          </div>
          <div className="rounded-2xl border p-4 bg-slate-50">
            <div className="text-sm font-semibold">Pro</div>
            <div className="mt-1 text-xs text-slate-500">Saha operasyonu</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5">
              <li>Teknisyen mobil akışı</li>
              <li>Stok ve parça kullanımı</li>
              <li>Gelişmiş rapor</li>
            </ul>
          </div>
          <div className="rounded-2xl border p-4">
            <div className="text-sm font-semibold">Kurumsal</div>
            <div className="mt-1 text-xs text-slate-500">Çok şube / SLA</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5">
              <li>Çok lokasyon</li>
              <li>Özel entegrasyonlar</li>
              <li>Öncelikli destek</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card title="Satın Alma Talebi" subtitle="Bilgilerinizi bırakın — sizi arayıp paketi netleştirelim.">
        {sent ? (
          <div className="rounded-2xl border bg-emerald-50 p-4">
            <div className="font-semibold text-emerald-900">Talebiniz alındı ✅</div>
            <div className="mt-1 text-sm text-emerald-900/80">ID: {sent.id}</div>
            <div className="mt-2 text-sm text-emerald-900/80">
              En kısa sürede sizi arayacağız. Bu sırada paneliniz read-only modda kalabilir.
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Yetkili Ad Soyad" value={fullName} onChange={e => setFullName(e.target.value)} />
            <Input label="E-posta" value={email} onChange={e => setEmail(e.target.value)} />
            <Input label="Telefon" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05xx..." />
            <Input label="Şehir" value={city} onChange={e => setCity(e.target.value)} />
            <Input label="Aylık ortalama iş sayısı" value={monthlyJobs} onChange={e => setMonthlyJobs(e.target.value)} />
            <Input label="Teknisyen sayısı" value={technicianCount} onChange={e => setTechnicianCount(e.target.value)} />
            <div className="md:col-span-2">
              <Textarea label="Not" value={note} onChange={e => setNote(e.target.value)} placeholder="Kısaca ihtiyacınızı yazın..." />
            </div>
            {err ? <div className="md:col-span-2 text-sm text-red-600">{err}</div> : null}
            <div className="md:col-span-2">
              <Button onClick={submit} disabled={loading || !fullName || !email || !phone}>
                {loading ? "Gönderiliyor..." : "Talebi Gönder"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="text-xs text-slate-500">
        KVKK: Bu form ile gönderdiğiniz bilgiler, sadece sizinle iletişime geçmek ve teklif oluşturmak amacıyla kullanılır.
      </div>
    </div>
  );
}
