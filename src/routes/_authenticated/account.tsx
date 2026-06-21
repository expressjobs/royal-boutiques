import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BoutiqueLayout } from "@/components/layout/BoutiqueLayout";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My Account — Royal Boutiques" }] }),
  component: AccountLayout,
});

const TABS = [
  { label: "Profile", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Wishlist", href: "/wishlist" },
];

function AccountLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <BoutiqueLayout>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <p className="eyebrow text-gold">My Account</p>
        <h1 className="font-serif text-4xl mt-3 mb-10">Welcome</h1>
        <div className="grid lg:grid-cols-[220px_1fr] gap-12">
          <nav className="space-y-1">
            {TABS.map((t) => {
              const active = pathname === t.href;
              return (
                <Link key={t.href} to={t.href as string} className={`block px-4 py-3 text-sm rounded ${active ? "bg-soft text-charcoal font-medium" : "text-charcoal/60 hover:bg-nude"}`}>
                  {t.label}
                </Link>
              );
            })}
            <SignOutButton />
          </nav>
          <div><Outlet /></div>
        </div>
      </div>
    </BoutiqueLayout>
  );
}




function SignOutButton() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return (
    <button
      onClick={async () => {
        await qc.cancelQueries();
        qc.clear();
        await supabase.auth.signOut();
        navigate({ to: "/auth", replace: true });
      }}
      className="block w-full text-left px-4 py-3 text-sm text-charcoal/60 hover:bg-nude rounded mt-6"
    >
      Sign Out
    </button>
  );
}
