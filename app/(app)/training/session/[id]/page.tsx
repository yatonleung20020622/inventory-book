import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import {
  getTrainSession,
  listTrainExercises,
} from "@/lib/actions/training";
import { SessionWorkout } from "./session-workout";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function SessionContent({ id }: { id: string }) {
  await connection();
  const [session, exercises] = await Promise.all([
    getTrainSession(id),
    listTrainExercises(),
  ]);
  if (!session) {
    notFound();
  }
  return <SessionWorkout session={session} exercises={exercises} />;
}

export default async function TrainingSessionPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense
      fallback={<PageLoading label="Loading session" variant="block" />}
    >
      <SessionContent id={id} />
    </Suspense>
  );
}
