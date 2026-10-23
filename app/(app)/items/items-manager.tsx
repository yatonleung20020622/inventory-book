"use client";

import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Divider,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Upload,
} from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CategoryTag } from "@/components/category-tag";
import { MajorColorSwatch } from "@/components/major-color-swatch";
import { PageCardless } from "@/components/page-above-card";
import { TableFrame } from "@/components/table-frame";
import {
  createItem,
  deleteItem,
  exportItemsCsv,
  importItemsFromCsv,
  previewItemCsvUpdates,
  updateItem,
  type ItemCsvUpdatePreview,
  type ItemRecord,
} from "@/lib/actions/items";
import { buildItemCsvTemplate } from "@/lib/csv/items-csv";
import { isFreeSalePrice } from "@/lib/sale-price";
import { ItemCsvUpdateModal } from "./item-csv-update-modal";
import {
  ItemFormModal,
  type ItemFormCategoryOption,
  type ItemFormLocationOption,
  type ItemFormValues,
} from "./item-form-modal";

type LocationOption = ItemFormLocationOption;
type CategoryOption = ItemFormCategoryOption;

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

const NO_LOCATION = "__none__";

type BoxFilter = "box" | "not_box";

type ItemFilters = {
  search: string;
  locationId: string | null;
  categoryId: string | null;
  brand: string | null;
  box: BoxFilter | null;
};

const emptyFilters: ItemFilters = {
  search: "",
  locationId: null,
  categoryId: null,
  brand: null,
  box: null,
};

