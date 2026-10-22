import type { ReactNode } from "react";

/** Keeps Ant Design tables inside the card on narrow screens. */
export function TableFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="table-frame"
      style={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {children}
    </div>
  );
}
