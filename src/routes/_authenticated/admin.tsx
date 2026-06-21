import {
  createFileRoute,
  Outlet,
  Link,
  useRouterState,
  useNavigate,
  redirect,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Star,
  Users,
  Ticket,
  Settings,
  BarChart3,
  FolderTree,
  ArrowLeft,
  Store,
  Images,
} from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw redirect({ to: "/account" });
  },
  component: AdminLayout,
});

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Media Library", href: "/admin/media", icon: Images },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Vendors", href: "/admin/vendors", icon: Store },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);
  return (
    <div className="min-h-screen bg-nude text-charcoal lg:flex">
      <aside className="bg-charcoal p-4 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col lg:p-6">
        <div className="flex items-center justify-between gap-4 lg:block">
          <Link to="/" className="flex items-center gap-3 lg:mb-8">
            <Logo variant="monogram" className="h-10 w-auto invert brightness-200 lg:h-12" />
            <span className="font-serif text-lg tracking-[0.18em]">ROYAL</span>
          </Link>
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40 lg:mb-4 lg:block">
            Admin Console
          </p>
        </div>
        <nav className="mt-4 flex gap-1 overflow-x-auto pb-1 lg:mt-0 lg:flex-1 lg:flex-col lg:space-y-1 lg:overflow-visible">
          {NAV.map((navItem) => {
            const active = pathname === navItem.href || pathname.startsWith(`${navItem.href}/`);
            const Icon = navItem.icon;
            return (
              <Link
                key={navItem.href}
                to={navItem.href as string}
                className={`flex shrink-0 items-center gap-2 rounded px-3 py-2 text-sm transition lg:gap-3 lg:px-4 lg:py-3 ${
                  active ? "bg-gold text-white" : "text-white/70 hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4" /> {navItem.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 hidden border-t border-white/10 pt-6 lg:block">
          <p className="mb-4 truncate text-xs text-white/50">{email}</p>
          <Link to="/" className="flex items-center gap-2 text-xs text-white/60 hover:text-white">
            <ArrowLeft className="h-3 w-3" /> Back to store
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
            className="mt-3 text-xs text-white/60 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
