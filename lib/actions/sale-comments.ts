"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type SaleCommentRecord = {
  id: string;
  listingId: string;
  body: string;
  authorUsername: string;
  isOwn: boolean;
  canDelete: boolean;
  createdAt: string;
};

export type SaleCommentActionResult = {
  ok: boolean;
  message: string;
};

async function requireSessionUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return {
    id: session.user.id,
    role: session.user.role,
  };
}

function revalidateListing(listingId: string) {
  revalidatePath(`/sales/${listingId}`);
  revalidatePath("/sales");
}

export async function listSaleComments(
  listingId: string,
): Promise<SaleCommentRecord[]> {
  const user = await requireSessionUser();

  const listing = await prisma.saleListing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  if (!listing) {
    return [];
  }

  const comments = await prisma.saleListingComment.findMany({
    where: { listingId },
    include: {
      user: { select: { username: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return comments.map((comment) => {
    const isOwn = comment.userId === user.id;
    return {
      id: comment.id,
      listingId: comment.listingId,
      body: comment.body,
      authorUsername: comment.user.username.trim() || "Unknown",
      isOwn,
      canDelete: isOwn || user.role === "ADMIN",
      createdAt: comment.createdAt.toISOString(),
    };
  });
}

export async function createSaleComment(input: {
  listingId: string;
  body: string;
}): Promise<SaleCommentActionResult> {
  try {
    const user = await requireSessionUser();
    const body = input.body.trim();

    if (!body) {
      return { ok: false, message: "Comment cannot be empty." };
    }
    if (body.length > 2000) {
      return { ok: false, message: "Comment must be 2000 characters or less." };
    }

    const listing = await prisma.saleListing.findUnique({
      where: { id: input.listingId },
      select: { id: true },
    });
    if (!listing) {
      return { ok: false, message: "Listing not found." };
    }

    await prisma.saleListingComment.create({
      data: {
        listingId: listing.id,
        userId: user.id,
        body,
      },
    });

    revalidateListing(listing.id);
    return { ok: true, message: "Comment posted." };
  } catch {
    return { ok: false, message: "Failed to post comment." };
  }
}

export async function deleteSaleComment(
  id: string,
): Promise<SaleCommentActionResult> {
  try {
    const user = await requireSessionUser();
    const comment = await prisma.saleListingComment.findUnique({
      where: { id },
      select: { id: true, listingId: true, userId: true },
    });

    if (!comment) {
      return { ok: false, message: "Comment not found." };
    }

    if (comment.userId !== user.id && user.role !== "ADMIN") {
      return { ok: false, message: "You cannot delete this comment." };
    }

    await prisma.saleListingComment.delete({ where: { id: comment.id } });
    revalidateListing(comment.listingId);
    return { ok: true, message: "Comment deleted." };
  } catch {
    return { ok: false, message: "Failed to delete comment." };
  }
}
