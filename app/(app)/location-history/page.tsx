import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { listItemLocationChanges } from "@/lib/actions/item-location-changes";
import { LocationHistoryTable } from "./location-history-table";

async function LocationHistoryContent() {
  const changes = await listItemLocationChanges();
  return <LocationHistoryTable changes={changes} />;
}

export default function LocationHistoryPage() {
  return (
    <Suspense
      fallback={
        <PageLoading label="Loading location history" variant="block" />
      }
    >
      <LocationHistoryContent />
    </Suspense>
  );
}
