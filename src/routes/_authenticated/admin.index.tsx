import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { DollarSign, ShoppingCart, Package, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin-summary"],
    queryFn: async () => {
      const [orders, products, reviews] = await Promise.all([
        supabase.from("orders").select("total, status, created_at"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
      ]);
      const allOrders = orders.data ?? [];
      const revenue = allOrders.reduce((s, o) => s + Number(o.total), 0);
      const customerSet = new Set(allOrders.map((o: any) => o.user_id));
      return {
        revenue,
        orderCount: allOrders.length,
        productCount: products.count ?? 0,
        reviewCount: reviews.count ?? 0,
        recent: allOrders.slice(-5).reverse(),
        customers: customerSet.size,
      };
    },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Dashboard</h1>
      <p className="text-sm text-charcoal/60 mb-10">Overview of your boutique</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Stat icon={<DollarSign className="h-5 w-5" />} label="Revenue" value={data ? formatPrice(data.revenue) : "..."} />
        <Stat icon={<ShoppingCart className="h-5 w-5" />} label="Orders" value={data?.orderCount ?? "..."} />
        <Stat icon={<Package className="h-5 w-5" />} label="Products" value={data?.productCount ?? "..."} />
        <Stat icon={<Users className="h-5 w-5" />} label="Reviews" value={data?.reviewCount ?? "..."} />
      </div>

      <div className="bg-white rounded-2xl p-6 border border-charcoal/5">
        <h2 className="font-serif text-xl mb-4">Recent Orders</h2>
        {!data?.recent.length ? <p className="text-sm text-charcoal/50">No orders yet.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-charcoal/50 eyebrow">
              <th className="py-2">Status</th><th>Total</th><th>Date</th>
            </tr></thead>
            <tbody>
              {data.recent.map((o: any, i) => (
                <tr key={i} className="border-t border-charcoal/5">
                  <td className="py-3 capitalize">{o.status}</td>
                  <td>{formatPrice(o.total)}</td>
                  <td className="text-charcoal/60">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-charcoal/5">
      <div className="flex items-center justify-between mb-3">
        <span className="eyebrow text-charcoal/50">{label}</span>
        <span className="text-gold">{icon}</span>
      </div>
      <p className="font-serif text-3xl">{value}</p>
    </div>
  );
}
