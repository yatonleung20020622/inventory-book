"use client";

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Switch,
  Table,
} from "antd";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { TableFrame } from "@/components/table-frame";
import type { ItemRecord } from "@/lib/actions/items";
import {
  createSaleListing,
  createSaleListingWithNewItem,
  deleteSaleListing,
  updateSaleListing,
  type SaleCondition,
  type SaleListingRecord,
} from "@/lib/actions/sales";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import {
  formatSalePriceDisplay,
  isFreeSalePrice,
} from "@/lib/sale-price";

type ItemSource = "existing" | "new";

type ListingFormValues = {
  source: ItemSource;
  itemId?: string;
  name?: string;
  brand?: string;
  quantity?: number;
  unit?: string;
  desc?: string;
  notice?: string;
  purchaseDate?: string;
  condition?: SaleCondition;
  isVirtual?: boolean;
  salePrice: string;
  isFree: boolean;
  note: string;
};

type MyListingsManagerProps = {
  listings: SaleListingRecord[];
  items: ItemRecord[];
};

const CONDITION_OPTIONS = [
  { value: "new", label: "New" },
  { value: "like-new", label: "Like new" },
  { value: "used", label: "Used" },
];

function formatCondition(value: string) {
  if (value === "new") return "New";
  if (value === "like-new") return "Like new";
  if (value === "used") return "Used";
  return "";
}

