"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { TrainSessionStatus } from "@/lib/generated/prisma/enums";

export type TrainingActionResult = {
  ok: boolean;
  message: string;
  id?: string;
};

export type TrainExerciseRecord = {
  id: string;
  name: string;
  defaultRestSec: number;
  notes: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TrainSetRecord = {
  id: string;
  setIndex: number;
  reps: number;
  durationSec: number;
  restAfterSec: number;
};

export type TrainSessionExerciseRecord = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sortOrder: number;
  targetRestSec: number;
  sets: TrainSetRecord[];
};

export type TrainSessionListItem = {
  id: string;
  title: string;
  startedAt: string;
  finishedAt: string | null;
  status: TrainSessionStatus;
  notes: string;
  exerciseNames: string[];
  totalSets: number;
};

export type TrainSessionRecord = {
  id: string;
  title: string;
  startedAt: string;
  finishedAt: string | null;
  status: TrainSessionStatus;
  notes: string;
  exercises: TrainSessionExerciseRecord[];
  createdAt: string;
  updatedAt: string;
};

async function requireLogin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

function revalidateTraining(sessionId?: string) {
  revalidatePath("/training");
  revalidatePath("/training/exercises");
  if (sessionId) {
    revalidatePath(`/training/session/${sessionId}`);
  }
}

function toExerciseRecord(row: {
  id: string;
  name: string;
  defaultRestSec: number;
  notes: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): TrainExerciseRecord {
  return {
    id: row.id,
    name: row.name,
    defaultRestSec: row.defaultRestSec,
    notes: row.notes,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const sessionDetailInclude = {
  exercises: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      exercise: { select: { id: true, name: true } },
      sets: { orderBy: { setIndex: "asc" as const } },
    },
  },
};

function toSessionRecord(row: {
  id: string;
  title: string;
  startedAt: Date;
  finishedAt: Date | null;
  status: TrainSessionStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  exercises: {
    id: string;
    exerciseId: string;
    sortOrder: number;
    targetRestSec: number;
    exercise: { id: string; name: string };
    sets: {
      id: string;
      setIndex: number;
      reps: number;
      durationSec: number;
      restAfterSec: number;
    }[];
  }[];
}): TrainSessionRecord {
  return {
    id: row.id,
    title: row.title,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    exercises: row.exercises.map((ex) => ({
      id: ex.id,
      exerciseId: ex.exerciseId,
      exerciseName: ex.exercise.name,
      sortOrder: ex.sortOrder,
      targetRestSec: ex.targetRestSec,
      sets: ex.sets.map((set) => ({
        id: set.id,
        setIndex: set.setIndex,
        reps: set.reps,
        durationSec: set.durationSec,
        restAfterSec: set.restAfterSec,
      })),
    })),
  };
}

function parseStartedAt(value: string | Date | undefined): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function asNonNegInt(value: unknown, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

// --- Exercises ---

export async function listTrainExercises(): Promise<TrainExerciseRecord[]> {
  await requireLogin();
  const rows = await prisma.trainExercise.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toExerciseRecord);
}

export async function upsertTrainExercise(input: {
  id?: string;
  name: string;
  defaultRestSec: number;
  notes: string;
  sortOrder: number;
}): Promise<TrainingActionResult> {
  try {
    await requireLogin();
    const name = input.name.trim();
    if (!name) {
      return { ok: false, message: "Exercise name is required." };
    }
    const data = {
      name,
      defaultRestSec: asNonNegInt(input.defaultRestSec, 60) || 60,
      notes: input.notes.trim(),
      sortOrder: asNonNegInt(input.sortOrder, 0),
    };

    if (input.id) {
      const existing = await prisma.trainExercise.findFirst({
        where: { id: input.id },
        select: { id: true },
      });
      if (!existing) {
        return { ok: false, message: "Exercise not found." };
      }
      await prisma.trainExercise.update({ where: { id: input.id }, data });
      revalidateTraining();
      return { ok: true, message: "Exercise updated.", id: input.id };
    }

    const created = await prisma.trainExercise.create({ data });
    revalidateTraining();
    return { ok: true, message: "Exercise created.", id: created.id };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { ok: false, message: "An exercise with that name already exists." };
    }
    return { ok: false, message: "Failed to save exercise." };
  }
}

export async function deleteTrainExercise(
  id: string,
): Promise<TrainingActionResult> {
  try {
    await requireLogin();
    const inUse = await prisma.trainSessionExercise.count({
      where: { exerciseId: id },
    });
    if (inUse > 0) {
      return {
        ok: false,
        message: "Cannot delete: exercise is used in a session.",
      };
    }
    const result = await prisma.trainExercise.deleteMany({ where: { id } });
    if (result.count === 0) {
      return { ok: false, message: "Exercise not found." };
    }
    revalidateTraining();
    return { ok: true, message: "Exercise deleted." };
  } catch {
    return { ok: false, message: "Failed to delete exercise." };
  }
}

// --- Sessions ---

