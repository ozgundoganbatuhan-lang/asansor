"use client";

import Link from "next/link";

interface RelatedPost {
  slug: string;
  title: string;
  excerpt: string;
  readingMinutes: number;
}

export default function RelatedPostCard({ post }: { post: RelatedPost }) {
  return (
    <Link
      key={post.slug}
      href={`/blog/${post.slug}`}
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        padding: "17px",
        textDecoration: "none",
        display: "block",
        transition: "all 0.14s",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 18px rgba(0,0,0,0.07)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
    >
      <div style={{ fontSize: 9.5, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
        {post.readingMinutes} dk
      </div>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1.35, margin: "0 0 5px" }}>
        {post.title}
      </h3>
      <p style={{ fontSize: 11.5, lineHeight: 1.55, color: "#6b7280", margin: "0 0 9px" }}>
        {post.excerpt}
      </p>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>Oku →</span>
    </Link>
  );
}
