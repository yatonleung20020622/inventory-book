import { connection } from "next/server";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
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
      fallback={<PageLoading label="Loading training" variant="block" />}
    >
      <TrainingContent />
    </Suspense>
  );
}
