"use client";

import Link from "next/link";
import type { DeclutterListingRecord } from "@/lib/actions/declutter";
import { DeclutterLikeButton } from "./declutter-like-button";

function statusLabel(status: DeclutterListingRecord["status"]) {
  switch (status) {
    case "AVAILABLE":
      return "Available";
    case "RESERVED":
      return "Reserved";
    case "GONE":
      return "Gone";
    default:
      return status;
  }
}

function priceLabel(price: string) {
  const trimmed = price.trim();
  return trimmed ? trimmed : "Free";
}

export function DeclutterDetail({
  listing,
}: {
  listing: DeclutterListingRecord;
}) {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(48px, 8vw, 96px) clamp(20px, 5vw, 40px) 64px",
      }}
    >
      <p style={{ margin: "0 0 20px" }}>
        <Link
          href="/public/declutter"
          style={{ color: "var(--cv-muted)", textDecoration: "none" }}
        >
          ← All listings
        </Link>
      </p>

      <header
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: "0 0 10px",
              color: "var(--cv-muted)",
              fontSize: 13,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {statusLabel(listing.status)}
          </p>
          <h1
            className="cv-display"
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 5vw, 3rem)",
              color: "var(--cv-fg)",
            }}
          >
            {listing.title}
          </h1>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "var(--cv-accent)",
            }}
          >
            {priceLabel(listing.price)}
          </p>
        </div>
        <DeclutterLikeButton listingId={listing.id} />
      </header>

      <dl
        style={{
          display: "grid",
          gap: 14,
          margin: "0 0 28px",
          padding: "18px 20px",
          background: "var(--cv-panel)",
          border: "1px solid var(--cv-rule)",
          borderRadius: 12,
        }}
      >
        {listing.condition ? (
          <div>
            <dt style={{ margin: 0, color: "var(--cv-muted)", fontSize: 12 }}>
              Condition
            </dt>
            <dd style={{ margin: "4px 0 0" }}>{listing.condition}</dd>
          </div>
        ) : null}
        {listing.category ? (
          <div>
            <dt style={{ margin: 0, color: "var(--cv-muted)", fontSize: 12 }}>
              Category
            </dt>
            <dd
              style={{
                margin: "4px 0 0",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: listing.category.color || "var(--cv-accent)",
                }}
              />
              {listing.category.name}
            </dd>
          </div>
        ) : null}
        {listing.locationNote ? (
          <div>
            <dt style={{ margin: 0, color: "var(--cv-muted)", fontSize: 12 }}>
              Location
            </dt>
            <dd style={{ margin: "4px 0 0" }}>{listing.locationNote}</dd>
          </div>
        ) : null}
        {listing.contactNote ? (
          <div>
            <dt style={{ margin: 0, color: "var(--cv-muted)", fontSize: 12 }}>
              Contact
            </dt>
            <dd style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>
              {listing.contactNote}
            </dd>
          </div>
        ) : null}
      </dl>

      {listing.description ? (
        <section>
          <h2
            className="cv-section-title"
            style={{ margin: "0 0 12px", fontSize: "1rem" }}
          >
            Details
          </h2>
          <p
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              lineHeight: 1.65,
              color: "var(--cv-fg)",
            }}
          >
            {listing.description}
          </p>
        </section>
      ) : null}
    </div>
  );
}
