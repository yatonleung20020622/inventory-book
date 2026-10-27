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
import { TableFrame } from "@/components/table-frame";
import {
  deleteItem,
  setItemDisposition,
  type ItemRecord,
} from "@/lib/actions/items";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import {
  disposalTagLabel,
  workingConditionLabel,
} from "@/lib/item-disposition";
import {
  ItemDisposeModal,
  type ItemDisposeFormValues,
} from "../items/item-dispose-modal";

type DisposalManagerProps = {
  items: ItemRecord[];
};

export function DisposalManager({ items }: DisposalManagerProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [pending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [disposeOpen, setDisposeOpen] = useState(false);
  const [disposing, setDisposing] = useState<ItemRecord | null>(null);
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);

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
          <Tag color={record.disposalStatus === "disposed" ? "default" : "orange"}>
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
        <div>
          <h1
            style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 600 }}
          >
            Disposal
          </h1>
          <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 13 }}>
            Items marked to dispose or already thrown away ({items.length}).
          </p>
        </div>
      </div>

      {isMobile ? (
        items.length === 0 ? (
          <MobileEmpty>No disposal items yet.</MobileEmpty>
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
                    <div style={{ marginBottom: 8 }}>{statusTags(record)}</div>
                    <div style={mobileRecordMetaStyle}>
                      <span>{record.locationName || "No location"}</span>
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
            pagination={{ pageSize: 10, simple: true }}
            scroll={{ x: 720 }}
            locale={{ emptyText: "No disposal items yet." }}
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
