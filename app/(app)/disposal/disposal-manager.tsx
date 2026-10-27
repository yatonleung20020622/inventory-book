"use client";

import {
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Dropdown,
  Form,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  MobileEmpty,
  MobileRecordList,
  mobileRecordCardStyle,
  mobileRecordMetaStyle,
} from "@/components/mobile-record-list";
import { PageCardless } from "@/components/page-above-card";
import { TableFrame } from "@/components/table-frame";
import {
  deleteItem,
  setItemDisposition,
  type ItemRecord,
} from "@/lib/actions/items";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import {
  disposalTagLabel,
  type DisposalMethod,
  type DisposalStatus,
  workingConditionLabel,
} from "@/lib/item-disposition";
import {
  ItemDisposeModal,
  type ItemDisposeFormValues,
} from "../items/item-dispose-modal";

type DisposalManagerProps = {
  items: ItemRecord[];
};

type StatusFilter = DisposalStatus | null;
type MethodFilter = DisposalMethod | null;

type DisposalFilters = {
  status: StatusFilter;
  method: MethodFilter;
};

const emptyFilters: DisposalFilters = {
  status: null,
  method: null,
};

function filtersActive(filters: DisposalFilters) {
  return filters.status !== null || filters.method !== null;
}

function filterItems(items: ItemRecord[], filters: DisposalFilters) {
  return items.filter((item) => {
    if (filters.status && item.disposalStatus !== filters.status) {
      return false;
    }
    if (filters.method && item.disposalMethod !== filters.method) {
      return false;
    }
    return true;
  });
}

