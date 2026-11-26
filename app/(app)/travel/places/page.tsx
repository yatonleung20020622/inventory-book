import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
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
      fallback={<PageSkeleton label="Loading travel places" variant="list" />}
    >
      <PlacesContent />
    </Suspense>
  );
}
