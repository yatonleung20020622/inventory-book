import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { listLocations } from "@/lib/actions/locations";
import { LocationsManager } from "./locations-manager";

async function LocationsContent() {
  const locations = await listLocations();
  return <LocationsManager locations={locations} />;
}

export default function LocationsPage() {
  return (
    <Suspense
      fallback={<PageSkeleton label="Loading locations" variant="list" />}
    >
      <LocationsContent />
    </Suspense>
  );
}
