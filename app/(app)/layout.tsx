import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { auth, signOut } from "@/auth";
import { AppShell } from "@/components/app-shell";

async function AuthenticatedShell({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AppShell email={session.user.email} signOutAction={signOutAction}>
      {children}
    </AppShell>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
