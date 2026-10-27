"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type LocationRecord = {
  id: string;
  name: string;
  address: string;
  lat: string;
  lon: string;
  isExpired: boolean;
  isDefault: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type LocationActionResult = {
  ok: boolean;
  message: string;
};

type LocationRow = {
  id: string;
  name: string;
  address: string;
  lat: string;
  lon: string;
  isExpired: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { items: number };
};

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

function toLocationRecord(location: LocationRow): LocationRecord {
  return {
    id: location.id,
    name: location.name,
    address: location.address,
    lat: location.lat,
    lon: location.lon,
    isExpired: location.isExpired,
    isDefault: location.isDefault,
    itemCount: location._count.items,
    createdAt: location.createdAt.toISOString(),
    updatedAt: location.updatedAt.toISOString(),
  };
}

async function clearOtherDefaults(userId: string, keepId?: string) {
  await prisma.location.updateMany({
    where: {
      userId,
      isDefault: true,
      ...(keepId ? { id: { not: keepId } } : {}),
    },
    data: { isDefault: false },
  });
}

export async function listLocations(): Promise<LocationRecord[]> {
  const userId = await requireUserId();
  const locations = await prisma.location.findMany({
    where: { userId },
    include: { _count: { select: { items: true } } },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return locations.map(toLocationRecord);
}

export async function createLocation(input: {
  name: string;
  address?: string;
  lat?: string;
  lon?: string;
  isExpired?: boolean;
  isDefault?: boolean;
}): Promise<LocationActionResult> {
  try {
    const userId = await requireUserId();
    const name = input.name.trim();
    const address = (input.address ?? "").trim();
    const lat = (input.lat ?? "").trim();
    const lon = (input.lon ?? "").trim();
    const isExpired = Boolean(input.isExpired);

    if (!name) {
      return { ok: false, message: "Location name is required." };
    }

    const count = await prisma.location.count({ where: { userId } });
    const isDefault = count === 0 ? true : Boolean(input.isDefault);

    if (isDefault) {
      await clearOtherDefaults(userId);
    }

    await prisma.location.create({
      data: {
        name,
        address,
        lat,
        lon,
        isExpired,
        isDefault,
        userId,
      },
    });

    revalidatePath("/locations");
    revalidatePath("/items");
    return { ok: true, message: "Location created." };
  } catch {
    return { ok: false, message: "Failed to create location." };
  }
}

export async function updateLocation(input: {
  id: string;
  name: string;
  address: string;
  lat: string;
  lon: string;
  isExpired: boolean;
  isDefault: boolean;
}): Promise<LocationActionResult> {
  try {
    const userId = await requireUserId();
    const name = input.name.trim();
    const address = input.address.trim();
    const lat = input.lat.trim();
    const lon = input.lon.trim();
    const isDefault = Boolean(input.isDefault);
    const isExpired = Boolean(input.isExpired);

    if (!name) {
      return { ok: false, message: "Location name is required." };
    }

    const existing = await prisma.location.findFirst({
      where: { id: input.id, userId },
      select: { id: true, isExpired: true },
    });

    if (!existing) {
      return { ok: false, message: "Location not found." };
    }

    if (isExpired && !existing.isExpired) {
      const itemCount = await prisma.item.count({
        where: { locationId: input.id, userId },
      });
      if (itemCount > 0) {
        return {
          ok: false,
          message:
            itemCount === 1
              ? "Cannot mark as expired while 1 item is still at this location."
              : `Cannot mark as expired while ${itemCount} items are still at this location.`,
        };
      }
    }

    if (isDefault) {
      await clearOtherDefaults(userId, input.id);
    }

    const result = await prisma.location.updateMany({
      where: { id: input.id, userId },
      data: {
        name,
        address,
        lat,
        lon,
        isExpired,
        isDefault,
      },
    });

    if (result.count === 0) {
      return { ok: false, message: "Location not found." };
    }

    // Keep exactly one default when possible.
    if (!isDefault) {
      const defaults = await prisma.location.count({
        where: { userId, isDefault: true },
      });
      if (defaults === 0) {
        const fallback = await prisma.location.findFirst({
          where: { userId },
          orderBy: { createdAt: "asc" },
        });
        if (fallback) {
          await prisma.location.update({
            where: { id: fallback.id },
            data: { isDefault: true },
          });
        }
      }
    }

    revalidatePath("/locations");
    revalidatePath("/items");
    return { ok: true, message: "Location updated." };
  } catch {
    return { ok: false, message: "Failed to update location." };
  }
}

export async function setDefaultLocation(
  id: string,
): Promise<LocationActionResult> {
  try {
    const userId = await requireUserId();
    const location = await prisma.location.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!location) {
      return { ok: false, message: "Location not found." };
    }

    await clearOtherDefaults(userId, id);
    await prisma.location.update({
      where: { id },
      data: { isDefault: true },
    });

    revalidatePath("/locations");
    revalidatePath("/items");
    return { ok: true, message: "Default location updated." };
  } catch {
    return { ok: false, message: "Failed to set default location." };
  }
}

export async function deleteLocation(id: string): Promise<LocationActionResult> {
  try {
    const userId = await requireUserId();
    const existing = await prisma.location.findFirst({
      where: { id, userId },
      select: { id: true, isDefault: true },
    });

    if (!existing) {
      return { ok: false, message: "Location not found." };
    }

    await prisma.location.delete({ where: { id } });

    if (existing.isDefault) {
      const fallback = await prisma.location.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
      if (fallback) {
        await prisma.location.update({
          where: { id: fallback.id },
          data: { isDefault: true },
        });
      }
    }

    revalidatePath("/locations");
    revalidatePath("/items");
    return { ok: true, message: "Location deleted." };
  } catch {
    return { ok: false, message: "Failed to delete location." };
  }
}
