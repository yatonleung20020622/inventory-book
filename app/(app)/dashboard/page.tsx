import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { auth } from "@/auth";
import { PageLoading } from "@/components/page-loading";
import { APP_CHANNEL, APP_VERSION, getAppVersionLabel } from "@/lib/app-version";
import { formatHkdTotal, sumItemValues } from "@/lib/item-price";
import { listSharedSaleListings } from "@/lib/actions/sales";
import { prisma } from "@/lib/prisma";
import { ForSaleCarousel } from "./for-sale-carousel";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 8,
        background: "var(--page-bg)",
        border: "1px solid var(--border-color)",
        minWidth: 200,
        flex: "1 1 200px",
        maxWidth: 320,
      }}
    >
      <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>
        {value}
      </div>
      {hint ? (
        <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

async function DashboardStats() {
  await connection();
  const totalUsers = await prisma.user.count();

  return (
    <StatCard label="Total users" value={totalUsers} />
  );
}

async function InventoryValueStats() {
  await connection();
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return null;
  }

  const items = await prisma.item.findMany({
    where: {
      userId,
      OR: [
        { disposition: null },
        {
          disposition: {
            disposalStatus: { notIn: ["to_dispose", "disposed"] },
          },
        },
      ],
    },
    select: {
      estimatedPrice: true,
      actualPrice: true,
      quantity: true,
    },
  });

  const { estimatedTotal, actualTotal } = sumItemValues(items);

  return (
    <>
      <StatCard
        label="Total estimated value"
        value={formatHkdTotal(estimatedTotal)}
        hint="Sum of estimated price × quantity"
      />
      <StatCard
        label="Total actual value"
        value={formatHkdTotal(actualTotal)}
        hint="Sum of actual price × quantity"
      />
    </>
  );
}

function BetaVersionCard() {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 8,
        background: "rgba(22, 119, 255, 0.08)",
        border: "1px solid rgba(22, 119, 255, 0.35)",
        minWidth: 240,
        flex: "1 1 260px",
        maxWidth: 360,
      }}
    >
      <div
        style={{
          display: "inline-block",
          marginBottom: 10,
          padding: "2px 8px",
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.04,
          textTransform: "uppercase",
          color: "#1677ff",
          background: "rgba(22, 119, 255, 0.12)",
        }}
      >
        {APP_CHANNEL}
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        Inventory Book {getAppVersionLabel()}
      </div>
      <p
        style={{
          margin: 0,
          color: "var(--muted)",
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        You are using a beta build (v{APP_VERSION}). Features may change, and
        some workflows are still being polished. Thanks for trying it early.
      </p>
    </div>
  );
}

async function ForSaleSection() {
  const listings = await listSharedSaleListings();

  return (
    <section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>For sale</h2>
        <Link href="/sales" style={{ fontSize: 13 }}>
          View all
        </Link>
      </div>
      <ForSaleCarousel listings={listings} />
    </section>
  );
}

export default function DashboardPage() {
  return (
    <>
      <h1 style={{ marginTop: 0, fontSize: 24, fontWeight: 600 }}>Dashboard</h1>
      <p style={{ color: "var(--muted)" }}>Welcome back.</p>
      <div
        style={{
          marginTop: 24,
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        <BetaVersionCard />
        <Suspense
          fallback={<PageLoading label="Loading stats" variant="inline" />}
        >
          <DashboardStats />
        </Suspense>
        <Suspense
          fallback={
            <PageLoading label="Loading inventory value" variant="inline" />
          }
        >
          <InventoryValueStats />
        </Suspense>
      </div>
      <div style={{ marginTop: 32 }}>
        <Suspense
          fallback={<PageLoading label="Loading for sale" variant="block" />}
        >
          <ForSaleSection />
        </Suspense>
      </div>
    </>
  );
}
