import { AppBreadcrumb } from "@/components/app-breadcrumb";

export default function ItemNotFound() {
  return (
    <>
      <AppBreadcrumb
        outsideCard
        items={[
          { title: "Items", href: "/items" },
          { title: "Not found" },
        ]}
      />
      <h1 style={{ marginTop: 0, fontSize: 24, fontWeight: 600 }}>
        Item not found
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: 16 }}>
        This item does not exist or you do not have access to it.
      </p>
    </>
  );
}