"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Vertical = "ELEVATOR" | "WHITE_GOODS";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialVertical = useMemo(() => {
    const v = (searchParams.get("vertical") || "").toUpperCase();
    if (v === "WHITE_GOODS") return "WHITE_GOODS" as const;
    if (v === "ELEVATOR") return "ELEVATOR" as const;
    return "ELEVATOR" as const;
  }, [searchParams]);

  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [vertical, setVertical] = useState<Vertical>(initialVertical);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Update select when user comes from a vertical landing page.
  useEffect(() => {
    setVertical(initialVertical);
  }, [initialVertical]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationName,
        organizationSlug,
        vertical,
        name: name || undefined,
        email,
        password
      })
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data?.error ?? "Kayıt başarısız");

    router.push("/app/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <div className="text-2xl font-extrabold tracking-tight">Servisim</div>
          <div className="text-sm text-gray-500">Kurumsal SaaS kurulum</div>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-xs font-mono uppercase text-gray-400">Firma adı</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-gray-400">Firma slug</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={organizationSlug}
              onChange={(e) => setOrganizationSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
              placeholder="ornek-firma"
              required
            />
            <div className="text-xs text-gray-500 mt-1">Sadece a-z, 0-9 ve -</div>
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-gray-400">Dikey</label>
            <select className="mt-1 w-full rounded-lg border px-3 py-2" value={vertical} onChange={(e) => setVertical(e.target.value as Vertical)}>
              <option value="ELEVATOR">Asansör Servisi</option>
              <option value="WHITE_GOODS">Beyaz Eşya Servisi</option>
            </select>
          </div>

          <div className="h-px bg-gray-100 my-2" />

          <div>
            <label className="text-xs font-mono uppercase text-gray-400">Ad Soyad (ops.)</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-gray-400">E-posta</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-gray-400">Şifre</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={8} required />
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <button disabled={loading} className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-600 disabled:opacity-60">
            {loading ? "Oluşturuluyor..." : "Hesap Oluştur"}
          </button>

          <div className="text-sm text-gray-600">
            Zaten hesabın var mı? <a className="font-semibold text-blue-600 hover:underline" href="/auth/login">Giriş yap</a>
          </div>
        </form>
      </div>
    </div>
  );
}