export async function listTrainSessions(): Promise<TrainSessionListItem[]> {
  await requireLogin();
  const rows = await prisma.trainSession.findMany({
    orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
    include: {
      exercises: {
        orderBy: { sortOrder: "asc" },
        include: {
          exercise: { select: { name: true } },
          _count: { select: { sets: true } },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
    status: row.status,
    notes: row.notes,
    exerciseNames: row.exercises.map((ex) => ex.exercise.name),
    totalSets: row.exercises.reduce((sum, ex) => sum + ex._count.sets, 0),
  }));
}

export async function getTrainSession(
  id: string,
): Promise<TrainSessionRecord | null> {
  await requireLogin();
  const trimmed = id.trim();
  if (!trimmed) return null;
  const row = await prisma.trainSession.findFirst({
    where: { id: trimmed },
    include: sessionDetailInclude,
  });
  return row ? toSessionRecord(row) : null;
}

export async function createTrainSession(input?: {
  title?: string;
  notes?: string;
  startedAt?: string;
  status?: "IN_PROGRESS" | "COMPLETED";
}): Promise<TrainingActionResult> {
  try {
    await requireLogin();
    const status =
      input?.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS";
    const startedAt = parseStartedAt(input?.startedAt) ?? new Date();
    const created = await prisma.trainSession.create({
      data: {
        title: (input?.title ?? "").trim(),
        notes: (input?.notes ?? "").trim(),
        startedAt,
        status,
        finishedAt: status === "COMPLETED" ? startedAt : null,
      },
    });
    revalidateTraining(created.id);
    return { ok: true, message: "Session created.", id: created.id };
  } catch {
    return { ok: false, message: "Failed to create session." };
  }
}

export async function updateTrainSession(input: {
  id: string;
  title?: string;
  notes?: string;
  startedAt?: string;
}): Promise<TrainingActionResult> {
  try {
    await requireLogin();
    const existing = await prisma.trainSession.findFirst({
      where: { id: input.id },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, message: "Session not found." };
    }

    const data: {
      title?: string;
      notes?: string;
      startedAt?: Date;
    } = {};
    if (input.title !== undefined) data.title = input.title.trim();
    if (input.notes !== undefined) data.notes = input.notes.trim();
    if (input.startedAt !== undefined) {
      const startedAt = parseStartedAt(input.startedAt);
      if (!startedAt) {
        return { ok: false, message: "Invalid start time." };
      }
      data.startedAt = startedAt;
    }

    await prisma.trainSession.update({ where: { id: input.id }, data });
    revalidateTraining(input.id);
    return { ok: true, message: "Session updated.", id: input.id };
  } catch {
    return { ok: false, message: "Failed to update session." };
  }
}

export async function finishTrainSession(
  id: string,
): Promise<TrainingActionResult> {
  try {
    await requireLogin();
    const existing = await prisma.trainSession.findFirst({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, message: "Session not found." };
    }
    await prisma.trainSession.update({
      where: { id },
      data: { status: "COMPLETED", finishedAt: new Date() },
    });
    revalidateTraining(id);
    return { ok: true, message: "Workout finished.", id };
  } catch {
    return { ok: false, message: "Failed to finish session." };
  }
}

export async function deleteTrainSession(
  id: string,
): Promise<TrainingActionResult> {
  try {
    await requireLogin();
    const result = await prisma.trainSession.deleteMany({ where: { id } });
    if (result.count === 0) {
      return { ok: false, message: "Session not found." };
    }
    revalidateTraining();
    return { ok: true, message: "Session deleted." };
  } catch {
    return { ok: false, message: "Failed to delete session." };
  }
}

export async function addExerciseToSession(input: {
  sessionId: string;
  exerciseId: string;
  targetRestSec?: number;
}): Promise<TrainingActionResult> {
  try {
    await requireLogin();
    const session = await prisma.trainSession.findFirst({
      where: { id: input.sessionId },
      select: { id: true },
    });
    if (!session) {
      return { ok: false, message: "Session not found." };
    }
    const exercise = await prisma.trainExercise.findFirst({
      where: { id: input.exerciseId },
      select: { id: true, defaultRestSec: true },
    });
    if (!exercise) {
      return { ok: false, message: "Exercise not found." };
    }

    const maxOrder = await prisma.trainSessionExercise.aggregate({
      where: { sessionId: input.sessionId },
      _max: { sortOrder: true },
    });

    const created = await prisma.trainSessionExercise.create({
      data: {
        sessionId: input.sessionId,
        exerciseId: exercise.id,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        targetRestSec:
          input.targetRestSec !== undefined
            ? asNonNegInt(input.targetRestSec, exercise.defaultRestSec)
            : exercise.defaultRestSec,
      },
    });
    revalidateTraining(input.sessionId);
    return { ok: true, message: "Exercise added.", id: created.id };
  } catch {
    return { ok: false, message: "Failed to add exercise." };
  }
}

export async function updateSessionExercise(input: {
  id: string;
  targetRestSec?: number;
  sortOrder?: number;
}): Promise<TrainingActionResult> {
  try {
    await requireLogin();
    const existing = await prisma.trainSessionExercise.findFirst({
      where: { id: input.id },
      select: { id: true, sessionId: true },
    });
    if (!existing) {
      return { ok: false, message: "Session exercise not found." };
    }

    const data: { targetRestSec?: number; sortOrder?: number } = {};
    if (input.targetRestSec !== undefined) {
      data.targetRestSec = asNonNegInt(input.targetRestSec, 60);
    }
    if (input.sortOrder !== undefined) {
      data.sortOrder = asNonNegInt(input.sortOrder, 0);
    }

    await prisma.trainSessionExercise.update({
      where: { id: input.id },
      data,
    });
    revalidateTraining(existing.sessionId);
    return { ok: true, message: "Updated.", id: input.id };
  } catch {
    return { ok: false, message: "Failed to update." };
  }
}

export async function removeExerciseFromSession(
  id: string,
): Promise<TrainingActionResult> {
  try {
    await requireLogin();
    const existing = await prisma.trainSessionExercise.findFirst({
      where: { id },
      select: { id: true, sessionId: true },
    });
    if (!existing) {
      return { ok: false, message: "Session exercise not found." };
    }
    await prisma.trainSessionExercise.delete({ where: { id } });
    revalidateTraining(existing.sessionId);
    return { ok: true, message: "Exercise removed." };
  } catch {
    return { ok: false, message: "Failed to remove exercise." };
  }
}

export async function upsertTrainSet(input: {
  id?: string;
  sessionExerciseId: string;
  reps: number;
  durationSec?: number;
  restAfterSec?: number;
  setIndex?: number;
}): Promise<TrainingActionResult> {
  try {
    await requireLogin();
    const sessionExercise = await prisma.trainSessionExercise.findFirst({
      where: { id: input.sessionExerciseId },
      select: { id: true, sessionId: true },
    });
    if (!sessionExercise) {
      return { ok: false, message: "Session exercise not found." };
    }

    const reps = asNonNegInt(input.reps, 0);
    const durationSec = asNonNegInt(input.durationSec, 0);
    const restAfterSec = asNonNegInt(input.restAfterSec, 0);

    if (input.id) {
      const existing = await prisma.trainSet.findFirst({
        where: { id: input.id, sessionExerciseId: input.sessionExerciseId },
        select: { id: true },
      });
      if (!existing) {
        return { ok: false, message: "Set not found." };
      }
      await prisma.trainSet.update({
        where: { id: input.id },
        data: {
          reps,
          durationSec,
          restAfterSec,
          ...(input.setIndex !== undefined
            ? { setIndex: asNonNegInt(input.setIndex, 1) || 1 }
            : {}),
        },
      });
      revalidateTraining(sessionExercise.sessionId);
      return { ok: true, message: "Set updated.", id: input.id };
    }

    const maxIndex = await prisma.trainSet.aggregate({
      where: { sessionExerciseId: input.sessionExerciseId },
      _max: { setIndex: true },
    });
    const setIndex =
      input.setIndex !== undefined
        ? asNonNegInt(input.setIndex, 1) || 1
        : (maxIndex._max.setIndex ?? 0) + 1;

    const created = await prisma.trainSet.create({
      data: {
        sessionExerciseId: input.sessionExerciseId,
        setIndex,
        reps,
        durationSec,
        restAfterSec,
      },
    });
    revalidateTraining(sessionExercise.sessionId);
    return { ok: true, message: "Set logged.", id: created.id };
  } catch {
    return { ok: false, message: "Failed to save set." };
  }
}

export async function updateTrainSetRest(input: {
  id: string;
  restAfterSec: number;
}): Promise<TrainingActionResult> {
  try {
    await requireLogin();
    const existing = await prisma.trainSet.findFirst({
      where: { id: input.id },
      select: {
        id: true,
        sessionExercise: { select: { sessionId: true } },
      },
    });
    if (!existing) {
      return { ok: false, message: "Set not found." };
    }
    await prisma.trainSet.update({
      where: { id: input.id },
      data: { restAfterSec: asNonNegInt(input.restAfterSec, 0) },
    });
    revalidateTraining(existing.sessionExercise.sessionId);
    return { ok: true, message: "Rest saved.", id: input.id };
  } catch {
    return { ok: false, message: "Failed to save rest." };
  }
}

export async function deleteTrainSet(
  id: string,
): Promise<TrainingActionResult> {
  try {
    await requireLogin();
    const existing = await prisma.trainSet.findFirst({
      where: { id },
      select: {
        id: true,
        sessionExerciseId: true,
        sessionExercise: { select: { sessionId: true } },
      },
    });
    if (!existing) {
      return { ok: false, message: "Set not found." };
    }
    await prisma.trainSet.delete({ where: { id } });

    const remaining = await prisma.trainSet.findMany({
      where: { sessionExerciseId: existing.sessionExerciseId },
      orderBy: { setIndex: "asc" },
      select: { id: true },
    });
    await Promise.all(
      remaining.map((set, index) =>
        prisma.trainSet.update({
          where: { id: set.id },
          data: { setIndex: index + 1 },
        }),
      ),
    );

    revalidateTraining(existing.sessionExercise.sessionId);
    return { ok: true, message: "Set deleted." };
  } catch {
    return { ok: false, message: "Failed to delete set." };
  }
}
