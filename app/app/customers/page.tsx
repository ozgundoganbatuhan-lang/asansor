"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Customer = {
  id: string; name: string; contactName?: string | null;
  phone?: string | null; email?: string | null;
  _count: { assets: number; workOrders: number };
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/customers")
      .then(r => r.json())
      .then(d => { if (d.error) { setError(d.error); return; } setCustomers(d.items ?? []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c =>
    !q || [c.name, c.contactName ?? "", c.phone ?? ""].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Müşteriler</h1>
          <p className="mt-1 text-sm text-gray-500">Site / bina yönetimleri, kurumsal müşteriler…</p>
        </div>
        <Link href="/app/customers/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm">
          + Yeni Müşteri
        </Link>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <input
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none"
        placeholder="Müşteri adı veya telefon ara…"
        value={q} onChange={e => setQ(e.target.value)}
      />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            {q ? "Eşleşen müşteri bulunamadı." : "Henüz müşteri yok."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3">Müşteri</th>
                <th className="px-5 py-3">İrtibat</th>
                <th className="px-5 py-3">Telefon</th>
                <th className="px-5 py-3 text-center">Asansör</th>
                <th className="px-5 py-3 text-center">İş Emri</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/app/customers/${c.id}`}>
                  <td className="px-5 py-3 font-semibold text-gray-900">{c.name}</td>
                  <td className="px-5 py-3 text-gray-600">{c.contactName ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-600">{c.phone ?? "—"}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">{c._count.assets}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${c._count.workOrders > 0 ? "bg-amber-50 border border-amber-100 text-amber-700" : "bg-gray-50 border border-gray-100 text-gray-500"}`}>{c._count.workOrders}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/app/customers/${c.id}`} onClick={e => e.stopPropagation()} className="text-xs font-semibold text-blue-600 hover:underline">Detay →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
