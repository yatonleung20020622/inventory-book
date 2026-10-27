import type { CSSProperties, ReactNode } from "react";

export const mobileRecordCardStyle: CSSProperties = {
  padding: 14,
  borderRadius: 10,
  border: "1px solid var(--border-color)",
  background: "var(--page-bg)",
  minWidth: 0,
};

export const mobileRecordMetaStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px 12px",
  fontSize: 13,
  color: "var(--muted)",
};

export function MobileRecordList({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gap: 10 }}>{children}</div>;
}

export function MobileEmpty({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: "28px 12px",
        textAlign: "center",
        color: "var(--muted)",
        fontSize: 14,
      }}
    >
      {children}
    </div>
  );
}
