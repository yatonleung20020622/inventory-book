import { connection } from "next/server";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";

async function DashboardStats() {
  await connection();
  const totalUsers = await prisma.user.count();

  return (
    <div
      style={{
        marginTop: 24,
        padding: 20,
        borderRadius: 8,
        background: "var(--page-bg)",
        border: "1px solid var(--border-color)",
        maxWidth: 280,
      }}
    >
      <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 8 }}>
        Total users
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>
        {totalUsers}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <h1 style={{ marginTop: 0, fontSize: 24, fontWeight: 600 }}>Dashboard</h1>
      <p style={{ color: "var(--muted)" }}>Welcome back.</p>
      <Suspense fallback={<div style={{ marginTop: 24 }}>Loading stats…</div>}>
        <DashboardStats />
      </Suspense>
    </>
  );
}
