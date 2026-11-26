import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
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
        <PageSkeleton label="Loading location history" variant="list" />
      }
    >
      <LocationHistoryContent />
    </Suspense>
  );
}
