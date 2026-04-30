"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCustomerPage() {
  const router = useRouter();
  const [name,        setName]        = useState("");
  const [contactName, setContactName] = useState("");
  const [phone,       setPhone]       = useState("");
  const [email,       setEmail]       = useState("");
  const [address,     setAddress]     = useState("");
  const [taxId,       setTaxId]       = useState("");
  const [identityNo,  setIdentityNo]  = useState("");
  const [notes,       setNotes]       = useState("");
  const [error,       setError]       = useState<string|null>(null);
  const [loading,     setLoading]     = useState(false);

  // TC Kimlik No Luhn-like validation (11 digit check)
  function validateTc(v: string) {
    if (!v) return true; // optional
    if (!/^\d{11}$/.test(v)) return false;
    if (v[0] === "0") return false;
    const d = v.split("").map(Number);
    const sum10 = ((d[0]+d[2]+d[4]+d[6]+d[8])*7 - (d[1]+d[3]+d[5]+d[7])) % 10;
    if (sum10 < 0 ? sum10+10 : sum10 !== d[9]) return false;
    const total = d.slice(0,10).reduce((a,b)=>a+b,0) % 10;
    return total === d[10];
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (identityNo && !validateTc(identityNo)) { setError("TC Kimlik No geçersiz. 11 haneli ve doğru olmalıdır."); return; }
    setLoading(true); setError(null);
    const res = await fetch("/api/customers", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ name, contactName:contactName||undefined, phone:phone||undefined, email:email||undefined, address:address||undefined, taxId:taxId||undefined, identityNo:identityNo||undefined, notes:notes||undefined }),
    });
    const data = await res.json().catch(()=>({}));
    setLoading(false);
    if (!res.ok) { setError(data?.error ?? "Kaydetme başarısız"); return; }
    router.push(`/app/customers/${data.item?.id ?? ""}`);
  }

  const inp = "mt-1 w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm text-[#0f1623] placeholder-[#c0c8d4] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-colors";
  const lbl = "block text-[11px] font-bold uppercase tracking-[0.07em] text-[#94a3b8]";

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={()=>router.back()} className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#64748b] hover:bg-[#f4f5f7] transition-colors">← Geri</button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0f1623]">Yeni Müşteri</h1>
          <p className="text-sm text-[#64748b]">Müşteri kartını oluştur, asansörlerini bağla.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_4px_rgba(15,22,35,.06)] space-y-6">

        {/* Firma Bilgileri */}
        <section>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94a3b8] mb-3">Firma Bilgileri</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={lbl}>Firma / Müşteri Adı <span className="text-blue-500 normal-case">*</span></label>
              <input className={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="ABC Apartman Yönetimi" required />
            </div>
            <div>
              <label className={lbl}>Yetkili Kişi</label>
              <input className={inp} value={contactName} onChange={e=>setContactName(e.target.value)} placeholder="Ali Yılmaz" />
            </div>
            <div>
              <label className={lbl}>Vergi No</label>
              <input className={inp} value={taxId} onChange={e=>setTaxId(e.target.value)} placeholder="1234567890" maxLength={11} />
            </div>
            <div>
              <label className={lbl}>
                TC Kimlik No
                <span className="ml-1.5 font-normal text-[#c0c8d4] normal-case">(opsiyonel)</span>
              </label>
              <input className={inp} value={identityNo} onChange={e=>setIdentityNo(e.target.value.replace(/\D/g,""))}
                placeholder="12345678901" maxLength={11}
                pattern="\d{11}" title="11 haneli TC Kimlik Numarası" />
              {identityNo && !validateTc(identityNo) && (
                <p className="mt-1 text-xs text-amber-600">TC Kimlik No geçersiz görünüyor</p>
              )}
            </div>
          </div>
        </section>

        {/* İletişim */}
        <section className="border-t border-[#f0f2f5] pt-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94a3b8] mb-3">İletişim</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>Telefon</label>
              <input className={inp} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="0212 555 55 55" />
            </div>
            <div>
              <label className={lbl}>E-posta</label>
              <input className={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="yonetim@abc.com" />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Adres</label>
              <input className={inp} value={address} onChange={e=>setAddress(e.target.value)} placeholder="Atatürk Cad. No:1 Kadıköy, İstanbul" />
            </div>
          </div>
        </section>

        {/* Notlar */}
        <section className="border-t border-[#f0f2f5] pt-5">
          <label className={lbl}>Notlar</label>
          <textarea className={`${inp} resize-none`} rows={3} value={notes} onChange={e=>setNotes(e.target.value)}
            placeholder="Özel durumlar, erişim bilgileri, ödeme koşulları…" />
        </section>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">{error}</div>}

        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 shadow-sm transition-colors">
            {loading ? "Kaydediliyor…" : "Müşteri Oluştur →"}
          </button>
          <button type="button" onClick={()=>router.back()}
            className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#64748b] hover:bg-[#f4f5f7] transition-colors">
            İptal
          </button>
        </div>
      </form>
    </div>
  );
}
