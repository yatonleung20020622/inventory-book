import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { listTravelGroups } from "@/lib/actions/travel-groups";
import { listTravelPlaces } from "@/lib/actions/travel";
import { PlacesManager } from "./places-manager";

async function PlacesContent() {
  const [places, groups] = await Promise.all([
    listTravelPlaces(),
    listTravelGroups(),
  ]);
  return <PlacesManager places={places} groups={groups} />;
}

export default function TravelPlacesPage() {
  return (
    <Suspense
      fallback={<PageLoading label="Loading travel places" variant="block" />}
    >
      <PlacesContent />
    </Suspense>
  );
}
