import { Suspense } from "react";
import { listLocations } from "@/lib/actions/locations";
import { LocationsManager } from "./locations-manager";

async function LocationsContent() {
  const locations = await listLocations();
  return <LocationsManager locations={locations} />;
}

export default function LocationsPage() {
  return (
    <Suspense fallback={<div>Loading locations…</div>}>
      <LocationsContent />
    </Suspense>
  );
}
