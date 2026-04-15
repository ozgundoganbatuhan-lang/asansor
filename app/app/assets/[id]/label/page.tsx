import PrintButton from "@/components/PrintButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signAssetShareToken } from "@/lib/asset-share";

export default async function AssetLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Fetch the asset along with its customer and organisation name. Including
  // the organisation allows us to print the servicing firm on the label.
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: { customer: true, organization: { select: { name: true } } },
  });
  if (!asset) notFound();
  const token = signAssetShareToken(asset.id, asset.organizationId);
  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/public/assets/${asset.id}?token=${token}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(publicUrl)}`;
  // Determine the servicing company name from the organisation record or
  // environment variable. Fall back to a generic label if none is provided.
  const companyName = asset.organization?.name ?? process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Servis Firması";

  return (
    <main className="mx-auto max-w-[960px] px-6 py-12">
      <div className="panel rounded-[36px] p-8 text-center">
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--muted-2)]">QR etiket</div>
        {/* Print the asset name and servicing company prominently */}
        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[color:var(--foreground)]">{asset.name}</h1>
        <p className="mt-1 text-sm font-semibold text-[color:var(--primary)]">{companyName}</p>
        <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{asset.customer.name} · {asset.buildingName || "Bina adı yok"}</p>
        <div className="mt-8 flex justify-center">
          <div className="rounded-[32px] border border-[color:var(--border)] bg-white p-5 shadow-[var(--shadow-soft)]">
            <img src={qrUrl} alt="QR etiketi" className="h-[320px] w-[320px] rounded-[20px]" />
          </div>
        </div>
        {/* Display the servicing company again underneath the QR for clarity */}
        <p className="mt-3 text-sm font-bold text-[color:var(--foreground)]">{companyName}</p>
        <div className="mt-6 rounded-[24px] bg-[color:var(--surface-soft)] p-4 text-left text-sm leading-7 text-[color:var(--muted)]">
          Bu etiketi makina dairesi girişine veya teknik dolap kapağına yerleştirebilirsiniz. QR okutulduğunda public servis geçmişi sayfası açılır.
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={publicUrl} target="_blank" rel="noreferrer" className="rounded-[22px] bg-[color:var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)]">Public sayfayı aç</a>
          <PrintButton className="rounded-[22px] border border-[color:var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-soft)]" />
          <Link href={`/app/assets/${asset.id}`} className="rounded-[22px] border border-[color:var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-soft)]">Detaya dön</Link>
        </div>
      </div>
    </main>
  );
}
