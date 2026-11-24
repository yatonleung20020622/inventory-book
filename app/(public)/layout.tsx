"use client";

import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

/** Shared public shell (no app sidebar / no login gate). Section layouts set their own look. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="public-shell"
      style={{
        // Body is overflow:hidden (app shell); this shell owns scrolling like (blank).
        height: "100dvh",
        overflow: "auto",
        position: "relative",
        background: "var(--page-bg)",
        color: "var(--foreground)",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 20 }}>
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
