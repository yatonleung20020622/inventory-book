import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { listTravelPlaces } from "@/lib/actions/travel";
import { TravelMapManager } from "./travel-map-manager";

async function TravelContent() {
  const places = await listTravelPlaces();
  return <TravelMapManager places={places} />;
}

export default function TravelPage() {
  return (
    <Suspense
      fallback={<PageLoading label="Loading travel map" variant="block" />}
    >
      <TravelContent />
    </Suspense>
  );
}
