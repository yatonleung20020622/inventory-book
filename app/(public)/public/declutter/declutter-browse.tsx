"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
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

function FilterPill({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        border: `1px solid ${active ? "var(--dc-accent)" : "var(--dc-rule)"}`,
        background: active ? "var(--dc-accent-soft)" : "transparent",
        color: "var(--dc-fg)",
        borderRadius: 999,
        padding: "6px 14px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 14,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {color ? (
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
      ) : null}
      {children}
    </button>
  );
}

export function DeclutterBrowse({
  listings,
}: {
  listings: DeclutterListingRecord[];
}) {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const { likedSet, hydrated } = useDeclutterLikes();

  const categories = useMemo(() => {
    const byId = new Map<
      string,
      { id: string; name: string; color: string }
    >();
    for (const listing of listings) {
      if (!listing.category) continue;
      byId.set(listing.category.id, listing.category);
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [listings]);

  const visible = useMemo(() => {
    let rows = listings;
    if (filter === "liked") {
      if (!hydrated) return [];
      rows = rows.filter((listing) => likedSet.has(listing.id));
    }
    if (categoryId) {
      rows = rows.filter((listing) => listing.categoryId === categoryId);
    }
    return rows;
  }, [categoryId, filter, hydrated, likedSet, listings]);

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
            color: "var(--dc-muted)",
            fontSize: 13,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Letting go
        </p>
        <h1
          className="dc-display"
          style={{
            margin: 0,
            fontSize: "clamp(2.2rem, 6vw, 3.4rem)",
            color: "var(--dc-fg)",
          }}
        >
          Declutter
        </h1>
        <p
          style={{
            margin: "14px 0 0",
            maxWidth: "42ch",
            color: "var(--dc-muted)",
            lineHeight: 1.55,
          }}
        >
          Things looking for a new home. Mark what you want with the heart —
          saved only on this device.
        </p>

        <div
          role="group"
          aria-label="Listing filter"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 24,
          }}
        >
          {(
            [
              { key: "all", label: "All" },
              { key: "liked", label: "Liked" },
            ] as const
          ).map((item) => (
            <FilterPill
              key={item.key}
              active={filter === item.key}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </FilterPill>
          ))}
        </div>

        {categories.length > 0 ? (
          <div
            role="group"
            aria-label="Category filter"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 12,
            }}
          >
            <FilterPill
              active={categoryId === null}
              onClick={() => setCategoryId(null)}
            >
              All categories
            </FilterPill>
            {categories.map((category) => (
              <FilterPill
                key={category.id}
                active={categoryId === category.id}
                color={category.color || "var(--dc-accent)"}
                onClick={() => setCategoryId(category.id)}
              >
                {category.name}
              </FilterPill>
            ))}
          </div>
        ) : null}
      </header>

      {visible.length === 0 ? (
        <p style={{ color: "var(--dc-muted)", margin: 0 }}>
          {filter === "liked" && !categoryId
            ? "No liked items yet. Tap the heart on a listing to save it here."
            : filter === "liked" && categoryId
              ? "No liked items in this category."
              : categoryId
                ? "Nothing in this category right now."
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
                  background: "var(--dc-panel)",
                  border: "1px solid var(--dc-rule)",
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
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "1.15rem",
                      fontWeight: 600,
                    }}
                  >
                    {listing.title}
                  </h2>
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      color: "var(--dc-muted)",
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
                              listing.category.color || "var(--dc-accent)",
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
                    gap: 4,
                    flexShrink: 0,
                    paddingRight: 12,
                  }}
                >
                  <span
                    style={{
                      color: "var(--dc-accent)",
                      fontWeight: 600,
                      fontSize: 15,
                      lineHeight: 1,
                    }}
                  >
                    {priceLabel(listing.price)}
                  </span>
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
