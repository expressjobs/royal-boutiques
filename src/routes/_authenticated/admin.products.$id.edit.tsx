import { createFileRoute } from "@tanstack/react-router";

import { AdminProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_authenticated/admin/products/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Product - Admin - Royal Boutiques" }] }),
  component: EditProductRoute,
});

function EditProductRoute() {
  const { id } = Route.useParams();
  return <AdminProductForm productId={id} />;
}
