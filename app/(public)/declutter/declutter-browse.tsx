"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DeclutterListingRecord } from "@/lib/actions/declutter";
import { DeclutterLikeButton } from "./declutter-like-button";
import { useDeclutterLikes } from "./use-declutter-likes";

type FilterMode = "all" | "liked";

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

export function DeclutterBrowse({
  listings,
}: {
  listings: DeclutterListingRecord[];
}) {
  const [filter, setFilter] = useState<FilterMode>("all");
  const { likedSet, hydrated } = useDeclutterLikes();

  const visible = useMemo(() => {
    if (filter !== "liked") return listings;
    if (!hydrated) return [];
    return listings.filter((listing) => likedSet.has(listing.id));
  }, [filter, hydrated, likedSet, listings]);

  return (
    <div
      style={{
        maxWidth: 860,
        margin: "0 auto",
        padding: "clamp(48px, 8vw, 96px) clamp(20px, 5vw, 40px) 64px",
      }}
    >
      <header style={{ marginBottom: 36 }}>
        <p
          style={{
            margin: "0 0 12px",
            color: "var(--cv-muted)",
            fontSize: 13,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Letting go
        </p>
        <h1
          className="cv-display"
          style={{
            margin: 0,
            fontSize: "clamp(2.2rem, 6vw, 3.4rem)",
            color: "var(--cv-fg)",
          }}
        >
          Declutter
        </h1>
        <p
          style={{
            margin: "14px 0 0",
            maxWidth: "42ch",
            color: "var(--cv-muted)",
            lineHeight: 1.55,
          }}
        >
          Things looking for a new home. Mark what you want with the heart —
          saved only on this device.
        </p>

        <div
          role="tablist"
          aria-label="Listing filter"
          style={{ display: "flex", gap: 8, marginTop: 24 }}
        >
          {(
            [
              { key: "all", label: "All" },
              { key: "liked", label: "Liked" },
            ] as const
          ).map((item) => {
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(item.key)}
                style={{
                  border: `1px solid ${active ? "var(--cv-accent)" : "var(--cv-rule)"}`,
                  background: active ? "var(--cv-accent-soft)" : "transparent",
                  color: "var(--cv-fg)",
                  borderRadius: 999,
                  padding: "6px 14px",
                  cursor: "pointer",
                  font: "inherit",
                  fontSize: 14,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {visible.length === 0 ? (
        <p style={{ color: "var(--cv-muted)", margin: 0 }}>
          {filter === "liked"
            ? "No liked items yet. Tap the heart on a listing to save it here."
            : "Nothing listed right now."}
        </p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {visible.map((listing) => (
            <li key={listing.id}>
              <div
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: 4,
                  background: "var(--cv-panel)",
                  border: "1px solid var(--cv-rule)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <Link
                  href={`/public/declutter/${listing.id}`}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "16px 18px",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      alignItems: "baseline",
                      justifyContent: "space-between",
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "1.15rem",
                        fontWeight: 600,
                      }}
                    >
                      {listing.title}
                    </h2>
                    <span
                      style={{
                        color: "var(--cv-accent)",
                        fontWeight: 600,
                        fontSize: 15,
                      }}
                    >
                      {priceLabel(listing.price)}
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      color: "var(--cv-muted)",
                      fontSize: 13,
                    }}
                  >
                    <span>{statusLabel(listing.status)}</span>
                    {listing.condition ? (
                      <span>· {listing.condition}</span>
                    ) : null}
                    {listing.category ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        ·
                        <span
                          aria-hidden
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background:
                              listing.category.color || "var(--cv-accent)",
                          }}
                        />
                        {listing.category.name}
                      </span>
                    ) : null}
                  </div>
                </Link>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    paddingRight: 8,
                  }}
                >
                  <DeclutterLikeButton listingId={listing.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
