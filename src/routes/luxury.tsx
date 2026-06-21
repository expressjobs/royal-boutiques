import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/luxury")({
  beforeLoad: () => { throw redirect({ to: "/category/$slug", params: { slug: "luxury" }, replace: true }); },
});
