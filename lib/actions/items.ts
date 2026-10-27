"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { BOX_CONTAINS_TYPE, BOX_IN_TYPE } from "@/lib/box-relation";
import { parseBoxItemsCsv } from "@/lib/csv/box-items-csv";
import {
  buildItemsExportCsv,
  parseCsv,
  parseIsBoxCell,
  rowsToItemCsv,
  rowsToItemUpdateCsv,
  type ItemUpdateCsvRow,
} from "@/lib/csv/items-csv";
import { prisma } from "@/lib/prisma";

export type ItemCategorySummary = {
  id: string;
  name: string;
  color: string;
};

export type ItemRecord = {
  id: string;
  name: string;
  brand: string;
  majorColor: string;
  desc: string;
  quantity: number;
  unit: string;
  estimatedPrice: string;
  actualPrice: string;
  isBox: boolean;
  boxPurpose: string;
  purchaseDate: string;
  notice: string;
  remarks: string;
  locationId: string | null;
  locationName: string | null;
  categories: ItemCategorySummary[];
  onSale: boolean;
  salePrice: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ItemActionResult = {
  ok: boolean;
  message: string;
  itemId?: string;
};

export type ImportItemsResult = {
  ok: boolean;
  message: string;
  created?: number;
  failed?: number;
  errors?: string[];
};

export type ItemCsvFieldChange = {
  field: string;
  from: string;
  to: string;
};

export type ItemCsvUpdatePreview = {
  key: string;
  id: string;
  name: string;
  changes: ItemCsvFieldChange[];
  payload: {
    name: string;
    brand: string;
    majorColor: string;
    desc: string;
    quantity: number;
    unit: string;
    estimatedPrice: string;
    actualPrice: string;
    isBox: boolean;
    boxPurpose: string;
    purchaseDate: string;
    notice: string;
    remarks: string;
    locationId: string | null;
  };
};

export type PreviewItemCsvUpdatesResult = {
  ok: boolean;
  message: string;
  updates?: ItemCsvUpdatePreview[];
  unchangedCount?: number;
  errors?: string[];
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
  actualPrice: string;
  isBox: boolean;
  boxPurpose: string;
  purchaseDate: string;
  notice: string;
  remarks: string;
  locationId: string | null;
  location: { name: string } | null;
  categories?: { category: { id: string; name: string; color: string } }[];
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

async function resolveOwnedLocation(
  userId: string,
  locationId: string | null | undefined,
): Promise<{ id: string; name: string } | null> {
  if (!locationId) {
    return null;
  }

  const location = await prisma.location.findFirst({
    where: { id: locationId, userId },
    select: { id: true, name: true },
  });

  if (!location) {
    throw new Error("Invalid location.");
  }

  return location;
}

async function resolveOwnedLocationId(
  userId: string,
  locationId: string | null | undefined,
) {
  const location = await resolveOwnedLocation(userId, locationId);
  return location?.id ?? null;
}

async function resolveOwnedCategoryIds(
  userId: string,
  categoryIds: string[] | undefined,
) {
  const uniqueIds = Array.from(
    new Set((categoryIds ?? []).map((id) => id.trim()).filter(Boolean)),
  );

  if (uniqueIds.length === 0) {
    return [] as string[];
  }

  const categories = await prisma.category.findMany({
    where: { userId, id: { in: uniqueIds } },
    select: { id: true },
  });

  if (categories.length !== uniqueIds.length) {
    throw new Error("Invalid category.");
  }

  return categories.map((category) => category.id);
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
    actualPrice: item.actualPrice,
    isBox: item.isBox,
    boxPurpose: item.boxPurpose,
    purchaseDate: item.purchaseDate,
    notice: item.notice,
    remarks: item.remarks,
    locationId: item.locationId,
    locationName: item.location?.name ?? null,
    categories: (item.categories ?? []).map((row) => ({
      id: row.category.id,
      name: row.category.name,
      color: row.category.color,
    })),
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
  categories: {
    select: {
      category: {
        select: { id: true, name: true, color: true },
      },
    },
    orderBy: {
      category: { name: "asc" as const },
    },
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
  actualPrice?: string;
  isBox?: boolean;
  boxPurpose?: string;
  purchaseDate?: string;
  notice?: string;
  remarks?: string;
  locationId?: string | null;
  categoryIds?: string[];
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
    const actualPrice = (input.actualPrice ?? "").trim();
    const isBox = Boolean(input.isBox);
    const boxPurpose = isBox ? (input.boxPurpose ?? "").trim() : "";
    const purchaseDate = (input.purchaseDate ?? "").trim();
    const notice = (input.notice ?? "").trim();
    const remarks = (input.remarks ?? "").trim();
    const locationId = await resolveOwnedLocationId(userId, input.locationId);
    const categoryIds = await resolveOwnedCategoryIds(userId, input.categoryIds);

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
        actualPrice,
        isBox,
        boxPurpose,
        purchaseDate,
        notice,
        remarks,
        locationId,
        userId,
        categories: {
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
    });

    revalidatePath("/items");
    revalidatePath("/categories");
    revalidatePath("/dashboard");
    return { ok: true, message: "Item created." };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Invalid location." ||
        error.message === "Invalid category.")
    ) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Failed to create item." };
  }
}

