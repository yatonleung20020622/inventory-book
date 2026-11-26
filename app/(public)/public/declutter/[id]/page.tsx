import { Figtree, Literata } from "next/font/google";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { getPublicDeclutterListing } from "@/lib/actions/declutter";
import { DeclutterDetail } from "../declutter-detail";

const display = Literata({
  subsets: ["latin"],
  variable: "--font-dc-display",
  weight: ["500", "600", "700"],
});

const sans = Figtree({
  subsets: ["latin"],
  variable: "--font-dc-sans",
  weight: ["400", "500", "600", "700"],
});

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const listing = await getPublicDeclutterListing(id);
  if (!listing) {
    return { title: "Listing not found" };
  }
  return {
    title: listing.title,
    description: listing.description.slice(0, 140) || "Declutter listing",
  };
}

async function DeclutterDetailContent({ id }: { id: string }) {
  await connection();
  const listing = await getPublicDeclutterListing(id);
  if (!listing) {
    notFound();
  }
  return <DeclutterDetail listing={listing} />;
}

export default async function PublicDeclutterDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className={`${display.variable} ${sans.variable}`}>
      <Suspense
        fallback={<PageSkeleton label="Loading listing" variant="detail" />}
      >
        <DeclutterDetailContent id={id} />
      </Suspense>
    </div>
  );
}
