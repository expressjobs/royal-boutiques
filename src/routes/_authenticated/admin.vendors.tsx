import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/vendors")({
  head: () => ({ meta: [{ title: "Vendors - Admin - Royal Boutiques" }] }),
  component: AdminVendors,
});

type VendorRow = {
  id: string;
  business_name: string;
  slug: string;
  contact_email: string;
  contact_phone: string | null;
  city: string | null;
  country: string | null;
  status: string;
  default_commission_value: number;
  rating: number | null;
  total_sales: number | null;
  created_at: string;
};

function AdminVendors() {
  const vendorsQuery = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: async () => {
      const [vendorsRes, usersRes, productsRes, ordersRes, payoutsRes] = await Promise.all([
        supabase.from("vendors").select("*").order("created_at", { ascending: false }),
        supabase.from("vendor_users").select("vendor_id"),
        supabase.from("vendor_products").select("vendor_id, approved, is_active"),
        supabase.from("vendor_orders").select("vendor_id, subtotal, vendor_earnings, status"),
        supabase.from("vendor_payouts").select("vendor_id, amount, status"),
      ]);

      if (vendorsRes.error) throw vendorsRes.error;
      if (usersRes.error) throw usersRes.error;
      if (productsRes.error) throw productsRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (payoutsRes.error) throw payoutsRes.error;

      return (vendorsRes.data ?? []).map((vendor) => {
        const vendorUsers = (usersRes.data ?? []).filter((item) => item.vendor_id === vendor.id);
        const vendorProducts = (productsRes.data ?? []).filter(
          (item) => item.vendor_id === vendor.id,
        );
        const vendorOrders = (ordersRes.data ?? []).filter((item) => item.vendor_id === vendor.id);
        const vendorPayouts = (payoutsRes.data ?? []).filter(
          (item) => item.vendor_id === vendor.id,
        );
        return {
          vendor: vendor as VendorRow,
          users: vendorUsers.length,
          products: vendorProducts.length,
          approvedProducts: vendorProducts.filter((item) => item.approved).length,
          orders: vendorOrders.length,
          earnings: vendorOrders.reduce((sum, item) => sum + Number(item.vendor_earnings), 0),
          payouts: vendorPayouts.length,
          pendingPayouts: vendorPayouts
            .filter((item) => item.status === "pending")
            .reduce((sum, item) => sum + Number(item.amount), 0),
        };
      });
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl">Vendors</h1>
        <p className="text-sm text-charcoal/60">
          Existing vendor marketplace tables: vendors, vendor_users, vendor_products, vendor_orders,
          vendor_payouts.
        </p>
      </div>

      {vendorsQuery.isLoading ? (
        <State text="Loading vendors..." />
      ) : vendorsQuery.error ? (
        <State text="Could not load vendor tables. Confirm marketplace migrations and admin RLS policies are applied." />
      ) : !vendorsQuery.data?.length ? (
        <State text="No vendors yet. Vendor tables exist, but no vendor records were found." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {vendorsQuery.data.map((item) => (
            <div key={item.vendor.id} className="rounded border border-charcoal/10 bg-white p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded bg-nude text-gold">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-serif text-xl">{item.vendor.business_name}</h2>
                    <p className="text-xs text-charcoal/50">
                      {item.vendor.contact_email} - {item.vendor.contact_phone ?? "No phone"}
                    </p>
                    <p className="text-xs text-charcoal/50">
                      {[item.vendor.city, item.vendor.country].filter(Boolean).join(", ") ||
                        "No location"}
                    </p>
                  </div>
                </div>
                <span className="rounded bg-gold/10 px-2 py-1 text-[10px] uppercase tracking-widest text-gold">
                  {item.vendor.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <Metric label="Users" value={item.users} />
                <Metric label="Products" value={`${item.approvedProducts}/${item.products}`} />
                <Metric label="Orders" value={item.orders} />
                <Metric label="Earnings" value={formatPrice(item.earnings)} />
              </div>

              <div className="mt-5 border-t border-charcoal/5 pt-4 text-xs text-charcoal/60">
                <p>Commission: {item.vendor.default_commission_value}%</p>
                <p>Total sales: {formatPrice(item.vendor.total_sales ?? 0)}</p>
                <p>
                  Pending payouts: {formatPrice(item.pendingPayouts)} across {item.payouts} payout
                  records
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded bg-nude p-3">
      <p className="text-[10px] uppercase tracking-widest text-charcoal/50">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
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
