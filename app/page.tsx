import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { PageSkeleton } from "@/components/page-skeleton";

async function HomeRedirect() {
  await connection();

  const session = await auth();
  return redirect(session ? "/dashboard" : "/login");
}

export default function Home() {
  return (
    <Suspense fallback={<PageSkeleton label="Loading" variant="shell" />}>
      <HomeRedirect />
    </Suspense>
  );
}