export function DisposalManager({ items }: DisposalManagerProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [pending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [draftFilters, setDraftFilters] =
    useState<DisposalFilters>(emptyFilters);
  const [filters, setFilters] = useState<DisposalFilters>(emptyFilters);
  const [disposeOpen, setDisposeOpen] = useState(false);
  const [disposing, setDisposing] = useState<ItemRecord | null>(null);

  const filteredItems = filterItems(items, filters);
  const hasActiveFilters = filtersActive(filters);
  const pageItems = filteredItems.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const emptyText = hasActiveFilters
    ? "No disposal items match these filters."
    : "No disposal items yet.";

  const filterFieldStyle = {
    flex: isMobile ? "1 1 100%" : "1 1 200px",
    minWidth: isMobile ? 0 : 180,
    maxWidth: isMobile ? "100%" : 280,
    marginBottom: 16,
  } as const;

  const cardStyle = {
    background: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: 8,
    color: "var(--foreground)",
  } as const;

  function patchDraft(patch: Partial<DisposalFilters>) {
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

  function openDispose(item: ItemRecord) {
    setDisposing(item);
    setDisposeOpen(true);
  }

  function closeDispose() {
    setDisposeOpen(false);
    setDisposing(null);
  }

  function onDisposeSubmit(values: ItemDisposeFormValues) {
    if (!disposing) return;
    startTransition(async () => {
      const result = await setItemDisposition({
        itemId: disposing.id,
        workingCondition: values.workingCondition ?? "",
        disposalStatus: values.disposalStatus ?? "",
        disposalMethod: values.disposalMethod ?? "",
        soldPrice: values.soldPrice ?? "",
      });
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      closeDispose();
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

  function clearDisposal(record: ItemRecord) {
    startTransition(async () => {
      const result = await setItemDisposition({
        itemId: record.id,
        workingCondition: record.workingCondition,
        disposalStatus: "",
        disposalMethod: "",
        soldPrice: "",
      });
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success("Disposal cleared.");
      router.refresh();
    });
  }

  function statusTags(record: ItemRecord) {
    const disposal = disposalTagLabel(
      record.disposalStatus,
      record.disposalMethod,
    );
    const condition = workingConditionLabel(record.workingCondition);
    return (
      <Space size={4} wrap>
        {disposal ? (
          <Tag
            color={record.disposalStatus === "disposed" ? "default" : "orange"}
          >
            {disposal}
          </Tag>
        ) : null}
        {condition ? (
          <Tag
            color={
              record.workingCondition === "broken"
                ? "red"
                : record.workingCondition === "not_working"
                  ? "gold"
                  : "green"
            }
          >
            {condition}
          </Tag>
        ) : null}
      </Space>
    );
  }

  function renderActions(record: ItemRecord) {
    return (
      <Space size={0}>
        <Link href={`/items/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} aria-label="View item" />
        </Link>
        <Dropdown
          menu={{
            items: [
              { key: "edit-disposal", label: "Edit disposal" },
              { key: "clear-disposal", label: "Clear disposal" },
            ],
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();
              if (key === "edit-disposal") openDispose(record);
              if (key === "clear-disposal") clearDisposal(record);
            },
          }}
          trigger={["click"]}
        >
          <Button
            type="link"
            icon={<MoreOutlined />}
            aria-label="More actions"
          />
        </Dropdown>
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
    );
  }

  return (
    <>
      <PageCardless />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            ...cardStyle,
            padding: isMobile ? "16px 14px 4px" : "20px 24px 4px",
          }}
        >
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
              <Form.Item label="Status" style={filterFieldStyle}>
                <Select
                  allowClear
                  placeholder="please select"
                  value={draftFilters.status ?? undefined}
                  onChange={(value) =>
                    patchDraft({
                      status: (value as StatusFilter | undefined) ?? null,
                    })
                  }
                  options={[
                    { value: "to_dispose", label: "To dispose" },
                    { value: "disposed", label: "Disposed" },
                  ]}
                />
              </Form.Item>
              <Form.Item label="Method" style={filterFieldStyle}>
                <Select
                  allowClear
                  placeholder="please select"
                  value={draftFilters.method ?? undefined}
                  onChange={(value) =>
                    patchDraft({
                      method: (value as MethodFilter | undefined) ?? null,
                    })
                  }
                  options={[
                    { value: "recycle", label: "Recycle" },
                    { value: "rubbish", label: "Rubbish" },
                    { value: "sell", label: "2nd platform" },
                    { value: "gift", label: "Friends gift" },
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

        <div
          style={{
            ...cardStyle,
            padding: isMobile ? 14 : 24,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 16,
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                minWidth: 0,
              }}
            >
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
                Disposal
              </h1>
              <span style={{ color: "var(--muted)", fontSize: 14 }}>
                {hasActiveFilters
                  ? `${filteredItems.length} of ${items.length}`
                  : `${items.length} total`}
              </span>
            </div>
          </div>

          {isMobile ? (
            filteredItems.length === 0 ? (
              <MobileEmpty>{emptyText}</MobileEmpty>
            ) : (
              <MobileRecordList>
                {pageItems.map((record) => (
                  <div key={record.id} style={mobileRecordCardStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Link
                          href={`/items/${record.id}`}
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
                        <div style={{ marginBottom: 8 }}>
                          {statusTags(record)}
                        </div>
                        <div style={mobileRecordMetaStyle}>
                          <span>{record.locationName || "No location"}</span>
                          {record.soldPrice ? (
                            <span>Sold {record.soldPrice}</span>
                          ) : null}
                          {record.disposedAt ? (
                            <span>Disposed {record.disposedAt}</span>
                          ) : null}
                        </div>
                      </div>
                      {renderActions(record)}
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 4,
                  }}
                >
                  <Pagination
                    simple
                    current={page}
                    pageSize={pageSize}
                    total={filteredItems.length}
                    showSizeChanger
                    pageSizeOptions={[10, 20, 50, 100]}
                    onChange={(nextPage, nextSize) => {
                      if (nextSize && nextSize !== pageSize) {
                        setPageSize(nextSize);
                        setPage(1);
                        return;
                      }
                      setPage(nextPage);
                    }}
                  />
                </div>
              </MobileRecordList>
            )
          ) : (
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
                scroll={{ x: 720 }}
                locale={{ emptyText }}
                columns={[
                  {
                    title: "Name",
                    dataIndex: "name",
                    ellipsis: true,
                    render: (value: string, record) => (
                      <Space size={6} wrap>
                        <Link href={`/items/${record.id}`}>{value}</Link>
                        {statusTags(record)}
                      </Space>
                    ),
                  },
                  {
                    title: "Location",
                    dataIndex: "locationName",
                    width: 140,
                    render: (value: string | null) => value || "—",
                  },
                  {
                    title: "Sold price",
                    dataIndex: "soldPrice",
                    width: 110,
                    render: (value: string) =>
                      value ? value : <span style={{ opacity: 0.45 }}>—</span>,
                  },
                  {
                    title: "Disposed on",
                    dataIndex: "disposedAt",
                    width: 120,
                    render: (value: string) =>
                      value ? value : <span style={{ opacity: 0.45 }}>—</span>,
                  },
                  {
                    title: "Actions",
                    key: "actions",
                    width: 120,
                    render: (_, record) => renderActions(record),
                  },
                ]}
              />
            </TableFrame>
          )}
        </div>
      </div>

      <ItemDisposeModal
        open={disposeOpen}
        item={disposing}
        pending={pending}
        onCancel={closeDispose}
        onSubmit={onDisposeSubmit}
      />
    </>
  );
}
