"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type CategoryRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type CategoryActionResult = {
  ok: boolean;
  message: string;
};

type CategoryRow = {
  id: string;
  name: string;
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

function toCategoryRecord(category: CategoryRow): CategoryRecord {
  return {
    id: category.id,
    name: category.name,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export async function listCategories(): Promise<CategoryRecord[]> {
  const userId = await requireUserId();
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
  return categories.map(toCategoryRecord);
}

export async function createCategory(input: {
  name: string;
}): Promise<CategoryActionResult> {
  try {
    const userId = await requireUserId();
    const name = input.name.trim();

    if (!name) {
      return { ok: false, message: "Category name is required." };
    }

    await prisma.category.create({
      data: {
        name,
        userId,
      },
    });

    revalidatePath("/categories");
    revalidatePath("/items");
    return { ok: true, message: "Category created." };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { ok: false, message: "A category with that name already exists." };
    }
    return { ok: false, message: "Failed to create category." };
  }
}

export async function updateCategory(input: {
  id: string;
  name: string;
}): Promise<CategoryActionResult> {
  try {
    const userId = await requireUserId();
    const name = input.name.trim();

    if (!name) {
      return { ok: false, message: "Category name is required." };
    }

    const result = await prisma.category.updateMany({
      where: { id: input.id, userId },
      data: { name },
    });

    if (result.count === 0) {
      return { ok: false, message: "Category not found." };
    }

    revalidatePath("/categories");
    revalidatePath("/items");
    return { ok: true, message: "Category updated." };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { ok: false, message: "A category with that name already exists." };
    }
    return { ok: false, message: "Failed to update category." };
  }
}

export async function deleteCategory(id: string): Promise<CategoryActionResult> {
  try {
    const userId = await requireUserId();
    const result = await prisma.category.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      return { ok: false, message: "Category not found." };
    }

    revalidatePath("/categories");
    revalidatePath("/items");
    return { ok: true, message: "Category deleted." };
  } catch {
    return { ok: false, message: "Failed to delete category." };
  }
}
