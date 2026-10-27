import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { listItems } from "@/lib/actions/items";
import { DisposalManager } from "./disposal-manager";

async function DisposalContent() {
  const items = await listItems("disposal");
  return <DisposalManager items={items} />;
}

export default function DisposalPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading disposal" variant="block" />}>
      <DisposalContent />
    </Suspense>
  );
}
