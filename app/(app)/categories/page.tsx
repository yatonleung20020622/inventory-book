import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { listCategories } from "@/lib/actions/categories";
import { CategoriesManager } from "./categories-manager";

async function CategoriesContent() {
  const categories = await listCategories();
  return <CategoriesManager categories={categories} />;
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={<PageLoading label="Loading categories" variant="block" />}
    >
      <CategoriesContent />
    </Suspense>
  );
}
