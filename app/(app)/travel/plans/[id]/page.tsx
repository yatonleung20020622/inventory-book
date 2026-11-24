import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
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
    <Suspense fallback={<PageLoading label="Loading plan" variant="block" />}>
      <PlanContent id={id} />
    </Suspense>
  );
}
