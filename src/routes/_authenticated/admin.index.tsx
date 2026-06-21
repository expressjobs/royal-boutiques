import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

type OrderSummary = {
  id: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total: number;
  created_at: string;
};

type ProductSummary = {
  id: string;
  name: string;
  stock: number;
  is_active: boolean;
  created_at: string;
  image_url: string | null;
};

function Dashboard() {
  const summary = useQuery({
    queryKey: ["admin-dashboard-summary"],
    queryFn: async () => {
      const [productsRes, ordersRes, profilesRes, recentOrdersRes, recentProductsRes] =
        await Promise.all([
          supabase.from("products").select("id, stock, is_active"),
          supabase.from("orders").select("id, status, total"),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase
            .from("orders")
            .select("id, customer_name, customer_email, status, total, created_at")
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("products")
            .select("id, name, stock, is_active, created_at, image_url")
            .order("created_at", { ascending: false })
            .limit(6),
        ]);

      if (productsRes.error) throw productsRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (recentOrdersRes.error) throw recentOrdersRes.error;
      if (recentProductsRes.error) throw recentProductsRes.error;

      const products = productsRes.data ?? [];
      const orders = ordersRes.data ?? [];
      const paidOrders = orders.filter(
        (order) => order.status === "paid" || order.status === "delivered",
      );

      return {
        totalProducts: products.length,
        activeProducts: products.filter((product) => product.is_active).length,
        lowStockProducts: products.filter((product) => product.stock <= 10).length,
        totalOrders: orders.length,
        pendingOrders: orders.filter((order) =>
          ["pending", "pending_payment", "manual_pending", "processing"].includes(order.status),
        ).length,
        paidOrders: paidOrders.length,
        totalRevenue: paidOrders.reduce((sum, order) => sum + Number(order.total), 0),
        customers: profilesRes.count ?? 0,
        recentOrders: (recentOrdersRes.data ?? []) as OrderSummary[],
        recentProducts: (recentProductsRes.data ?? []) as ProductSummary[],
      };
    },
  });

  if (summary.isLoading) return <AdminState text="Loading dashboard..." />;
  if (summary.error)
    return <AdminState text="Could not load dashboard metrics. Check admin RLS policies." />;

  const data = summary.data;

  return (
    <div>
      <div className="mb-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
          Royal Boutiques Command
        </p>
        <h1 className="mt-2 font-serif text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          Store health, orders, revenue, and catalogue activity.
        </p>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={<Package className="h-5 w-5" />}
          label="Total products"
          value={data?.totalProducts ?? 0}
          sub={`${data?.activeProducts ?? 0} active`}
        />
        <Stat
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Low stock"
          value={data?.lowStockProducts ?? 0}
          sub="10 or fewer units"
        />
        <Stat
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Orders"
          value={data?.totalOrders ?? 0}
          sub={`${data?.pendingOrders ?? 0} pending`}
        />
        <Stat
          icon={<DollarSign className="h-5 w-5" />}
          label="Revenue"
          value={formatPrice(data?.totalRevenue ?? 0)}
          sub={`${data?.paidOrders ?? 0} paid orders`}
        />
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <Stat
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Paid orders"
          value={data?.paidOrders ?? 0}
          sub="Paid or delivered"
        />
        <Stat
          icon={<Users className="h-5 w-5" />}
          label="Customers"
          value={data?.customers ?? 0}
          sub="Profile records"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Recent Orders"
          action={
            <Link to="/admin/orders" className="text-xs uppercase tracking-widest text-gold">
              View all
            </Link>
          }
        >
          {!data?.recentOrders.length ? (
            <Empty text="No orders yet." />
          ) : (
            <div className="space-y-3">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-4 border-b border-charcoal/5 pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{order.customer_name || order.customer_email}</p>
                    <p className="text-xs text-charcoal/50">
                      #{order.id.slice(0, 8).toUpperCase()} - {order.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(order.total)}</p>
                    <p className="text-xs text-charcoal/50">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Recent Products"
          action={
            <Link to="/admin/products" className="text-xs uppercase tracking-widest text-gold">
              Manage
            </Link>
          }
        >
          {!data?.recentProducts.length ? (
            <Empty text="No products yet." />
          ) : (
            <div className="space-y-3">
              {data.recentProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-4 border-b border-charcoal/5 pb-3 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-12 w-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-charcoal/50">{product.stock} in stock</p>
                    </div>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-[10px] uppercase tracking-widest ${product.is_active ? "bg-emerald-50 text-emerald-700" : "bg-charcoal/10 text-charcoal/60"}`}
                  >
                    {product.is_active ? "Active" : "Hidden"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="rounded border border-charcoal/10 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-charcoal/50">
          {label}
        </span>
        <span className="text-gold">{icon}</span>
      </div>
      <p className="font-serif text-3xl">{value}</p>
      <p className="mt-1 text-xs text-charcoal/50">{sub}</p>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-charcoal/10 bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-serif text-xl">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-charcoal/50">{text}</p>;
}

function AdminState({ text }: { text: string }) {
  return (
    <div className="rounded border border-charcoal/10 bg-white p-8 text-sm text-charcoal/60">
      {text}
    </div>
  );
}
