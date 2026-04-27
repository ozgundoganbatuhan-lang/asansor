"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";

type UploadedAttachment = { id: string; url: string; originalName: string; size: number };

async function compressImage(file: File) {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const maxWidth = 1600;
  const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.76));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
}

export default function PhotoUploader({
  workOrderId,
  onUploaded,
}: {
  workOrderId: string;
  onUploaded: (items: UploadedAttachment[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setLoading(true);
    setMessage("Fotoğraflar sıkıştırılıyor ve güvenli şekilde yükleniyor...");
    const uploaded: UploadedAttachment[] = [];
    for (const rawFile of Array.from(files)) {
      const file = await compressImage(rawFile);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/work-orders/${workOrderId}/attachments`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        setMessage(data.error ?? "Fotoğraf yüklenemedi.");
        return;
      }
      uploaded.push(data.item as UploadedAttachment);
    }
    setLoading(false);
    setMessage(`${uploaded.length} görsel işlendi ve iş emrine eklendi.`);
    onUploaded(uploaded);
  }

  return (
    <div className="overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(180deg,#fbfdff,#eef5ff)] shadow-[var(--shadow-xs)]">
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border-b border-[color:var(--border)] p-6 lg:border-b-0 lg:border-r lg:p-7">
          <div className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--muted-2)] shadow-[var(--shadow-xs)]">Görsel kanıt akışı</div>
          <div className="mt-4 text-xl font-black tracking-[-0.04em] text-[color:var(--foreground)]">Fotoğraf yükleme, ama düzgün olanından</div>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">Saha ekibi fotoğrafı çekiyor ya da galeriden seçiyor. Sistem görseli cihazda küçültüyor, yükleme maliyetini düşürüyor ve işi boğmadan kanıta dönüştürüyor.</p>
          <div className="mt-6 grid gap-3">
            {[
              ["Kamera", "Şantiyede ya da makine dairesinde hızlı çekim"],
              ["Sıkıştırma", "1600px ve optimize kalite ile hafif dosya"],
              ["Bağlama", "İş emrine ve servis formuna otomatik ekleme"],
            ].map(([title, desc], index) => (
              <div key={title} className="flex items-start gap-3 rounded-[22px] bg-white/90 px-4 py-4 shadow-[var(--shadow-xs)]">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-[color:var(--surface-soft)] text-sm font-black text-[color:var(--primary)]">0{index + 1}</div>
                <div>
                  <div className="text-sm font-bold text-[color:var(--foreground)]">{title}</div>
                  <div className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 lg:p-7">
          <div className="rounded-[28px] border border-dashed border-[color:var(--border-strong)] bg-white/80 p-5">
            <div className="text-sm font-extrabold text-[color:var(--foreground)]">Yükleme alanı</div>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Hem galeriden seçim hem de doğrudan kamera açma desteklenir. Mobil teknisyen akışında tek dokunuş hedeflendi.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
              <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
              <Button type="button" variant="secondary" size="lg" onClick={() => galleryRef.current?.click()} disabled={loading} className="w-full">Galeriden seç</Button>
              <Button type="button" size="lg" onClick={() => inputRef.current?.click()} disabled={loading} className="w-full">Kamera ile çek</Button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Format", "JPEG optimizasyonu"],
                ["Hedef", "Servis kanıtı"],
                ["Kullanım", "Mobil uygulama çekimi"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[18px] bg-[color:var(--surface-soft-2)] px-3 py-3 text-sm">
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[color:var(--muted-2)]">{label}</div>
                  <div className="mt-1 font-semibold text-[color:var(--foreground)]">{value}</div>
                </div>
              ))}
            </div>
          </div>
          {message && <p className="mt-4 rounded-[20px] bg-white/90 px-4 py-3 text-sm font-medium text-[color:var(--muted)] shadow-[var(--shadow-xs)]">{message}</p>}
        </div>
      </div>
    </div>
  );
}
