import { Figtree, Literata } from "next/font/google";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { listPublicDeclutterListings } from "@/lib/actions/declutter";
import { DeclutterBrowse } from "./declutter-browse";

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

export const metadata: Metadata = {
  title: "Declutter",
  description: "Things looking for a new home",
};

async function DeclutterContent() {
  const listings = await listPublicDeclutterListings();
  return <DeclutterBrowse listings={listings} />;
}

export default function PublicDeclutterPage() {
  return (
    <div className={`${display.variable} ${sans.variable}`}>
      <Suspense
        fallback={<PageLoading label="Loading declutter" variant="block" />}
      >
        <DeclutterContent />
      </Suspense>
    </div>
  );
}
