import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { listCategories } from "@/lib/actions/categories";
import { listItems } from "@/lib/actions/items";
import { listLocations } from "@/lib/actions/locations";
import { ItemsManager } from "./items-manager";

async function ItemsContent() {
  const [items, locations, categories] = await Promise.all([
    listItems(),
    listLocations(),
    listCategories(),
  ]);

  return (
    <ItemsManager
      items={items}
      locations={locations.map((location) => ({
        id: location.id,
        name: location.name,
        isExpired: location.isExpired,
        isDefault: location.isDefault,
      }))}
      categories={categories.map((category) => ({
        id: category.id,
        name: category.name,
      }))}
    />
  );
}

export default function ItemsPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading items" variant="block" />}>
      <ItemsContent />
    </Suspense>
  );
}
