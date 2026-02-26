export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/auth";

export default async function CustomersPage() {
  const session = readSession();
  const orgId = session!.orgId;

  const customers = await prisma.customer.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { assets: true, workOrders: true } },
    },
  });

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Müşteriler</h1>
          <p className="mt-1 text-sm text-gray-500">Site / bina yönetimleri, kurumsal müşteriler, bireysel çağrılar…</p>
        </div>
        <Link className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm" href="/app/customers/new">
          + Yeni Müşteri
        </Link>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 px-5 py-3">Müşteri</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 px-5 py-3">İrtibat</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 px-5 py-3">Telefon</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 px-5 py-3">Asansör</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 px-5 py-3">İş Emri</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                  Henüz müşteri yok.{" "}
                  <Link href="/app/customers/new" className="text-blue-600 hover:underline">Ekle →</Link>
                </td>
              </tr>
            ) : customers.map((c) => (
              <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <Link href={`/app/customers/${c.id}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                    {c.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-gray-600">{c.contactName ?? "—"}</td>
                <td className="px-5 py-3">
                  {c.phone
                    ? <a href={`tel:${c.phone}`} className="text-gray-700 hover:text-blue-600">{c.phone}</a>
                    : <span className="text-gray-400">—</span>
                  }
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {c._count.assets}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                    {c._count.workOrders}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
