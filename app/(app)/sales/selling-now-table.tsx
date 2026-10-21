"use client";

import { Table } from "antd";
import type { SaleListingRecord } from "@/lib/actions/sales";

function formatDate(iso: string) {
  // Stable SSR/client format (avoid toLocaleDateString hydration mismatch).
  return iso.slice(0, 10);
}

export function SellingNowTable({
  listings,
}: {
  listings: SaleListingRecord[];
}) {
  return (
    <Table<SaleListingRecord>
      rowKey="id"
      dataSource={listings}
      pagination={{ pageSize: 10 }}
      scroll={{ x: 900 }}
      columns={[
        {
          title: "Item",
          dataIndex: "itemName",
          ellipsis: true,
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
          title: "Seller",
          dataIndex: "sellerUsername",
          width: 160,
        },
        {
          title: "Posted at",
          dataIndex: "createdAt",
          width: 120,
          render: (value: string) => formatDate(value),
        },
      ]}
      locale={{ emptyText: "No items for sale yet." }}
    />
  );
}
