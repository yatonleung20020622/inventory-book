import Link from "next/link";
import type { ReactNode } from "react";

type LegalDocProps = {
  title: string;
  children: ReactNode;
};

export function LegalDoc({ title, children }: LegalDocProps) {
  return (
    <article
      style={{
        width: "100%",
        maxWidth: 720,
        maxHeight: "min(90vh, 900px)",
        overflow: "auto",
        background: "var(--card-bg)",
        color: "var(--foreground)",
        padding: "28px 32px",
        borderRadius: 12,
        boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/"
          style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}
        >
          ← Back
        </Link>
      </div>
      <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28, fontWeight: 600 }}>
        {title}
      </h1>
      <p style={{ color: "var(--muted)", marginTop: 0, marginBottom: 24, fontSize: 13 }}>
        Last updated: October 20, 2026
      </p>
      <div
        style={{
          lineHeight: 1.7,
          fontSize: 15,
          display: "grid",
          gap: 16,
        }}
      >
        {children}
      </div>
    </article>
  );
}
