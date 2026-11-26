import { connection } from "next/server";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { listTravelPlans } from "@/lib/actions/travel-plans";
import { TravelPlansManager } from "./plans-manager";

async function PlansContent() {
  await connection();
  const plans = await listTravelPlans();
  return <TravelPlansManager plans={plans} />;
}

export default function TravelPlansPage() {
  return (
    <Suspense
      fallback={<PageSkeleton label="Loading travel plans" variant="list" />}
    >
      <PlansContent />
    </Suspense>
  );
}
