import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { PageLoading } from "@/components/page-loading";
import { listCategories } from "@/lib/actions/categories";
import { listDeclutterListings } from "@/lib/actions/declutter";
import { DeclutterCmsManager } from "./declutter-cms-manager";

async function DeclutterCmsContent() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [listings, categories] = await Promise.all([
    listDeclutterListings(),
    listCategories(),
  ]);

  return (
    <DeclutterCmsManager listings={listings} categories={categories} />
  );
}

export default function AdminDeclutterPage() {
  return (
    <Suspense
      fallback={<PageLoading label="Loading Declutter CMS" variant="block" />}
    >
      <DeclutterCmsContent />
    </Suspense>
  );
}