/** Create an item inside a box with "contains" (box→item) and "in" (item→box). */
export async function createItemInBox(input: {
  boxId: string;
  name: string;
  brand?: string;
  quantity?: number;
  unit?: string;
  desc?: string;
}): Promise<ItemActionResult> {
  try {
    const userId = await requireUserId();
    const name = input.name.trim();
    const brand = (input.brand ?? "").trim();
    const desc = (input.desc ?? "").trim();
    const quantity = input.quantity ?? 1;
    const unit = (input.unit ?? "個").trim() || "個";

    if (!name) {
      return { ok: false, message: "Item name is required." };
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      return { ok: false, message: "Quantity must be zero or greater." };
    }

    const box = await prisma.item.findFirst({
      where: { id: input.boxId, userId, isBox: true },
      select: { id: true, locationId: true },
    });

    if (!box) {
      return { ok: false, message: "Box not found." };
    }

    const created = await prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          name,
          brand,
          desc,
          quantity: Math.floor(quantity),
          unit,
          locationId: box.locationId,
          userId,
          isBox: false,
          boxPurpose: "",
        },
      });

      await tx.itemRelation.createMany({
        data: [
          {
            fromItemId: box.id,
            toItemId: item.id,
            type: BOX_CONTAINS_TYPE,
            userId,
          },
          {
            fromItemId: item.id,
            toItemId: box.id,
            type: BOX_IN_TYPE,
            userId,
          },
        ],
      });

      return item;
    });

    revalidatePath("/items");
    revalidatePath(`/items/${box.id}`);
    revalidatePath(`/items/${created.id}`);
    revalidatePath("/dashboard");
    return {
      ok: true,
      message: "Item created in box.",
      itemId: created.id,
    };
  } catch {
    return { ok: false, message: "Failed to create item in box." };
  }
}

