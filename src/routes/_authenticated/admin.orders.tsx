import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

const STATUSES = [
  "pending",
  "pending_payment",
  "payment_failed",
  "paid",
  "manual_pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_country: string;
  payment_method: string;
  status: string;
  total: number;
  created_at: string;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    size: string | null;
    color: string | null;
  }>;
  payments: Array<{ status: string; provider: string; amount: number }>;
};

function AdminOrders() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*), payments(status, provider, amount)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  const orders = ordersQuery.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (status && order.status !== status) return false;
      if (
        term &&
        !`${order.id} ${order.customer_email} ${order.customer_name}`.toLowerCase().includes(term)
      )
        return false;
      return true;
    });
  }, [orders, status, search]);

  const update = async (id: string, nextStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: nextStatus as never })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order updated");
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard-summary"] });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl">Orders</h1>
        <p className="text-sm text-charcoal/60">
          {filtered.length} shown from {orders.length} orders
        </p>
      </div>

      <div className="mb-6 grid gap-3 rounded border border-charcoal/10 bg-white p-4 lg:grid-cols-[1fr_220px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-charcoal/40" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order id, customer name, or email"
            className="w-full rounded border border-charcoal/15 py-3 pl-10 pr-4 text-sm"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded border border-charcoal/15 px-3 py-3 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {ordersQuery.isLoading ? (
        <State text="Loading orders..." />
      ) : ordersQuery.error ? (
        <State text="Could not load orders." />
      ) : filtered.length === 0 ? (
        <State text="No orders match these filters." />
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const latestPayment = order.payments?.[0];
            const paymentStatus = latestPayment?.status ?? order.status;
            return (
              <div key={order.id} className="rounded border border-charcoal/10 bg-white p-6">
                <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-mono text-xs text-charcoal/50">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <h2 className="mt-1 font-serif text-xl">{order.customer_name}</h2>
                    <p className="text-sm text-charcoal/60">
                      {order.customer_email} - {order.customer_phone}
                    </p>
                    <p className="mt-1 text-xs text-charcoal/50">
                      {order.shipping_address}, {order.shipping_city}, {order.shipping_country}
                    </p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="font-serif text-2xl">{formatPrice(order.total)}</p>
                    <p className="text-xs uppercase tracking-widest text-charcoal/50">
                      {order.payment_method} - {paymentStatus}
                    </p>
                    <p className="text-xs text-charcoal/50">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mb-4 overflow-hidden rounded border border-charcoal/10">
                  <table className="w-full text-sm">
                    <thead className="bg-nude text-[10px] uppercase tracking-[0.2em] text-charcoal/50">
                      <tr>
                        <th className="p-3 text-left">Item</th>
                        <th className="p-3 text-left">Options</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items?.map((item) => (
                        <tr key={item.id} className="border-t border-charcoal/5">
                          <td className="p-3">
                            {item.product_name} x {item.quantity}
                          </td>
                          <td className="p-3 text-charcoal/50">
                            {[item.size, item.color].filter(Boolean).join(" / ") || "-"}
                          </td>
                          <td className="p-3 text-right">
                            {formatPrice(Number(item.unit_price) * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs uppercase tracking-widest text-charcoal/50">
                    Order status
                  </span>
                  <select
                    value={order.status}
                    onChange={(event) => update(order.id, event.target.value)}
                    className="rounded border border-charcoal/15 px-3 py-2 text-sm"
                  >
                    {STATUSES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function State({ text }: { text: string }) {
  return (
    <div className="rounded border border-charcoal/10 bg-white p-10 text-center text-sm text-charcoal/60">
      {text}
    </div>
  );
}
