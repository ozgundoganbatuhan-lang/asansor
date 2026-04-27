"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input, Button, Card } from "@/components/ui";

// Default HTML templates for offer (teklif) and contract (sözleşme). Fields enclosed in []
// will be substituted by the user through dynamic form fields below.
const OFFER_HTML = `<p>Merhaba [Müşteri Adı],</p>
<p>Aşağıda asansör bakım teklifimizi bulabilirsiniz:</p>
<ul>
  <li>Firma: [Firma Adı]</li>
  <li>Adres: [Adres]</li>
  <li>Teklif Tarihi: [Tarih]</li>
  <li>Hizmet Açıklaması: [Açıklama]</li>
  <li>Aylık Ücret: [Aylık Ücret] ₺</li>
</ul>
<p>Saygılarımızla,<br/>[Servis Firması]</p>`;
const CONTRACT_HTML = `<p>Merhaba [Müşteri Adı],</p>
<p>Aşağıda asansör bakım sözleşmemizi bulabilirsiniz:</p>
<ul>
  <li>Taraflar: [Firma Adı] ve [Apartman/Site Adı]</li>
  <li>Sözleşme Süresi: [Başlangıç] – [Bitiş]</li>
  <li>Hizmetler: [Hizmetler]</li>
  <li>Aylık Ücret: [Aylık Ücret] ₺</li>
</ul>
<p>Lütfen sözleşmeyi inceleyip onaylayınız.</p>
<p>Saygılarımızla,<br/>[Servis Firması]</p>`;

export default function DocEditorPage() {
  const router = useRouter();
  const params = useParams<{ type: string }>();
  const type = params.type ?? "";
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // Placeholder values keyed by placeholder name
  const [values, setValues] = useState<Record<string, string>>({});

  // Determine default template based on type
  const defaultHtml = useMemo(() => {
    if (type === "teklif") return OFFER_HTML;
    if (type === "sozlesme") return CONTRACT_HTML;
    return "";
  }, [type]);

  // Set subject and reset values when type changes
  useEffect(() => {
    if (type === "teklif") {
      setSubject("Asansör Bakım Teklifi");
    } else if (type === "sozlesme") {
      setSubject("Asansör Bakım Sözleşmesi");
    } else {
      // invalid type -> redirect back
      router.push("/app/settings");
    }
    // clear filled values when switching types
    setValues({});
  }, [type, router]);

  // Extract unique placeholder names from the template. Placeholders are text inside []
  const placeholders = useMemo(() => {
    const regex = /\[([^\]]+)\]/g;
    const found = new Set<string>();
    let match;
    while ((match = regex.exec(defaultHtml))) {
      found.add(match[1]);
    }
    return Array.from(found);
  }, [defaultHtml]);

  // Compute final HTML by replacing placeholders with user-provided values
  const finalHtml = useMemo(() => {
    let html = defaultHtml;
    for (const key of placeholders) {
      const val = values[key] ?? key;
      // Escape special characters for regex
      const escaped = key.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const pattern = new RegExp(`\\[${escaped}\\]`, "g");
      html = html.replace(pattern, val);
    }
    return html;
  }, [defaultHtml, placeholders, values]);

  // Send document with replaced HTML via API
  async function sendDoc(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/docs/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, to, subject, html: finalHtml }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Hata");
      } else {
        setStatus("✓ E-posta gönderildi.");
        setTo("");
      }
    } catch (err: any) {
      setStatus(err.message || "Hata");
    } finally {
      setSending(false);
    }
  }

  function handlePlaceholderChange(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          {type === "teklif" ? "Teklif Düzenle ve Gönder" : "Sözleşme Düzenle ve Gönder"}
        </h1>
        <p className="text-sm text-gray-500">
          Aşağıdaki alanları doldurun; şablonda köşeli parantez içindeki yerler otomatik olarak bu değerlerle değiştirilecektir. E‑posta gönderildiğinde PDF şablonu ekli olacaktır.
        </p>
      </div>
      {status && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${status.startsWith("✓") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}
        >
          {status}
        </div>
      )}
      <form onSubmit={sendDoc} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Alıcı E‑Posta"
            placeholder="yonetici@example.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
          />
          <Input
            label="Konu"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>
        {placeholders.length > 0 && (
          <div className="space-y-4">
            {placeholders.map((ph) => (
              <Input
                key={ph}
                label={ph}
                placeholder={ph}
                value={values[ph] || ""}
                onChange={(e) => handlePlaceholderChange(ph, e.target.value)}
              />
            ))}
          </div>
        )}
        <div>
          <Button type="submit" disabled={sending}>
            {sending ? "Gönderiliyor..." : "E‑posta Gönder"}
          </Button>
        </div>
      </form>
      {/* Preview of the final HTML message */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Önizleme</h2>
        <Card className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: finalHtml }} />
        </Card>
      </div>
    </div>
  );
}