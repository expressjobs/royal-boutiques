import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/casual-wear")({
  beforeLoad: () => { throw redirect({ to: "/category/$slug", params: { slug: "casual-wear" }, replace: true }); },
});
