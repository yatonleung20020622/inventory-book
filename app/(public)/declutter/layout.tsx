import type { ReactNode } from "react";

/** Declutter-only public chrome — separate from CV. */
export default function PublicDeclutterLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className="dc-public-shell"
      style={{
        minHeight: "100dvh",
        background: "var(--dc-page-bg)",
        color: "var(--dc-fg)",
      }}
    >
      {children}
    </div>
  );
}
