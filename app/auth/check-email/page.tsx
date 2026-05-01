"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthBrand } from "@/components/AuthLayout";

export default function CheckEmailPage() {
  return <Suspense><CheckEmail /></Suspense>;
}

function CheckEmail() {
  const params = useSearchParams();
  const expired = params.get("error") === "expired";
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function resend() {
    setLoading(true);
    await fetch("/api/auth/resend-verify", { method: "POST" });
    setLoading(false); setResent(true);
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col items-center justify-center p-6">
      <div className="mb-8"><AuthBrand /></div>

      <div className="w-full max-w-[420px] bg-white border border-[#e2e8f0] rounded-2xl p-10 shadow-[0_2px_20px_rgba(15,22,35,.06)] text-center">
        <div className="text-5xl mb-5">{expired ? "⏱" : "📧"}</div>

        <h1 className="text-xl font-black text-[#0f1623] tracking-tight mb-2">
          {expired ? "Bağlantı süresi doldu" : "E-postanızı kontrol edin"}
        </h1>

        <p className="text-sm text-[#64748b] leading-relaxed mb-7">
          {expired
            ? "Doğrulama bağlantısının süresi dolmuş. Yeni bir bağlantı göndermek için aşağıdaki butona tıklayın."
            : "Kayıt e-posta adresinize bir doğrulama bağlantısı gönderdik. Gelen kutunuzu ve spam klasörünü kontrol edin."}
        </p>

        {resent ? (
          <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-semibold">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Yeni doğrulama e-postası gönderildi!
          </div>
        ) : (
          <button onClick={resend} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl py-3 transition-colors shadow-sm flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{animation:"spin .6s linear infinite"}}/>Gönderiliyor…</>
              : "Yeni bağlantı gönder"}
          </button>
        )}

        <Link href="/auth/login" className="block mt-5 text-sm text-[#94a3b8] hover:text-[#4b5a6e] transition-colors">
          ← Giriş sayfasına dön
        </Link>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
