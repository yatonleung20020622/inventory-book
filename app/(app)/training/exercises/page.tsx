import { connection } from "next/server";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
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
      fallback={<PageSkeleton label="Loading exercises" variant="list" />}
    >
      <ExercisesContent />
    </Suspense>
  );
}
