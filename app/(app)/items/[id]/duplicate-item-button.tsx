"use client";

import { CopyOutlined } from "@ant-design/icons";
import { App, Button, Popconfirm } from "antd";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { duplicateItem } from "@/lib/actions/items";

type DuplicateItemButtonProps = {
  itemId: string;
};

export function DuplicateItemButton({ itemId }: DuplicateItemButtonProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const result = await duplicateItem(itemId);
      if (!result.ok || !result.itemId) {
        message.error(result.message);
        return;
      }

      message.success(result.message);
      router.push(`/items/${result.itemId}`);
    });
  }

  return (
    <Popconfirm
      title="Duplicate this item?"
      description="Creates a copy with the same fields and categories."
      okText="Duplicate"
      cancelText="Cancel"
      onConfirm={onConfirm}
      disabled={pending}
    >
      <Button
        type="text"
        icon={<CopyOutlined />}
        loading={pending}
        aria-label="Duplicate item"
        title="Duplicate item"
        style={{
          color: "var(--muted)",
          width: 36,
          height: 36,
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      />
    </Popconfirm>
  );
}
