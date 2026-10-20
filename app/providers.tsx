"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import type { ThemeMode } from "@/lib/theme";

export function Providers({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme: ThemeMode;
}) {
  return (
    <AntdRegistry>
      <ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider>
    </AntdRegistry>
  );
}
