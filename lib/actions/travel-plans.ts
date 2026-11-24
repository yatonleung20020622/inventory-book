"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { TravelPlanItemStatus } from "@/lib/generated/prisma/enums";

export type TravelPlanActionResult = {
  ok: boolean;
  message: string;
  id?: string;
};

export type TravelPlanItemRecord = {
  id: string;
  title: string;
  notes: string;
  url: string;
  status: TravelPlanItemStatus;
  startDate: string;
  endDate: string;
  cost: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TravelPlanListItem = {
  id: string;
  title: string;
  summary: string;
  startDate: string;
  endDate: string;
  notes: string;
  itemCount: number;
  statusCounts: Record<TravelPlanItemStatus, number>;
  createdAt: string;
  updatedAt: string;
};

export type TravelPlanRecord = {
  id: string;
  title: string;
  summary: string;
  startDate: string;
  endDate: string;
  notes: string;
  items: TravelPlanItemRecord[];
  createdAt: string;
  updatedAt: string;
};

async function requireLogin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
}

function revalidatePlans(planId?: string) {
  revalidatePath("/travel/plans");
  if (planId) {
    revalidatePath(`/travel/plans/${planId}`);
  }
}

function parseStatus(value: string | undefined): TravelPlanItemStatus | null {
  if (
    value === "IDEA" ||
    value === "RESEARCHING" ||
    value === "BOOKED" ||
    value === "SKIPPED"
  ) {
    return value;
  }
  return null;
}

function emptyStatusCounts(): Record<TravelPlanItemStatus, number> {
  return { IDEA: 0, RESEARCHING: 0, BOOKED: 0, SKIPPED: 0 };
}

function toItemRecord(row: {
  id: string;
  title: string;
  notes: string;
  url: string;
  status: TravelPlanItemStatus;
  startDate: string;
  endDate: string;
  cost: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): TravelPlanItemRecord {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    url: row.url,
    status: row.status,
    startDate: row.startDate,
    endDate: row.endDate,
    cost: row.cost,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listTravelPlans(): Promise<TravelPlanListItem[]> {
  await requireLogin();
  const rows = await prisma.travelPlan.findMany({
    orderBy: [{ startDate: "desc" }, { updatedAt: "desc" }],
    include: {
      items: { select: { status: true } },
    },
  });

  return rows.map((row) => {
    const statusCounts = emptyStatusCounts();
    for (const item of row.items) {
      statusCounts[item.status] += 1;
    }
    return {
      id: row.id,
      title: row.title,
      summary: row.summary,
      startDate: row.startDate,
      endDate: row.endDate,
      notes: row.notes,
      itemCount: row.items.length,
      statusCounts,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

export async function getTravelPlan(
  id: string,
): Promise<TravelPlanRecord | null> {
  await requireLogin();
  const trimmed = id.trim();
  if (!trimmed) return null;
  const row = await prisma.travelPlan.findFirst({
    where: { id: trimmed },
    include: {
      items: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    startDate: row.startDate,
    endDate: row.endDate,
    notes: row.notes,
    items: row.items.map(toItemRecord),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function upsertTravelPlan(input: {
  id?: string;
  title: string;
  summary: string;
  startDate: string;
  endDate: string;
  notes: string;
}): Promise<TravelPlanActionResult> {
  try {
    await requireLogin();
    const title = input.title.trim();
    if (!title) {
      return { ok: false, message: "Title is required." };
    }
    const data = {
      title,
      summary: input.summary.trim(),
      startDate: input.startDate.trim(),
      endDate: input.endDate.trim(),
      notes: input.notes.trim(),
    };

    if (input.id) {
      const existing = await prisma.travelPlan.findFirst({
        where: { id: input.id },
        select: { id: true },
      });
      if (!existing) {
        return { ok: false, message: "Plan not found." };
      }
      await prisma.travelPlan.update({ where: { id: input.id }, data });
      revalidatePlans(input.id);
      return { ok: true, message: "Plan updated.", id: input.id };
    }

    const created = await prisma.travelPlan.create({ data });
    revalidatePlans(created.id);
    return { ok: true, message: "Plan created.", id: created.id };
  } catch {
    return { ok: false, message: "Failed to save plan." };
  }
}

export async function deleteTravelPlan(
  id: string,
): Promise<TravelPlanActionResult> {
  try {
    await requireLogin();
    const result = await prisma.travelPlan.deleteMany({ where: { id } });
    if (result.count === 0) {
      return { ok: false, message: "Plan not found." };
    }
    revalidatePlans();
    return { ok: true, message: "Plan deleted." };
  } catch {
    return { ok: false, message: "Failed to delete plan." };
  }
}

export async function upsertTravelPlanItem(input: {
  id?: string;
  planId: string;
  title: string;
  notes: string;
  url: string;
  status: string;
  startDate: string;
  endDate: string;
  cost: string;
  sortOrder: number;
}): Promise<TravelPlanActionResult> {
  try {
    await requireLogin();
    const plan = await prisma.travelPlan.findFirst({
      where: { id: input.planId },
      select: { id: true },
    });
    if (!plan) {
      return { ok: false, message: "Plan not found." };
    }

    const title = input.title.trim();
    if (!title) {
      return { ok: false, message: "Title is required." };
    }
    const status = parseStatus(input.status);
    if (!status) {
      return { ok: false, message: "Invalid status." };
    }

    const data = {
      title,
      notes: input.notes.trim(),
      url: input.url.trim(),
      status,
      startDate: input.startDate.trim(),
      endDate: input.endDate.trim(),
      cost: input.cost.trim(),
      sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
    };

    if (input.id) {
      const existing = await prisma.travelPlanItem.findFirst({
        where: { id: input.id, planId: input.planId },
        select: { id: true },
      });
      if (!existing) {
        return { ok: false, message: "Item not found." };
      }
      await prisma.travelPlanItem.update({ where: { id: input.id }, data });
      revalidatePlans(input.planId);
      return { ok: true, message: "Item updated.", id: input.id };
    }

    const created = await prisma.travelPlanItem.create({
      data: { ...data, planId: input.planId },
    });
    revalidatePlans(input.planId);
    return { ok: true, message: "Item added.", id: created.id };
  } catch {
    return { ok: false, message: "Failed to save item." };
  }
}

export async function deleteTravelPlanItem(
  id: string,
): Promise<TravelPlanActionResult> {
  try {
    await requireLogin();
    const existing = await prisma.travelPlanItem.findFirst({
      where: { id },
      select: { id: true, planId: true },
    });
    if (!existing) {
      return { ok: false, message: "Item not found." };
    }
    await prisma.travelPlanItem.delete({ where: { id } });
    revalidatePlans(existing.planId);
    return { ok: true, message: "Item deleted." };
  } catch {
    return { ok: false, message: "Failed to delete item." };
  }
}
