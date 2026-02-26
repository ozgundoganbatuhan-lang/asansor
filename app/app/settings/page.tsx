"use client";

import { useEffect, useState } from "react";
import { Button, Card, Select, Input, Pill } from "@/components/ui";

type Org = { id: string; name: string; slug: string; vertical: "ELEVATOR" | "WHITE_GOODS" };

export default function SettingsPage() {
  const [org, setOrg] = useState<Org | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/org");
    const j = await r.json();
    setOrg(j.org);
  }

  useEffect(() => {
    load().catch(() => setErr("Yüklenemedi"));
  }, []);

  async function save() {
    if (!org) return;
    setSaving(true);
    setErr(null);
    try {
      const r = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: org.name, vertical: org.vertical }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Kaydedilemedi");
      setOrg(j.org);
    } catch (e: any) {
      setErr(e.message || "Hata");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-extrabold tracking-tight">Ayarlar</div>
        <div className="mt-1 text-sm text-gray-500">Şirket bilgileri ve ürün dikeyi</div>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Organizasyon</div>
            <div className="mt-1 text-xs font-mono text-gray-400">Slug: {org?.slug ?? "..."}</div>
          </div>
          <Pill tone="blue">Kurumsal</Pill>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input
            label="Firma Adı"
            value={org?.name ?? ""}
            onChange={(e) => setOrg((o) => (o ? { ...o, name: e.target.value } : o))}
            placeholder="Örn. Servisim Teknik"
          />
          <Select
            label="Dikey"
            value={org?.vertical ?? "ELEVATOR"}
            onChange={(e) => setOrg((o) => (o ? { ...o, vertical: e.target.value as any } : o))}
          >
            <option value="ELEVATOR">Asansör</option>
            <option value="WHITE_GOODS">Beyaz Eşya</option>
          </Select>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          <div className="text-xs text-gray-500">Yetki: OWNER/ADMIN dışı kullanıcılar kaydedemez (API tarafında).</div>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold">Billing / Abonelik</div>
        <div className="mt-1 text-sm text-gray-600">
          Bu paket, canlıya çıkış için <span className="font-semibold">Stripe entegrasyonu yapılacak</span> şekilde hazırlandı.
          Ancak bu sürümde bilinçli olarak ödeme adımı kapalı (yanlış fiyat/vergilendirme riski).
        </div>
        <div className="mt-3 text-xs font-mono text-gray-400">
          TODO: Stripe Customer + Subscription, Webhook, Plan limitleri
        </div>
      </Card>
    </div>
  );
}
