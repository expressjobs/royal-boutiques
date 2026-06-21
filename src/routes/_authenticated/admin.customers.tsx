import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Admin · Royal Boutiques" }] }),
  component: AdminCustomers,
});

function AdminCustomers() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, city, country, created_at")
        .order("created_at", { ascending: false });
      const { data: orders } = await supabase.from("orders").select("user_id, total");
      const totals = new Map<string, { count: number; spend: number }>();
      (orders ?? []).forEach((o: any) => {
        const cur = totals.get(o.user_id) ?? { count: 0, spend: 0 };
        cur.count += 1; cur.spend += Number(o.total);
        totals.set(o.user_id, cur);
      });
      return (profiles ?? []).map((p: any) => ({ ...p, ...(totals.get(p.id) ?? { count: 0, spend: 0 }) }));
    },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Customers</h1>
      <p className="text-sm text-charcoal/60 mb-8">{data.length} registered</p>
      <div className="bg-white rounded-2xl border border-charcoal/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-nude eyebrow text-charcoal/50">
            <tr>
              <th className="text-left p-4">Customer</th>
              <th className="text-left">Location</th>
              <th className="text-left">Orders</th>
              <th className="text-left">Lifetime spend</th>
              <th className="text-left">Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-charcoal/50">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-charcoal/50">No customers yet.</td></tr>
            ) : (
              data.map((c: any) => (
                <tr key={c.id} className="border-t border-charcoal/5">
                  <td className="p-4">
                    <p className="font-medium">{c.full_name || "—"}</p>
                    <p className="text-xs text-charcoal/50">{c.phone || ""}</p>
                  </td>
                  <td>{[c.city, c.country].filter(Boolean).join(", ") || "—"}</td>
                  <td>{c.count}</td>
                  <td>{formatPrice(c.spend)}</td>
                  <td className="text-charcoal/60">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
