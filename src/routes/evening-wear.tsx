import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/evening-wear")({
  beforeLoad: () => { throw redirect({ to: "/category/$slug", params: { slug: "evening-wear" }, replace: true }); },
});
