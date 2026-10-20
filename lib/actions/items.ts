"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ItemRecord = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
};

export type ItemActionResult = {
  ok: boolean;
  message: string;
};

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

function toItemRecord(item: {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
}): ItemRecord {
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function listItems(): Promise<ItemRecord[]> {
  const userId = await requireUserId();
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return items.map(toItemRecord);
}

export async function createItem(input: {
  name: string;
  quantity?: number;
  unit?: string;
}): Promise<ItemActionResult> {
  try {
    const userId = await requireUserId();
    const name = input.name.trim();
    const quantity = input.quantity ?? 1;
    const unit = (input.unit ?? "個").trim() || "個";

    if (!name) {
      return { ok: false, message: "Name is required." };
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      return { ok: false, message: "Quantity must be zero or greater." };
    }

    await prisma.item.create({
      data: {
        name,
        quantity: Math.floor(quantity),
        unit,
        userId,
      },
    });

    revalidatePath("/items");
    return { ok: true, message: "Item created." };
  } catch {
    return { ok: false, message: "Failed to create item." };
  }
}

export async function updateItem(input: {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}): Promise<ItemActionResult> {
  try {
    const userId = await requireUserId();
    const name = input.name.trim();
    const unit = input.unit.trim() || "個";

    if (!name) {
      return { ok: false, message: "Name is required." };
    }
    if (!Number.isFinite(input.quantity) || input.quantity < 0) {
      return { ok: false, message: "Quantity must be zero or greater." };
    }

    const result = await prisma.item.updateMany({
      where: { id: input.id, userId },
      data: {
        name,
        quantity: Math.floor(input.quantity),
        unit,
      },
    });

    if (result.count === 0) {
      return { ok: false, message: "Item not found." };
    }

    revalidatePath("/items");
    return { ok: true, message: "Item updated." };
  } catch {
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
