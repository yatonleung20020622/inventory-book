"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type TravelGroupRecord = {
  id: string;
  name: string;
  color: string;
  placeCount: number;
  createdAt: string;
  updatedAt: string;
};

export type TravelGroupActionResult = {
  ok: boolean;
  message: string;
  groupId?: string;
};

async function requireLogin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
}

function revalidateTravel() {
  revalidatePath("/travel");
  revalidatePath("/travel/places");
}

export async function listTravelGroups(): Promise<TravelGroupRecord[]> {
  await requireLogin();
  const groups = await prisma.travelGroup.findMany({
    include: { _count: { select: { places: true } } },
    orderBy: { name: "asc" },
  });
  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    color: group.color,
    placeCount: group._count.places,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  }));
}

export async function createTravelGroup(input: {
  name: string;
  color?: string;
}): Promise<TravelGroupActionResult> {
  try {
    await requireLogin();
    const name = input.name.trim();
    const color = (input.color ?? "").trim();
    if (!name) {
      return { ok: false, message: "Group name is required." };
    }

    const existing = await prisma.travelGroup.findUnique({
      where: { name },
      select: { id: true },
    });
    if (existing) {
      return { ok: false, message: "A group with this name already exists." };
    }

    const group = await prisma.travelGroup.create({
      data: { name, color },
    });
    revalidateTravel();
    return { ok: true, message: "Group created.", groupId: group.id };
  } catch {
    return { ok: false, message: "Failed to create group." };
  }
}

export async function updateTravelGroup(input: {
  id: string;
  name: string;
  color: string;
}): Promise<TravelGroupActionResult> {
  try {
    await requireLogin();
    const name = input.name.trim();
    const color = input.color.trim();
    if (!name) {
      return { ok: false, message: "Group name is required." };
    }

    const existing = await prisma.travelGroup.findUnique({
      where: { id: input.id },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, message: "Group not found." };
    }

    const duplicate = await prisma.travelGroup.findFirst({
      where: { name, id: { not: input.id } },
      select: { id: true },
    });
    if (duplicate) {
      return { ok: false, message: "A group with this name already exists." };
    }

    await prisma.travelGroup.update({
      where: { id: input.id },
      data: { name, color },
    });
    revalidateTravel();
    return { ok: true, message: "Group updated.", groupId: input.id };
  } catch {
    return { ok: false, message: "Failed to update group." };
  }
}

export async function deleteTravelGroup(
  id: string,
): Promise<TravelGroupActionResult> {
  try {
    await requireLogin();
    const existing = await prisma.travelGroup.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, message: "Group not found." };
    }

    await prisma.travelGroup.delete({ where: { id } });
    revalidateTravel();
    return { ok: true, message: "Group deleted." };
  } catch {
    return { ok: false, message: "Failed to delete group." };
  }
}
