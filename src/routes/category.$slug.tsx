import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BoutiqueLayout } from "@/components/layout/BoutiqueLayout";
import { ProductCard } from "@/components/ProductCard";

const categoryQuery = (slug: string) => queryOptions({
  queryKey: ["category", slug],
  queryFn: async () => {
    const isSpecial = ["new-arrivals", "sale"].includes(slug);
    const { data: cat } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();

    let qry = supabase.from("products").select("*, category:categories(name)").eq("is_active", true);
    if (slug === "new-arrivals") qry = qry.eq("is_new", true);
    else if (slug === "sale") qry = qry.not("sale_price", "is", null);
    else if (cat) qry = qry.eq("category_id", cat.id);
    else if (!isSpecial) throw notFound();

    const { data: products } = await qry.order("created_at", { ascending: false });
    return { category: cat, products: products ?? [], slug };
  },
});

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${formatSlug(params.slug)} — Royal Boutiques` },
      { name: "description", content: `Shop ${formatSlug(params.slug)} at Royal Boutiques — Kenya's premium online department store. Free delivery over KES 5,000.` },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(categoryQuery(params.slug)),
  component: CategoryPage,
  notFoundComponent: () => (
    <BoutiqueLayout>
      <div className="py-32 text-center">
        <h1 className="font-serif text-4xl">Category not found</h1>
      </div>
    </BoutiqueLayout>
  ),
});

function formatSlug(s: string) {
  return s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(categoryQuery(slug));
  const title = data.category?.name ?? formatSlug(slug);
  const description = data.category?.description;

  return (
    <BoutiqueLayout>
      <section className="relative h-[40vh] min-h-[300px] bg-soft overflow-hidden">
        {data.category?.image_url && (
          <img src={data.category.image_url} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <p className="eyebrow text-white/80">The Collection</p>
          <h1 className="font-serif text-5xl md:text-6xl text-white mt-3">{title}</h1>
          {description && <p className="text-white/80 text-sm mt-4 max-w-md">{description}</p>}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <p className="text-xs text-charcoal/50 mb-6">{data.products.length} products</p>
        {data.products.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-serif text-2xl">This collection is being curated.</p>
            <p className="text-charcoal/60 mt-2">Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {data.products.map((p: any) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>
    </BoutiqueLayout>
  );
}
