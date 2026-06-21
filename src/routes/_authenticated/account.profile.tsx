import { createFileRoute, redirect } from "@tanstack/react-router";

// /account/profile is an alias for the main account page
export const Route = createFileRoute("/_authenticated/account/profile")({
  beforeLoad: () => { throw redirect({ to: "/account" }); },
});
