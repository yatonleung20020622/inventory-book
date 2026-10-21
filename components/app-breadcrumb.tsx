"use client";

import { Breadcrumb } from "antd";
import Link from "next/link";
import { useMemo } from "react";
import { PageAboveCard } from "@/components/page-above-card";

export type BreadcrumbItem = {
  title: string;
  href?: string;
};

export function AppBreadcrumb({
  items,
  outsideCard = false,
}: {
  items: BreadcrumbItem[];
  outsideCard?: boolean;
}) {
  const breadcrumb = useMemo(
    () => (
      <Breadcrumb
        style={outsideCard ? undefined : { marginBottom: 16 }}
        items={items.map((item) => ({
          title: item.href ? (
            <Link href={item.href}>{item.title}</Link>
          ) : (
            item.title
          ),
        }))}
      />
    ),
    [items, outsideCard],
  );

  if (outsideCard) {
    return <PageAboveCard>{breadcrumb}</PageAboveCard>;
  }

  return breadcrumb;
}
