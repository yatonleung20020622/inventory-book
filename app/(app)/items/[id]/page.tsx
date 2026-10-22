import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { PageLoading } from "@/components/page-loading";
import { getItem } from "@/lib/actions/items";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        gap: 16,
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

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString();
}

async function ItemDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) {
    notFound();
  }

  return (
    <>
      <AppBreadcrumb
        outsideCard
        items={[
          { title: "Items", href: "/items" },
          { title: item.name },
        ]}
      />

      <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 24, fontWeight: 600 }}>
        {item.name}
      </h1>
      <p style={{ color: "var(--muted)", marginTop: 0, marginBottom: 24 }}>
        Item details
      </p>

      {item.notice.trim() ? (
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
            {item.notice}
          </div>
        </div>
      ) : null}

      <div
        style={{
          maxWidth: 720,
          padding: "8px 20px",
          borderRadius: 8,
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
        }}
      >
        <DetailRow label="Name" value={item.name} />
        <DetailRow label="Brand" value={item.brand || <EmptyValue />} />
        <DetailRow
          label="Location"
          value={item.locationName || <EmptyValue />}
        />
        <DetailRow label="Desc" value={item.desc || <EmptyValue />} />
        <DetailRow label="Quantity" value={item.quantity} />
        <DetailRow label="Unit" value={item.unit} />
        <DetailRow
          label="Estimated price"
          value={item.estimatedPrice || <EmptyValue />}
        />
        <DetailRow
          label="Purchase date"
          value={item.purchaseDate || <EmptyValue />}
        />
        <DetailRow
          label="Notice"
          value={item.notice || <EmptyValue />}
        />
        <DetailRow label="Remarks" value={item.remarks || <EmptyValue />} />
        <DetailRow
          label="Created"
          value={formatDateTime(item.createdAt)}
        />
        <DetailRow
          label="Updated"
          value={formatDateTime(item.updatedAt)}
        />
      </div>
    </>
  );
}

export default function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<PageLoading label="Loading item" variant="block" />}>
      <ItemDetails params={params} />
    </Suspense>
  );
}
