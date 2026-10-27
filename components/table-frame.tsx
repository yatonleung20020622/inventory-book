import type { ReactNode } from "react";

/** Keeps Ant Design tables inside the card on narrow screens (iPhone-width). */
export function TableFrame({ children }: { children: ReactNode }) {
  return <div className="table-frame">{children}</div>;
}
