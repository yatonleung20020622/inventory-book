"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type SaleCondition = "new" | "like-new" | "used" | "";

export type SaleListingRecord = {
  id: string;
  itemId: string;
  name: string;
  brand: string;
  quantity: number;
  unit: string;
  desc: string;
  notice: string;
  purchaseDate: string;
  condition: SaleCondition;
  isVirtual: boolean;
  salePrice: string;
  note: string;
  sellerUsername: string;
  sellerPhone: string;
  isOwn: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SaleActionResult = {
  ok: boolean;
  message: string;
};

type ItemFallbackFields = {
  name: string;
  brand: string;
  quantity: number;
  unit: string;
  estimatedPrice: string;
  desc: string;
  notice: string;
  purchaseDate: string;
};

const CONDITION_VALUES = new Set(["new", "like-new", "used", ""]);

function normalizeCondition(value: string | undefined | null): SaleCondition {
  const trimmed = (value ?? "").trim();
  return CONDITION_VALUES.has(trimmed) ? (trimmed as SaleCondition) : "";
}

function requireNonEmpty(value: string | undefined | null, fallback: string) {
  const trimmed = (value ?? "").trim();
  return trimmed || fallback;
}

function resolveListingFields(
  input: {
    name?: string;
    brand?: string;
    quantity?: number;
    unit?: string;
    desc?: string;
    notice?: string;
    purchaseDate?: string;
    condition?: string;
    isVirtual?: boolean;
    salePrice?: string;
    note?: string;
  },
  item: ItemFallbackFields,
) {
  const name = requireNonEmpty(input.name, item.name);
  const brand = requireNonEmpty(input.brand, item.brand);
  const unit = requireNonEmpty(input.unit, item.unit) || "個";
  const desc = requireNonEmpty(input.desc, item.desc);
  const notice = requireNonEmpty(input.notice, item.notice);
  const purchaseDate = requireNonEmpty(input.purchaseDate, item.purchaseDate);
  const condition = normalizeCondition(input.condition);
  const isVirtual = Boolean(input.isVirtual);
  const salePrice = requireNonEmpty(input.salePrice, item.estimatedPrice);
  const note = (input.note ?? "").trim();

  const quantityRaw = input.quantity;
  const quantity =
    quantityRaw === undefined ||
    quantityRaw === null ||
    !Number.isFinite(quantityRaw)
      ? item.quantity
      : Math.floor(quantityRaw);

  return {
    name,
    brand,
    quantity,
    unit,
    desc,
    notice,
    purchaseDate,
    condition,
    isVirtual,
    salePrice,
    note,
  };
}

function mapListingRecord(
  listing: {
    id: string;
    itemId: string;
    name: string;
    brand: string;
    quantity: number;
    unit: string;
    desc: string;
    notice: string;
    purchaseDate: string;
    condition: string;
    isVirtual: boolean;
    salePrice: string;
    note: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    item: ItemFallbackFields;
    user: { username: string; phone: string };
  },
  currentUserId: string,
): SaleListingRecord {
  const unfilled = !listing.name.trim();
  const name = listing.name.trim() || listing.item.name;
  const brand = listing.brand.trim() || listing.item.brand;
  const unit = listing.unit.trim() || listing.item.unit || "個";
  const desc = listing.desc.trim() || listing.item.desc;
  const notice = listing.notice.trim() || listing.item.notice;
  const purchaseDate =
    listing.purchaseDate.trim() || listing.item.purchaseDate;
  const salePrice =
    listing.salePrice.trim() || listing.item.estimatedPrice;
  const quantity = unfilled ? listing.item.quantity : listing.quantity;

  return {
    id: listing.id,
    itemId: listing.itemId,
    name,
    brand,
    quantity,
    unit,
    desc,
    notice,
    purchaseDate,
    condition: normalizeCondition(listing.condition),
    isVirtual: listing.isVirtual,
    salePrice,
    note: listing.note,
    sellerUsername: listing.user.username.trim() || "Unknown",
    sellerPhone: listing.user.phone.trim(),
    isOwn: listing.userId === currentUserId,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  };
}

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

const itemFallbackSelect = {
  name: true,
  brand: true,
  quantity: true,
  unit: true,
  estimatedPrice: true,
  desc: true,
  notice: true,
  purchaseDate: true,
} as const;

const listingInclude = {
  item: { select: itemFallbackSelect },
  user: { select: { username: true, phone: true } },
} as const;

export async function listSharedSaleListings(): Promise<SaleListingRecord[]> {
  const userId = await requireUserId();
  const listings = await prisma.saleListing.findMany({
    include: listingInclude,
    orderBy: { createdAt: "desc" },
  });

  return listings.map((listing) => mapListingRecord(listing, userId));
}

export async function listMySaleListings(): Promise<SaleListingRecord[]> {
  const userId = await requireUserId();
  const listings = await prisma.saleListing.findMany({
    where: { userId },
    include: listingInclude,
    orderBy: { createdAt: "desc" },
  });

  return listings.map((listing) => mapListingRecord(listing, userId));
}

export async function getSaleListing(
  id: string,
): Promise<SaleListingRecord | null> {
  const userId = await requireUserId();
  const listing = await prisma.saleListing.findUnique({
    where: { id },
    include: listingInclude,
  });
  if (!listing) return null;
  return mapListingRecord(listing, userId);
}

export async function createSaleListing(input: {
  itemId: string;
  name?: string;
  brand?: string;
  quantity?: number;
  unit?: string;
  desc?: string;
  notice?: string;
  purchaseDate?: string;
  condition?: string;
  isVirtual?: boolean;
  salePrice?: string;
  note?: string;
}): Promise<SaleActionResult> {
  try {
    const userId = await requireUserId();
    const item = await prisma.item.findFirst({
      where: { id: input.itemId, userId },
      select: { id: true, ...itemFallbackSelect },
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

    const fields = resolveListingFields(input, item);
    if (!fields.name) {
      return { ok: false, message: "Item name is required." };
    }
    if (!Number.isFinite(fields.quantity) || fields.quantity < 0) {
      return { ok: false, message: "Quantity must be zero or greater." };
    }

    await prisma.saleListing.create({
      data: {
        itemId: item.id,
        userId,
        ...fields,
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
  desc?: string;
  notice?: string;
  purchaseDate?: string;
  condition?: string;
  isVirtual?: boolean;
  salePrice?: string;
  note?: string;
}): Promise<SaleActionResult> {
  try {
    const userId = await requireUserId();
    const name = input.name.trim();
    const brand = (input.brand ?? "").trim();
    const quantity = input.quantity ?? 1;
    const unit = (input.unit ?? "個").trim() || "個";
    const desc = (input.desc ?? "").trim();
    const notice = (input.notice ?? "").trim();
    const purchaseDate = (input.purchaseDate ?? "").trim();
    const condition = normalizeCondition(input.condition);
    const isVirtual = Boolean(input.isVirtual);
    const salePrice = (input.salePrice ?? "").trim();
    const note = (input.note ?? "").trim();

    if (!name) {
      return { ok: false, message: "Item name is required." };
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      return { ok: false, message: "Quantity must be zero or greater." };
    }

    const qty = Math.floor(quantity);

    await prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          name,
          brand,
          quantity: qty,
          unit,
          desc,
          notice,
          purchaseDate,
          userId,
        },
      });

      await tx.saleListing.create({
        data: {
          itemId: item.id,
          userId,
          name,
          brand,
          quantity: qty,
          unit,
          desc,
          notice,
          purchaseDate,
          condition,
          isVirtual,
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
  name?: string;
  brand?: string;
  quantity?: number;
  unit?: string;
  desc?: string;
  notice?: string;
  purchaseDate?: string;
  condition?: string;
  isVirtual?: boolean;
  salePrice: string;
  note: string;
}): Promise<SaleActionResult> {
  try {
    const userId = await requireUserId();
    const existing = await prisma.saleListing.findFirst({
      where: { id: input.id, userId },
      include: {
        item: { select: itemFallbackSelect },
      },
    });

    if (!existing) {
      return { ok: false, message: "Post not found." };
    }

    const fields = resolveListingFields(input, existing.item);
    if (!fields.name) {
      return { ok: false, message: "Item name is required." };
    }
    if (!Number.isFinite(fields.quantity) || fields.quantity < 0) {
      return { ok: false, message: "Quantity must be zero or greater." };
    }

    await prisma.saleListing.update({
      where: { id: existing.id },
      data: fields,
    });

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
