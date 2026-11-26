import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { listItems } from "@/lib/actions/items";
import { CustodyList } from "../items/custody-list";

async function LentContent() {
  const items = await listItems("lent");
  return <CustodyList mode="lent" items={items} />;
}

export default function LentPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading lent items" variant="block" />}>
      <LentContent />
    </Suspense>
  );
}
