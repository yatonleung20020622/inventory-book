import { Fraunces, Source_Sans_3 } from "next/font/google";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { getPublishedCv } from "@/lib/actions/cv";
import { CvUnavailable, CvView } from "./cv-view";

const cvDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-cv-display",
  weight: ["500", "600", "700"],
});

const cvSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-cv-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CV",
  description: "Public curriculum vitae",
};

async function CvContent() {
  const profile = await getPublishedCv();
  if (!profile) {
    return <CvUnavailable />;
  }
  return <CvView profile={profile} />;
}

export default function PublicCvPage() {
  return (
    <div className={`${cvDisplay.variable} ${cvSans.variable}`}>
      <Suspense fallback={<PageLoading label="Loading CV" variant="block" />}>
        <CvContent />
      </Suspense>
    </div>
  );
}
