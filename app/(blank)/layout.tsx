import type { ReactNode } from "react";

/** Blank shell for unauthenticated pages (e.g. login). */
export default function BlankLayout({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "linear-gradient(180deg, #f5f7fb 0%, #eef2f7 100%)",
      }}
    >
      {children}
    </main>
  );
}
