"use client";

import { Table } from "antd";
import Link from "next/link";
import type { SaleListingRecord } from "@/lib/actions/sales";
import { formatSalePriceDisplay } from "@/lib/sale-price";

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
          title: "Sale price",
          dataIndex: "salePrice",
          width: 140,
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
