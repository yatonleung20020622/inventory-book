type PageLoadingProps = {
  label?: string;
  /** Compact for inline Suspense regions; page for full content areas. */
  variant?: "page" | "inline" | "block";
};

export function PageLoading({
  label = "Loading",
  variant = "page",
}: PageLoadingProps) {
  const isPage = variant === "page";
  const isBlock = variant === "block";

  return (
    <div
      className="page-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        marginInline: "auto",
        padding: isPage ? 48 : isBlock ? 28 : 16,
        minHeight: isPage
          ? "calc(100vh - 220px)"
          : isBlock
            ? "min(40vh, 280px)"
            : undefined,
        width: "100%",
        boxSizing: "border-box",
        textAlign: "center",
      }}
    >
      <div className="page-loading-mark" aria-hidden>
        <span className="page-loading-ring" />
        <span className="page-loading-core">IB</span>
      </div>
      <div className="page-loading-label">
        <span>{label}</span>
        <span className="page-loading-dots" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      </div>
    </div>
  );
}