/** Bulk-create items inside a box from a CSV upload. */
export async function importItemsIntoBoxFromCsv(input: {
  boxId: string;
  csvText: string;
}): Promise<ImportItemsResult> {
  try {
    const userId = await requireUserId();
    const box = await prisma.item.findFirst({
      where: { id: input.boxId, userId, isBox: true },
      select: { id: true, locationId: true },
    });

    if (!box) {
      return { ok: false, message: "Box not found." };
    }

    const parsed = parseBoxItemsCsv(input.csvText);
    if (!parsed.ok) {
      return { ok: false, message: parsed.message };
    }

    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < parsed.items.length; i += 1) {
      const row = parsed.items[i];
      const rowNumber = i + 2;
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

      const brand = row.brand.trim();
      const desc = row.desc.trim();
      const unit = row.unit.trim() || "個";

      try {
        await prisma.$transaction(async (tx) => {
          const item = await tx.item.create({
            data: {
              name,
              brand,
              desc,
              quantity: Math.floor(quantity),
              unit,
              locationId: box.locationId,
              userId,
              isBox: false,
              boxPurpose: "",
            },
          });

          await tx.itemRelation.createMany({
            data: [
              {
                fromItemId: box.id,
                toItemId: item.id,
                type: BOX_CONTAINS_TYPE,
                userId,
              },
              {
                fromItemId: item.id,
                toItemId: box.id,
                type: BOX_IN_TYPE,
                userId,
              },
            ],
          });
        });
        created += 1;
      } catch {
        errors.push(`Row ${rowNumber}: failed to create item.`);
      }
    }

    revalidatePath("/items");
    revalidatePath(`/items/${box.id}`);
    revalidatePath("/dashboard");

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
          ? `Imported ${created} item(s) into box; ${failed} row(s) failed.`
          : `Imported ${created} item(s) into box.`,
      created,
      failed,
      errors: errors.slice(0, 10),
    };
  } catch {
    return { ok: false, message: "Failed to import CSV." };
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
  actualPrice: string;
  isBox: boolean;
  boxPurpose: string;
  purchaseDate: string;
  notice: string;
  remarks: string;
  locationId?: string | null;
  categoryIds?: string[];
}): Promise<ItemActionResult> {
  try {
    const userId = await requireUserId();
    const name = input.name.trim();
    const brand = input.brand.trim();
    const majorColor = input.majorColor.trim();
    const desc = input.desc.trim();
    const unit = input.unit.trim() || "個";
    const estimatedPrice = input.estimatedPrice.trim();
    const actualPrice = input.actualPrice.trim();
    const isBox = Boolean(input.isBox);
    const boxPurpose = isBox ? input.boxPurpose.trim() : "";
    const purchaseDate = input.purchaseDate.trim();
    const notice = input.notice.trim();
    const remarks = input.remarks.trim();
    const nextLocation = await resolveOwnedLocation(userId, input.locationId);
    const locationId = nextLocation?.id ?? null;
    const categoryIds = await resolveOwnedCategoryIds(userId, input.categoryIds);

    if (!name) {
      return { ok: false, message: "Item name is required." };
    }
    if (!Number.isFinite(input.quantity) || input.quantity < 0) {
      return { ok: false, message: "Quantity must be zero or greater." };
    }

    const existing = await prisma.item.findFirst({
      where: { id: input.id, userId },
      select: {
        id: true,
        locationId: true,
        location: { select: { name: true } },
      },
    });

    if (!existing) {
      return { ok: false, message: "Item not found." };
    }

    const locationChanged = existing.locationId !== locationId;

    await prisma.$transaction([
      ...(locationChanged
        ? [
            prisma.itemLocationChange.create({
              data: {
                itemId: input.id,
                userId,
                fromLocationId: existing.locationId,
                toLocationId: locationId,
                fromLocationName: existing.location?.name ?? "",
                toLocationName: nextLocation?.name ?? "",
              },
            }),
          ]
        : []),
      prisma.item.update({
        where: { id: input.id },
        data: {
          name,
          brand,
          majorColor,
          desc,
          quantity: Math.floor(input.quantity),
          unit,
          estimatedPrice,
          actualPrice,
          isBox,
          boxPurpose,
          purchaseDate,
          notice,
          remarks,
          locationId,
        },
      }),
      prisma.itemCategory.deleteMany({ where: { itemId: input.id } }),
      prisma.itemCategory.createMany({
        data: categoryIds.map((categoryId) => ({
          itemId: input.id,
          categoryId,
        })),
      }),
    ]);

    revalidatePath("/items");
    revalidatePath(`/items/${input.id}`);
    revalidatePath("/categories");
    revalidatePath("/dashboard");
    return { ok: true, message: "Item updated." };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Invalid location." ||
        error.message === "Invalid category.")
    ) {
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
    revalidatePath("/dashboard");
    return { ok: true, message: "Item deleted." };
  } catch {
    return { ok: false, message: "Failed to delete item." };
  }
}

/** Shallow-copy an item (fields + categories). Does not copy relations, sales, or box contents. */
export async function duplicateItem(id: string): Promise<ItemActionResult> {
  try {
    const userId = await requireUserId();
    const source = await prisma.item.findFirst({
      where: { id, userId },
      include: {
        categories: { select: { categoryId: true } },
      },
    });

    if (!source) {
      return { ok: false, message: "Item not found." };
    }

    const created = await prisma.item.create({
      data: {
        name: `${source.name} (copy)`,
        brand: source.brand,
        majorColor: source.majorColor,
        desc: source.desc,
        quantity: source.quantity,
        unit: source.unit,
        estimatedPrice: source.estimatedPrice,
        actualPrice: source.actualPrice,
        isBox: source.isBox,
        boxPurpose: source.boxPurpose,
        purchaseDate: source.purchaseDate,
        notice: source.notice,
        remarks: source.remarks,
        locationId: source.locationId,
        userId,
        categories: {
          create: source.categories.map((category) => ({
            categoryId: category.categoryId,
          })),
        },
      },
      select: { id: true },
    });

    revalidatePath("/items");
    revalidatePath(`/items/${created.id}`);
    revalidatePath("/categories");
    revalidatePath("/dashboard");
    return {
      ok: true,
      message: "Item duplicated.",
      itemId: created.id,
    };
  } catch {
    return { ok: false, message: "Failed to duplicate item." };
  }
}

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

