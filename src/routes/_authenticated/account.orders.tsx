import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/account/orders")({
  component: OrdersPage,
});

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-soft text-charcoal",
  pending_payment: "bg-amber-50 text-amber-800",
  payment_failed: "bg-red-50 text-red-800",
  paid: "bg-emerald-50 text-emerald-800",
  manual_pending: "bg-blue-50 text-blue-800",
  processing: "bg-blue-50 text-blue-800",
  shipped: "bg-amber-50 text-amber-800",
  delivered: "bg-emerald-50 text-emerald-800",
  cancelled: "bg-red-50 text-red-800",
};

function OrdersPage() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <h2 className="font-serif text-2xl mb-6">Order History</h2>
      {isLoading ? (
        <p className="text-charcoal/50">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-nude rounded-2xl">
          <p className="font-serif text-xl">No orders yet</p>
          <Link
            to="/shop"
            className="mt-4 inline-block text-xs uppercase tracking-widest border-b border-charcoal"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o: any) => (
            <div key={o.id} className="border border-charcoal/10 rounded-xl p-6">
              <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                <div>
                  <p className="text-xs text-charcoal/50 font-mono">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-charcoal/60 mt-1">
                    {new Date(o.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-medium ${STATUS_COLOR[o.status] ?? ""}`}
                >
                  {o.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                {o.items.map((it: any) => (
                  <div key={it.id} className="flex justify-between text-sm">
                    <span className="text-charcoal/70">
                      {it.product_name} × {it.quantity}
                    </span>
                    <span>{formatPrice(Number(it.unit_price) * it.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-charcoal/10">
                <span className="text-xs text-charcoal/60 uppercase tracking-widest">Total</span>
                <span className="font-serif text-lg">{formatPrice(o.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
