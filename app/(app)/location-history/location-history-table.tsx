"use client";

import { Pagination, Table } from "antd";
import Link from "next/link";
import { useState } from "react";
import {
  MobileEmpty,
  MobileRecordList,
  mobileRecordCardStyle,
  mobileRecordMetaStyle,
} from "@/components/mobile-record-list";
import { TableFrame } from "@/components/table-frame";
import type { ItemLocationChangeRecord } from "@/lib/actions/item-location-changes";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";

type LocationHistoryTableProps = {
  changes: ItemLocationChangeRecord[];
};

function locationLabel(name: string) {
  const trimmed = name.trim();
  return trimmed || "—";
}

function formatWhen(iso: string, compact: boolean) {
  if (compact) {
    return iso.slice(0, 16).replace("T", " ");
  }
  return new Date(iso).toLocaleString();
}

export function LocationHistoryTable({ changes }: LocationHistoryTableProps) {
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const pageItems = changes.slice((page - 1) * pageSize, page * pageSize);

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
        <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 600 }}>
          Location history
        </h1>
      </div>

      {isMobile ? (
        changes.length === 0 ? (
          <MobileEmpty>No location changes yet.</MobileEmpty>
        ) : (
          <MobileRecordList>
            {pageItems.map((record) => (
              <div key={record.id} style={mobileRecordCardStyle}>
                <Link
                  href={`/items/${record.itemId}`}
                  style={{
                    display: "block",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "inherit",
                    marginBottom: 8,
                    wordBreak: "break-word",
                  }}
                >
                  {record.itemName}
                </Link>
                <div style={mobileRecordMetaStyle}>
                  <span>{formatWhen(record.createdAt, true)}</span>
                  <span>
                    {locationLabel(record.fromLocationName)} →{" "}
                    {locationLabel(record.toLocationName)}
                  </span>
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
                total={changes.length}
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
          <Table<ItemLocationChangeRecord>
            rowKey="id"
            dataSource={changes}
            pagination={{ pageSize: 20, simple: true }}
            scroll={{ x: 720 }}
            locale={{ emptyText: "No location changes yet." }}
            columns={[
              {
                title: "When",
                dataIndex: "createdAt",
                width: 180,
                render: (value: string) => formatWhen(value, false),
              },
              {
                title: "Item",
                dataIndex: "itemName",
                ellipsis: true,
                render: (value: string, record) => (
                  <Link href={`/items/${record.itemId}`}>{value}</Link>
                ),
              },
              {
                title: "From",
                dataIndex: "fromLocationName",
                width: 160,
                ellipsis: true,
                render: (value: string) => locationLabel(value),
              },
              {
                title: "To",
                dataIndex: "toLocationName",
                width: 160,
                ellipsis: true,
                render: (value: string) => locationLabel(value),
              },
            ]}
          />
        </TableFrame>
      )}
    </>
  );
}
