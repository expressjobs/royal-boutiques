import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BoutiqueLayout } from "@/components/layout/BoutiqueLayout";
import { ProductCard } from "@/components/ProductCard";
import { ImageLensZoom } from "@/components/ImageLensZoom";
import { Heart, Minus, Plus, Star, MessageCircle, Truck, Shield } from "lucide-react";
import { formatPrice, buildWhatsAppUrl } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const productQuery = (slug: string) => queryOptions({
  queryKey: ["product", slug],
  queryFn: async () => {
    const { data: product, error } = await supabase
      .from("products")
      .select("*, category:categories(id, name, slug)")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw error;
    if (!product) return null;
    const relatedQry = product.category_id
      ? supabase.from("products").select("*, category:categories(name)").eq("is_active", true).neq("id", product.id).eq("category_id", product.category_id).limit(4)
      : Promise.resolve({ data: [] as any[] });
    const [{ data: images }, { data: reviews }, { data: related }] = await Promise.all([
      supabase.from("product_images").select("*").eq("product_id", product.id).order("sort_order"),
      supabase.from("reviews").select("*, profile:profiles(full_name)").eq("product_id", product.id).eq("is_approved", true).order("created_at", { ascending: false }),
      relatedQry,
    ]);
    return { product, images: images ?? [], reviews: reviews ?? [], related: related ?? [] };
  },
});

export const Route = createFileRoute("/product/$slug")({
  head: ({ params, loaderData }) => {
    const d = loaderData as any;
    const p = d?.product;
    if (!p) return { meta: [{ title: `${params.slug.replace(/-/g, " ")} — Royal Boutiques` }] };
    const price = Number(p.sale_price ?? p.price);
    const desc = p.description ?? "Shop this piece at Royal Boutiques — luxury fashion, timeless elegance.";
    return {
      meta: [
        { title: `${p.name} — Royal Boutiques` },
        { name: "description", content: desc },
        { property: "og:title", content: `${p.name} — Royal Boutiques` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        ...(p.image_url ? [{ property: "og:image", content: p.image_url }, { name: "twitter:image", content: p.image_url }] : []),
        { property: "product:price:amount", content: String(price) },
        { property: "product:price:currency", content: "USD" },
      ],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: desc,
          image: p.image_url ? [p.image_url] : undefined,
          sku: p.id,
          brand: { "@type": "Brand", name: "Royal Boutiques" },
          aggregateRating: p.review_count > 0 ? {
            "@type": "AggregateRating",
            ratingValue: Number(p.rating ?? 0),
            reviewCount: p.review_count,
          } : undefined,
          offers: {
            "@type": "Offer",
            price,
            priceCurrency: "USD",
            availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `/product/${p.slug}`,
          },
        }),
      }],
    };
  },
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productQuery(params.slug)),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(productQuery(slug));
  const { add } = useCart();
  const { ids, toggle } = useWishlist();
  const { user } = useAuth();
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  // Recently viewed (localStorage)
  useEffect(() => {
    if (typeof window === "undefined" || !data?.product) return;
    const raw = localStorage.getItem("recentlyViewed");
    const arr: string[] = raw ? JSON.parse(raw) : [];
    const next = [data.product.slug, ...arr.filter((s) => s !== data.product.slug)].slice(0, 6);
    localStorage.setItem("recentlyViewed", JSON.stringify(next));
  }, [data?.product]);

  if (!data) {
    return (
      <BoutiqueLayout>
        <div className="py-32 text-center">
          <h1 className="font-serif text-4xl">Product not found</h1>
          <Link to="/shop" className="mt-6 inline-block text-sm uppercase tracking-widest border-b border-charcoal">Back to shop</Link>
        </div>
      </BoutiqueLayout>
    );
  }

  const { product, images, reviews, related } = data;
  const gallery = [product.image_url, ...images.map((i) => i.image_url)].filter(Boolean) as string[];
  const onSale = product.sale_price != null && Number(product.sale_price) < Number(product.price);
  const inWish = ids.has(product.id);

  const handleAdd = () => {
    if (product.sizes.length > 0 && !size) return toast.error("Please select a size");
    if (product.colors.length > 0 && !color) return toast.error("Please select a color");
    add.mutate({ productId: product.id, quantity: qty, size, color });
  };

  const whatsappMsg = `Hello Royal Boutiques! I'd like to order:\n\n${product.name}${size ? ` (Size: ${size})` : ""}${color ? ` (Color: ${color})` : ""}\nQty: ${qty}\nPrice: ${formatPrice(product.sale_price ?? product.price)}`;

  return (
    <BoutiqueLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <nav className="text-xs text-charcoal/50 mb-8">
          <Link to="/" className="hover:text-charcoal">Home</Link> / <Link to="/shop" className="hover:text-charcoal">Shop</Link>
          {product.category && <> / <Link to="/category/$slug" params={{ slug: product.category.slug }} className="hover:text-charcoal">{product.category.name}</Link></>}
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <div>
            <ImageLensZoom src={gallery[activeImg] ?? ""} alt={product.name} />
            {gallery.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-4">
                {gallery.map((src, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`aspect-square bg-soft rounded-xl overflow-hidden border-2 transition ${i === activeImg ? "border-gold" : "border-transparent hover:border-charcoal/20"}`}>
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:sticky lg:top-28 self-start">
            {product.category && <p className="eyebrow text-charcoal/50">{product.category.name}</p>}
            <h1 className="font-serif text-4xl md:text-5xl mt-2">{product.name}</h1>

            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(Number(product.rating)) ? "fill-gold text-gold" : "text-charcoal/20"}`} />
                ))}
              </div>
              <span className="text-xs text-charcoal/60">{product.review_count} reviews</span>
            </div>

            <div className="flex gap-3 items-baseline mt-6">
              {onSale ? (
                <>
                  <span className="text-3xl font-serif text-gold">{formatPrice(product.sale_price)}</span>
                  <span className="text-lg font-serif line-through text-charcoal/40">{formatPrice(product.price)}</span>
                </>
              ) : (
                <span className="text-3xl font-serif">{formatPrice(product.price)}</span>
              )}
            </div>

            <p className="text-sm text-charcoal/70 mt-6 leading-relaxed">{product.description}</p>

            {product.sizes.length > 0 && (
              <div className="mt-8">
                <p className="eyebrow mb-3">Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button key={s} onClick={() => setSize(s)} className={`min-w-[48px] h-12 px-4 border text-sm transition ${size === s ? "border-charcoal bg-charcoal text-white" : "border-charcoal/20 hover:border-charcoal"}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {product.colors.length > 0 && (
              <div className="mt-6">
                <p className="eyebrow mb-3">Color {color && <span className="ml-2 normal-case tracking-normal text-charcoal/60">{color}</span>}</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button key={c} onClick={() => setColor(c)} className={`px-4 h-10 border text-xs uppercase tracking-wider transition ${color === c ? "border-charcoal bg-charcoal text-white" : "border-charcoal/20 hover:border-charcoal"}`}>{c}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center border border-charcoal/20 h-12">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 h-full"><Minus className="h-3 w-3" /></button>
                <span className="px-4 text-sm">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-3 h-full"><Plus className="h-3 w-3" /></button>
              </div>
              <p className="text-xs text-charcoal/60">
                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAdd}
                disabled={product.stock <= 0}
                className="flex-1 bg-charcoal text-white h-14 text-[11px] uppercase tracking-[0.25em] font-semibold hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {product.stock > 0 ? "Add to Bag" : "Out of Stock"}
              </button>
              <button
                onClick={() => user ? toggle.mutate(product.id) : toast.error("Please sign in")}
                className="h-14 px-6 border border-charcoal/20 hover:border-charcoal flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em]"
              >
                <Heart className={`h-4 w-4 ${inWish ? "fill-gold text-gold" : ""}`} /> Save
              </button>
            </div>

            <a
              href={buildWhatsAppUrl(whatsappMsg)} target="_blank" rel="noreferrer"
              className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.25em] font-semibold transition"
            >
              <MessageCircle className="h-4 w-4" /> Order via WhatsApp
            </a>

            <div className="mt-8 grid grid-cols-2 gap-4 text-xs text-charcoal/60">
              <div className="flex items-center gap-2"><Truck className="h-4 w-4" /> Free shipping over $250</div>
              <div className="flex items-center gap-2"><Shield className="h-4 w-4" /> 30-day returns</div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-24 border-t border-charcoal/10 pt-16">
          <h2 className="font-serif text-3xl mb-8">Customer Reviews</h2>
          <ReviewSection productId={product.id} reviews={reviews} />
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-24">
            <h2 className="font-serif text-3xl mb-8">You May Also Love</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p: any) => <ProductCard key={p.id} p={p} />)}
            </div>
          </section>
        )}

        <RecentlyViewed currentSlug={product.slug} />
      </div>
    </BoutiqueLayout>
  );
}

