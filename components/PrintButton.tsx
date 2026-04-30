"use client";

export default function PrintButton({ className = "" }: { className?: string }) {
  return (
    <button onClick={() => window.print()} className={className}>
      Yazdır
    </button>
  );
}
