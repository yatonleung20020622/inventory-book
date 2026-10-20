"use client";

import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

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
        background: "var(--login-gradient)",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <ThemeToggle />
      </div>
      {children}
    </main>
  );
}
