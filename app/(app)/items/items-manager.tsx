"use client";

import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  UploadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  App,
  AutoComplete,
  Button,
  ColorPicker,
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
import type { Color } from "antd/es/color-picker";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { MajorColorSwatch } from "@/components/major-color-swatch";
import { TableFrame } from "@/components/table-frame";
import {
  createItem,
  deleteItem,
  importItemsFromCsv,
  updateItem,
  type ItemRecord,
} from "@/lib/actions/items";
import { buildItemCsvTemplate } from "@/lib/csv/items-csv";
import { isFreeSalePrice } from "@/lib/sale-price";

type LocationOption = {
  id: string;
  name: string;
  isExpired: boolean;
  isDefault: boolean;
};

type CategoryOption = {
  id: string;
  name: string;
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
  majorColor: string;
  desc: string;
  quantity: number;
  unit: string;
  estimatedPrice: string;
  purchaseDate: string;
  notice: string;
  remarks: string;
  locationId: string | null;
  categoryIds: string[];
};

type ItemsManagerProps = {
  items: ItemRecord[];
  locations: LocationOption[];
  categories: CategoryOption[];
};

const emptyFormValues: ItemFormValues = {
  name: "",
  brand: "",
  majorColor: "",
  desc: "",
  quantity: 1,
  unit: "個",
  estimatedPrice: "",
  purchaseDate: "",
  notice: "",
  remarks: "",
  locationId: null,
  categoryIds: [],
};

function isHexColor(value: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

function MajorColorPicker({
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
        value={hasColor ? trimmed : undefined}
        onChange={handleChange}
        allowClear
        onClear={() => onChange?.("")}
        showText={false}
        size="large"
        aria-label="Pick major color"
      />
      <span style={{ color: "var(--muted)", fontSize: 13 }}>
        {hasColor ? "Tap swatch to change" : "No color"}
      </span>
    </div>
  );
}

function ItemFormModal({
  open,
  editing,
  pending,
  locations,
  categories,
  brandOptions,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  editing: ItemRecord | null;
  pending: boolean;
  locations: LocationOption[];
  categories: CategoryOption[];
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
        majorColor: editing.majorColor,
        desc: editing.desc,
        quantity: editing.quantity,
        unit: editing.unit,
        estimatedPrice: editing.estimatedPrice,
        purchaseDate: editing.purchaseDate,
        notice: editing.notice,
        remarks: editing.remarks,
        locationId: editing.locationId,
        categoryIds: editing.categories.map((category) => category.id),
      });
      setBrandSearch(editing.brand);
      return;
    }
    form.setFieldsValue({
      ...emptyFormValues,
      locationId: getDefaultLocationId(locations),
      categoryIds: [],
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
        <Form.Item label="Categories" name="categoryIds">
          <Select
            mode="multiple"
            allowClear
            placeholder="Select categories"
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            optionFilterProp="label"
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
        <Form.Item label="Major color" name="majorColor">
          <MajorColorPicker />
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

export function ItemsManager({
  items,
  locations,
  categories,
}: ItemsManagerProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ItemRecord | null>(null);
  const [pageSize, setPageSize] = useState(10);
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
        majorColor: values.majorColor ?? "",
        desc: values.desc,
        quantity: values.quantity,
        unit: values.unit,
        estimatedPrice: values.estimatedPrice,
        purchaseDate: values.purchaseDate ?? "",
        notice: values.notice ?? "",
        remarks: values.remarks,
        locationId: values.locationId ?? null,
        categoryIds: values.categoryIds ?? [],
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

      <TableFrame>
      <Table<ItemRecord>
        rowKey="id"
        dataSource={items}
        loading={pending}
        pagination={{
          simple: true,
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          onShowSizeChange: (_page, size) => setPageSize(size),
        }}
        scroll={{ x: 1360 }}
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
                      isFreeSalePrice(record.salePrice)
                        ? "Sale price: Free"
                        : record.salePrice?.trim()
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
            title: "Color",
            dataIndex: "majorColor",
            width: 72,
            align: "center",
            render: (value: string) => <MajorColorSwatch value={value} />,
          },
          {
            title: "Location",
            dataIndex: "locationName",
            width: 140,
            render: (value: string | null) => value || "—",
          },
          {
            title: "Categories",
            dataIndex: "categories",
            width: 180,
            render: (value: ItemRecord["categories"]) =>
              value.length > 0 ? (
                <Space size={[4, 4]} wrap>
                  {value.map((category) => (
                    <Tag key={category.id} style={{ marginInlineEnd: 0 }}>
                      {category.name}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <span style={{ opacity: 0.45 }}>-</span>
              ),
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
            width: 120,
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
      </TableFrame>

      <ItemFormModal
        open={open}
        editing={editing}
        pending={pending}
        locations={locations}
        categories={categories}
        brandOptions={brandOptions}
        onCancel={closeModal}
        onSubmit={onSubmit}
      />
    </>
  );
}
