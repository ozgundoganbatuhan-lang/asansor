import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";

const NETGSM_USERCODE = process.env.NETGSM_USERCODE ?? "";
const NETGSM_PASSWORD = process.env.NETGSM_PASSWORD ?? "";
const NETGSM_MSGHEADER = process.env.NETGSM_MSGHEADER ?? "SERVISIM"; // Onaylı başlık

async function sendSmsNetgsm(phone: string, message: string): Promise<{ ok: boolean; error?: string }> {
  if (!NETGSM_USERCODE || !NETGSM_PASSWORD) {
    // Demo mode — log and return ok
    console.log(`[SMS DEMO] To: ${phone}\nMessage: ${message}`);
    return { ok: true };
  }

  // Netgsm REST API
  const body = new URLSearchParams({
    usercode: NETGSM_USERCODE,
    password: NETGSM_PASSWORD,
    gsmno: phone.replace(/\D/g, "").replace(/^0/, "90"),
    text: message,
    msgheader: NETGSM_MSGHEADER,
    dil: "TR",
  });

  const res = await fetch("https://api.netgsm.com.tr/sms/send/get", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const text = await res.text();
  // Netgsm returns "00 JOBID" on success, error codes otherwise
  if (text.startsWith("00 ") || text.startsWith("01 ") || text.startsWith("02 ")) {
    return { ok: true };
  }
  return { ok: false, error: `Netgsm hatası: ${text}` };
}

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });

  const { workOrderId, type, customMessage } = body;

  if (!workOrderId) return NextResponse.json({ error: "workOrderId gerekli" }, { status: 400 });

  const wo = await prisma.workOrder.findFirst({
    where: { id: workOrderId, organizationId: session.orgId },
    include: {
      customer: true,
      technician: true,
      asset: true,
    },
  });

  if (!wo) return NextResponse.json({ error: "İş emri bulunamadı." }, { status: 404 });

  let phone: string | null = null;
  let message = "";

  if (type === "assignment") {
    // SMS to technician
    phone = wo.technician?.phone ?? null;
    if (!phone) return NextResponse.json({ error: "Teknisyenin telefon numarası kayıtlı değil." }, { status: 400 });
    message = `Servisim | Yeni is emri: ${wo.code}. Musteri: ${wo.customer.name}${wo.asset ? `, Asansor: ${wo.asset.name}` : ""}. ${wo.note ? `Not: ${wo.note.slice(0, 80)}` : ""}`;
  } else if (type === "reminder") {
    // SMS to customer
    phone = wo.customer.phone ?? null;
    if (!phone) return NextResponse.json({ error: "Müşterinin telefon numarası kayıtlı değil." }, { status: 400 });
    const techName = wo.technician?.name ?? "teknisyen";
    message = `Servisim | Sayin ${wo.customer.name}, ${techName} bugün asansorunuzu bakima gelecektir. Is Emri: ${wo.code}. Bilgi: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}`;
  } else if (type === "completed") {
    // SMS to customer — work completed
    phone = wo.customer.phone ?? null;
    if (!phone) return NextResponse.json({ error: "Müşterinin telefon numarası kayıtlı değil." }, { status: 400 });
    message = `Servisim | Sayin ${wo.customer.name}, ${wo.code} nolu is emriniz tamamlanmistir. Herhangi bir sorun icin lutfen bizi arayin.`;
  } else if (type === "custom" && customMessage) {
    phone = wo.customer.phone ?? wo.technician?.phone ?? null;
    if (!phone) return NextResponse.json({ error: "Telefon numarası bulunamadı." }, { status: 400 });
    message = customMessage;
  } else {
    return NextResponse.json({ error: "Geçersiz SMS tipi." }, { status: 400 });
  }

  const result = await sendSmsNetgsm(phone, message);

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "SMS gönderilemedi." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, to: phone, message });
}
