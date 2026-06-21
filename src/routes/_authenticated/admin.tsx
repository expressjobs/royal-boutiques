import { createFileRoute, Outlet, Link, useRouterState, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Package, ShoppingCart, Star, Users, Tag, Ticket, Settings, BarChart3, FolderTree, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/account" });
  },
  component: AdminLayout,
});

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? "")); }, []);
  return (
    <div className="min-h-screen bg-nude text-charcoal flex">
      <aside className="w-64 bg-charcoal text-white p-6 flex flex-col">
        <Link to="/" className="flex items-center gap-3 mb-8">
          <Logo variant="monogram" className="h-12 w-auto invert brightness-200" />
          <span className="font-serif text-lg tracking-[0.18em]">ROYAL</span>
        </Link>
        <p className="eyebrow text-white/40 mb-4">Admin Console</p>
        <nav className="space-y-1 flex-1">
          {NAV.map((n) => {
            const active = pathname === n.href;
            const Icon = n.icon;
            return (
              <Link key={n.href} to={n.href as string} className={`flex items-center gap-3 px-4 py-3 rounded text-sm transition ${active ? "bg-gold text-white" : "text-white/70 hover:bg-white/10"}`}>
                <Icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-6 border-t border-white/10">
          <p className="text-xs text-white/50 truncate mb-4">{email}</p>
          <Link to="/" className="flex items-center gap-2 text-xs text-white/60 hover:text-white">
            <ArrowLeft className="h-3 w-3" /> Back to store
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }}
            className="mt-3 text-xs text-white/60 hover:text-white"
          >Sign out</button>
        </div>
      </aside>
      <div className="flex-1 p-10 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
