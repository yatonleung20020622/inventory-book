import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { listItems } from "@/lib/actions/items";
import { CustodyList } from "../items/custody-list";

async function LostContent() {
  const items = await listItems("lost");
  return <CustodyList mode="lost" items={items} />;
}

export default function LostPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading lost items" variant="block" />}>
      <LostContent />
    </Suspense>
  );
}
