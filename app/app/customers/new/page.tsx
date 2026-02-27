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
  const [taxId, setTaxId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        contactName: contactName || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        taxId: taxId || undefined,
        notes: notes || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data?.error ?? "Kaydetme başarısız"); return; }
    router.push(`/app/customers/${data.item?.id ?? ""}`);
  }

  const inp = "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10";
  const lbl = "block text-xs font-semibold uppercase tracking-wide text-gray-500";

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">← Geri</button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Yeni Müşteri</h1>
          <p className="text-sm text-gray-500">Müşteri kartını oluştur, asansörlerini bağla.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
        {/* Company info */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Firma Bilgileri</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={lbl}>Firma / Müşteri Adı <span className="text-blue-500">*</span></label>
              <input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="ABC Apartman Yönetimi" required />
            </div>
            <div>
              <label className={lbl}>Yetkili Kişi</label>
              <input className={inp} value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Ali Yılmaz" />
            </div>
            <div>
              <label className={lbl}>Vergi No</label>
              <input className={inp} value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="1234567890" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">İletişim</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>Telefon</label>
              <input className={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="0212 555 55 55" />
            </div>
            <div>
              <label className={lbl}>E-posta</label>
              <input className={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="yonetim@abc.com" />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Adres</label>
              <input className={inp} value={address} onChange={e => setAddress(e.target.value)} placeholder="Atatürk Cad. No:1 Kadıköy, İstanbul" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <label className={lbl}>Notlar</label>
          <textarea className={`${inp} resize-none`} rows={3} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Özel durumlar, erişim bilgileri, ödeme koşulları…" />
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-2 pt-1">
          <button disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 shadow-sm">
            {loading ? "Kaydediliyor…" : "Müşteri Oluştur →"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            İptal
          </button>
        </div>
      </form>
    </div>
  );
}
