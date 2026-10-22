import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { listLocations } from "@/lib/actions/locations";
import { LocationsManager } from "./locations-manager";

async function LocationsContent() {
  const locations = await listLocations();
  return <LocationsManager locations={locations} />;
}

export default function LocationsPage() {
  return (
    <Suspense
      fallback={<PageLoading label="Loading locations" variant="block" />}
    >
      <LocationsContent />
    </Suspense>
  );
}