function ReviewSection({ productId, reviews }: { productId: string; reviews: any[] }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in to review");
    setSubmitting(true);
    const { error } = await supabase.from("reviews").upsert({ product_id: productId, user_id: user.id, rating, comment });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success("Thank you for your review"); setComment(""); window.location.reload(); }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-12">
      <div className="space-y-6">
        {reviews.length === 0 && <p className="text-charcoal/60 text-sm">No reviews yet. Be the first.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-charcoal/10 pb-6">
            <div className="flex items-center gap-2 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-gold text-gold" : "text-charcoal/20"}`} />
              ))}
              <span className="text-xs text-charcoal/60 ml-2">{r.profile?.full_name ?? "Customer"}</span>
            </div>
            {r.title && <p className="font-medium text-sm">{r.title}</p>}
            <p className="text-sm text-charcoal/70 mt-1">{r.comment}</p>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="bg-nude rounded-2xl p-6 h-fit">
        <h3 className="font-serif text-xl mb-4">Write a Review</h3>
        <div className="flex gap-1 mb-3">
          {[1,2,3,4,5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)}>
              <Star className={`h-5 w-5 ${n <= rating ? "fill-gold text-gold" : "text-charcoal/20"}`} />
            </button>
          ))}
        </div>
        <textarea
          value={comment} onChange={(e) => setComment(e.target.value)}
          required minLength={10} maxLength={1000}
          placeholder="Share your experience..."
          className="w-full bg-white border border-charcoal/10 p-3 text-sm rounded-lg h-28 focus:outline-none focus:border-gold"
        />
        <button type="submit" disabled={submitting} className="mt-3 w-full bg-charcoal text-white py-3 text-[11px] uppercase tracking-[0.2em] font-semibold disabled:opacity-50">
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}

function RecentlyViewed({ currentSlug }: { currentSlug: string }) {
  const { data } = useQuery({
    queryKey: ["recently-viewed", currentSlug],
    queryFn: async () => {
      if (typeof window === "undefined") return [];
      const raw = localStorage.getItem("recentlyViewed");
      const slugs: string[] = raw ? JSON.parse(raw) : [];
      const others = slugs.filter((s) => s !== currentSlug).slice(0, 4);
      if (!others.length) return [];
      const { data } = await supabase.from("products").select("*, category:categories(name)").in("slug", others).eq("is_active", true);
      return data ?? [];
    },
  });
  if (!data || data.length === 0) return null;
  return (
    <section className="mt-24">
      <h2 className="font-serif text-3xl mb-8">Recently Viewed</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {data.map((p: any) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}
