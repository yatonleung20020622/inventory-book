"use client";

import { App } from "antd";

export function MajorColorSwatch({
  value,
  size = 16,
}: {
  value: string;
  size?: number;
}) {
  const { message } = App.useApp();

  if (!value) {
    return <span style={{ opacity: 0.45 }}>-</span>;
  }

  async function copyHex() {
    try {
      await navigator.clipboard.writeText(value);
      message.success(`Copied ${value}`);
    } catch {
      message.error("Could not copy color");
    }
  }

  return (
    <button
      type="button"
      title={`Copy ${value}`}
      aria-label={`Copy major color ${value}`}
      onClick={(event) => {
        event.stopPropagation();
        void copyHex();
      }}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: 4,
        background: value,
        border: "1px solid var(--border-color)",
        verticalAlign: "middle",
        padding: 0,
        cursor: "pointer",
      }}
    />
  );
}
