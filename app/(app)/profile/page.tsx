import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ResetPasswordForm } from "./reset-password-form";

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: 8,
          fontSize: 14,
          color: "var(--foreground)",
        }}
      >
        {label}
      </label>
      <input
        value={value}
        disabled
        readOnly
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid var(--border-color)",
          background: "var(--page-bg)",
          color: "var(--muted)",
          fontSize: 14,
        }}
      />
    </div>
  );
}

async function ProfileAccount() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, username: true, phone: true, role: true },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div
      style={{
        maxWidth: 420,
        marginBottom: 32,
        display: "grid",
        gap: 16,
      }}
    >
      <ReadOnlyField label="Username" value={user.username || "—"} />
      <ReadOnlyField label="Email" value={user.email} />
      <ReadOnlyField label="Phone" value={user.phone || "—"} />
      <ReadOnlyField
        label="Role"
        value={user.role === "ADMIN" ? "Admin" : "User"}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <>
      <h1 style={{ marginTop: 0, fontSize: 24, fontWeight: 600 }}>Profile</h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        Manage your account. Username, email, phone, and role cannot be changed
        here.
      </p>
      <Suspense fallback={<div style={{ marginBottom: 32 }}>Loading account…</div>}>
        <ProfileAccount />
      </Suspense>
      <h2 style={{ marginTop: 0, fontSize: 18, fontWeight: 600 }}>
        Reset password
      </h2>
      <ResetPasswordForm />
    </>
  );
}
