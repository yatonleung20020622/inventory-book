import { connection } from "next/server";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { listTrainSessions } from "@/lib/actions/training";
import { TrainingSessionsManager } from "./training-sessions";

async function TrainingContent() {
  await connection();
  const sessions = await listTrainSessions();
  return <TrainingSessionsManager sessions={sessions} />;
}

export default function TrainingPage() {
  return (
    <Suspense
      fallback={<PageSkeleton label="Loading training" variant="list" />}
    >
      <TrainingContent />
    </Suspense>
  );
}
