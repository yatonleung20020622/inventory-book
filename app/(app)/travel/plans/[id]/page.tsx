import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { getTravelPlan } from "@/lib/actions/travel-plans";
import { TravelPlanDetail } from "./plan-detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function PlanContent({ id }: { id: string }) {
  await connection();
  const plan = await getTravelPlan(id);
  if (!plan) {
    notFound();
  }
  return <TravelPlanDetail plan={plan} />;
}

export default async function TravelPlanDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<PageSkeleton label="Loading plan" variant="detail" />}>
      <PlanContent id={id} />
    </Suspense>
  );
}
