import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { PageLoading } from "@/components/page-loading";
import { getSaleListing } from "@/lib/actions/sales";
import { formatSalePriceDisplay } from "@/lib/sale-price";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div
      className="detail-row"
      style={{
        padding: "12px 0",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      <div style={{ color: "var(--muted)", fontSize: 13 }}>{label}</div>
      <div style={{ wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

function EmptyValue() {
  return <span style={{ opacity: 0.45 }}>-</span>;
}

function formatCondition(value: string) {
  if (value === "new") return "New";
  if (value === "like-new") return "Like new";
  if (value === "used") return "Used";
  return "";
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString();
}

async function SaleListingDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getSaleListing(id);
  if (!listing) {
    notFound();
  }

  const condition = formatCondition(listing.condition);
  const price = formatSalePriceDisplay(listing.salePrice);

  return (
    <>
      <AppBreadcrumb
        outsideCard
        items={[
          { title: "Selling now", href: "/sales" },
          { title: listing.name },
        ]}
      />

      <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 24, fontWeight: 600 }}>
        {listing.name}
      </h1>
      <p style={{ color: "var(--muted)", marginTop: 0, marginBottom: 24 }}>
        Sale listing details
      </p>

      {listing.notice.trim() ? (
        <div
          role="alert"
          style={{
            maxWidth: 720,
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(250, 173, 20, 0.12)",
            border: "1px solid rgba(250, 173, 20, 0.55)",
            color: "var(--foreground)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#d48806",
              marginBottom: 4,
              letterSpacing: 0.02,
            }}
          >
            Notice
          </div>
          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {listing.notice}
          </div>
        </div>
      ) : null}

      <div
        style={{
          maxWidth: 720,
          width: "100%",
          boxSizing: "border-box",
          padding: "8px 16px",
          borderRadius: 8,
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
        }}
      >
        <DetailRow label="Name" value={listing.name} />
        <DetailRow label="Brand" value={listing.brand || <EmptyValue />} />
        <DetailRow
          label="Quantity"
          value={`${listing.quantity} ${listing.unit}`}
        />
        <DetailRow
          label="Sale price"
          value={price || <EmptyValue />}
        />
        <DetailRow
          label="Condition"
          value={condition || <EmptyValue />}
        />
        <DetailRow
          label="Type"
          value={listing.isVirtual ? "Virtual" : "Physical"}
        />
        <DetailRow
          label="Purchase date"
          value={listing.purchaseDate || <EmptyValue />}
        />
        <DetailRow
          label="Description"
          value={
            listing.desc ? (
              <span style={{ whiteSpace: "pre-wrap" }}>{listing.desc}</span>
            ) : (
              <EmptyValue />
            )
          }
        />
        <DetailRow
          label="Note"
          value={
            listing.note ? (
              <span style={{ whiteSpace: "pre-wrap" }}>{listing.note}</span>
            ) : (
              <EmptyValue />
            )
          }
        />
        <DetailRow label="Seller" value={listing.sellerUsername} />
        <DetailRow
          label="Seller phone"
          value={listing.sellerPhone || <EmptyValue />}
        />
        <DetailRow
          label="Posted"
          value={formatDateTime(listing.createdAt)}
        />
        <DetailRow
          label="Updated"
          value={formatDateTime(listing.updatedAt)}
        />
      </div>
    </>
  );
}

export default function SaleListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={<PageLoading label="Loading listing" variant="block" />}
    >
      <SaleListingDetails params={params} />
    </Suspense>
  );
}
