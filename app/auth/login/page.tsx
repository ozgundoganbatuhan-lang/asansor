"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgSlug, setOrgSlug] = useState("demo");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, orgSlug })
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data?.error ?? "Giriş başarısız");
    router.push("/app/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <div className="text-2xl font-extrabold tracking-tight">Servisim</div>
          <div className="text-sm text-gray-500">Kurumsal servis yönetimi (Asansör / Beyaz Eşya)</div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-mono uppercase text-gray-400">Firma (slug)</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)} placeholder="ornek-firma" />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-gray-400">E-posta</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mail@firma.com" type="email" required />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-gray-400">Şifre</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <button disabled={loading} className="w-full rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>

          <div className="text-sm text-gray-600">
            Hesabın yok mu? <a className="font-semibold text-brand-600 hover:underline" href="/auth/register">Kayıt ol</a>
          </div>
        </form>
      </div>
    </div>
  );
}
