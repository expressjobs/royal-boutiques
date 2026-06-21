import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { BoutiqueLayout } from "@/components/layout/BoutiqueLayout";
import { ProductCard } from "@/components/ProductCard";
import { Search, SlidersHorizontal, X } from "lucide-react";

type SortKey = "newest" | "price-asc" | "price-desc" | "rating";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  sort: fallback(z.enum(["newest", "price-asc", "price-desc", "rating"]), "newest").default("newest"),
  category: fallback(z.string(), "").default(""),
  size: fallback(z.string(), "").default(""),
  color: fallback(z.string(), "").default(""),
  min: fallback(z.number().min(0), 0).default(0),
  max: fallback(z.number().min(0), 1000).default(1000),
  inStock: fallback(z.boolean(), false).default(false),
});

export const Route = createFileRoute("/shop")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Shop All — Royal Boutiques" },
      { name: "description", content: "Browse the entire Royal Boutiques collection: dresses, shoes, bags, accessories, and luxury edits." },
      { property: "og:title", content: "Shop the Collection — Royal Boutiques" },
      { property: "og:description", content: "Curated luxury fashion for the modern woman." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [qLocal, setQLocal] = useState(search.q);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      if (qLocal !== search.q) navigate({ search: (p: any) => ({ ...p, q: qLocal }), replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [qLocal]); // eslint-disable-line

  const { data: categories = [] } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: async () => (await supabase.from("categories").select("slug, name").order("name")).data ?? [],
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop", search.sort],
    queryFn: async () => {
      let qry = supabase.from("products").select("*, category:categories(name, slug)").eq("is_active", true);
      if (search.sort === "price-asc") qry = qry.order("price", { ascending: true });
      else if (search.sort === "price-desc") qry = qry.order("price", { ascending: false });
      else if (search.sort === "rating") qry = qry.order("rating", { ascending: false });
      else qry = qry.order("created_at", { ascending: false });
      const { data, error } = await qry;
      if (error) throw error;
      return data ?? [];
    },
  });

  // Compute facets from all products
  const facets = useMemo(() => {
    const sizes = new Set<string>();
    const colors = new Set<string>();
    let priceMax = 0;
    products.forEach((p: any) => {
      (p.sizes ?? []).forEach((s: string) => sizes.add(s));
      (p.colors ?? []).forEach((c: string) => colors.add(c));
      const price = Number(p.sale_price ?? p.price);
      if (price > priceMax) priceMax = price;
    });
    return { sizes: [...sizes], colors: [...colors], priceMax: Math.ceil(priceMax / 50) * 50 || 1000 };
  }, [products]);

  const filtered = useMemo(() => {
    const ql = search.q.toLowerCase();
    return products.filter((p: any) => {
      if (ql && !p.name.toLowerCase().includes(ql) && !p.description?.toLowerCase().includes(ql)) return false;
      if (search.category && p.category?.slug !== search.category) return false;
      if (search.size && !(p.sizes ?? []).includes(search.size)) return false;
      if (search.color && !(p.colors ?? []).includes(search.color)) return false;
      const price = Number(p.sale_price ?? p.price);
      if (price < search.min || price > search.max) return false;
      if (search.inStock && p.stock <= 0) return false;
      return true;
    });
  }, [products, search]);

  const update = (patch: Partial<typeof search>) =>
    navigate({ search: (p: any) => ({ ...p, ...patch }), replace: true });

  const clearAll = () => navigate({ search: () => ({ q: "", sort: "newest", category: "", size: "", color: "", min: 0, max: 1000, inStock: false }) });

  const activeChips: { label: string; clear: () => void }[] = [];
  if (search.q) activeChips.push({ label: `"${search.q}"`, clear: () => { setQLocal(""); update({ q: "" }); } });
  if (search.category) activeChips.push({ label: categories.find((c: any) => c.slug === search.category)?.name ?? search.category, clear: () => update({ category: "" }) });
  if (search.size) activeChips.push({ label: `Size ${search.size}`, clear: () => update({ size: "" }) });
  if (search.color) activeChips.push({ label: search.color, clear: () => update({ color: "" }) });
  if (search.min > 0 || search.max < 1000) activeChips.push({ label: `$${search.min}–$${search.max}`, clear: () => update({ min: 0, max: 1000 }) });
  if (search.inStock) activeChips.push({ label: "In stock", clear: () => update({ inStock: false }) });

  const FilterPanel = (
    <div className="space-y-8">
      <div>
        <h3 className="eyebrow mb-4">Category</h3>
        <div className="space-y-1.5 text-sm">
          <FilterRadio name="category" value="" current={search.category} onChange={(v) => update({ category: v })} label="All Categories" />
          {categories.map((c: any) => (
            <FilterRadio key={c.slug} name="category" value={c.slug} current={search.category} onChange={(v) => update({ category: v })} label={c.name} />
          ))}
        </div>
      </div>

      {facets.sizes.length > 0 && (
        <div>
          <h3 className="eyebrow mb-4">Size</h3>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => (
              <button
                key={s}
                onClick={() => update({ size: search.size === s ? "" : s })}
                className={`min-w-[40px] h-9 px-3 border text-xs rounded transition ${
                  search.size === s ? "border-charcoal bg-charcoal text-white" : "border-charcoal/20 hover:border-charcoal"
                }`}
              >{s}</button>
            ))}
          </div>
        </div>
      )}

      {facets.colors.length > 0 && (
        <div>
          <h3 className="eyebrow mb-4">Color</h3>
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((c) => (
              <button
                key={c}
                onClick={() => update({ color: search.color === c ? "" : c })}
                className={`px-3 h-9 border text-[11px] uppercase tracking-wider rounded transition ${
                  search.color === c ? "border-charcoal bg-charcoal text-white" : "border-charcoal/20 hover:border-charcoal"
                }`}
              >{c}</button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="eyebrow mb-4">Price</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            value={search.min}
            min={0}
            onChange={(e) => update({ min: Math.max(0, Number(e.target.value) || 0) })}
            className="w-full bg-white border border-charcoal/15 px-3 py-2 text-sm rounded"
            placeholder="Min"
          />
          <input
            type="number"
            value={search.max}
            min={0}
            onChange={(e) => update({ max: Math.max(0, Number(e.target.value) || 0) })}
            className="w-full bg-white border border-charcoal/15 px-3 py-2 text-sm rounded"
            placeholder="Max"
          />
        </div>
        <input
          type="range" min={0} max={facets.priceMax || 1000} step={25}
          value={Math.min(search.max, facets.priceMax || 1000)}
          onChange={(e) => update({ max: Number(e.target.value) })}
          className="w-full accent-gold"
        />
        <p className="text-xs text-charcoal/60 mt-2">Up to ${search.max}</p>
      </div>

      <label className="flex items-center gap-3 text-sm cursor-pointer">
        <input type="checkbox" checked={search.inStock} onChange={(e) => update({ inStock: e.target.checked })} className="accent-gold h-4 w-4" />
        In stock only
      </label>

      <button onClick={clearAll} className="eyebrow text-charcoal/50 underline">Clear all filters</button>
    </div>
  );

  return (
    <BoutiqueLayout>
      <section className="bg-nude py-16 border-b border-charcoal/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="eyebrow text-gold">The Boutique</p>
          <h1 className="font-serif text-4xl md:text-5xl mt-3">Shop All</h1>
          <p className="text-charcoal/60 mt-4 max-w-md mx-auto text-sm">Every piece, curated and ready to ship.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        {/* Top bar: search + sort + mobile filter trigger */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
            <input
              value={qLocal}
              onChange={(e) => setQLocal(e.target.value)}
              placeholder="Search products"
              className="w-full bg-white border border-charcoal/10 pl-10 pr-4 py-3 text-sm rounded-full focus:outline-none focus:border-gold"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-3 border border-charcoal/15 rounded-full text-[11px] uppercase tracking-[0.2em] font-semibold"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
              {activeChips.length > 0 && <span className="bg-gold text-white rounded-full h-5 min-w-5 px-1.5 grid place-items-center text-[10px]">{activeChips.length}</span>}
            </button>
            <select
              value={search.sort}
              onChange={(e) => update({ sort: e.target.value as SortKey })}
              className="bg-white border border-charcoal/10 px-4 py-3 text-sm rounded-full focus:outline-none focus:border-gold"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
              <option value="rating">Best Rated</option>
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {activeChips.map((c, i) => (
              <button
                key={i}
                onClick={c.clear}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-soft text-charcoal text-xs rounded-full hover:bg-charcoal hover:text-white transition"
              >
                {c.label} <X className="h-3 w-3" />
              </button>
            ))}
            <button onClick={clearAll} className="text-xs text-charcoal/50 underline ml-2">Clear all</button>
          </div>
        )}

        <div className="grid lg:grid-cols-[260px_1fr] gap-10">
          {/* Desktop filter rail */}
          <aside className="hidden lg:block sticky top-28 self-start">{FilterPanel}</aside>

          {/* Mobile slide-out */}
          {filtersOpen && (
            <>
              <div className="lg:hidden fixed inset-0 z-[60] bg-charcoal/50" onClick={() => setFiltersOpen(false)} />
              <aside className="lg:hidden fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl max-h-[88vh] overflow-y-auto p-6 shadow-2xl animate-fade-up">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-serif text-2xl">Filters</h2>
                  <button onClick={() => setFiltersOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button>
                </div>
                {FilterPanel}
                <button onClick={() => setFiltersOpen(false)} className="mt-8 w-full bg-charcoal text-white py-4 text-[11px] uppercase tracking-[0.25em] font-semibold rounded-full">
                  Show {filtered.length} products
                </button>
              </aside>
            </>
          )}

          <div>
            <p className="text-xs text-charcoal/50 mb-6">{isLoading ? "Loading…" : `${filtered.length} of ${products.length} products`}</p>
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-soft rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24">
                <p className="font-serif text-2xl">No products match your filters</p>
                <p className="text-charcoal/60 mt-2 text-sm">Try widening your search.</p>
                <button onClick={clearAll} className="mt-6 inline-block bg-charcoal text-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-semibold rounded-full">
                  Clear all filters
                </button>
                <div className="mt-10">
                  <p className="eyebrow text-charcoal/40 mb-3">Or browse</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {categories.slice(0, 6).map((c: any) => (
                      <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} className="px-3 py-1.5 text-xs border border-charcoal/15 rounded-full hover:bg-charcoal hover:text-white transition">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((p: any) => <ProductCard key={p.id} p={p} />)}
              </div>
            )}
          </div>
        </div>
      </section>
    </BoutiqueLayout>
  );
}

function FilterRadio({ name, value, current, onChange, label }: { name: string; value: string; current: string; onChange: (v: string) => void; label: string }) {
  const active = current === value;
  return (
    <label className={`flex items-center gap-2 cursor-pointer py-1 transition ${active ? "text-gold font-medium" : "text-charcoal/70 hover:text-charcoal"}`}>
      <input type="radio" name={name} checked={active} onChange={() => onChange(value)} className="accent-gold" />
      {label}
    </label>
  );
}