export async function exportItemsCsv(): Promise<
  { ok: true; csv: string } | { ok: false; message: string }
> {
  try {
    const items = await listItems();
    const csv = buildItemsExportCsv(items);
    return { ok: true, csv };
  } catch {
    return { ok: false, message: "Failed to export CSV." };
  }
}

function normalizeCsvQuantity(
  raw: string,
): { ok: true; value: number } | { ok: false; message: string } {
  const quantity = raw.trim() === "" ? 1 : Number(raw.trim());
  if (!Number.isFinite(quantity) || quantity < 0) {
    return { ok: false, message: "quantity must be zero or greater." };
  }
  return { ok: true, value: Math.floor(quantity) };
}

function compareItemFields(
  existing: {
    name: string;
    brand: string;
    majorColor: string;
    desc: string;
    quantity: number;
    unit: string;
    estimatedPrice: string;
    actualPrice: string;
    isBox: boolean;
    boxPurpose: string;
    purchaseDate: string;
    notice: string;
    remarks: string;
    locationName: string | null;
  },
  next: {
    name: string;
    brand: string;
    majorColor: string;
    desc: string;
    quantity: number;
    unit: string;
    estimatedPrice: string;
    actualPrice: string;
    isBox: boolean;
    boxPurpose: string;
    purchaseDate: string;
    notice: string;
    remarks: string;
    locationName: string;
  },
): ItemCsvFieldChange[] {
  const pairs: Array<{ field: string; from: string; to: string }> = [
    { field: "name", from: existing.name, to: next.name },
    { field: "brand", from: existing.brand, to: next.brand },
    { field: "majorColor", from: existing.majorColor, to: next.majorColor },
    { field: "desc", from: existing.desc, to: next.desc },
    {
      field: "quantity",
      from: String(existing.quantity),
      to: String(next.quantity),
    },
    { field: "unit", from: existing.unit, to: next.unit },
    {
      field: "estimatedPrice",
      from: existing.estimatedPrice,
      to: next.estimatedPrice,
    },
    {
      field: "actualPrice",
      from: existing.actualPrice,
      to: next.actualPrice,
    },
    {
      field: "isBox",
      from: existing.isBox ? "true" : "false",
      to: next.isBox ? "true" : "false",
    },
    { field: "boxPurpose", from: existing.boxPurpose, to: next.boxPurpose },
    {
      field: "purchaseDate",
      from: existing.purchaseDate,
      to: next.purchaseDate,
    },
    { field: "notice", from: existing.notice, to: next.notice },
    { field: "remarks", from: existing.remarks, to: next.remarks },
    {
      field: "location",
      from: existing.locationName ?? "",
      to: next.locationName,
    },
  ];

  return pairs.filter((pair) => pair.from !== pair.to);
}

function rowToUpdatePayload(
  row: ItemUpdateCsvRow,
  locationId: string | null,
): ItemCsvUpdatePreview["payload"] {
  const isBox = parseIsBoxCell(row.isBox);
  const quantity = normalizeCsvQuantity(row.quantity);
  return {
    name: row.name.trim(),
    brand: row.brand.trim(),
    majorColor: row.majorColor.trim(),
    desc: row.desc.trim(),
    quantity: quantity.ok ? quantity.value : 1,
    unit: row.unit.trim() || "個",
    estimatedPrice: row.estimatedPrice.trim(),
    actualPrice: row.actualPrice.trim(),
    isBox,
    boxPurpose: isBox ? row.boxPurpose.trim() : "",
    purchaseDate: row.purchaseDate.trim(),
    notice: row.notice.trim(),
    remarks: row.remarks.trim(),
    locationId,
  };
}

