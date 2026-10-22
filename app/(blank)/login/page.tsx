import { Suspense } from "react";
import { PageLoading } from "@/components/page-loading";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading" variant="block" />}>
      <LoginForm />
    </Suspense>
  );
}
