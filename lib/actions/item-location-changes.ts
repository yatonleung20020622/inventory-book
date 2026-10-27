"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ItemLocationChangeRecord = {
  id: string;
  itemId: string;
  itemName: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  fromLocationName: string;
  toLocationName: string;
  createdAt: string;
};

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function listItemLocationChanges(): Promise<
  ItemLocationChangeRecord[]
> {
  const userId = await requireUserId();
  const rows = await prisma.itemLocationChange.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      itemId: true,
      fromLocationId: true,
      toLocationId: true,
      fromLocationName: true,
      toLocationName: true,
      createdAt: true,
      item: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    itemId: row.itemId,
    itemName: row.item.name,
    fromLocationId: row.fromLocationId,
    toLocationId: row.toLocationId,
    fromLocationName: row.fromLocationName,
    toLocationName: row.toLocationName,
    createdAt: row.createdAt.toISOString(),
  }));
}
