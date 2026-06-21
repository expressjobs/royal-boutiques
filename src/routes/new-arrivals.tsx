import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/new-arrivals")({
  beforeLoad: () => { throw redirect({ to: "/category/$slug", params: { slug: "new-arrivals" }, replace: true }); },
});
