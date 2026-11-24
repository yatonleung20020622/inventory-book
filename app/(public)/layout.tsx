"use client";

import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

/** Full-page public shell (no app sidebar / no login gate). */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="cv-public-shell"
      style={{
        minHeight: "100dvh",
        overflow: "auto",
        position: "relative",
        background: "var(--cv-page-bg)",
        color: "var(--cv-fg)",
      }}
    >
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 20 }}>
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
