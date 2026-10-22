"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { parseCsv, rowsToItemCsv } from "@/lib/csv/items-csv";
import { prisma } from "@/lib/prisma";

export type ItemRecord = {
  id: string;
  name: string;
  brand: string;
  majorColor: string;
  desc: string;
  quantity: number;
  unit: string;
  estimatedPrice: string;
  purchaseDate: string;
  notice: string;
  remarks: string;
  locationId: string | null;
  locationName: string | null;
  onSale: boolean;
  salePrice: string | null;
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
  brand: string;
  majorColor: string;
  desc: string;
  quantity: number;
  unit: string;
  estimatedPrice: string;
  purchaseDate: string;
  notice: string;
  remarks: string;
  locationId: string | null;
  location: { name: string } | null;
  saleListings?: { id: string; salePrice: string }[];
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
  const listing = item.saleListings?.[0];
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    majorColor: item.majorColor,
    desc: item.desc,
    quantity: item.quantity,
    unit: item.unit,
    estimatedPrice: item.estimatedPrice,
    purchaseDate: item.purchaseDate,
    notice: item.notice,
    remarks: item.remarks,
    locationId: item.locationId,
    locationName: item.location?.name ?? null,
    onSale: Boolean(listing),
    salePrice: listing?.salePrice ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

const itemInclude = {
  location: {
    select: { name: true },
  },
  saleListings: {
    select: { id: true, salePrice: true },
    take: 1,
  },
} as const;

export async function listItems(): Promise<ItemRecord[]> {
  const userId = await requireUserId();
  const items = await prisma.item.findMany({
    where: { userId },
    include: itemInclude,
    orderBy: { createdAt: "desc" },
  });
  return items.map(toItemRecord);
}

export async function getItem(id: string): Promise<ItemRecord | null> {
  const userId = await requireUserId();
  const item = await prisma.item.findFirst({
    where: { id, userId },
    include: itemInclude,
  });
  return item ? toItemRecord(item) : null;
}

export async function createItem(input: {
  name: string;
  brand?: string;
  majorColor?: string;
  desc?: string;
  quantity?: number;
  unit?: string;
  estimatedPrice?: string;
  purchaseDate?: string;
  notice?: string;
  remarks?: string;
  locationId?: string | null;
}): Promise<ItemActionResult> {
  try {
    const userId = await requireUserId();
    const name = input.name.trim();
    const brand = (input.brand ?? "").trim();
    const majorColor = (input.majorColor ?? "").trim();
    const desc = (input.desc ?? "").trim();
    const quantity = input.quantity ?? 1;
    const unit = (input.unit ?? "個").trim() || "個";
    const estimatedPrice = (input.estimatedPrice ?? "").trim();
    const purchaseDate = (input.purchaseDate ?? "").trim();
    const notice = (input.notice ?? "").trim();
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
        brand,
        majorColor,
        desc,
        quantity: Math.floor(quantity),
        unit,
        estimatedPrice,
        purchaseDate,
        notice,
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
  brand: string;
  majorColor: string;
  desc: string;
  quantity: number;
  unit: string;
  estimatedPrice: string;
  purchaseDate: string;
  notice: string;
  remarks: string;
  locationId?: string | null;
}): Promise<ItemActionResult> {
  try {
    const userId = await requireUserId();
    const name = input.name.trim();
    const brand = input.brand.trim();
    const majorColor = input.majorColor.trim();
    const desc = input.desc.trim();
    const unit = input.unit.trim() || "個";
    const estimatedPrice = input.estimatedPrice.trim();
    const purchaseDate = input.purchaseDate.trim();
    const notice = input.notice.trim();
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
        brand,
        majorColor,
        desc,
        quantity: Math.floor(input.quantity),
        unit,
        estimatedPrice,
        purchaseDate,
        notice,
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

export type ImportItemsResult = {
  ok: boolean;
  message: string;
  created?: number;
  failed?: number;
  errors?: string[];
};

export async function importItemsFromCsv(
  csvText: string,
): Promise<ImportItemsResult> {
  try {
    const parsed = rowsToItemCsv(parseCsv(csvText));
    if (!parsed.ok) {
      return { ok: false, message: parsed.message };
    }

    const userId = await requireUserId();
    const locations = await prisma.location.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    const locationByName = new Map(
      locations.map((location) => [location.name.trim().toLowerCase(), location.id]),
    );

    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < parsed.items.length; i += 1) {
      const row = parsed.items[i];
      const rowNumber = i + 2; // header is row 1
      const name = row.name.trim();
      if (!name) {
        errors.push(`Row ${rowNumber}: name is required.`);
        continue;
      }

      const quantityRaw = row.quantity.trim();
      const quantity = quantityRaw === "" ? 1 : Number(quantityRaw);
      if (!Number.isFinite(quantity) || quantity < 0) {
        errors.push(`Row ${rowNumber}: quantity must be zero or greater.`);
        continue;
      }

      const locationName = row.location.trim();
      let locationId: string | null = null;
      if (locationName) {
        const matched = locationByName.get(locationName.toLowerCase());
        if (!matched) {
          errors.push(
            `Row ${rowNumber}: location "${locationName}" was not found.`,
          );
          continue;
        }
        locationId = matched;
      }

      try {
        await prisma.item.create({
          data: {
            name,
            brand: row.brand.trim(),
            majorColor: row.majorColor.trim(),
            desc: row.desc.trim(),
            quantity: Math.floor(quantity),
            unit: row.unit.trim() || "個",
            estimatedPrice: row.estimatedPrice.trim(),
            purchaseDate: row.purchaseDate.trim(),
            notice: row.notice.trim(),
            remarks: row.remarks.trim(),
            locationId,
            userId,
          },
        });
        created += 1;
      } catch {
        errors.push(`Row ${rowNumber}: failed to create item.`);
      }
    }

    revalidatePath("/items");

    if (created === 0) {
      return {
        ok: false,
        message: "No items were imported.",
        created: 0,
        failed: errors.length,
        errors: errors.slice(0, 10),
      };
    }

    const failed = errors.length;
    return {
      ok: true,
      message:
        failed > 0
          ? `Imported ${created} item(s); ${failed} row(s) failed.`
          : `Imported ${created} item(s).`,
      created,
      failed,
      errors: errors.slice(0, 10),
    };
  } catch {
    return { ok: false, message: "Failed to import CSV." };
  }
}
