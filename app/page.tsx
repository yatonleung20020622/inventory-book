import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";

async function HomeRedirect() {
  const session = await auth();
  redirect(session ? "/dashboard" : "/login");
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <HomeRedirect />
    </Suspense>
  );
}
