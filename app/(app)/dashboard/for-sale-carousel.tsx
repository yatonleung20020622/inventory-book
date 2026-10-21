"use client";

import { Carousel } from "antd";
import Link from "next/link";
import type { SaleListingRecord } from "@/lib/actions/sales";

export function ForSaleCarousel({
  listings,
}: {
  listings: SaleListingRecord[];
}) {
  if (listings.length === 0) {
    return (
      <div
        style={{
          padding: 20,
          borderRadius: 8,
          border: "1px solid var(--border-color)",
          background: "var(--page-bg)",
          color: "var(--muted)",
        }}
      >
        No items for sale yet.{" "}
        <Link href="/sales/mine">Post something from My posts</Link>.
      </div>
    );
  }

  return (
    <Carousel autoplay dots>
      {listings.map((listing) => (
        <div key={listing.id}>
          <Link
            href={listing.isOwn ? `/items/${listing.itemId}` : "/sales"}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                margin: "0 4px 24px",
                padding: 24,
                minHeight: 140,
                borderRadius: 8,
                border: "1px solid var(--border-color)",
                background: "var(--page-bg)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  marginBottom: 8,
                }}
              >
                {listing.sellerUsername}
                {listing.itemBrand ? ` · ${listing.itemBrand}` : ""}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                {listing.itemName}
              </div>
              <div style={{ fontSize: 16, color: "#1677ff" }}>
                {listing.salePrice.trim() || "Price on request"}
              </div>
              {listing.note.trim() ? (
                <div
                  style={{
                    marginTop: 8,
                    color: "var(--muted)",
                    fontSize: 13,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {listing.note}
                </div>
              ) : null}
            </div>
          </Link>
        </div>
      ))}
    </Carousel>
  );
}
