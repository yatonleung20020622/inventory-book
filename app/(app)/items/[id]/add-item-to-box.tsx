"use client";

import { DownloadOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, InputNumber, Space, Upload } from "antd";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  createItemInBox,
  importItemsIntoBoxFromExcel,
} from "@/lib/actions/items";
import { buildBoxItemsExcelTemplate } from "@/lib/excel/box-items-excel";

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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read file."));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

export function AddItemToBox({ boxId, boxName }: AddItemToBoxProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form] = Form.useForm<FormValues>();

  function downloadTemplate() {
    const bytes = buildBoxItemsExcelTemplate();
    const blob = new Blob([Uint8Array.from(bytes)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "box-items-template.xlsx";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function onImportExcel(file: File) {
    startTransition(async () => {
      try {
        const fileBase64 = await fileToBase64(file);
        const result = await importItemsIntoBoxFromExcel({ boxId, fileBase64 });
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
        message.error("Failed to import Excel.");
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
          Excel template
        </Button>
        <Upload
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          showUploadList={false}
          beforeUpload={onImportExcel}
        >
          <Button icon={<UploadOutlined />} loading={pending}>
            Import Excel
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
