import { Suspense } from "react";
import { listSharedSaleListings } from "@/lib/actions/sales";
import { SellingNowTable } from "./selling-now-table";

async function SellingNowContent() {
  const listings = await listSharedSaleListings();
  return <SellingNowTable listings={listings} />;
}

export default function SellingNowPage() {
  return (
    <>
      <h1 style={{ marginTop: 0, fontSize: 24, fontWeight: 600 }}>
        Selling now
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        Items currently posted for sale by everyone.
      </p>
      <Suspense fallback={<div>Loading…</div>}>
        <SellingNowContent />
      </Suspense>
    </>
  );
}
