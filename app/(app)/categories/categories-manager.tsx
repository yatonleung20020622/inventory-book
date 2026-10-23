"use client";

import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  ColorPicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
} from "antd";
import type { Color } from "antd/es/color-picker";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CategoryTag } from "@/components/category-tag";
import { TableFrame } from "@/components/table-frame";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CategoryRecord,
} from "@/lib/actions/categories";

type CategoryFormValues = {
  name: string;
  color: string;
};

type CategoriesManagerProps = {
  categories: CategoryRecord[];
};

const emptyFormValues: CategoryFormValues = {
  name: "",
  color: "#1677FF",
};

function isHexColor(value: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

function CategoryColorPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) {
  const trimmed = (value ?? "").trim();
  const hasColor = Boolean(trimmed) && isHexColor(trimmed);

  function handleChange(color: Color) {
    onChange?.(color.toHexString());
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <ColorPicker
        value={hasColor ? trimmed : "#1677FF"}
        onChange={handleChange}
        allowClear
        onClear={() => onChange?.("")}
        showText
        size="large"
        aria-label="Pick category color"
      />
      <span style={{ color: "var(--muted)", fontSize: 13 }}>
        {hasColor ? trimmed.toUpperCase() : "No color"}
      </span>
    </div>
  );
}

function CategoryFormModal({
  open,
  editing,
  pending,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  editing: CategoryRecord | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: CategoryFormValues) => void;
}) {
  const [form] = Form.useForm<CategoryFormValues>();

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        color: editing.color || "#1677FF",
      });
      return;
    }
    form.setFieldsValue(emptyFormValues);
  }, [open, editing, form]);

  if (!open) {
    return null;
  }

  return (
    <Modal
      title={editing ? "Edit category" : "Add category"}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={pending}
      okText={editing ? "Save" : "Create"}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={onSubmit}
        initialValues={emptyFormValues}
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
                  : Promise.reject(new Error("Category name is required")),
            },
          ]}
        >
          <Input placeholder="e.g. Electronics" />
        </Form.Item>
        <Form.Item label="Color" name="color">
          <CategoryColorPicker />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRecord | null>(null);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(category: CategoryRecord) {
    setEditing(category);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditing(null);
  }

  function onSubmit(values: CategoryFormValues) {
    startTransition(async () => {
      const result = editing
        ? await updateCategory({
            id: editing.id,
            name: values.name,
            color: values.color ?? "",
          })
        : await createCategory({
            name: values.name,
            color: values.color ?? "",
          });

      if (!result.ok) {
        message.error(result.message);
        return;
      }

      message.success(result.message);
      closeModal();
      router.refresh();
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      router.refresh();
    });
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Categories</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add category
        </Button>
      </div>

      <TableFrame>
        <Table<CategoryRecord>
          rowKey="id"
          dataSource={categories}
          loading={pending}
          pagination={{ pageSize: 10, simple: true }}
          scroll={{ x: 520 }}
          columns={[
            {
              title: "Name",
              dataIndex: "name",
              render: (value: string, record) => (
                <CategoryTag name={value} color={record.color} />
              ),
            },
            {
              title: "Color",
              dataIndex: "color",
              width: 120,
              render: (value: string) =>
                value ? (
                  <span style={{ fontFamily: "monospace", fontSize: 12 }}>
                    {value}
                  </span>
                ) : (
                  <span style={{ opacity: 0.45 }}>-</span>
                ),
            },
            {
              title: "Actions",
              key: "actions",
              width: 96,
              render: (_, record) => (
                <Space size={0}>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(record)}
                    aria-label="Edit category"
                  />
                  <Popconfirm
                    title="Delete this category?"
                    description="It will be removed from any items that use it."
                    okText="Delete"
                    cancelText="Cancel"
                    onConfirm={() => onDelete(record.id)}
                  >
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label="Delete category"
                    />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          locale={{ emptyText: "No categories yet. Add your first category." }}
        />
      </TableFrame>

      <CategoryFormModal
        open={open}
        editing={editing}
        pending={pending}
        onCancel={closeModal}
        onSubmit={onSubmit}
      />
    </>
  );
}