export function MyListingsManager({
  listings,
  items,
}: MyListingsManagerProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SaleListingRecord | null>(null);
  const [form] = Form.useForm<ListingFormValues>();
  const source = Form.useWatch("source", form) ?? "new";
  const isFree = Form.useWatch("isFree", form) ?? false;

  const listedItemIds = new Set(listings.map((listing) => listing.itemId));
  const availableItems = items.filter(
    (item) => !listedItemIds.has(item.id) || item.id === editing?.itemId,
  );

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const free = isFreeSalePrice(editing.salePrice);
      form.setFieldsValue({
        source: "existing",
        itemId: editing.itemId,
        name: editing.name,
        brand: editing.brand,
        quantity: editing.quantity,
        unit: editing.unit,
        desc: editing.desc,
        notice: editing.notice,
        purchaseDate: editing.purchaseDate,
        condition: editing.condition || undefined,
        isVirtual: editing.isVirtual,
        salePrice: free ? "" : editing.salePrice,
        isFree: free,
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
      desc: "",
      notice: "",
      purchaseDate: "",
      condition: undefined,
      isVirtual: false,
      salePrice: "",
      isFree: false,
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

  function applyItemDefaults(itemId: string) {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;
    form.setFieldsValue({
      name: item.name,
      brand: item.brand,
      quantity: item.quantity,
      unit: item.unit,
      desc: item.desc,
      notice: item.notice,
      purchaseDate: item.purchaseDate,
      salePrice: item.estimatedPrice,
    });
  }

  function onSubmit(values: ListingFormValues) {
    const salePrice = values.isFree ? "0" : (values.salePrice ?? "");
    const shared = {
      name: values.name,
      brand: values.brand,
      quantity: values.quantity,
      unit: values.unit,
      desc: values.desc,
      notice: values.notice,
      purchaseDate: values.purchaseDate,
      condition: values.condition ?? "",
      isVirtual: values.isVirtual ?? false,
      salePrice,
      note: values.note ?? "",
    };

    startTransition(async () => {
      let result;

      if (editing) {
        result = await updateSaleListing({
          id: editing.id,
          ...shared,
        });
      } else if (values.source === "new") {
        result = await createSaleListingWithNewItem({
          ...shared,
          name: values.name ?? "",
        });
      } else {
        if (!values.itemId) {
          message.error("Select an item.");
          return;
        }
        result = await createSaleListing({
          itemId: values.itemId,
          ...shared,
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

  const showItemFields =
    Boolean(editing) || source === "new" || source === "existing";

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} block={isMobile}>
          Add post
        </Button>
      </div>

      {isMobile ? (
        listings.length === 0 ? (
          <div
            style={{
              padding: "28px 12px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            You have not posted any items for sale yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {listings.map((record) => {
              const price = formatSalePriceDisplay(record.salePrice);
              const condition = formatCondition(record.condition);
              return (
                <div
                  key={record.id}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: "1px solid var(--border-color)",
                    background: "var(--page-bg)",
                  }}
                >
                  <Link
                    href={`/sales/${record.id}`}
                    style={{
                      display: "block",
                      fontSize: 16,
                      fontWeight: 600,
                      color: "inherit",
                      marginBottom: 8,
                      wordBreak: "break-word",
                    }}
                  >
                    {record.name}
                  </Link>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px 12px",
                      fontSize: 13,
                      color: "var(--muted)",
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ color: "#1677ff", fontWeight: 600 }}>
                      {price || "—"}
                    </span>
                    <span>
                      {record.quantity} {record.unit}
                    </span>
                    {condition ? <span>{condition}</span> : null}
                    <span>{record.isVirtual ? "Virtual" : "Physical"}</span>
                  </div>
                  <Space size={4}>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => openEdit(record)}
                    >
                      Edit
                    </Button>
                    <Popconfirm
                      title="Remove this post?"
                      okText="Remove"
                      cancelText="Cancel"
                      onConfirm={() => onDelete(record.id)}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />}>
                        Remove
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <TableFrame>
          <Table<SaleListingRecord>
            rowKey="id"
            dataSource={listings}
            loading={pending}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 900 }}
            columns={[
              {
                title: "Item",
                dataIndex: "name",
                ellipsis: true,
                render: (value: string, record) => (
                  <Link href={`/sales/${record.id}`}>{value}</Link>
                ),
              },
              {
                title: "Brand",
                dataIndex: "brand",
                width: 110,
                render: (value: string) =>
                  value ? value : <span style={{ opacity: 0.45 }}>-</span>,
              },
              {
                title: "Qty",
                key: "qty",
                width: 90,
                render: (_, record) => `${record.quantity} ${record.unit}`,
              },
              {
                title: "Condition",
                dataIndex: "condition",
                width: 100,
                render: (value: string) => {
                  const label = formatCondition(value);
                  return label ? (
                    label
                  ) : (
                    <span style={{ opacity: 0.45 }}>-</span>
                  );
                },
              },
              {
                title: "Type",
                dataIndex: "isVirtual",
                width: 90,
                render: (value: boolean) => (value ? "Virtual" : "Physical"),
              },
              {
                title: "Sale price",
                dataIndex: "salePrice",
                width: 110,
                render: (value: string) => {
                  const display = formatSalePriceDisplay(value);
                  return display ? (
                    display
                  ) : (
                    <span style={{ opacity: 0.45 }}>-</span>
                  );
                },
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
            locale={{
              emptyText: "You have not posted any items for sale yet.",
            }}
          />
        </TableFrame>
      )}

      <Modal
        title={editing ? "Edit post" : "Add post"}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={pending}
        okText={editing ? "Save" : "Post for sale"}
        destroyOnHidden
        width="min(520px, calc(100vw - 24px))"
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
            isFree: false,
            isVirtual: false,
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
                onChange={(itemId: string) => applyItemDefaults(itemId)}
              />
            </Form.Item>
          ) : null}

          {showItemFields ? (
            <>
              <Form.Item
                label="Name"
                name="name"
                required
                rules={[
                  {
                    validator: (_, value: string) =>
                      value?.trim() || source === "existing"
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
                rules={
                  source === "new" || editing
                    ? [{ required: true, message: "Quantity is required" }]
                    : undefined
                }
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                label="Unit"
                name="unit"
                rules={
                  source === "new" || editing
                    ? [{ required: true, message: "Unit is required" }]
                    : undefined
                }
              >
                <Input placeholder="個" />
              </Form.Item>
              <Form.Item label="Description" name="desc">
                <Input.TextArea rows={2} placeholder="Optional description" />
              </Form.Item>
              <Form.Item label="Notice" name="notice">
                <Input.TextArea
                  rows={2}
                  placeholder="Optional warning or notice"
                />
              </Form.Item>
              <Form.Item
                label="Purchase date"
                name="purchaseDate"
                getValueProps={(value: string) => ({
                  value: value ? dayjs(value) : null,
                })}
                normalize={(value) => (value ? value.format("YYYY-MM-DD") : "")}
              >
                <DatePicker style={{ width: "100%" }} allowClear />
              </Form.Item>
              <Form.Item label="Condition" name="condition">
                <Select
                  allowClear
                  placeholder="Select condition"
                  options={CONDITION_OPTIONS}
                />
              </Form.Item>
              <Form.Item
                label="Virtual item"
                name="isVirtual"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </>
          ) : null}

          <Form.Item label="Sale price" name="salePrice">
            <Input placeholder="e.g. 120 HKD" disabled={isFree} />
          </Form.Item>
          <Form.Item
            name="isFree"
            valuePropName="checked"
            style={{ marginTop: -8 }}
          >
            <Checkbox
              onChange={(event) => {
                if (event.target.checked) {
                  form.setFieldValue("salePrice", "");
                }
              }}
            >
              Free
            </Checkbox>
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
