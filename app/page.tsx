import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { PageLoading } from "@/components/page-loading";

async function HomeRedirect() {
  const session = await auth();
  return redirect(session ? "/dashboard" : "/login");
}

export default function Home() {
  return (
    <Suspense fallback={<PageLoading label="Loading" />}>
      <HomeRedirect />
    </Suspense>
  );
}
