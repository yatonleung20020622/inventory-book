"use client";

import { Table } from "antd";
import Link from "next/link";
import { TableFrame } from "@/components/table-frame";
import type { ItemLocationChangeRecord } from "@/lib/actions/item-location-changes";

type LocationHistoryTableProps = {
  changes: ItemLocationChangeRecord[];
};

function locationLabel(name: string) {
  const trimmed = name.trim();
  return trimmed || "—";
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString();
}

export function LocationHistoryTable({ changes }: LocationHistoryTableProps) {
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
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
          Location history
        </h1>
      </div>

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
              render: (value: string) => formatWhen(value),
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
    </>
  );
}
