import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["pending","processing","shipped","delivered","cancelled"] as const;

function AdminOrders() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("*, items:order_items(*)").order("created_at", { ascending: false })).data ?? [],
  });

  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order updated");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Orders</h1>
      {isLoading ? <p>Loading...</p> : (
        <div className="space-y-4">
          {orders.map((o: any) => (
            <div key={o.id} className="bg-white rounded-2xl p-6 border border-charcoal/5">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <p className="font-mono text-xs text-charcoal/50">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-sm font-medium mt-1">{o.customer_name}</p>
                  <p className="text-xs text-charcoal/60">{o.customer_email} · {o.customer_phone}</p>
                  <p className="text-xs text-charcoal/60 mt-1">{o.shipping_address}, {o.shipping_city}, {o.shipping_country}</p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-xl">{formatPrice(o.total)}</p>
                  <p className="text-xs text-charcoal/60 capitalize">{o.payment_method}</p>
                  <p className="text-xs text-charcoal/60">{new Date(o.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="border-t border-charcoal/10 pt-3 space-y-1 mb-4">
                {o.items.map((it: any) => (
                  <p key={it.id} className="text-sm text-charcoal/70">{it.product_name} × {it.quantity} — {formatPrice(Number(it.unit_price) * it.quantity)}</p>
                ))}
              </div>
              <select value={o.status} onChange={(e) => update(o.id, e.target.value)} className="border border-charcoal/15 px-3 py-2 text-sm rounded">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