export async function previewItemCsvUpdates(
  csvText: string,
): Promise<PreviewItemCsvUpdatesResult> {
  try {
    const parsed = rowsToItemUpdateCsv(parseCsv(csvText));
    if (!parsed.ok) {
      return { ok: false, message: parsed.message };
    }

    const userId = await requireUserId();
    const [existingItems, locations] = await Promise.all([
      prisma.item.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          brand: true,
          majorColor: true,
          desc: true,
          quantity: true,
          unit: true,
          estimatedPrice: true,
          actualPrice: true,
          isBox: true,
          boxPurpose: true,
          purchaseDate: true,
          notice: true,
          remarks: true,
          locationId: true,
          location: { select: { name: true } },
        },
      }),
      prisma.location.findMany({
        where: { userId },
        select: { id: true, name: true },
      }),
    ]);

    const itemById = new Map(existingItems.map((item) => [item.id, item]));
    const locationByName = new Map(
      locations.map((location) => [
        location.name.trim().toLowerCase(),
        location.id,
      ]),
    );

    const updates: ItemCsvUpdatePreview[] = [];
    const errors: string[] = [];
    let unchangedCount = 0;

    for (let i = 0; i < parsed.items.length; i += 1) {
      const row = parsed.items[i];
      const rowNumber = i + 2;
      const id = row.id.trim();

      if (!id) {
        errors.push(
          `Row ${rowNumber}: id is required for updates. Use Import CSV to add new items.`,
        );
        continue;
      }

      const existing = itemById.get(id);
      if (!existing) {
        errors.push(`Row ${rowNumber}: item id was not found.`);
        continue;
      }

      const name = row.name.trim();
      if (!name) {
        errors.push(`Row ${rowNumber}: name is required.`);
        continue;
      }

      const quantityResult = normalizeCsvQuantity(row.quantity);
      if (!quantityResult.ok) {
        errors.push(`Row ${rowNumber}: ${quantityResult.message}`);
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

      const isBox = parseIsBoxCell(row.isBox);
      const boxPurpose = isBox ? row.boxPurpose.trim() : "";
      const next = {
        name,
        brand: row.brand.trim(),
        majorColor: row.majorColor.trim(),
        desc: row.desc.trim(),
        quantity: quantityResult.value,
        unit: row.unit.trim() || "個",
        estimatedPrice: row.estimatedPrice.trim(),
        actualPrice: row.actualPrice.trim(),
        isBox,
        boxPurpose,
        purchaseDate: row.purchaseDate.trim(),
        notice: row.notice.trim(),
        remarks: row.remarks.trim(),
        locationName,
      };

      const changes = compareItemFields(
        {
          ...existing,
          locationName: existing.location?.name ?? null,
        },
        next,
      );

      if (changes.length === 0) {
        unchangedCount += 1;
        continue;
      }

      updates.push({
        key: `${id}-${rowNumber}`,
        id,
        name: existing.name,
        changes,
        payload: rowToUpdatePayload(row, locationId),
      });
    }

    if (updates.length === 0 && errors.length === 0) {
      return {
        ok: true,
        message:
          unchangedCount > 0
            ? `No changes found (${unchangedCount} row(s) unchanged).`
            : "No changes found.",
        updates: [],
        unchangedCount,
        errors: [],
      };
    }

    if (updates.length === 0) {
      return {
        ok: false,
        message: "No valid updates to apply.",
        updates: [],
        unchangedCount,
        errors: errors.slice(0, 20),
      };
    }

    return {
      ok: true,
      message: `Found ${updates.length} update(s).`,
      updates,
      unchangedCount,
      errors: errors.slice(0, 20),
    };
  } catch {
    return { ok: false, message: "Failed to preview CSV updates." };
  }
}

export async function applyItemCsvUpdate(
  change: ItemCsvUpdatePreview,
): Promise<ItemActionResult> {
  try {
    const userId = await requireUserId();
    const existing = await prisma.item.findFirst({
      where: { id: change.id, userId },
      select: {
        id: true,
        categories: { select: { categoryId: true } },
      },
    });

    if (!existing) {
      return { ok: false, message: "Item not found." };
    }

    return updateItem({
      id: change.id,
      ...change.payload,
      categoryIds: existing.categories.map((row) => row.categoryId),
    });
  } catch {
    return { ok: false, message: "Failed to apply CSV update." };
  }
}
