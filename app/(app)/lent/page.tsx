import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { listItems } from "@/lib/actions/items";
import { CustodyList } from "../items/custody-list";

async function LentContent() {
  const items = await listItems("lent");
  return <CustodyList mode="lent" items={items} />;
}

export default function LentPage() {
  return (
    <Suspense fallback={<PageSkeleton label="Loading lent items" variant="list" />}>
      <LentContent />
    </Suspense>
  );
}
