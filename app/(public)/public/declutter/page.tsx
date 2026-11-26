import { Figtree, Literata } from "next/font/google";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
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
  await connection();
  const listings = await listPublicDeclutterListings();
  return <DeclutterBrowse listings={listings} />;
}

export default function PublicDeclutterPage() {
  return (
    <div className={`${display.variable} ${sans.variable}`}>
      <Suspense
        fallback={<PageSkeleton label="Loading declutter" variant="list" />}
      >
        <DeclutterContent />
      </Suspense>
    </div>
  );
}