function filterItems(items: ItemRecord[], filters: ItemFilters): ItemRecord[] {
  const query = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    if (query) {
      const haystack =
        `${item.name} ${item.brand} ${item.desc} ${item.boxPurpose}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }

    if (filters.locationId === NO_LOCATION) {
      if (item.locationId !== null) {
        return false;
      }
    } else if (filters.locationId && item.locationId !== filters.locationId) {
      return false;
    }

    if (
      filters.categoryId &&
      !item.categories.some((category) => category.id === filters.categoryId)
    ) {
      return false;
    }

    if (filters.brand && item.brand.trim() !== filters.brand) {
      return false;
    }

    if (filters.box === "box" && !item.isBox) {
      return false;
    }
    if (filters.box === "not_box" && item.isBox) {
      return false;
    }

    return true;
  });
}

function filtersActive(filters: ItemFilters) {
  return (
    filters.search.trim() !== "" ||
    filters.locationId !== null ||
    filters.categoryId !== null ||
    filters.brand !== null ||
    filters.box !== null
  );
}

type ItemsManagerProps = {
  items: ItemRecord[];
  locations: LocationOption[];
  categories: CategoryOption[];
};

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
  const [page, setPage] = useState(1);
  const [draftFilters, setDraftFilters] = useState<ItemFilters>(emptyFilters);
  const [filters, setFilters] = useState<ItemFilters>(emptyFilters);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updatePreview, setUpdatePreview] = useState<{
    updates: ItemCsvUpdatePreview[];
    unchangedCount: number;
    errors: string[];
  }>({ updates: [], unchangedCount: 0, errors: [] });
  const brandOptions = uniqueBrands(items);
  const filteredItems = filterItems(items, filters);
  const hasActiveFilters = filtersActive(filters);

  function patchDraft(patch: Partial<ItemFilters>) {
    setDraftFilters((current) => ({ ...current, ...patch }));
  }

  function applyFilters() {
    setFilters(draftFilters);
    setPage(1);
  }

  function resetFilters() {
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
    setPage(1);
  }

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
        estimatedPrice: values.estimatedPrice ?? "",
        actualPrice: values.actualPrice ?? "",
        isBox: Boolean(values.isBox),
        boxPurpose: values.boxPurpose ?? "",
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

  function onExportCsv() {
    startTransition(async () => {
      const result = await exportItemsCsv();
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "items-export.csv";
      anchor.click();
      URL.revokeObjectURL(url);
      message.success("CSV exported.");
    });
  }

  function onUpdatesFromCsv(file: File) {
    startTransition(async () => {
      try {
        const text = await file.text();
        const result = await previewItemCsvUpdates(text);
        if (!result.ok) {
          message.error(result.message);
          if (result.errors?.length) {
            message.warning(result.errors.slice(0, 5).join(" "));
          }
          return;
        }
        setUpdatePreview({
          updates: result.updates ?? [],
          unchangedCount: result.unchangedCount ?? 0,
          errors: result.errors ?? [],
        });
        setUpdateModalOpen(true);
        if ((result.updates?.length ?? 0) === 0) {
          message.info(result.message);
        }
      } catch {
        message.error("Failed to read CSV file.");
      }
    });
    return false;
  }

  const filterFieldStyle = {
    flex: "1 1 200px",
    minWidth: 180,
    maxWidth: 280,
    marginBottom: 16,
  } as const;

  const cardStyle = {
    background: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: 8,
    color: "var(--foreground)",
  } as const;

  return (
    <>
      <PageCardless />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ ...cardStyle, padding: "20px 24px 4px" }}>
          <Form
            layout="horizontal"
            onFinish={applyFilters}
            requiredMark={false}
            labelAlign="right"
            labelCol={{ flex: "0 0 auto" }}
            colon
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0 24px",
                alignItems: "flex-start",
              }}
            >
              <Form.Item label="Search" style={filterFieldStyle}>
                <Input
                  allowClear
                  placeholder="please enter"
                  value={draftFilters.search}
                  onChange={(event) =>
                    patchDraft({ search: event.target.value })
                  }
                />
              </Form.Item>
              <Form.Item label="Location" style={filterFieldStyle}>
                <Select
                  allowClear
                  placeholder="please select"
                  value={draftFilters.locationId ?? undefined}
                  onChange={(value) =>
                    patchDraft({ locationId: value ?? null })
                  }
                  options={[
                    { value: NO_LOCATION, label: "No location" },
                    ...locations.map((location) => ({
                      value: location.id,
                      label: location.isExpired
                        ? `${location.name} (expired)`
                        : location.name,
                    })),
                  ]}
                />
              </Form.Item>
              <Form.Item label="Category" style={filterFieldStyle}>
                <Select
                  allowClear
                  placeholder="please select"
                  value={draftFilters.categoryId ?? undefined}
                  onChange={(value) =>
                    patchDraft({ categoryId: value ?? null })
                  }
                  options={categories.map((category) => ({
                    value: category.id,
                    label: category.name,
                  }))}
                />
              </Form.Item>
              <Form.Item label="Brand" style={filterFieldStyle}>
                <Select
                  allowClear
                  showSearch
                  placeholder="please select"
                  value={draftFilters.brand ?? undefined}
                  onChange={(value) => patchDraft({ brand: value ?? null })}
                  optionFilterProp="label"
                  options={brandOptions.map((brand) => ({
                    value: brand,
                    label: brand,
                  }))}
                />
              </Form.Item>
              <Form.Item label="Box" style={filterFieldStyle}>
                <Select
                  allowClear
                  placeholder="please select"
                  value={draftFilters.box ?? undefined}
                  onChange={(value) =>
                    patchDraft({ box: (value as BoxFilter | null) ?? null })
                  }
                  options={[
                    { value: "box", label: "Is a box" },
                    { value: "not_box", label: "Not a box" },
                  ]}
                />
              </Form.Item>
              <div
                style={{
                  flex: "1 1 auto",
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  marginBottom: 16,
                  minWidth: 180,
                }}
              >
                <Space wrap>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SearchOutlined />}
                  >
                    Search
                  </Button>
                  <Button htmlType="button" onClick={resetFilters}>
                    Reset
                  </Button>
                </Space>
              </div>
            </div>
          </Form>
        </div>

        <div style={{ ...cardStyle, padding: 24, minWidth: 0 }}>
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
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Items</h1>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-end",
                gap: 12,
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    letterSpacing: 0.02,
                    paddingInline: 2,
                  }}
                >
                  Add via CSV
                </span>
                <Space size={8} wrap>
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
              </div>

              <Divider
                orientation="vertical"
                style={{ height: 36, margin: "0 2px 2px", alignSelf: "flex-end" }}
              />

              <div style={{ display: "grid", gap: 4 }}>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    letterSpacing: 0.02,
                    paddingInline: 2,
                  }}
                >
                  Edit via CSV
                </span>
                <Space size={8} wrap>
                  <Button
                    icon={<DownloadOutlined />}
                    loading={pending}
                    onClick={onExportCsv}
                  >
                    Export CSV
                  </Button>
                  <Upload
                    accept=".csv,text/csv"
                    showUploadList={false}
                    beforeUpload={onUpdatesFromCsv}
                  >
                    <Button icon={<UploadOutlined />} loading={pending}>
                      Updates from CSV
                    </Button>
                  </Upload>
                </Space>
              </div>

              <Divider
                orientation="vertical"
                style={{ height: 36, margin: "0 2px 2px", alignSelf: "flex-end" }}
              />

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreate}
                style={{ alignSelf: "flex-end" }}
              >
                Add item
              </Button>
            </div>
          </div>

          <TableFrame>
          <Table<ItemRecord>
            rowKey="id"
            dataSource={filteredItems}
            loading={pending}
            pagination={{
              simple: true,
              current: page,
              pageSize,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              onChange: (nextPage) => setPage(nextPage),
              onShowSizeChange: (_nextPage, size) => {
                setPageSize(size);
                setPage(1);
              },
            }}
            scroll={{ x: 1480 }}
            columns={[
          {
            title: "Name",
            dataIndex: "name",
            fixed: "left",
            width: 240,
            render: (value: string, record) => (
              <Space size={6} wrap>
                {record.notice.trim() ? (
                  <span
                    title={record.notice}
                    style={{ display: "inline-flex", cursor: "help" }}
                  >
                    <WarningOutlined
                      style={{ color: "#faad14" }}
                      aria-label="Has notice"
                    />
                  </span>
                ) : null}
                <Link href={`/items/${record.id}`}>{value}</Link>
                {record.isBox ? (
                  <span title="This item is a box" style={{ display: "inline-flex" }}>
                    <Tag color="purple" style={{ marginInlineEnd: 0 }}>
                      {record.boxPurpose.trim() || "Box"}
                    </Tag>
                  </span>
                ) : null}
                {record.onSale ? (
                  <span
                    title={
                      isFreeSalePrice(record.salePrice)
                        ? "Sale price: Free"
                        : record.salePrice?.trim()
                          ? `Sale price: ${record.salePrice}`
                          : "Posted for sale"
                    }
                    style={{ display: "inline-flex" }}
                  >
                    <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                      On sale
                    </Tag>
                  </span>
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
                    <CategoryTag
                      key={category.id}
                      name={category.name}
                      color={category.color}
                    />
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
            title: "Actual price",
            dataIndex: "actualPrice",
            width: 120,
            ellipsis: true,
            render: (value: string) =>
              value ? value : <span style={{ opacity: 0.45 }}>-</span>,
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
            locale={{
              emptyText: hasActiveFilters
                ? "No items match these filters."
                : "No items yet. Add your first item.",
            }}
          />
          </TableFrame>
        </div>
      </div>

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

      <ItemCsvUpdateModal
        open={updateModalOpen}
        updates={updatePreview.updates}
        unchangedCount={updatePreview.unchangedCount}
        errors={updatePreview.errors}
        onClose={() => setUpdateModalOpen(false)}
        onApplied={() => router.refresh()}
      />
    </>
  );
}
