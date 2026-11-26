import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { auth, signOut } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { PageSkeleton } from "@/components/page-skeleton";
import { prisma } from "@/lib/prisma";

async function AuthenticatedShell({ children }: { children: ReactNode }) {
  await connection();
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, username: true, role: true },
  });

  if (!user) {
    redirect("/login");
  }

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AppShell
      email={user.email}
      username={user.username}
      role={user.role}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton label="Loading workspace" variant="shell" />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
