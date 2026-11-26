import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<PageSkeleton label="Loading" variant="form" />}>
      <LoginForm />
    </Suspense>
  );
}
