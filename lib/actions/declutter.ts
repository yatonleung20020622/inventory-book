"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { DeclutterStatus } from "@/lib/generated/prisma/enums";

export type DeclutterCategorySummary = {
  id: string;
  name: string;
  color: string;
};

export type DeclutterListingRecord = {
  id: string;
  title: string;
  description: string;
  condition: string;
  price: string;
  locationNote: string;
  contactNote: string;
  status: DeclutterStatus;
  sortOrder: number;
  categoryId: string | null;
  category: DeclutterCategorySummary | null;
  createdAt: string;
  updatedAt: string;
};

export type DeclutterActionResult = {
  ok: boolean;
  message: string;
  id?: string;
};

const PUBLIC_STATUSES: DeclutterStatus[] = ["AVAILABLE", "RESERVED", "GONE"];

const listingInclude = {
  category: {
    select: { id: true, name: true, color: true },
  },
} as const;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session.user;
}

function revalidateDeclutter(id?: string) {
  revalidatePath("/public/declutter");
  revalidatePath("/admin/declutter");
  if (id) {
    revalidatePath(`/public/declutter/${id}`);
  }
}

function toListingRecord(row: {
  id: string;
  title: string;
  description: string;
  condition: string;
  price: string;
  locationNote: string;
  contactNote: string;
  status: DeclutterStatus;
  sortOrder: number;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: DeclutterCategorySummary | null;
}): DeclutterListingRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    condition: row.condition,
    price: row.price,
    locationNote: row.locationNote,
    contactNote: row.contactNote,
    status: row.status,
    sortOrder: row.sortOrder,
    categoryId: row.categoryId,
    category: row.category,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function resolveOwnedCategoryId(
  userId: string,
  categoryId: string | null | undefined,
): Promise<string | null> {
  const trimmed = (categoryId ?? "").trim();
  if (!trimmed) return null;
  const category = await prisma.category.findFirst({
    where: { id: trimmed, userId },
    select: { id: true },
  });
  if (!category) {
    throw new Error("Invalid category.");
  }
  return category.id;
}

function parseStatus(value: string | undefined): DeclutterStatus | null {
  if (
    value === "AVAILABLE" ||
    value === "RESERVED" ||
    value === "GONE" ||
    value === "HIDDEN"
  ) {
    return value;
  }
  return null;
}

/** Public: visible listings only (never HIDDEN). */
export async function listPublicDeclutterListings(): Promise<
  DeclutterListingRecord[]
> {
  const rows = await prisma.declutterListing.findMany({
    where: { status: { in: PUBLIC_STATUSES } },
    include: listingInclude,
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  return rows.map(toListingRecord);
}

/** Public: single listing; null if missing or HIDDEN. */
export async function getPublicDeclutterListing(
  id: string,
): Promise<DeclutterListingRecord | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;
  const row = await prisma.declutterListing.findFirst({
    where: { id: trimmed, status: { in: PUBLIC_STATUSES } },
    include: listingInclude,
  });
  return row ? toListingRecord(row) : null;
}

/** Admin: all listings including HIDDEN. */
export async function listDeclutterListings(): Promise<DeclutterListingRecord[]> {
  await requireAdmin();
  const rows = await prisma.declutterListing.findMany({
    include: listingInclude,
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  return rows.map(toListingRecord);
}

export async function upsertDeclutterListing(input: {
  id?: string;
  title: string;
  description: string;
  condition: string;
  price: string;
  locationNote: string;
  contactNote: string;
  status: string;
  sortOrder: number;
  categoryId?: string | null;
}): Promise<DeclutterActionResult> {
  try {
    const admin = await requireAdmin();
    const title = input.title.trim();
    if (!title) {
      return { ok: false, message: "Title is required." };
    }
    const status = parseStatus(input.status);
    if (!status) {
      return { ok: false, message: "Invalid status." };
    }

    let categoryId: string | null;
    try {
      categoryId = await resolveOwnedCategoryId(admin.id, input.categoryId);
    } catch {
      return { ok: false, message: "Invalid category." };
    }

    const data = {
      title,
      description: input.description.trim(),
      condition: input.condition.trim(),
      price: input.price.trim(),
      locationNote: input.locationNote.trim(),
      contactNote: input.contactNote.trim(),
      status,
      sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
      categoryId,
    };

    if (input.id) {
      const existing = await prisma.declutterListing.findFirst({
        where: { id: input.id },
        select: { id: true },
      });
      if (!existing) {
        return { ok: false, message: "Listing not found." };
      }
      await prisma.declutterListing.update({
        where: { id: input.id },
        data,
      });
      revalidateDeclutter(input.id);
      return { ok: true, message: "Listing updated.", id: input.id };
    }

    const created = await prisma.declutterListing.create({ data });
    revalidateDeclutter(created.id);
    return { ok: true, message: "Listing added.", id: created.id };
  } catch {
    return { ok: false, message: "Failed to save listing." };
  }
}

export async function deleteDeclutterListing(
  id: string,
): Promise<DeclutterActionResult> {
  try {
    await requireAdmin();
    const existing = await prisma.declutterListing.findFirst({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, message: "Listing not found." };
    }
    await prisma.declutterListing.delete({ where: { id } });
    revalidateDeclutter(id);
    return { ok: true, message: "Listing deleted." };
  } catch {
    return { ok: false, message: "Failed to delete listing." };
  }
}
