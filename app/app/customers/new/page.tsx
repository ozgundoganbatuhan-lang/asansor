"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCustomerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        contactName: contactName || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined
      })
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data?.error ?? "Kaydetme başarısız");

    router.push("/app/customers");
    router.refresh();
  }

  return (
    <div className="max-w-xl">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Yeni Müşteri</h1>
        <p className="text-sm text-gray-500">Müşteri kartını oluştur ve iş emirlerine bağla.</p>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border bg-white p-5 space-y-3">
        <Field label="Müşteri adı" value={name} onChange={setName} required />
        <Field label="İrtibat" value={contactName} onChange={setContactName} />
        <Field label="Telefon" value={phone} onChange={setPhone} />
        <Field label="E-posta" value={email} onChange={setEmail} type="email" />
        <Field label="Adres" value={address} onChange={setAddress} />

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="flex gap-2">
          <button disabled={loading} className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <button type="button" className="rounded-lg border bg-white px-4 py-2 font-semibold hover:bg-gray-100" onClick={() => router.back()}>
            İptal
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-mono uppercase text-gray-400">{label}{required ? " *" : ""}</label>
      <input
        className="mt-1 w-full rounded-lg border px-3 py-2"
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}
