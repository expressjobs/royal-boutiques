import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/accessories")({
  beforeLoad: () => { throw redirect({ to: "/category/$slug", params: { slug: "accessories" }, replace: true }); },
});
