import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { listCategories } from "@/lib/actions/categories";
import { CategoriesManager } from "./categories-manager";

async function CategoriesContent() {
  const categories = await listCategories();
  return <CategoriesManager categories={categories} />;
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={<PageSkeleton label="Loading categories" variant="list" />}
    >
      <CategoriesContent />
    </Suspense>
  );
}
