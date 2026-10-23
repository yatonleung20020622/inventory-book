import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { CategoryTag } from "@/components/category-tag";
import { MajorColorSwatch } from "@/components/major-color-swatch";
import { PageLoading } from "@/components/page-loading";
import { listItemRelations } from "@/lib/actions/item-relations";
import { getItem, listItems } from "@/lib/actions/items";
import { ItemRelations } from "./item-relations";

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

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString();
}

async function ItemDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, relations, allItems] = await Promise.all([
    getItem(id),
    listItemRelations(id),
    listItems(),
  ]);
  if (!item) {
    notFound();
  }

  const itemOptions = allItems
    .filter((entry) => entry.id !== item.id)
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      brand: entry.brand,
    }));

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
            width: "100%",
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(250, 173, 20, 0.12)",
            border: "1px solid rgba(250, 173, 20, 0.55)",
            color: "var(--foreground)",
            boxSizing: "border-box",
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

      <div className="item-detail-layout">
        <div
          style={{
            width: "100%",
            minWidth: 0,
            boxSizing: "border-box",
            padding: "8px 16px",
            borderRadius: 8,
            background: "var(--card-bg)",
            border: "1px solid var(--border-color)",
          }}
        >
          <DetailRow label="Name" value={item.name} />
          <DetailRow label="Brand" value={item.brand || <EmptyValue />} />
          <DetailRow
            label="Major color"
            value={<MajorColorSwatch value={item.majorColor} size={20} />}
          />
          <DetailRow
            label="Location"
            value={item.locationName || <EmptyValue />}
          />
          <DetailRow
            label="Categories"
            value={
              item.categories.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {item.categories.map((category) => (
                    <CategoryTag
                      key={category.id}
                      name={category.name}
                      color={category.color}
                    />
                  ))}
                </div>
              ) : (
                <EmptyValue />
              )
            }
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

        <ItemRelations
          itemId={item.id}
          itemName={item.name}
          relations={relations}
          itemOptions={itemOptions}
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
