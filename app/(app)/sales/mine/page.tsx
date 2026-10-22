import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { listItems } from "@/lib/actions/items";
import { listMySaleListings } from "@/lib/actions/sales";
import { MyListingsManager } from "./my-listings-manager";

async function MyListingsContent() {
  const [listings, items] = await Promise.all([
    listMySaleListings(),
    listItems(),
  ]);

  return <MyListingsManager listings={listings} items={items} />;
}

export default function MyListingsPage() {
  return (
    <>
      <h1 style={{ marginTop: 0, fontSize: 24, fontWeight: 600 }}>
        My posts
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        Choose items from your inventory to post for sale.
      </p>
      <Suspense fallback={<PageLoading label="Loading your posts" variant="block" />}>
        <MyListingsContent />
      </Suspense>
    </>
  );
}
