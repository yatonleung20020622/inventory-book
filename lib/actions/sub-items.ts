"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type SubItemRecord = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  remarks: string;
  itemId: string;
  createdAt: string;
  updatedAt: string;
};

export type SubItemActionResult = {
  ok: boolean;
  message: string;
};

type SubItemRow = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  remarks: string;
  itemId: string;
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

async function requireOwnedItemId(userId: string, itemId: string) {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  });

  if (!item) {
    throw new Error("Item not found.");
  }

  return item.id;
}

function toSubItemRecord(subItem: SubItemRow): SubItemRecord {
  return {
    id: subItem.id,
    name: subItem.name,
    quantity: subItem.quantity,
    unit: subItem.unit,
    remarks: subItem.remarks,
    itemId: subItem.itemId,
    createdAt: subItem.createdAt.toISOString(),
    updatedAt: subItem.updatedAt.toISOString(),
  };
}

function revalidateItemPaths(itemId: string) {
  revalidatePath("/items");
  revalidatePath(`/items/${itemId}`);
}

export async function listSubItems(itemId: string): Promise<SubItemRecord[]> {
  const userId = await requireUserId();
  await requireOwnedItemId(userId, itemId);

  const subItems = await prisma.subItem.findMany({
    where: { itemId },
    orderBy: { createdAt: "asc" },
  });

  return subItems.map(toSubItemRecord);
}

export async function createSubItem(input: {
  itemId: string;
  name: string;
  quantity?: number;
  unit?: string;
  remarks?: string;
}): Promise<SubItemActionResult> {
  try {
    const userId = await requireUserId();
    const itemId = await requireOwnedItemId(userId, input.itemId);
    const name = input.name.trim();
    const quantity = input.quantity ?? 1;
    const unit = (input.unit ?? "個").trim() || "個";
    const remarks = (input.remarks ?? "").trim();

    if (!name) {
      return { ok: false, message: "Sub-item name is required." };
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      return { ok: false, message: "Quantity must be zero or greater." };
    }

    await prisma.subItem.create({
      data: {
        name,
        quantity: Math.floor(quantity),
        unit,
        remarks,
        itemId,
      },
    });

    revalidateItemPaths(itemId);
    return { ok: true, message: "Sub-item created." };
  } catch (error) {
    if (error instanceof Error && error.message === "Item not found.") {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Failed to create sub-item." };
  }
}

export async function updateSubItem(input: {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  unit: string;
  remarks: string;
}): Promise<SubItemActionResult> {
  try {
    const userId = await requireUserId();
    const itemId = await requireOwnedItemId(userId, input.itemId);
    const name = input.name.trim();
    const unit = input.unit.trim() || "個";
    const remarks = input.remarks.trim();

    if (!name) {
      return { ok: false, message: "Sub-item name is required." };
    }
    if (!Number.isFinite(input.quantity) || input.quantity < 0) {
      return { ok: false, message: "Quantity must be zero or greater." };
    }

    const result = await prisma.subItem.updateMany({
      where: { id: input.id, itemId },
      data: {
        name,
        quantity: Math.floor(input.quantity),
        unit,
        remarks,
      },
    });

    if (result.count === 0) {
      return { ok: false, message: "Sub-item not found." };
    }

    revalidateItemPaths(itemId);
    return { ok: true, message: "Sub-item updated." };
  } catch (error) {
    if (error instanceof Error && error.message === "Item not found.") {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Failed to update sub-item." };
  }
}

export async function deleteSubItem(input: {
  id: string;
  itemId: string;
}): Promise<SubItemActionResult> {
  try {
    const userId = await requireUserId();
    const itemId = await requireOwnedItemId(userId, input.itemId);

    const result = await prisma.subItem.deleteMany({
      where: { id: input.id, itemId },
    });

    if (result.count === 0) {
      return { ok: false, message: "Sub-item not found." };
    }

    revalidateItemPaths(itemId);
    return { ok: true, message: "Sub-item deleted." };
  } catch (error) {
    if (error instanceof Error && error.message === "Item not found.") {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Failed to delete sub-item." };
  }
}
