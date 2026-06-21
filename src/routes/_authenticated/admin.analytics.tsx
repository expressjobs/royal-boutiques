import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { TrendingUp, AlertCircle, ShoppingBag, DollarSign, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Range = 7 | 30 | 90;

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Admin · Royal Boutiques" }] }),
  component: AdminAnalytics,
});

function AdminAnalytics() {
  const [range, setRange] = useState<Range>(7);

  const { data } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const [orders, products, items] = await Promise.all([
        supabase.from("orders").select("total, created_at, status, user_id"),
        supabase.from("products").select("id, name, stock, image_url, slug"),
        supabase.from("order_items").select("product_id, product_name, quantity, unit_price, created_at"),
      ]);
      return {
        orders: orders.data ?? [],
        products: products.data ?? [],
        items: items.data ?? [],
      };
    },
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const now = Date.now();
    const rangeMs = range * 24 * 60 * 60 * 1000;
    const prevRangeStart = now - 2 * rangeMs;

    const ordersInRange = data.orders.filter((o: any) => now - new Date(o.created_at).getTime() <= rangeMs);
    const ordersPrev = data.orders.filter((o: any) => {
      const t = new Date(o.created_at).getTime();
      return t > prevRangeStart && now - t > rangeMs;
    });
    const sum = (arr: any[]) => arr.reduce((s, o) => s + Number(o.total), 0);
    const revenue = sum(ordersInRange);
    const revenuePrev = sum(ordersPrev);
    const customers = new Set(ordersInRange.map((o: any) => o.user_id).filter(Boolean)).size;
    const customersPrev = new Set(ordersPrev.map((o: any) => o.user_id).filter(Boolean)).size;
    const avg = ordersInRange.length ? revenue / ordersInRange.length : 0;
    const avgPrev = ordersPrev.length ? revenuePrev / ordersPrev.length : 0;

    // Daily series
    const days: { day: string; revenue: number; orders: number }[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      const dayOrders = data.orders.filter((o: any) => { const x = new Date(o.created_at); return x >= d && x < next; });
      days.push({
        day: d.toLocaleDateString("en", range > 30 ? { month: "short", day: "numeric" } : { weekday: "short" }),
        revenue: sum(dayOrders),
        orders: dayOrders.length,
      });
    }

    // Top products
    const counts = new Map<string, { name: string; qty: number; rev: number }>();
    data.items.forEach((it: any) => {
      const cur = counts.get(it.product_id) ?? { name: it.product_name, qty: 0, rev: 0 };
      cur.qty += it.quantity;
      cur.rev += Number(it.unit_price) * it.quantity;
      counts.set(it.product_id, cur);
    });
    const top = [...counts.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

    // Low stock
    const lowStock = data.products.filter((p: any) => p.stock <= 5).sort((a: any, b: any) => a.stock - b.stock);

    return { revenue, revenuePrev, customers, customersPrev, avg, avgPrev, orderCount: ordersInRange.length, prevCount: ordersPrev.length, days, top, lowStock };
  }, [data, range]);

  const maxDay = Math.max(1, ...(stats?.days.map((d) => d.revenue) ?? [1]));

  const deltaPct = (a: number, b: number) => (b === 0 ? (a > 0 ? 100 : 0) : Math.round(((a - b) / b) * 100));

  return (
    <div>
      <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl mb-2">Analytics</h1>
          <p className="text-sm text-charcoal/60">Sales performance & inventory health.</p>
        </div>
        <div className="flex bg-white border border-charcoal/10 rounded-full p-1">
          {([7, 30, 90] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-semibold rounded-full transition ${
                range === r ? "bg-charcoal text-white" : "text-charcoal/60 hover:text-charcoal"
              }`}
            >
              Last {r} days
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Stat icon={<DollarSign className="h-5 w-5" />} label="Revenue" value={stats ? formatPrice(stats.revenue) : "—"} delta={stats ? deltaPct(stats.revenue, stats.revenuePrev) : null} />
        <Stat icon={<ShoppingBag className="h-5 w-5" />} label="Orders" value={stats?.orderCount ?? "—"} delta={stats ? deltaPct(stats.orderCount, stats.prevCount) : null} />
        <Stat icon={<TrendingUp className="h-5 w-5" />} label="Avg Order" value={stats ? formatPrice(stats.avg) : "—"} delta={stats ? deltaPct(stats.avg, stats.avgPrev) : null} />
        <Stat icon={<Users className="h-5 w-5" />} label="Customers" value={stats?.customers ?? "—"} delta={stats ? deltaPct(stats.customers, stats.customersPrev) : null} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-charcoal/5 p-6">
          <h2 className="font-serif text-xl mb-6">Revenue · last {range} days</h2>
          <div className="flex items-end gap-1.5 h-56">
            {stats?.days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group min-w-0">
                <div className="w-full bg-soft rounded-t flex-1 flex items-end relative">
                  <div
                    className="w-full bg-gradient-to-t from-gold to-gold-soft rounded-t transition-all hover:from-charcoal hover:to-charcoal/70"
                    style={{ height: `${(d.revenue / maxDay) * 100}%` }}
                    title={`${d.day}: ${formatPrice(d.revenue)} (${d.orders} orders)`}
                  />
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] bg-charcoal text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    {formatPrice(d.revenue)}
                  </span>
                </div>
                {(range <= 14 || i % Math.ceil(range / 12) === 0) && (
                  <span className="text-[9px] text-charcoal/60 truncate">{d.day}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-charcoal/5 p-6">
          <h2 className="font-serif text-xl mb-6">Top Products</h2>
          {!stats?.top.length ? (
            <p className="text-sm text-charcoal/50">No sales yet.</p>
          ) : (
            <ul className="space-y-4">
              {stats.top.map((p, i) => (
                <li key={i} className="flex justify-between items-start gap-3 text-sm">
                  <div className="flex gap-2 min-w-0 flex-1">
                    <span className="font-serif text-gold w-5 shrink-0">#{i + 1}</span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-xs text-charcoal/50">{p.qty} sold</p>
                    </div>
                  </div>
                  <p className="text-charcoal/70 text-xs shrink-0">{formatPrice(p.rev)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-charcoal/5 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Low Stock Alerts
          </h2>
          <Link to="/admin/products" className="text-[11px] uppercase tracking-[0.2em] font-semibold text-charcoal/60 hover:text-charcoal">
            Manage →
          </Link>
        </div>
        {!stats?.lowStock.length ? (
          <p className="text-sm text-charcoal/50">All products are well-stocked.</p>
        ) : (
          <ul className="divide-y divide-charcoal/5">
            {stats.lowStock.map((p: any) => (
              <li key={p.id} className="flex items-center gap-3 text-sm py-3">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="h-12 w-12 object-cover rounded-lg" />
                ) : (
                  <div className="h-12 w-12 bg-soft rounded-lg" />
                )}
                <Link
                  to="/product/$slug"
                  params={{ slug: p.slug }}
                  target="_blank"
                  className="flex-1 font-medium hover:text-gold transition truncate"
                >
                  {p.name}
                </Link>
                <span className={`text-[11px] px-2 py-1 rounded font-semibold ${p.stock === 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                  {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, delta }: { icon: React.ReactNode; label: string; value: any; delta: number | null }) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="bg-white rounded-2xl p-5 border border-charcoal/5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gold">{icon}</span>
        {delta !== null && (
          <span className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${positive ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"}`}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="eyebrow text-charcoal/50">{label}</p>
      <p className="font-serif text-2xl mt-1">{value}</p>
    </div>
  );
}
