"use client";

import { Grid } from "antd";

const { useBreakpoint } = Grid;

/** True below the `md` breakpoint (~768px). Covers iPhone 13 (390 CSS px). */
export function useIsMobile() {
  const screens = useBreakpoint();
  return !screens.md;
}
