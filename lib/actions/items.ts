"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ItemRecord = {
  id: string;
  name: string;
  desc: string;
  quantity: number;
  unit: string;
  estimatedPrice: string;
  purchaseDate: string;
  remarks: string;
  locationId: string | null;
  locationName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ItemActionResult = {
  ok: boolean;
  message: string;
};

type ItemRow = {
  id: string;
  name: string;
  desc: string;
  quantity: number;
  unit: string;
  estimatedPrice: string;
  purchaseDate: string;
  remarks: string;
  locationId: string | null;
  location: { name: string } | null;
  createdAt: Date;
  updatedAt: Date;
};

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

async function resolveOwnedLocationId(
  userId: string,
  locationId: string | null | undefined,
) {
  if (!locationId) {
    return null;
  }

  const location = await prisma.location.findFirst({
    where: { id: locationId, userId },
    select: { id: true },
  });

  if (!location) {
    throw new Error("Invalid location.");
  }

  return location.id;
}

function toItemRecord(item: ItemRow): ItemRecord {
  return {
    id: item.id,
    name: item.name,
    desc: item.desc,
    quantity: item.quantity,
    unit: item.unit,
    estimatedPrice: item.estimatedPrice,
    purchaseDate: item.purchaseDate,
    remarks: item.remarks,
    locationId: item.locationId,
    locationName: item.location?.name ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function listItems(): Promise<ItemRecord[]> {
  const userId = await requireUserId();
  const items = await prisma.item.findMany({
    where: { userId },
    include: {
      location: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return items.map(toItemRecord);
}

export async function createItem(input: {
  name: string;
  desc?: string;
  quantity?: number;
  unit?: string;
  estimatedPrice?: string;
  purchaseDate?: string;
  remarks?: string;
  locationId?: string | null;
}): Promise<ItemActionResult> {
  try {
    const userId = await requireUserId();
    const name = input.name.trim();
    const desc = (input.desc ?? "").trim();
    const quantity = input.quantity ?? 1;
    const unit = (input.unit ?? "個").trim() || "個";
    const estimatedPrice = (input.estimatedPrice ?? "").trim();
    const purchaseDate = (input.purchaseDate ?? "").trim();
    const remarks = (input.remarks ?? "").trim();
    const locationId = await resolveOwnedLocationId(userId, input.locationId);

    if (!name) {
      return { ok: false, message: "Item name is required." };
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      return { ok: false, message: "Quantity must be zero or greater." };
    }

    await prisma.item.create({
      data: {
        name,
        desc,
        quantity: Math.floor(quantity),
        unit,
        estimatedPrice,
        purchaseDate,
        remarks,
        locationId,
        userId,
      },
    });

    revalidatePath("/items");
    return { ok: true, message: "Item created." };
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid location.") {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Failed to create item." };
  }
}

export async function updateItem(input: {
  id: string;
  name: string;
  desc: string;
  quantity: number;
  unit: string;
  estimatedPrice: string;
  purchaseDate: string;
  remarks: string;
  locationId?: string | null;
}): Promise<ItemActionResult> {
  try {
    const userId = await requireUserId();
    const name = input.name.trim();
    const desc = input.desc.trim();
    const unit = input.unit.trim() || "個";
    const estimatedPrice = input.estimatedPrice.trim();
    const purchaseDate = input.purchaseDate.trim();
    const remarks = input.remarks.trim();
    const locationId = await resolveOwnedLocationId(userId, input.locationId);

    if (!name) {
      return { ok: false, message: "Item name is required." };
    }
    if (!Number.isFinite(input.quantity) || input.quantity < 0) {
      return { ok: false, message: "Quantity must be zero or greater." };
    }

    const result = await prisma.item.updateMany({
      where: { id: input.id, userId },
      data: {
        name,
        desc,
        quantity: Math.floor(input.quantity),
        unit,
        estimatedPrice,
        purchaseDate,
        remarks,
        locationId,
      },
    });

    if (result.count === 0) {
      return { ok: false, message: "Item not found." };
    }

    revalidatePath("/items");
    return { ok: true, message: "Item updated." };
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid location.") {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Failed to update item." };
  }
}

export async function deleteItem(id: string): Promise<ItemActionResult> {
  try {
    const userId = await requireUserId();
    const result = await prisma.item.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      return { ok: false, message: "Item not found." };
    }

    revalidatePath("/items");
    return { ok: true, message: "Item deleted." };
  } catch {
    return { ok: false, message: "Failed to delete item." };
  }
}
