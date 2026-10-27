"use client";

import { Form, Input, Modal, Select } from "antd";
import { useEffect } from "react";
import type { ItemRecord } from "@/lib/actions/items";
import type {
  DisposalMethod,
  DisposalStatus,
  WorkingCondition,
} from "@/lib/item-disposition";

export type ItemDisposeFormValues = {
  workingCondition: WorkingCondition;
  disposalStatus: DisposalStatus;
  disposalMethod: DisposalMethod;
  soldPrice: string;
};

type ItemDisposeModalProps = {
  open: boolean;
  item: ItemRecord | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: ItemDisposeFormValues) => void;
};

export function ItemDisposeModal({
  open,
  item,
  pending,
  onCancel,
  onSubmit,
}: ItemDisposeModalProps) {
  const [form] = Form.useForm<ItemDisposeFormValues>();
  const disposalStatus = Form.useWatch("disposalStatus", form);
  const disposalMethod = Form.useWatch("disposalMethod", form);
  const showSoldPrice = disposalMethod === "sell";
  const soldPriceRequired =
    disposalMethod === "sell" && disposalStatus === "disposed";

  useEffect(() => {
    if (!open || !item) return;
    form.setFieldsValue({
      workingCondition: item.workingCondition || undefined,
      disposalStatus: item.disposalStatus || "to_dispose",
      disposalMethod: item.disposalMethod || undefined,
      soldPrice: item.soldPrice || undefined,
    });
  }, [open, item, form]);

  if (!open || !item) {
    return null;
  }

  return (
    <Modal
      title={`Dispose: ${item.name}`}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={pending}
      okText="Save disposal"
      destroyOnHidden
      width="min(440px, calc(100vw - 24px))"
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={onSubmit}
      >
        <Form.Item label="Working condition" name="workingCondition">
          <Select
            allowClear
            placeholder="Unset"
            options={[
              { value: "working", label: "Working" },
              { value: "not_working", label: "Not working" },
              { value: "broken", label: "Broken" },
            ]}
          />
        </Form.Item>
        <Form.Item
          label="Disposal status"
          name="disposalStatus"
          rules={[{ required: true, message: "Choose a disposal status" }]}
          extra="To dispose = decided; Disposed = already gone."
        >
          <Select
            options={[
              { value: "to_dispose", label: "To dispose" },
              { value: "disposed", label: "Disposed" },
            ]}
          />
        </Form.Item>
        {disposalStatus ? (
          <Form.Item label="Disposal method" name="disposalMethod">
            <Select
              allowClear
              placeholder="Select method"
              options={[
                { value: "recycle", label: "Recycle" },
                { value: "rubbish", label: "Rubbish" },
                { value: "sell", label: "2nd platform" },
                { value: "gift", label: "Friends gift" },
              ]}
              onChange={(value) => {
                if (value !== "sell") {
                  form.setFieldValue("soldPrice", undefined);
                }
              }}
            />
          </Form.Item>
        ) : null}
        {showSoldPrice ? (
          <Form.Item
            label="Sold price"
            name="soldPrice"
            rules={
              soldPriceRequired
                ? [{ required: true, message: "Enter the sold price" }]
                : undefined
            }
            extra={
              soldPriceRequired
                ? "Required once the item is sold."
                : "Optional until sold; fill in when it sells."
            }
          >
            <Input allowClear placeholder="e.g. 200" inputMode="decimal" />
          </Form.Item>
        ) : null}
      </Form>
    </Modal>
  );
}
