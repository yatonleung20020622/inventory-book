import { Suspense } from "react";
import { listItems } from "@/lib/actions/items";
import { ItemsManager } from "./items-manager";

async function ItemsContent() {
  const items = await listItems();
  return <ItemsManager items={items} />;
}

export default function ItemsPage() {
  return (
    <Suspense fallback={<div>Loading items…</div>}>
      <ItemsContent />
    </Suspense>
  );
}
