import { createFileRoute, redirect } from "@tanstack/react-router";

// /account/wishlist is an alias for the main wishlist page
export const Route = createFileRoute("/_authenticated/account/wishlist")({
  beforeLoad: () => { throw redirect({ to: "/wishlist" }); },
});
