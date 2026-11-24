import type { ReactNode } from "react";

/** CV-only public chrome — separate from Declutter. */
export default function PublicCvLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="cv-public-shell"
      style={{
        minHeight: "100dvh",
        background: "var(--cv-page-bg)",
        color: "var(--cv-fg)",
      }}
    >
      {children}
    </div>
  );
}
