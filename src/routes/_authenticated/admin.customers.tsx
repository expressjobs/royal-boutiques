import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({ meta: [{ title: "Customers - Admin - Royal Boutiques" }] }),
  component: AdminCustomers,
});

type Customer = {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  email: string;
  order_count: number;
  lifetime_spend: number;
};

function AdminCustomers() {
  const [search, setSearch] = useState("");

  const customersQuery = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, phone, address, city, country, created_at")
        .order("created_at", { ascending: false });
      if (profilesError) throw profilesError;

      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("user_id, customer_email, total");
      if (ordersError) throw ordersError;

      const totals = new Map<
        string,
        { email: string; order_count: number; lifetime_spend: number }
      >();
      (orders ?? []).forEach((order) => {
        const current = totals.get(order.user_id) ?? {
          email: "",
          order_count: 0,
          lifetime_spend: 0,
        };
        current.email = current.email || order.customer_email;
        current.order_count += 1;
        current.lifetime_spend += Number(order.total);
        totals.set(order.user_id, current);
      });

      return (profiles ?? []).map((profile) => {
        const orderTotals = totals.get(profile.id) ?? {
          email: "",
          order_count: 0,
          lifetime_spend: 0,
        };
        return { ...profile, ...orderTotals };
      }) as Customer[];
    },
  });

  const customers = customersQuery.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      `${customer.full_name ?? ""} ${customer.email} ${customer.phone ?? ""} ${customer.city ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [customers, search]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl">Customers</h1>
        <p className="text-sm text-charcoal/60">{filtered.length} customer profiles</p>
      </div>

      <label className="relative mb-6 block max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-charcoal/40" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, email, phone, or city"
          className="w-full rounded border border-charcoal/15 bg-white py-3 pl-10 pr-4 text-sm"
        />
      </label>

      <div className="overflow-hidden rounded border border-charcoal/10 bg-white">
        {customersQuery.isLoading ? (
          <State text="Loading customers..." />
        ) : customersQuery.error ? (
          <State text="Could not load customers. Apply the admin profile read policy migration." />
        ) : filtered.length === 0 ? (
          <State text="No customers match this search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-nude text-[10px] uppercase tracking-[0.2em] text-charcoal/50">
                <tr>
                  <th className="p-4 text-left">Customer</th>
                  <th className="p-4 text-left">Contact</th>
                  <th className="p-4 text-left">Address</th>
                  <th className="p-4 text-left">Orders</th>
                  <th className="p-4 text-left">Lifetime spend</th>
                  <th className="p-4 text-left">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id} className="border-t border-charcoal/5">
                    <td className="p-4">
                      <p className="font-medium">{customer.full_name || "Unnamed customer"}</p>
                      <p className="font-mono text-xs text-charcoal/40">
                        {customer.id.slice(0, 8)}
                      </p>
                    </td>
                    <td className="p-4">
                      <p>{customer.email || "No order email yet"}</p>
                      <p className="text-xs text-charcoal/50">{customer.phone || "No phone"}</p>
                    </td>
                    <td className="p-4 text-charcoal/60">
                      {[customer.address, customer.city, customer.country]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </td>
                    <td className="p-4">{customer.order_count}</td>
                    <td className="p-4">{formatPrice(customer.lifetime_spend)}</td>
                    <td className="p-4 text-charcoal/60">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function State({ text }: { text: string }) {
  return <div className="p-10 text-center text-sm text-charcoal/60">{text}</div>;
}
