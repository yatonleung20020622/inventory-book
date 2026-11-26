import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { PageSkeleton } from "@/components/page-skeleton";
import { getCvForAdmin } from "@/lib/actions/cv";
import { CvCmsManager } from "./cv-cms-manager";

async function CvCmsContent() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const profile = await getCvForAdmin();
  return <CvCmsManager profile={profile} />;
}

export default function AdminCvPage() {
  return (
    <Suspense fallback={<PageSkeleton label="Loading CV CMS" variant="list" />}>
      <CvCmsContent />
    </Suspense>
  );
}
