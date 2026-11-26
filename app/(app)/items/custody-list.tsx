"use client";

import {
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Dropdown,
  Pagination,
  Popconfirm,
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
import { workingConditionLabel } from "@/lib/item-disposition";
import {
  ItemDisposeModal,
  type ItemDisposeFormValues,
} from "./item-dispose-modal";

export type CustodyMode = "lost" | "lent";

type CustodyListProps = {
  mode: CustodyMode;
  items: ItemRecord[];
};

const copy: Record<
  CustodyMode,
  { title: string; empty: string; tagColor: string; tagLabel: string }
> = {
  lost: {
    title: "Lost",
    empty: "No lost items yet.",
    tagColor: "volcano",
    tagLabel: "Lost",
  },
  lent: {
    title: "Lent out",
    empty: "No lent items yet.",
    tagColor: "geekblue",
    tagLabel: "Lent out",
  },
};

export function CustodyList({ mode, items }: CustodyListProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [pending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [disposeOpen, setDisposeOpen] = useState(false);
  const [disposing, setDisposing] = useState<ItemRecord | null>(null);

  const labels = copy[mode];
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);

  const cardStyle = {
    background: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: 8,
    color: "var(--foreground)",
  } as const;

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
        lentTo: values.lentTo ?? "",
        dueDate: values.dueDate ?? "",
        custodyNotes: values.custodyNotes ?? "",
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

  function clearStatus(record: ItemRecord) {
    startTransition(async () => {
      const result = await setItemDisposition({
        itemId: record.id,
        workingCondition: record.workingCondition,
        disposalStatus: "",
        disposalMethod: "",
        soldPrice: "",
        lentTo: "",
        dueDate: "",
        custodyNotes: "",
      });
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success("Status cleared.");
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

  function statusTags(record: ItemRecord) {
    const condition = workingConditionLabel(record.workingCondition);
    return (
      <Space size={4} wrap>
        <Tag color={labels.tagColor}>{labels.tagLabel}</Tag>
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
              { key: "edit-status", label: "Edit status" },
              { key: "clear-status", label: "Clear status" },
            ],
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();
              if (key === "edit-status") openDispose(record);
              if (key === "clear-status") clearStatus(record);
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

  const columns =
    mode === "lent"
      ? [
          {
            title: "Name",
            dataIndex: "name" as const,
            ellipsis: true,
            render: (value: string, record: ItemRecord) => (
              <Space size={6} wrap>
                <Link href={`/items/${record.id}`}>{value}</Link>
                {statusTags(record)}
              </Space>
            ),
          },
          {
            title: "Lent to",
            dataIndex: "lentTo" as const,
            width: 140,
            render: (value: string) =>
              value ? value : <span style={{ opacity: 0.45 }}>—</span>,
          },
          {
            title: "Due back",
            dataIndex: "dueDate" as const,
            width: 120,
            render: (value: string) =>
              value ? value : <span style={{ opacity: 0.45 }}>—</span>,
          },
          {
            title: "Notes",
            dataIndex: "custodyNotes" as const,
            ellipsis: true,
            render: (value: string) =>
              value ? value : <span style={{ opacity: 0.45 }}>—</span>,
          },
          {
            title: "Location",
            dataIndex: "locationName" as const,
            width: 140,
            render: (value: string | null) => value || "—",
          },
          {
            title: "Actions",
            key: "actions",
            width: 120,
            render: (_: unknown, record: ItemRecord) => renderActions(record),
          },
        ]
      : [
          {
            title: "Name",
            dataIndex: "name" as const,
            ellipsis: true,
            render: (value: string, record: ItemRecord) => (
              <Space size={6} wrap>
                <Link href={`/items/${record.id}`}>{value}</Link>
                {statusTags(record)}
              </Space>
            ),
          },
          {
            title: "Notes",
            dataIndex: "custodyNotes" as const,
            ellipsis: true,
            render: (value: string) =>
              value ? value : <span style={{ opacity: 0.45 }}>—</span>,
          },
          {
            title: "Location",
            dataIndex: "locationName" as const,
            width: 140,
            render: (value: string | null) => value || "—",
          },
          {
            title: "Actions",
            key: "actions",
            width: 120,
            render: (_: unknown, record: ItemRecord) => renderActions(record),
          },
        ];

  return (
    <>
      <PageCardless />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
              alignItems: "baseline",
              gap: 10,
              marginBottom: 16,
              minWidth: 0,
            }}
          >
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
              {labels.title}
            </h1>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>
              {items.length} total
            </span>
          </div>

          {isMobile ? (
            items.length === 0 ? (
              <MobileEmpty>{labels.empty}</MobileEmpty>
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
                          {mode === "lent" && record.lentTo ? (
                            <span>Lent to {record.lentTo}</span>
                          ) : null}
                          {mode === "lent" && record.dueDate ? (
                            <span>Due {record.dueDate}</span>
                          ) : null}
                          {record.custodyNotes ? (
                            <span>{record.custodyNotes}</span>
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
                    total={items.length}
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
                dataSource={items}
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
                scroll={{ x: mode === "lent" ? 860 : 640 }}
                locale={{ emptyText: labels.empty }}
                columns={columns}
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
