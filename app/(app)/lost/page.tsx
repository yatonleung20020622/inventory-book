import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { listItems } from "@/lib/actions/items";
import { CustodyList } from "../items/custody-list";

async function LostContent() {
  const items = await listItems("lost");
  return <CustodyList mode="lost" items={items} />;
}

export default function LostPage() {
  return (
    <Suspense fallback={<PageSkeleton label="Loading lost items" variant="list" />}>
      <LostContent />
    </Suspense>
  );
}
