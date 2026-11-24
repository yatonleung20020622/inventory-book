import { connection } from "next/server";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { listTrainExercises } from "@/lib/actions/training";
import { TrainingExercisesManager } from "./exercises-manager";

async function ExercisesContent() {
  await connection();
  const exercises = await listTrainExercises();
  return <TrainingExercisesManager exercises={exercises} />;
}

export default function TrainingExercisesPage() {
  return (
    <Suspense
      fallback={<PageLoading label="Loading exercises" variant="block" />}
    >
      <ExercisesContent />
    </Suspense>
  );
}
