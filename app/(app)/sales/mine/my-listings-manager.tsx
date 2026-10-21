"use client";

import {
  DeleteOutlined,
  EditOutlined,
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
  Radio,
  Select,
  Space,
  Table,
} from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { ItemRecord } from "@/lib/actions/items";
import {
  createSaleListing,
  createSaleListingWithNewItem,
  deleteSaleListing,
  updateSaleListing,
  type SaleListingRecord,
} from "@/lib/actions/sales";

type ItemSource = "existing" | "new";

type ListingFormValues = {
  source: ItemSource;
  itemId?: string;
  name?: string;
  brand?: string;
  quantity?: number;
  unit?: string;
  salePrice: string;
  note: string;
};

type MyListingsManagerProps = {
  listings: SaleListingRecord[];
  items: ItemRecord[];
};

export function MyListingsManager({
  listings,
  items,
}: MyListingsManagerProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SaleListingRecord | null>(null);
  const [form] = Form.useForm<ListingFormValues>();
  const source = Form.useWatch("source", form) ?? "new";

  const listedItemIds = new Set(listings.map((listing) => listing.itemId));
  const availableItems = items.filter(
    (item) => !listedItemIds.has(item.id) || item.id === editing?.itemId,
  );

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        source: "existing",
        itemId: editing.itemId,
        salePrice: editing.salePrice,
        note: editing.note,
      });
      return;
    }
    form.setFieldsValue({
      source: "new",
      itemId: undefined,
      name: "",
      brand: "",
      quantity: 1,
      unit: "個",
      salePrice: "",
      note: "",
    });
  }, [open, editing, form]);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(listing: SaleListingRecord) {
    setEditing(listing);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditing(null);
  }

  function onSubmit(values: ListingFormValues) {
    startTransition(async () => {
      let result;

      if (editing) {
        result = await updateSaleListing({
          id: editing.id,
          salePrice: values.salePrice ?? "",
          note: values.note ?? "",
        });
      } else if (values.source === "new") {
        result = await createSaleListingWithNewItem({
          name: values.name ?? "",
          brand: values.brand,
          quantity: values.quantity,
          unit: values.unit,
          salePrice: values.salePrice,
          note: values.note,
        });
      } else {
        if (!values.itemId) {
          message.error("Select an item.");
          return;
        }
        result = await createSaleListing({
          itemId: values.itemId,
          salePrice: values.salePrice,
          note: values.note,
        });
      }

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
      const result = await deleteSaleListing(id);
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
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add post
        </Button>
      </div>

      <Table<SaleListingRecord>
        rowKey="id"
        dataSource={listings}
        loading={pending}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
        columns={[
          {
            title: "Item",
            dataIndex: "itemName",
            render: (value: string, record) => (
              <Link href={`/items/${record.itemId}`}>{value}</Link>
            ),
          },
          {
            title: "Brand",
            dataIndex: "itemBrand",
            width: 140,
            render: (value: string) =>
              value ? value : <span style={{ opacity: 0.45 }}>-</span>,
          },
          {
            title: "Sale price",
            dataIndex: "salePrice",
            width: 140,
            render: (value: string) =>
              value ? value : <span style={{ opacity: 0.45 }}>-</span>,
          },
          {
            title: "Note",
            dataIndex: "note",
            ellipsis: true,
            render: (value: string) =>
              value ? value : <span style={{ opacity: 0.45 }}>-</span>,
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
                  aria-label="Edit post"
                />
                <Popconfirm
                  title="Remove this post?"
                  okText="Remove"
                  cancelText="Cancel"
                  onConfirm={() => onDelete(record.id)}
                >
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    aria-label="Remove post"
                  />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        locale={{ emptyText: "You have not posted any items for sale yet." }}
      />

      <Modal
        title={editing ? "Edit post" : "Add post"}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={pending}
        okText={editing ? "Save" : "Post for sale"}
        destroyOnHidden
        styles={{
          body: {
            maxHeight: "min(60vh, 480px)",
            overflowY: "auto",
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          onFinish={onSubmit}
          initialValues={{
            source: "new",
            quantity: 1,
            unit: "個",
            salePrice: "",
            note: "",
          }}
        >
          {!editing ? (
            <Form.Item label="Item source" name="source">
              <Radio.Group>
                <Radio.Button value="new">Create new item</Radio.Button>
                <Radio.Button
                  value="existing"
                  disabled={availableItems.length === 0}
                >
                  Existing item
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
          ) : null}

          {!editing && source === "existing" ? (
            <Form.Item
              label="Item"
              name="itemId"
              required
              rules={[{ required: true, message: "Select an item" }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Choose from your items"
                options={availableItems.map((item) => ({
                  value: item.id,
                  label: item.brand
                    ? `${item.name} (${item.brand})`
                    : item.name,
                }))}
              />
            </Form.Item>
          ) : null}

          {!editing && source === "new" ? (
            <>
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
                <Input placeholder="USB-C 充電線" />
              </Form.Item>
              <Form.Item label="Brand" name="brand">
                <Input placeholder="e.g. Apple" />
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
            </>
          ) : null}

          <Form.Item label="Sale price" name="salePrice">
            <Input placeholder="e.g. 120 HKD" />
          </Form.Item>
          <Form.Item label="Note" name="note">
            <Input.TextArea
              rows={2}
              placeholder="Optional note for buyers"
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
