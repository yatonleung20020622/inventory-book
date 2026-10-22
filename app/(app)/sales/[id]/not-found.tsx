import Link from "next/link";

export default function SaleListingNotFound() {
  return (
    <div>
      <h1 style={{ marginTop: 0, fontSize: 24, fontWeight: 600 }}>
        Listing not found
      </h1>
      <p style={{ color: "var(--muted)" }}>
        This sale post may have been removed.{" "}
        <Link href="/sales">Back to Selling now</Link>
      </p>
    </div>
  );
}
