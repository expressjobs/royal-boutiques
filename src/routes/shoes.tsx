import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/shoes")({
  beforeLoad: () => { throw redirect({ to: "/category/$slug", params: { slug: "shoes" }, replace: true }); },
});
