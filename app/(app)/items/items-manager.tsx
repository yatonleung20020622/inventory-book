"use client";

import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  UploadOutlined,
  UnorderedListOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  App,
  AutoComplete,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Upload,
} from "antd";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  createItem,
  deleteItem,
  importItemsFromCsv,
  updateItem,
  type ItemRecord,
} from "@/lib/actions/items";
import { buildItemCsvTemplate } from "@/lib/csv/items-csv";
import { SubItemsModal } from "./sub-items-modal";

type LocationOption = {
  id: string;
  name: string;
  isExpired: boolean;
  isDefault: boolean;
};

function getDefaultLocationId(locations: LocationOption[]): string | null {
  const markedDefault = locations.find((location) => location.isDefault);
  if (markedDefault) {
    return markedDefault.id;
  }
  if (locations.length === 1) {
    return locations[0].id;
  }
  return null;
}

function uniqueBrands(items: ItemRecord[]): string[] {
  const brands = new Set<string>();
  for (const item of items) {
    const brand = item.brand.trim();
    if (brand) {
      brands.add(brand);
    }
  }
  return Array.from(brands).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

type ItemFormValues = {
  name: string;
  brand: string;
  desc: string;
  quantity: number;
  unit: string;
  estimatedPrice: string;
  purchaseDate: string;
  notice: string;
  remarks: string;
  locationId: string | null;
};

type ItemsManagerProps = {
  items: ItemRecord[];
  locations: LocationOption[];
};

const emptyFormValues: ItemFormValues = {
  name: "",
  brand: "",
  desc: "",
  quantity: 1,
  unit: "個",
  estimatedPrice: "",
  purchaseDate: "",
  notice: "",
  remarks: "",
  locationId: null,
};

function ItemFormModal({
  open,
  editing,
  pending,
  locations,
  brandOptions,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  editing: ItemRecord | null;
  pending: boolean;
  locations: LocationOption[];
  brandOptions: string[];
  onCancel: () => void;
  onSubmit: (values: ItemFormValues) => void;
}) {
  const [form] = Form.useForm<ItemFormValues>();
  const [brandSearch, setBrandSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        brand: editing.brand,
        desc: editing.desc,
        quantity: editing.quantity,
        unit: editing.unit,
        estimatedPrice: editing.estimatedPrice,
        purchaseDate: editing.purchaseDate,
        notice: editing.notice,
        remarks: editing.remarks,
        locationId: editing.locationId,
      });
      setBrandSearch(editing.brand);
      return;
    }
    form.setFieldsValue({
      ...emptyFormValues,
      locationId: getDefaultLocationId(locations),
    });
    setBrandSearch("");
  }, [open, editing, form, locations]);

  const brandQuery = brandSearch.trim().toLowerCase();
  const filteredBrandOptions = (
    brandQuery
      ? brandOptions.filter((brand) => brand.toLowerCase().includes(brandQuery))
      : brandOptions
  ).map((brand) => ({ value: brand }));

  if (!open) {
    return null;
  }

  return (
    <Modal
      title={editing ? "Edit item" : "Add item"}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={pending}
      okText={editing ? "Save" : "Create"}
      destroyOnHidden
      styles={{
        body: {
          maxHeight: "min(60vh, 480px)",
          overflowY: "auto",
          paddingRight: 4,
        },
      }}
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
                  : Promise.reject(new Error("Item name is required")),
            },
          ]}
        >
          <Input placeholder="USB-C 充電線" />
        </Form.Item>
        <Form.Item label="Location" name="locationId">
          <Select
            allowClear
            placeholder="Select a location"
            options={locations.map((location) => ({
              value: location.id,
              label: location.isExpired
                ? `${location.name} (expired)`
                : location.name,
            }))}
          />
        </Form.Item>
        <Form.Item label="Brand" name="brand">
          <AutoComplete
            allowClear
            options={filteredBrandOptions}
            placeholder="e.g. Apple"
            onSearch={setBrandSearch}
            onSelect={(value) => setBrandSearch(value)}
            onChange={(value) => setBrandSearch(value ?? "")}
            filterOption={false}
          />
        </Form.Item>
        <Form.Item label="Desc" name="desc">
          <Input.TextArea
            rows={2}
            placeholder="Optional description"
            maxLength={1000}
            showCount
          />
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
        <Form.Item label="Estimated price" name="estimatedPrice">
          <Input placeholder="e.g. 120 HKD" />
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
        <Form.Item label="Notice" name="notice">
          <Input.TextArea
            rows={2}
            placeholder="Optional notice (stands out from remarks)"
            maxLength={1000}
            showCount
          />
        </Form.Item>
        <Form.Item label="Remarks" name="remarks">
          <Input.TextArea
            rows={2}
            placeholder="Optional remarks"
            maxLength={1000}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export function ItemsManager({ items, locations }: ItemsManagerProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ItemRecord | null>(null);
  const [subItemsItem, setSubItemsItem] = useState<ItemRecord | null>(null);
  const brandOptions = uniqueBrands(items);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(item: ItemRecord) {
    setEditing(item);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditing(null);
  }

  function onSubmit(values: ItemFormValues) {
    startTransition(async () => {
      const payload = {
        name: values.name,
        brand: values.brand ?? "",
        desc: values.desc,
        quantity: values.quantity,
        unit: values.unit,
        estimatedPrice: values.estimatedPrice,
        purchaseDate: values.purchaseDate ?? "",
        notice: values.notice ?? "",
        remarks: values.remarks,
        locationId: values.locationId ?? null,
      };

      const result = editing
        ? await updateItem({ id: editing.id, ...payload })
        : await createItem(payload);

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
      const result = await deleteItem(id);
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      router.refresh();
    });
  }

  function downloadTemplate() {
    const csv = buildItemCsvTemplate();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "items-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function onImportCsv(file: File) {
    startTransition(async () => {
      try {
        const text = await file.text();
        const result = await importItemsFromCsv(text);
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
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Items</h1>
        <Space wrap>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add item
          </Button>
        </Space>
      </div>

      <Table<ItemRecord>
        rowKey="id"
        dataSource={items}
        loading={pending}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1320 }}
        columns={[
          {
            title: "Name",
            dataIndex: "name",
            fixed: "left",
            width: 180,
            render: (value: string, record) => (
              <Space size={6} wrap>
                {record.notice.trim() ? (
                  <Tooltip title={record.notice}>
                    <WarningOutlined
                      style={{ color: "#faad14" }}
                      aria-label="Has notice"
                    />
                  </Tooltip>
                ) : null}
                <Link href={`/items/${record.id}`}>{value}</Link>
                {record.onSale ? (
                  <Tooltip
                    title={
                      record.salePrice?.trim()
                        ? `Sale price: ${record.salePrice}`
                        : "Posted for sale"
                    }
                  >
                    <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                      On sale
                    </Tag>
                  </Tooltip>
                ) : null}
              </Space>
            ),
          },
          {
            title: "Brand",
            dataIndex: "brand",
            width: 120,
            ellipsis: true,
            render: (value: string) =>
              value ? value : <span style={{ opacity: 0.45 }}>-</span>,
          },
          {
            title: "Location",
            dataIndex: "locationName",
            width: 140,
            render: (value: string | null) => value || "—",
          },
          {
            title: "Desc",
            dataIndex: "desc",
            ellipsis: true,
            width: 180,
          },
          {
            title: "Quantity",
            dataIndex: "quantity",
            width: 100,
          },
          {
            title: "Unit",
            dataIndex: "unit",
            width: 80,
          },
          {
            title: "Est. price",
            dataIndex: "estimatedPrice",
            width: 120,
            ellipsis: true,
          },
          {
            title: "Purchase date",
            dataIndex: "purchaseDate",
            width: 130,
            render: (value: string) =>
              value ? value : <span style={{ opacity: 0.45 }}>-</span>,
          },
          {
            title: "Remarks",
            dataIndex: "remarks",
            ellipsis: true,
            width: 180,
          },
          {
            title: "Actions",
            key: "actions",
            width: 148,
            fixed: "right",
            render: (_, record) => (
              <Space size={0}>
                <Link href={`/items/${record.id}`}>
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    aria-label="View item"
                  />
                </Link>
                <Button
                  type="link"
                  icon={<UnorderedListOutlined />}
                  onClick={() => setSubItemsItem(record)}
                  aria-label="Manage sub-items"
                />
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => openEdit(record)}
                  aria-label="Edit item"
                />
                <Popconfirm
                  title="Delete this item?"
                  okText="Delete"
                  cancelText="Cancel"
                  onConfirm={() => onDelete(record.id)}
                >
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    aria-label="Delete item"
                  />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        locale={{ emptyText: "No items yet. Add your first item." }}
      />

      <ItemFormModal
        open={open}
        editing={editing}
        pending={pending}
        locations={locations}
        brandOptions={brandOptions}
        onCancel={closeModal}
        onSubmit={onSubmit}
      />

      <SubItemsModal
        open={Boolean(subItemsItem)}
        itemId={subItemsItem?.id ?? null}
        itemName={subItemsItem?.name ?? ""}
        onClose={() => setSubItemsItem(null)}
      />
    </>
  );
}
