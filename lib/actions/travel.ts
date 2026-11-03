"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type TravelVisitRecord = {
  id: string;
  placeId: string;
  visitedAt: string;
  notes: string;
  companions: string;
  createdAt: string;
  updatedAt: string;
};

export type TravelPlaceRecord = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  groupId: string | null;
  groupName: string;
  groupColor: string;
  visits: TravelVisitRecord[];
  createdAt: string;
  updatedAt: string;
};

export type TravelActionResult = {
  ok: boolean;
  message: string;
  placeId?: string;
  visitId?: string;
};

type VisitRow = {
  id: string;
  placeId: string;
  visitedAt: string;
  notes: string;
  companions: string;
  createdAt: Date;
  updatedAt: Date;
};

type PlaceRow = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  groupId: string | null;
  createdAt: Date;
  updatedAt: Date;
  visits: VisitRow[];
  group: { id: string; name: string; color: string } | null;
};

async function requireLogin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
}

function revalidateTravel() {
  revalidatePath("/travel");
  revalidatePath("/travel/places");
}

function toVisitRecord(visit: VisitRow): TravelVisitRecord {
  return {
    id: visit.id,
    placeId: visit.placeId,
    visitedAt: visit.visitedAt,
    notes: visit.notes,
    companions: visit.companions,
    createdAt: visit.createdAt.toISOString(),
    updatedAt: visit.updatedAt.toISOString(),
  };
}

function toPlaceRecord(place: PlaceRow): TravelPlaceRecord {
  return {
    id: place.id,
    name: place.name,
    address: place.address,
    lat: place.lat,
    lon: place.lon,
    groupId: place.groupId,
    groupName: place.group?.name ?? "",
    groupColor: place.group?.color ?? "",
    visits: place.visits.map(toVisitRecord),
    createdAt: place.createdAt.toISOString(),
    updatedAt: place.updatedAt.toISOString(),
  };
}

function parseCoord(value: number, label: string): number | null {
  if (!Number.isFinite(value)) return null;
  if (label === "lat" && (value < -90 || value > 90)) return null;
  if (label === "lon" && (value < -180 || value > 180)) return null;
  return value;
}

async function resolveGroupId(
  groupId: string | null | undefined,
): Promise<{ ok: true; groupId: string | null } | { ok: false; message: string }> {
  if (!groupId) {
    return { ok: true, groupId: null };
  }
  const group = await prisma.travelGroup.findUnique({
    where: { id: groupId },
    select: { id: true },
  });
  if (!group) {
    return { ok: false, message: "Group not found." };
  }
  return { ok: true, groupId: group.id };
}

export async function listTravelPlaces(): Promise<TravelPlaceRecord[]> {
  await requireLogin();
  const places = await prisma.travelPlace.findMany({
    include: {
      group: { select: { id: true, name: true, color: true } },
      visits: { orderBy: [{ visitedAt: "desc" }, { createdAt: "desc" }] },
    },
    orderBy: { createdAt: "desc" },
  });
  return places.map(toPlaceRecord);
}

export async function createTravelPlace(input: {
  name: string;
  lat: number;
  lon: number;
  address?: string;
  groupId?: string | null;
  firstVisit: {
    visitedAt: string;
    notes?: string;
    companions?: string;
  };
}): Promise<TravelActionResult> {
  try {
    await requireLogin();
    const name = input.name.trim();
    const address = (input.address ?? "").trim();
    const lat = parseCoord(Number(input.lat), "lat");
    const lon = parseCoord(Number(input.lon), "lon");
    const visitedAt = input.firstVisit.visitedAt.trim();
    const notes = (input.firstVisit.notes ?? "").trim();
    const companions = (input.firstVisit.companions ?? "").trim();
    const groupResult = await resolveGroupId(input.groupId);

    if (!name) {
      return { ok: false, message: "Place name is required." };
    }
    if (lat === null || lon === null) {
      return { ok: false, message: "Valid latitude and longitude are required." };
    }
    if (!visitedAt) {
      return { ok: false, message: "Visit date is required." };
    }
    if (!groupResult.ok) {
      return { ok: false, message: groupResult.message };
    }

    const place = await prisma.travelPlace.create({
      data: {
        name,
        address,
        lat,
        lon,
        groupId: groupResult.groupId,
        visits: {
          create: {
            visitedAt,
            notes,
            companions,
          },
        },
      },
    });

    revalidateTravel();
    return {
      ok: true,
      message: "Place created.",
      placeId: place.id,
    };
  } catch {
    return { ok: false, message: "Failed to create place." };
  }
}

