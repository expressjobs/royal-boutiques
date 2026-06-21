import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/dresses")({
  beforeLoad: () => { throw redirect({ to: "/category/$slug", params: { slug: "dresses" }, replace: true }); },
});
