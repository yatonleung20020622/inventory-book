"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type AdminUserRecord = {
  id: string;
  email: string;
  username: string;
  phone: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
};

export type AdminUserActionResult = {
  ok: boolean;
  message: string;
};

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

function revalidateAdminUsers() {
  revalidatePath("/admin/users");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function listUsers(): Promise<AdminUserRecord[]> {
  await requireAdmin();
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ role: "asc" }, { username: "asc" }, { email: "asc" }],
  });

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));
}

export async function createUser(input: {
  email: string;
  username?: string;
  phone?: string;
  role?: "USER" | "ADMIN";
  password: string;
}): Promise<AdminUserActionResult> {
  try {
    await requireAdmin();

    const email = normalizeEmail(input.email);
    const username = (input.username ?? "").trim();
    const phone = (input.phone ?? "").trim();
    const role = input.role === "ADMIN" ? "ADMIN" : "USER";
    const password = input.password;

    if (!email) {
      return { ok: false, message: "Email is required." };
    }
    if (!password || password.length < 6) {
      return { ok: false, message: "Password must be at least 6 characters." };
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return { ok: false, message: "Email is already in use." };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { email, username, phone, role, passwordHash },
    });

    revalidateAdminUsers();
    return { ok: true, message: "User created." };
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return { ok: false, message: "Admin access required." };
    }
    return { ok: false, message: "Failed to create user." };
  }
}

export async function updateUser(input: {
  id: string;
  email: string;
  username?: string;
  phone?: string;
  role?: "USER" | "ADMIN";
  password?: string;
}): Promise<AdminUserActionResult> {
  try {
    const admin = await requireAdmin();

    const email = normalizeEmail(input.email);
    const username = (input.username ?? "").trim();
    const phone = (input.phone ?? "").trim();
    const role = input.role === "ADMIN" ? "ADMIN" : "USER";
    const password = (input.password ?? "").trim();

    if (!email) {
      return { ok: false, message: "Email is required." };
    }
    if (password && password.length < 6) {
      return { ok: false, message: "Password must be at least 6 characters." };
    }

    const target = await prisma.user.findUnique({
      where: { id: input.id },
      select: { id: true, role: true },
    });
    if (!target) {
      return { ok: false, message: "User not found." };
    }

    if (target.id === admin.id && role !== "ADMIN") {
      return { ok: false, message: "You cannot remove your own admin role." };
    }

    if (target.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return { ok: false, message: "Cannot demote the last admin." };
      }
    }

    const emailTaken = await prisma.user.findFirst({
      where: { email, NOT: { id: input.id } },
      select: { id: true },
    });
    if (emailTaken) {
      return { ok: false, message: "Email is already in use." };
    }

    await prisma.user.update({
      where: { id: input.id },
      data: {
        email,
        username,
        phone,
        role,
        ...(password
          ? { passwordHash: await bcrypt.hash(password, 12) }
          : {}),
      },
    });

    revalidateAdminUsers();
    return { ok: true, message: "User updated." };
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return { ok: false, message: "Admin access required." };
    }
    return { ok: false, message: "Failed to update user." };
  }
}

export async function deleteUser(id: string): Promise<AdminUserActionResult> {
  try {
    const admin = await requireAdmin();

    if (id === admin.id) {
      return { ok: false, message: "You cannot delete your own account." };
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!target) {
      return { ok: false, message: "User not found." };
    }

    if (target.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return { ok: false, message: "Cannot delete the last admin." };
      }
    }

    await prisma.user.delete({ where: { id } });
    revalidateAdminUsers();
    return { ok: true, message: "User deleted." };
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return { ok: false, message: "Admin access required." };
    }
    return { ok: false, message: "Failed to delete user." };
  }
}
