import { Figtree, Literata } from "next/font/google";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
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
        fallback={<PageLoading label="Loading listing" variant="block" />}
      >
        <DeclutterDetailContent id={id} />
      </Suspense>
    </div>
  );
}
