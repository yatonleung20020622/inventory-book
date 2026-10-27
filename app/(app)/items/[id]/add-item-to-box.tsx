"use client";

import { DownloadOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, InputNumber, Space, Upload } from "antd";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  createItemInBox,
  importItemsIntoBoxFromCsv,
} from "@/lib/actions/items";
import { buildBoxItemsCsvTemplate } from "@/lib/csv/box-items-csv";

type FormValues = {
  name: string;
  brand: string;
  quantity: number;
  unit: string;
  desc: string;
};

type AddItemToBoxProps = {
  boxId: string;
  boxName: string;
};

export function AddItemToBox({ boxId, boxName }: AddItemToBoxProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form] = Form.useForm<FormValues>();

  function downloadTemplate() {
    const csv = buildBoxItemsCsvTemplate();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "box-items-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function onImportCsv(file: File) {
    startTransition(async () => {
      try {
        const csvText = await file.text();
        const result = await importItemsIntoBoxFromCsv({ boxId, csvText });
        if (!result.ok) {
          message.error(result.message);
          if (result.errors?.length) {
            message.warning(result.errors.join(" "));
          }
          return;
        }
        message.success(result.message);
        if (result.errors?.length) {
          message.warning(result.errors.join(" "));
        }
        router.refresh();
      } catch {
        message.error("Failed to read CSV file.");
      }
    });
    return false;
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await createItemInBox({
        boxId,
        name: values.name,
        brand: values.brand ?? "",
        quantity: values.quantity ?? 1,
        unit: values.unit ?? "個",
        desc: values.desc ?? "",
      });

      if (!result.ok) {
        message.error(result.message);
        return;
      }

      message.success(result.message);
      form.resetFields();
      form.setFieldsValue({ quantity: 1, unit: "個" });
      router.refresh();
    });
  }

  return (
    <section
      style={{
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        padding: 16,
        borderRadius: 8,
        background: "var(--card-bg)",
        border: "1px solid var(--border-color)",
        alignSelf: "start",
      }}
    >
      <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600 }}>
        Add item to this box
      </h2>
      <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 13 }}>
        Creates a new item with relations: this box{" "}
        <em>contains</em> it, and the item is <em>in</em>{" "}
        <strong style={{ color: "var(--foreground)" }}>{boxName}</strong>.
      </p>

      <Space wrap style={{ marginBottom: 16 }}>
        <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
          Download template
        </Button>
        <Upload
          accept=".csv,text/csv"
          showUploadList={false}
          beforeUpload={onImportCsv}
        >
          <Button icon={<UploadOutlined />} loading={pending}>
            Import CSV
          </Button>
        </Upload>
      </Space>

      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={onSubmit}
        initialValues={{ quantity: 1, unit: "個", brand: "", desc: "" }}
      >
        <Form.Item
          label="Name"
          name="name"
          required
          rules={[
            {
              validator: (_, value: string) =>
                value?.trim()
                  ? Promise.resolve()
                  : Promise.reject(new Error("Item name is required")),
            },
          ]}
        >
          <Input placeholder="Item inside the box" />
        </Form.Item>
        <Form.Item label="Brand" name="brand">
          <Input placeholder="Optional" />
        </Form.Item>
        <Form.Item
          label="Quantity"
          name="quantity"
          rules={[{ required: true, message: "Quantity is required" }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          label="Unit"
          name="unit"
          rules={[{ required: true, message: "Unit is required" }]}
        >
          <Input placeholder="個" />
        </Form.Item>
        <Form.Item label="Desc" name="desc">
          <Input.TextArea rows={2} placeholder="Optional" maxLength={500} />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          icon={<PlusOutlined />}
          loading={pending}
        >
          Create in box
        </Button>
      </Form>
    </section>
  );
}
