import { createFileRoute } from "@tanstack/react-router";

import { AdminProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_authenticated/admin/products/new")({
  head: () => ({ meta: [{ title: "New Product - Admin - Royal Boutiques" }] }),
  component: NewProductRoute,
});

function NewProductRoute() {
  return <AdminProductForm />;
}
