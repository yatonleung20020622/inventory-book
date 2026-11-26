"use client";

import { DatePicker, Form, Input, Modal, Select } from "antd";
import dayjs from "dayjs";
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
  lentTo: string;
  dueDate: string;
  custodyNotes: string;
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
  const [form] = Form.useForm<
    Omit<ItemDisposeFormValues, "dueDate"> & {
      dueDate?: dayjs.Dayjs | null;
    }
  >();
  const disposalStatus = Form.useWatch("disposalStatus", form);
  const disposalMethod = Form.useWatch("disposalMethod", form);
  const showSoldPrice = disposalMethod === "sell";
  const soldPriceRequired =
    disposalMethod === "sell" && disposalStatus === "disposed";
  const isCustody =
    disposalStatus === "lost" || disposalStatus === "lent";
  const isLent = disposalStatus === "lent";
  const showDisposeMethod =
    disposalStatus === "to_dispose" || disposalStatus === "disposed";

  useEffect(() => {
    if (!open || !item) return;
    form.setFieldsValue({
      workingCondition: item.workingCondition || undefined,
      disposalStatus: item.disposalStatus || "to_dispose",
      disposalMethod: item.disposalMethod || undefined,
      soldPrice: item.soldPrice || undefined,
      lentTo: item.lentTo || undefined,
      dueDate: item.dueDate ? dayjs(item.dueDate) : null,
      custodyNotes: item.custodyNotes || undefined,
    });
  }, [open, item, form]);

  if (!open || !item) {
    return null;
  }

  return (
    <Modal
      title={`Status: ${item.name}`}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={pending}
      okText="Save"
      destroyOnHidden
      width="min(480px, calc(100vw - 24px))"
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={(values) => {
          onSubmit({
            workingCondition: values.workingCondition ?? "",
            disposalStatus: values.disposalStatus ?? "",
            disposalMethod: values.disposalMethod ?? "",
            soldPrice: values.soldPrice ?? "",
            lentTo: values.lentTo ?? "",
            dueDate: values.dueDate
              ? values.dueDate.format("YYYY-MM-DD")
              : "",
            custodyNotes: values.custodyNotes ?? "",
          });
        }}
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
          label="Status"
          name="disposalStatus"
          rules={[{ required: true, message: "Choose a status" }]}
          extra="Dispose, or mark Lost / Lent out."
        >
          <Select
            options={[
              { value: "to_dispose", label: "To dispose" },
              { value: "disposed", label: "Disposed" },
              { value: "lost", label: "Lost" },
              { value: "lent", label: "Lent out" },
            ]}
            onChange={(value) => {
              if (value !== "to_dispose" && value !== "disposed") {
                form.setFieldValue("disposalMethod", undefined);
                form.setFieldValue("soldPrice", undefined);
              }
              if (value !== "lent") {
                form.setFieldValue("lentTo", undefined);
                form.setFieldValue("dueDate", null);
              }
              if (value !== "lost" && value !== "lent") {
                form.setFieldValue("custodyNotes", undefined);
              }
            }}
          />
        </Form.Item>
        {showDisposeMethod ? (
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
        {isLent ? (
          <>
            <Form.Item
              label="Lent to"
              name="lentTo"
              rules={[{ required: true, message: "Who has this item?" }]}
            >
              <Input placeholder="Name of the person" />
            </Form.Item>
            <Form.Item label="Due back" name="dueDate">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </>
        ) : null}
        {isCustody ? (
          <Form.Item label="Notes" name="custodyNotes">
            <Input.TextArea
              rows={2}
              placeholder={
                isLent
                  ? "Optional notes about the loan"
                  : "Where it might be, last seen, etc."
              }
            />
          </Form.Item>
        ) : null}
      </Form>
    </Modal>
  );
}
