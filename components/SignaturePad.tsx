"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui";

type Point = { x: number; y: number };

export default function SignaturePad({
  value,
  onChange,
  className = "",
}: {
  value?: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [ready, setReady] = useState(false);

  const size = useMemo(() => ({ width: 860, height: 280 }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = size.width * ratio;
    canvas.height = size.height * ratio;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 2.3;
    context.strokeStyle = "#0f172a";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size.width, size.height);
    drawGuide(context, size.width, size.height);

    if (value) {
      const image = new Image();
      image.onload = () => {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, size.width, size.height);
        drawGuide(context, size.width, size.height);
        context.drawImage(image, 0, 0, size.width, size.height);
      };
      image.src = value;
    }
    setReady(true);
  }, [size.height, size.width, value]);

  function getCanvasPoint(event: PointerEvent | React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function begin(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    drawingRef.current = true;
    const point = getCanvasPoint(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const point = getCanvasPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function end() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    persist();
  }

  function persist() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL("image/png"));
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size.width, size.height);
    drawGuide(context, size.width, size.height);
    onChange(null);
  }

  return (
    <div className={`rounded-[28px] border border-[color:var(--border)] bg-white/90 p-4 shadow-[var(--shadow-xs)] ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-extrabold text-[color:var(--foreground)]">Dijital imza alanı</div>
          <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">Müşteri ya da bina yetkilisi doğrudan ekranda imza bırakabilir. İmza servis formuna da yansır.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={clearCanvas}>Temizle</Button>
          <div className={`rounded-full px-3 py-1 text-xs font-bold ${ready ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
            {ready ? "Hazır" : "Yükleniyor"}
          </div>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-[linear-gradient(180deg,#fff,#f8fbff)] p-2">
        <div className="relative overflow-hidden rounded-[20px] bg-white">
          <canvas
            ref={canvasRef}
            className="h-auto w-full touch-none"
            onPointerDown={begin}
            onPointerMove={draw}
            onPointerUp={end}
            onPointerLeave={end}
          />
          <div className="pointer-events-none absolute inset-x-5 bottom-5 border-t border-dashed border-slate-300/80" />
        </div>
      </div>
    </div>
  );
}

function drawGuide(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save();
  context.strokeStyle = "rgba(148, 163, 184, 0.55)";
  context.lineWidth = 1;
  context.setLineDash([7, 7]);
  context.beginPath();
  context.moveTo(24, height - 46);
  context.lineTo(width - 24, height - 46);
  context.stroke();
  context.restore();
}
