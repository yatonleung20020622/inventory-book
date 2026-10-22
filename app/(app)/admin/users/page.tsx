import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { PageLoading } from "@/components/page-loading";
import { listUsers } from "@/lib/actions/admin-users";
import { UsersManager } from "./users-manager";

async function UsersContent() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await listUsers();

  return (
    <UsersManager users={users} currentUserId={session.user.id} />
  );
}

export default function AdminUsersPage() {
  return (
    <>
      <h1 style={{ marginTop: 0, fontSize: 24, fontWeight: 600 }}>Users</h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        Manage accounts and roles. Admin only.
      </p>
      <Suspense fallback={<PageLoading label="Loading users" variant="block" />}>
        <UsersContent />
      </Suspense>
    </>
  );
}
