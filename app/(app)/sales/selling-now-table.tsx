"use client";

import { Grid, Table } from "antd";
import Link from "next/link";
import { TableFrame } from "@/components/table-frame";
import type { SaleListingRecord } from "@/lib/actions/sales";
import { formatSalePriceDisplay } from "@/lib/sale-price";

const { useBreakpoint } = Grid;

function formatDate(iso: string) {
  // Stable SSR/client format (avoid toLocaleDateString hydration mismatch).
  return iso.slice(0, 10);
}

function EmptyListings() {
  return (
    <div
      style={{
        padding: "28px 12px",
        textAlign: "center",
        color: "var(--muted)",
        fontSize: 14,
      }}
    >
      No items for sale yet.
    </div>
  );
}

function SellingNowCards({ listings }: { listings: SaleListingRecord[] }) {
  if (listings.length === 0) {
    return <EmptyListings />;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {listings.map((listing) => {
        const price = formatSalePriceDisplay(listing.salePrice);
        return (
          <Link
            key={listing.id}
            href={`/sales/${listing.id}`}
            style={{
              display: "block",
              textDecoration: "none",
              color: "inherit",
              padding: "14px 14px",
              borderRadius: 10,
              border: "1px solid var(--border-color)",
              background: "var(--page-bg)",
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 8,
                wordBreak: "break-word",
              }}
            >
              {listing.name}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px 12px",
                fontSize: 13,
                color: "var(--muted)",
              }}
            >
              <span style={{ color: "#1677ff", fontWeight: 600 }}>
                {price || "Price on request"}
              </span>
              <span>{listing.sellerUsername}</span>
              <span>{formatDate(listing.createdAt)}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function SellingNowTable({
  listings,
}: {
  listings: SaleListingRecord[];
}) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  if (isMobile) {
    return <SellingNowCards listings={listings} />;
  }

  return (
    <TableFrame>
      <Table<SaleListingRecord>
        rowKey="id"
        dataSource={listings}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 560 }}
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
            width: 120,
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
            width: 140,
            ellipsis: true,
          },
          {
            title: "Posted at",
            dataIndex: "createdAt",
            width: 110,
            render: (value: string) => formatDate(value),
          },
        ]}
        locale={{ emptyText: "No items for sale yet." }}
      />
    </TableFrame>
  );
}
