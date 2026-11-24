"use client";

import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { TableFrame } from "@/components/table-frame";
import type { CategoryRecord } from "@/lib/actions/categories";
import {
  deleteDeclutterListing,
  upsertDeclutterListing,
  type DeclutterListingRecord,
} from "@/lib/actions/declutter";

type ListingFormValues = {
  title: string;
  description: string;
  condition: string;
  price: string;
  locationNote: string;
  contactNote: string;
  status: DeclutterListingRecord["status"];
  sortOrder: number;
  categoryId?: string | null;
};

type DeclutterCmsManagerProps = {
  listings: DeclutterListingRecord[];
  categories: CategoryRecord[];
};

const STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "RESERVED", label: "Reserved" },
  { value: "GONE", label: "Gone" },
  { value: "HIDDEN", label: "Hidden" },
] as const;

const emptyFormValues: ListingFormValues = {
  title: "",
  description: "",
  condition: "",
  price: "",
  locationNote: "",
  contactNote: "",
  status: "AVAILABLE",
  sortOrder: 0,
  categoryId: null,
};

function statusColor(status: DeclutterListingRecord["status"]) {
  switch (status) {
    case "AVAILABLE":
      return "green";
    case "RESERVED":
      return "gold";
    case "GONE":
      return "default";
    case "HIDDEN":
      return "magenta";
    default:
      return "default";
  }
}

export function DeclutterCmsManager({
  listings,
  categories,
}: DeclutterCmsManagerProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DeclutterListingRecord | null>(null);
  const [form] = Form.useForm<ListingFormValues>();

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        title: editing.title,
        description: editing.description,
        condition: editing.condition,
        price: editing.price,
        locationNote: editing.locationNote,
        contactNote: editing.contactNote,
        status: editing.status,
        sortOrder: editing.sortOrder,
        categoryId: editing.categoryId,
      });
      return;
    }
    form.setFieldsValue(emptyFormValues);
  }, [open, editing, form]);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(listing: DeclutterListingRecord) {
    setEditing(listing);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditing(null);
  }

  function onSubmit(values: ListingFormValues) {
    startTransition(async () => {
      const result = await upsertDeclutterListing({
        id: editing?.id,
        title: values.title,
        description: values.description ?? "",
        condition: values.condition ?? "",
        price: values.price ?? "",
        locationNote: values.locationNote ?? "",
        contactNote: values.contactNote ?? "",
        status: values.status,
        sortOrder: values.sortOrder ?? 0,
        categoryId: values.categoryId ?? null,
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
      const result = await deleteDeclutterListing(id);
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      router.refresh();
    });
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Declutter CMS
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ margin: "4px 0 0" }}>
            Manage public listings at /public/declutter. Categories come from
            your inventory categories.
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Link href="/public/declutter" target="_blank">
            <Button icon={<ExportOutlined />}>Preview public page</Button>
          </Link>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add listing
          </Button>
        </Space>
      </div>

      <TableFrame>
        <Table
          rowKey="id"
          dataSource={listings}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 900 }}
          columns={[
            {
              title: "Title",
              dataIndex: "title",
              render: (title: string, row) => (
                <Space orientation="vertical" size={0}>
                  <span>{title}</span>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {row.price.trim() ? row.price : "Free"}
                    {row.condition ? ` · ${row.condition}` : ""}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "Category",
              dataIndex: ["category", "name"],
              width: 140,
              render: (_: unknown, row) => row.category?.name ?? "—",
            },
            {
              title: "Status",
              dataIndex: "status",
              width: 120,
              render: (status: DeclutterListingRecord["status"]) => (
                <Tag color={statusColor(status)}>
                  {STATUS_OPTIONS.find((option) => option.value === status)
                    ?.label ?? status}
                </Tag>
              ),
            },
            {
              title: "Order",
              dataIndex: "sortOrder",
              width: 80,
            },
            {
              title: "Actions",
              key: "actions",
              width: 160,
              render: (_: unknown, row) => (
                <Space>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(row)}
                  />
                  <Link href={`/public/declutter/${row.id}`} target="_blank">
                    <Button size="small" icon={<ExportOutlined />} />
                  </Link>
                  <Popconfirm
                    title="Delete this listing?"
                    onConfirm={() => onDelete(row.id)}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      loading={pending}
                    />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </TableFrame>

      <Modal
        title={editing ? "Edit listing" : "Add listing"}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={pending}
        okText={editing ? "Save" : "Create"}
        destroyOnHidden
        width="min(640px, calc(100vw - 24px))"
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          onFinish={onSubmit}
          initialValues={emptyFormValues}
        >
          <Form.Item
            label="Title"
            name="title"
            required
            rules={[
              {
                validator: (_, value: string) =>
                  value?.trim()
                    ? Promise.resolve()
                    : Promise.reject(new Error("Title is required")),
              },
            ]}
          >
            <Input placeholder="e.g. Desk lamp" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={4} placeholder="Details for buyers" />
          </Form.Item>
          <Space wrap style={{ width: "100%" }} styles={{ item: { flex: 1 } }}>
            <Form.Item label="Condition" name="condition" style={{ flex: 1 }}>
              <Input placeholder="Good / Fair" />
            </Form.Item>
            <Form.Item
              label="Price"
              name="price"
              style={{ flex: 1 }}
              extra="Leave blank for Free"
            >
              <Input placeholder="e.g. $50" />
            </Form.Item>
          </Space>
          <Form.Item label="Location note" name="locationNote">
            <Input placeholder="District, pickup only, etc." />
          </Form.Item>
          <Form.Item label="Contact note" name="contactNote">
            <Input.TextArea rows={2} placeholder="How to reach you" />
          </Form.Item>
          <Space wrap style={{ width: "100%" }} styles={{ item: { flex: 1 } }}>
            <Form.Item
              label="Status"
              name="status"
              required
              style={{ flex: 1, minWidth: 160 }}
            >
              <Select options={[...STATUS_OPTIONS]} />
            </Form.Item>
            <Form.Item
              label="Category"
              name="categoryId"
              style={{ flex: 1, minWidth: 180 }}
            >
              <Select
                allowClear
                placeholder="Optional"
                options={categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
              />
            </Form.Item>
            <Form.Item
              label="Sort order"
              name="sortOrder"
              style={{ width: 120 }}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
