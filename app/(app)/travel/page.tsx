import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { listTravelGroups } from "@/lib/actions/travel-groups";
import { listTravelPlaces } from "@/lib/actions/travel";
import { TravelMapManager } from "./travel-map-manager";

async function TravelContent() {
  const [places, groups] = await Promise.all([
    listTravelPlaces(),
    listTravelGroups(),
  ]);
  return <TravelMapManager places={places} groups={groups} />;
}

export default function TravelPage() {
  return (
    <Suspense
      fallback={<PageSkeleton label="Loading travel map" variant="map" />}
    >
      <TravelContent />
    </Suspense>
  );
}
