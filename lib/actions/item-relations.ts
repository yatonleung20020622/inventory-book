"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ItemRelationRecord = {
  id: string;
  type: string;
  direction: "from" | "to";
  otherItemId: string;
  otherItemName: string;
  otherItemBrand: string;
  createdAt: string;
};

export type ItemRelationActionResult = {
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

function revalidateItemPaths(itemIds: string[]) {
  revalidatePath("/items");
  for (const id of itemIds) {
    revalidatePath(`/items/${id}`);
  }
}

export async function listItemRelations(
  itemId: string,
): Promise<ItemRelationRecord[]> {
  const userId = await requireUserId();

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  });
  if (!item) {
    return [];
  }

  const [outgoing, incoming] = await Promise.all([
    prisma.itemRelation.findMany({
      where: { fromItemId: itemId, userId },
      include: {
        toItem: { select: { id: true, name: true, brand: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.itemRelation.findMany({
      where: { toItemId: itemId, userId },
      include: {
        fromItem: { select: { id: true, name: true, brand: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return [
    ...outgoing.map((relation) => ({
      id: relation.id,
      type: relation.type,
      direction: "from" as const,
      otherItemId: relation.toItem.id,
      otherItemName: relation.toItem.name,
      otherItemBrand: relation.toItem.brand,
      createdAt: relation.createdAt.toISOString(),
    })),
    ...incoming.map((relation) => ({
      id: relation.id,
      type: relation.type,
      direction: "to" as const,
      otherItemId: relation.fromItem.id,
      otherItemName: relation.fromItem.name,
      otherItemBrand: relation.fromItem.brand,
      createdAt: relation.createdAt.toISOString(),
    })),
  ];
}

export async function createItemRelation(input: {
  fromItemId: string;
  toItemId: string;
  type: string;
}): Promise<ItemRelationActionResult> {
  try {
    const userId = await requireUserId();
    const type = input.type.trim();

    if (!type) {
      return { ok: false, message: "Relation type is required." };
    }
    if (type.length > 80) {
      return { ok: false, message: "Relation type must be 80 characters or less." };
    }
    if (input.fromItemId === input.toItemId) {
      return { ok: false, message: "An item cannot relate to itself." };
    }

    const [fromItem, toItem] = await Promise.all([
      prisma.item.findFirst({
        where: { id: input.fromItemId, userId },
        select: { id: true },
      }),
      prisma.item.findFirst({
        where: { id: input.toItemId, userId },
        select: { id: true },
      }),
    ]);

    if (!fromItem || !toItem) {
      return { ok: false, message: "Item not found." };
    }

    const existing = await prisma.itemRelation.findUnique({
      where: {
        fromItemId_toItemId_type: {
          fromItemId: fromItem.id,
          toItemId: toItem.id,
          type,
        },
      },
      select: { id: true },
    });
    if (existing) {
      return { ok: false, message: "This relation already exists." };
    }

    await prisma.itemRelation.create({
      data: {
        fromItemId: fromItem.id,
        toItemId: toItem.id,
        type,
        userId,
      },
    });

    revalidateItemPaths([fromItem.id, toItem.id]);
    return { ok: true, message: "Relation added." };
  } catch {
    return { ok: false, message: "Failed to add relation." };
  }
}

export async function deleteItemRelation(
  id: string,
): Promise<ItemRelationActionResult> {
  try {
    const userId = await requireUserId();
    const relation = await prisma.itemRelation.findFirst({
      where: { id, userId },
      select: { id: true, fromItemId: true, toItemId: true },
    });

    if (!relation) {
      return { ok: false, message: "Relation not found." };
    }

    await prisma.itemRelation.delete({ where: { id: relation.id } });
    revalidateItemPaths([relation.fromItemId, relation.toItemId]);
    return { ok: true, message: "Relation removed." };
  } catch {
    return { ok: false, message: "Failed to remove relation." };
  }
}
