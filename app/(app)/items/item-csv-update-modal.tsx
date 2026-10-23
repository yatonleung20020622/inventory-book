"use client";

import { App, Button, Modal, Space } from "antd";
import { useEffect, useState, useTransition } from "react";
import {
  applyItemCsvUpdate,
  type ItemCsvUpdatePreview,
} from "@/lib/actions/items";

type ItemCsvUpdateModalProps = {
  open: boolean;
  updates: ItemCsvUpdatePreview[];
  unchangedCount: number;
  errors: string[];
  onClose: () => void;
  onApplied: () => void;
};

export function ItemCsvUpdateModal({
  open,
  updates: initialUpdates,
  unchangedCount,
  errors,
  onClose,
  onApplied,
}: ItemCsvUpdateModalProps) {
  const { message } = App.useApp();
  const [pending, startTransition] = useTransition();
  const [remaining, setRemaining] = useState(initialUpdates);
  const [applyingKey, setApplyingKey] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRemaining(initialUpdates);
      setApplyingKey(null);
    }
  }, [open, initialUpdates]);

  function skipOne(key: string) {
    setRemaining((current) => current.filter((entry) => entry.key !== key));
  }

  function applyOne(change: ItemCsvUpdatePreview) {
    setApplyingKey(change.key);
    startTransition(async () => {
      const result = await applyItemCsvUpdate(change);
      setApplyingKey(null);
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      setRemaining((current) =>
        current.filter((entry) => entry.key !== change.key),
      );
      onApplied();
    });
  }

  function applyAllRemaining() {
    const queue = [...remaining];
    if (queue.length === 0) {
      return;
    }
    startTransition(async () => {
      let applied = 0;
      let failed = 0;
      for (const change of queue) {
        setApplyingKey(change.key);
        const result = await applyItemCsvUpdate(change);
        if (result.ok) {
          applied += 1;
          setRemaining((current) =>
            current.filter((entry) => entry.key !== change.key),
          );
        } else {
          failed += 1;
        }
      }
      setApplyingKey(null);
      if (applied > 0) {
        message.success(`Applied ${applied} update(s).`);
        onApplied();
      }
      if (failed > 0) {
        message.error(`${failed} update(s) failed.`);
      }
    });
  }

  return (
    <Modal
      title="Confirm CSV updates"
      open={open}
      onCancel={onClose}
      footer={
        <Space wrap>
          <Button onClick={onClose}>Close</Button>
          <Button
            type="primary"
            disabled={remaining.length === 0}
            loading={pending && applyingKey === null}
            onClick={applyAllRemaining}
          >
            Apply all remaining ({remaining.length})
          </Button>
        </Space>
      }
      width={720}
      destroyOnHidden
      styles={{
        body: {
          maxHeight: "min(60vh, 520px)",
          overflowY: "auto",
          paddingRight: 4,
        },
      }}
    >
      <p style={{ marginTop: 0, color: "var(--muted)", fontSize: 13 }}>
        {remaining.length} pending update(s)
        {unchangedCount > 0 ? ` · ${unchangedCount} unchanged` : ""}
        {errors.length > 0 ? ` · ${errors.length} error(s)` : ""}
      </p>

      {errors.length > 0 ? (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid rgba(255, 77, 79, 0.45)",
            background: "rgba(255, 77, 79, 0.08)",
            fontSize: 13,
          }}
        >
          {errors.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      ) : null}

      {remaining.length === 0 ? (
        <div style={{ color: "var(--muted)", fontSize: 14 }}>
          No pending updates left.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {remaining.map((change) => (
            <div
              key={change.key}
              style={{
                padding: 12,
                borderRadius: 8,
                border: "1px solid var(--border-color)",
                background: "var(--card-bg)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{change.name}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      wordBreak: "break-all",
                    }}
                  >
                    {change.id}
                  </div>
                </div>
                <Space>
                  <Button
                    size="small"
                    disabled={pending}
                    onClick={() => skipOne(change.key)}
                  >
                    Skip
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    loading={pending && applyingKey === change.key}
                    disabled={pending && applyingKey !== change.key}
                    onClick={() => applyOne(change)}
                  >
                    Apply
                  </Button>
                </Space>
              </div>
              <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
                {change.changes.map((field) => (
                  <div key={`${change.key}-${field.field}`}>
                    <strong>{field.field}</strong>:{" "}
                    <span style={{ color: "var(--muted)" }}>
                      {field.from || "(empty)"}
                    </span>{" "}
                    → {field.to || "(empty)"}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
