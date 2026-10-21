"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type SaleListingRecord = {
  id: string;
  itemId: string;
  itemName: string;
  itemBrand: string;
  salePrice: string;
  note: string;
  sellerUsername: string;
  isOwn: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SaleActionResult = {
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

function revalidateSalesPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/sales");
  revalidatePath("/sales/mine");
  revalidatePath("/items");
}

export async function listSharedSaleListings(): Promise<SaleListingRecord[]> {
  const userId = await requireUserId();
  const listings = await prisma.saleListing.findMany({
    include: {
      item: { select: { name: true, brand: true } },
      user: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return listings.map((listing) => ({
    id: listing.id,
    itemId: listing.itemId,
    itemName: listing.item.name,
    itemBrand: listing.item.brand,
    salePrice: listing.salePrice,
    note: listing.note,
    sellerUsername: listing.user.username.trim() || "Unknown",
    isOwn: listing.userId === userId,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  }));
}

export async function listMySaleListings(): Promise<SaleListingRecord[]> {
  const userId = await requireUserId();
  const listings = await prisma.saleListing.findMany({
    where: { userId },
    include: {
      item: { select: { name: true, brand: true } },
      user: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return listings.map((listing) => ({
    id: listing.id,
    itemId: listing.itemId,
    itemName: listing.item.name,
    itemBrand: listing.item.brand,
    salePrice: listing.salePrice,
    note: listing.note,
    sellerUsername: listing.user.username.trim() || "Unknown",
    isOwn: true,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  }));
}

export async function createSaleListing(input: {
  itemId: string;
  salePrice?: string;
  note?: string;
}): Promise<SaleActionResult> {
  try {
    const userId = await requireUserId();
    const item = await prisma.item.findFirst({
      where: { id: input.itemId, userId },
      select: { id: true },
    });

    if (!item) {
      return { ok: false, message: "Item not found." };
    }

    const existing = await prisma.saleListing.findUnique({
      where: {
        userId_itemId: { userId, itemId: item.id },
      },
      select: { id: true },
    });

    if (existing) {
      return { ok: false, message: "This item is already posted for sale." };
    }

    await prisma.saleListing.create({
      data: {
        itemId: item.id,
        userId,
        salePrice: (input.salePrice ?? "").trim(),
        note: (input.note ?? "").trim(),
      },
    });

    revalidateSalesPaths();
    return { ok: true, message: "Item posted for sale." };
  } catch {
    return { ok: false, message: "Failed to post item for sale." };
  }
}

export async function createSaleListingWithNewItem(input: {
  name: string;
  brand?: string;
  quantity?: number;
  unit?: string;
  salePrice?: string;
  note?: string;
}): Promise<SaleActionResult> {
  try {
    const userId = await requireUserId();
    const name = input.name.trim();
    const brand = (input.brand ?? "").trim();
    const quantity = input.quantity ?? 1;
    const unit = (input.unit ?? "個").trim() || "個";
    const salePrice = (input.salePrice ?? "").trim();
    const note = (input.note ?? "").trim();

    if (!name) {
      return { ok: false, message: "Item name is required." };
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      return { ok: false, message: "Quantity must be zero or greater." };
    }

    await prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          name,
          brand,
          quantity: Math.floor(quantity),
          unit,
          userId,
        },
      });

      await tx.saleListing.create({
        data: {
          itemId: item.id,
          userId,
          salePrice,
          note,
        },
      });
    });

    revalidateSalesPaths();
    return { ok: true, message: "Item created and posted for sale." };
  } catch {
    return { ok: false, message: "Failed to create and post item." };
  }
}

export async function updateSaleListing(input: {
  id: string;
  salePrice: string;
  note: string;
}): Promise<SaleActionResult> {
  try {
    const userId = await requireUserId();
    const result = await prisma.saleListing.updateMany({
      where: { id: input.id, userId },
      data: {
        salePrice: input.salePrice.trim(),
        note: input.note.trim(),
      },
    });

    if (result.count === 0) {
      return { ok: false, message: "Post not found." };
    }

    revalidateSalesPaths();
    return { ok: true, message: "Post updated." };
  } catch {
    return { ok: false, message: "Failed to update post." };
  }
}

export async function deleteSaleListing(id: string): Promise<SaleActionResult> {
  try {
    const userId = await requireUserId();
    const result = await prisma.saleListing.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      return { ok: false, message: "Post not found." };
    }

    revalidateSalesPaths();
    return { ok: true, message: "Post removed." };
  } catch {
    return { ok: false, message: "Failed to remove post." };
  }
}
