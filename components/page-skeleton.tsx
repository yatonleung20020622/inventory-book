import type { CSSProperties, ReactNode } from "react";

type PageSkeletonVariant =
  | "list"
  | "detail"
  | "dashboard"
  | "form"
  | "map"
  | "inline"
  | "block"
  | "shell";

type PageSkeletonProps = {
  variant?: PageSkeletonVariant;
  /** Kept for call-site compatibility; not shown (skeletons are unlabeled). */
  label?: string;
};

function Bone({
  width = "100%",
  height = 14,
  radius = 6,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      className="page-skeleton-bone"
      aria-hidden
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

function CardShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border-color)",
        borderRadius: 8,
        padding: 20,
        minWidth: 0,
      }}
    >
      {children}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <CardShell>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
          }}
        >
          <Bone width={160} height={32} />
          <Bone width={140} height={32} />
          <Bone width={140} height={32} />
          <div style={{ flex: 1 }} />
          <Bone width={88} height={32} />
          <Bone width={72} height={32} />
        </div>
      </CardShell>
      <CardShell>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <Bone width={120} height={22} />
          <Bone width={64} height={14} />
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 72px",
                gap: 16,
                alignItems: "center",
              }}
            >
              <Bone height={16} />
              <Bone height={16} />
              <Bone height={16} />
              <Bone width={56} height={16} style={{ justifySelf: "end" }} />
            </div>
          ))}
        </div>
      </CardShell>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Bone width={72} height={32} />
        <Bone width={88} height={32} />
      </div>
      <CardShell>
        <Bone width="40%" height={24} style={{ marginBottom: 24 }} />
        <div style={{ display: "grid", gap: 18 }}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr",
                gap: 16,
                alignItems: "center",
              }}
            >
              <Bone width={100} height={14} />
              <Bone height={16} />
            </div>
          ))}
        </div>
      </CardShell>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
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
            <Bone width={96} height={12} style={{ marginBottom: 12 }} />
            <Bone width={120} height={28} />
          </div>
        ))}
      </div>
      <CardShell>
        <Bone width={140} height={20} style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 12, overflow: "hidden" }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Bone
              key={index}
              width={180}
              height={120}
              radius={8}
              style={{ flexShrink: 0 }}
            />
          ))}
        </div>
      </CardShell>
    </div>
  );
}

function FormSkeleton() {
  return (
    <CardShell>
      <Bone width={160} height={22} style={{ marginBottom: 24 }} />
      <div style={{ display: "grid", gap: 20, maxWidth: 420 }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} style={{ display: "grid", gap: 8 }}>
            <Bone width={88} height={12} />
            <Bone height={36} />
          </div>
        ))}
        <Bone width={120} height={36} style={{ marginTop: 8 }} />
      </div>
    </CardShell>
  );
}

function MapSkeleton() {
  return (
    <CardShell>
      <Bone width={160} height={22} style={{ marginBottom: 16 }} />
      <Bone height={420} radius={8} />
    </CardShell>
  );
}

function InlineSkeleton() {
  return (
    <div style={{ padding: 8 }}>
      <Bone width="70%" height={12} style={{ marginBottom: 10 }} />
      <Bone width="45%" height={22} />
    </div>
  );
}

function BlockSkeleton() {
  return (
    <CardShell>
      <Bone width="35%" height={18} style={{ marginBottom: 16 }} />
      <div style={{ display: "grid", gap: 12 }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Bone key={index} height={14} />
        ))}
      </div>
    </CardShell>
  );
}

function ShellSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        maxHeight: "100dvh",
        overflow: "hidden",
        background: "var(--page-bg)",
      }}
    >
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          background: "var(--sider-bg)",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <Bone
          width={132}
          height={18}
          style={{ background: "rgba(255,255,255,0.18)" }}
        />
        <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
          {Array.from({ length: 10 }).map((_, index) => (
            <Bone
              key={index}
              height={14}
              width={index % 3 === 0 ? "70%" : "88%"}
              style={{ background: "rgba(255,255,255,0.12)" }}
            />
          ))}
        </div>
      </aside>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            height: 64,
            flexShrink: 0,
            borderBottom: "1px solid var(--border-color)",
            background: "var(--header-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingInline: 24,
          }}
        >
          <Bone width={32} height={32} radius={6} />
          <div style={{ display: "flex", gap: 10 }}>
            <Bone width={32} height={32} radius={6} />
            <Bone width={88} height={32} radius={6} />
          </div>
        </header>
        <main style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 24 }}>
          <ListSkeleton />
        </main>
      </div>
    </div>
  );
}

export function PageSkeleton({
  variant = "list",
  label = "Loading",
}: PageSkeletonProps) {
  return (
    <div
      className="page-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      {variant === "shell" ? <ShellSkeleton /> : null}
      {variant === "list" ? <ListSkeleton /> : null}
      {variant === "detail" ? <DetailSkeleton /> : null}
      {variant === "dashboard" ? <DashboardSkeleton /> : null}
      {variant === "form" ? <FormSkeleton /> : null}
      {variant === "map" ? <MapSkeleton /> : null}
      {variant === "inline" ? <InlineSkeleton /> : null}
      {variant === "block" ? <BlockSkeleton /> : null}
    </div>
  );
}
