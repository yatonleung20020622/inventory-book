import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
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
      fallback={<PageLoading label="Loading travel map" variant="block" />}
    >
      <TravelContent />
    </Suspense>
  );
}
