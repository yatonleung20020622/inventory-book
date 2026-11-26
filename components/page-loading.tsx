import { PageSkeleton } from "@/components/page-skeleton";

type PageLoadingProps = {
  label?: string;
  /**
   * Maps onto PageSkeleton variants.
   * - page / block → list layout skeleton
   * - inline → compact skeleton
   */
  variant?: "page" | "inline" | "block";
};

/** @deprecated Prefer PageSkeleton with an explicit variant. */
export function PageLoading({
  label = "Loading",
  variant = "page",
}: PageLoadingProps) {
  const skeletonVariant =
    variant === "inline" ? "inline" : variant === "block" ? "block" : "list";

  return <PageSkeleton label={label} variant={skeletonVariant} />;
}
