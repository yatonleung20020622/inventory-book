import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { listItems } from "@/lib/actions/items";
import { DisposalManager } from "./disposal-manager";

async function DisposalContent() {
  const items = await listItems("disposal");
  return <DisposalManager items={items} />;
}

export default function DisposalPage() {
  return (
    <Suspense fallback={<PageSkeleton label="Loading disposal" variant="list" />}>
      <DisposalContent />
    </Suspense>
  );
}