export async function updateTravelPlace(input: {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  groupId?: string | null;
}): Promise<TravelActionResult> {
  try {
    await requireLogin();
    const name = input.name.trim();
    const address = input.address.trim();
    const lat = parseCoord(Number(input.lat), "lat");
    const lon = parseCoord(Number(input.lon), "lon");
    const groupResult = await resolveGroupId(input.groupId);

    if (!name) {
      return { ok: false, message: "Place name is required." };
    }
    if (lat === null || lon === null) {
      return { ok: false, message: "Valid latitude and longitude are required." };
    }
    if (!groupResult.ok) {
      return { ok: false, message: groupResult.message };
    }

    const existing = await prisma.travelPlace.findUnique({
      where: { id: input.id },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, message: "Place not found." };
    }

    await prisma.travelPlace.update({
      where: { id: input.id },
      data: {
        name,
        address,
        lat,
        lon,
        groupId: groupResult.groupId,
      },
    });

    revalidateTravel();
    return { ok: true, message: "Place updated.", placeId: input.id };
  } catch {
    return { ok: false, message: "Failed to update place." };
  }
}

export async function deleteTravelPlace(
  id: string,
): Promise<TravelActionResult> {
  try {
    await requireLogin();
    const existing = await prisma.travelPlace.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, message: "Place not found." };
    }

    await prisma.travelPlace.delete({ where: { id } });
    revalidateTravel();
    return { ok: true, message: "Place deleted." };
  } catch {
    return { ok: false, message: "Failed to delete place." };
  }
}

export async function createTravelVisit(input: {
  placeId: string;
  visitedAt: string;
  notes?: string;
  companions?: string;
}): Promise<TravelActionResult> {
  try {
    await requireLogin();
    const visitedAt = input.visitedAt.trim();
    const notes = (input.notes ?? "").trim();
    const companions = (input.companions ?? "").trim();

    if (!visitedAt) {
      return { ok: false, message: "Visit date is required." };
    }

    const place = await prisma.travelPlace.findUnique({
      where: { id: input.placeId },
      select: { id: true },
    });
    if (!place) {
      return { ok: false, message: "Place not found." };
    }

    const visit = await prisma.travelVisit.create({
      data: {
        placeId: input.placeId,
        visitedAt,
        notes,
        companions,
      },
    });

    revalidateTravel();
    return {
      ok: true,
      message: "Visit added.",
      placeId: input.placeId,
      visitId: visit.id,
    };
  } catch {
    return { ok: false, message: "Failed to add visit." };
  }
}

export async function updateTravelVisit(input: {
  id: string;
  visitedAt: string;
  notes: string;
  companions: string;
}): Promise<TravelActionResult> {
  try {
    await requireLogin();
    const visitedAt = input.visitedAt.trim();
    const notes = input.notes.trim();
    const companions = input.companions.trim();

    if (!visitedAt) {
      return { ok: false, message: "Visit date is required." };
    }

    const existing = await prisma.travelVisit.findUnique({
      where: { id: input.id },
      select: { id: true, placeId: true },
    });
    if (!existing) {
      return { ok: false, message: "Visit not found." };
    }

    await prisma.travelVisit.update({
      where: { id: input.id },
      data: { visitedAt, notes, companions },
    });

    revalidateTravel();
    return {
      ok: true,
      message: "Visit updated.",
      placeId: existing.placeId,
      visitId: input.id,
    };
  } catch {
    return { ok: false, message: "Failed to update visit." };
  }
}

export async function deleteTravelVisit(
  id: string,
): Promise<TravelActionResult> {
  try {
    await requireLogin();
    const existing = await prisma.travelVisit.findUnique({
      where: { id },
      select: { id: true, placeId: true },
    });
    if (!existing) {
      return { ok: false, message: "Visit not found." };
    }

    const visitCount = await prisma.travelVisit.count({
      where: { placeId: existing.placeId },
    });

    if (visitCount <= 1) {
      await prisma.travelPlace.delete({ where: { id: existing.placeId } });
      revalidateTravel();
      return {
        ok: true,
        message: "Last visit removed; place deleted.",
        placeId: existing.placeId,
      };
    }

    await prisma.travelVisit.delete({ where: { id } });
    revalidateTravel();
    return {
      ok: true,
      message: "Visit deleted.",
      placeId: existing.placeId,
      visitId: id,
    };
  } catch {
    return { ok: false, message: "Failed to delete visit." };
  }
}
