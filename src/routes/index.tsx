import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BoutiqueLayout } from "@/components/layout/BoutiqueLayout";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, ArrowLeft, Star, Clock, Sparkles, Truck, ShieldCheck, Phone, Mail } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1920&q=80",
    eyebrow: "Royal Boutiques · Fashion · Home · Lifestyle",
    title: "A Department Store, Reimagined",
    subtitle: "Considered fashion for women, men and kids — alongside jewelry, home, and beauty. Curated in Nairobi, delivered nationwide.",
    ctaLabel: "Shop Women",
    ctaTo: "/category/$slug" as const,
    ctaParams: { slug: "women" },
  },
  {
    image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1920&q=80",
    eyebrow: "Home & Living",
    title: "Beautiful Beds, Better Sleep",
    subtitle: "Pocket-sprung mattresses, Egyptian cotton bedding, and goose-down pillows — built for restful nights.",
    ctaLabel: "Shop Bedroom",
    ctaTo: "/category/$slug" as const,
    ctaParams: { slug: "home-living" },
  },
  {
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1920&q=80",
    eyebrow: "Limited · Up to 40% Off",
    title: "The Final Cuts",
    subtitle: "Archive treasures across every department, before they're gone.",
    ctaLabel: "Shop The Sale",
    ctaTo: "/category/$slug" as const,
    ctaParams: { slug: "sale" },
  },
];

const TESTIMONIALS = [
  { q: "From wardrobe to bedroom, Royal Boutiques is now my one-stop shop. Quality is exceptional.", a: "Wanjiru K.", city: "Nairobi" },
  { q: "I ordered a mattress, bedding and pyjamas in one go. Delivery was quick and packaging premium.", a: "Sophia M.", city: "Mombasa" },
  { q: "The kids' collection is gorgeous and the fit is true to size. My go-to for birthday gifts.", a: "Amara T.", city: "Kisumu" },
  { q: "Beauty products are beautifully scented and arrive in gift-ready boxes. So thoughtful.", a: "Mira H.", city: "Eldoret" },
  { q: "My husband's suit fits like it was tailored. Royal Boutiques has taken over our closet.", a: "Renée D.", city: "Nakuru" },
];

const DEPT_SECTIONS: { slug: string; eyebrow: string; title: string; subtitle: string; bg: string }[] = [
  { slug: "women", eyebrow: "Women", title: "The Women's Edit", subtitle: "Dresses, tailoring and silk pieces for everyday and occasion.", bg: "bg-soft" },
  { slug: "men", eyebrow: "Men", title: "The Men's Edit", subtitle: "Tailored suiting, refined knitwear and quiet weekend essentials.", bg: "bg-nude" },
  { slug: "kids", eyebrow: "Kids", title: "Little Ones", subtitle: "Soft, playful styles in fabrics that wash and wear beautifully.", bg: "bg-soft" },
  { slug: "shoes", eyebrow: "Footwear", title: "Sole & Form", subtitle: "Heels, loafers, boots and trainers — sculpted and made to last.", bg: "bg-nude" },
  { slug: "jewelry", eyebrow: "Fine Jewelry", title: "Heirlooms in the Making", subtitle: "18-karat gold, sterling silver and lustrous pearl.", bg: "bg-soft" },
  { slug: "home-living", eyebrow: "Home & Living", title: "A Beautiful Home", subtitle: "Rugs, ceramics, lighting and considered objects for daily life.", bg: "bg-nude" },
];

const homeQuery = queryOptions({
  queryKey: ["home-data-v2"],
  queryFn: async () => {
    const slugs = DEPT_SECTIONS.map((d) => d.slug);
    const [newArrivals, bestSellers, flashSale, deptProducts, bedding] = await Promise.all([
      supabase.from("products").select("*, category:categories(name, slug)").eq("is_active", true).eq("is_new", true).limit(8),
      supabase.from("products").select("*, category:categories(name, slug)").eq("is_active", true).eq("is_bestseller", true).limit(8),
      supabase.from("products").select("*, category:categories(name, slug)").eq("is_active", true).not("sale_price", "is", null).order("sale_price").limit(4),
      supabase.from("products").select("*, category:categories!inner(name, slug)").eq("is_active", true).in("category.slug", slugs).limit(60),
      supabase.from("products").select("*, category:categories!inner(name, slug)").eq("is_active", true).eq("category.slug", "home-living").or("name.ilike.%mattress%,name.ilike.%bed%,name.ilike.%pillow%,name.ilike.%duvet%,name.ilike.%linen%").limit(4),
    ]);
    const byDept: Record<string, any[]> = {};
    for (const slug of slugs) byDept[slug] = [];
    for (const p of deptProducts.data ?? []) {
      const s = (p as any).category?.slug;
      if (s && byDept[s] && byDept[s].length < 4) byDept[s].push(p);
    }
    return {
      newArrivals: newArrivals.data ?? [],
      bestSellers: bestSellers.data ?? [],
      flashSale: flashSale.data ?? [],
      bedding: bedding.data ?? [],
      byDept,
    };
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Royal Boutiques — Premium Fashion, Home & Lifestyle in Kenya" },
      { name: "description", content: "Shop fashion for women, men & kids, plus shoes, jewelry, home & living, and beauty. Free delivery over KES 5,000. M-Pesa accepted." },
      { property: "og:title", content: "Royal Boutiques — Fashion, Home & Lifestyle" },
      { property: "og:description", content: "Kenya's premium online department store. Curated quality. Delivered to your door." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: HomePage,
});

function HomePage() {
  const { data } = useSuspenseQuery(homeQuery);
  return (
    <BoutiqueLayout>
      <HeroSlider />
      <ValueStrip />
      {DEPT_SECTIONS.map((d) => (
        <DepartmentShowcase
          key={d.slug}
          slug={d.slug}
          eyebrow={d.eyebrow}
          title={d.title}
          subtitle={d.subtitle}
          bg={d.bg}
          items={data.byDept[d.slug] ?? []}
        />
      ))}
      <BeddingShowcase items={data.bedding} />
      {data.bestSellers.length > 0 && <BestSellers items={data.bestSellers} />}
      {data.newArrivals.length > 0 && <NewArrivals items={data.newArrivals} />}
      {data.flashSale.length > 0 && <FlashSale items={data.flashSale} />}
      <Testimonials />
      <InstagramGallery />
      <Newsletter />
    </BoutiqueLayout>
  );
}

function HeroSlider() {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 6000, stopOnInteraction: false })]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    onSelect();
    return () => { embla.off("select", onSelect); };
  }, [embla]);

  return (
    <section className="relative overflow-hidden bg-charcoal">
      <div ref={emblaRef}>
        <div className="flex">
          {HERO_SLIDES.map((s, i) => (
            <div key={i} className="relative flex-[0_0_100%] h-[78vh] md:h-[88vh]">
              <img src={s.image} alt={s.title} className="absolute inset-0 h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-charcoal/35 to-charcoal/20" />
              <div className="absolute inset-0 bg-gradient-to-b from-charcoal/30 via-transparent to-transparent" />
              <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center text-white animate-fade-up">
                <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] mb-5 text-gold">{s.eyebrow}</span>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif mb-5 max-w-3xl leading-[0.98]">{s.title}</h1>
                <p className="text-white/85 text-sm md:text-base mb-8 max-w-xl">{s.subtitle}</p>
                <Link to={s.ctaTo} params={s.ctaParams} className="bg-white text-charcoal px-10 py-4 text-[11px] uppercase tracking-[0.25em] font-semibold hover:bg-gold hover:text-white transition-all duration-500 rounded-full">{s.ctaLabel}</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => embla?.scrollTo(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-[2px] transition-all duration-500 ${selected === i ? "w-10 bg-gold" : "w-6 bg-white/40 hover:bg-white/70"}`}
          />
        ))}
      </div>
    </section>
  );
}

function ValueStrip() {
  const items = [
    { icon: Truck, title: "Free Delivery", body: "Over KES 5,000 nationwide" },
    { icon: ShieldCheck, title: "M-Pesa Secure", body: "Pay safely on checkout" },
    { icon: Phone, title: "WhatsApp Orders", body: "Talk to our stylists" },
    { icon: Sparkles, title: "30-Day Returns", body: "Easy, no-fuss exchanges" },
  ];
  return (
    <section className="bg-white border-y border-charcoal/5">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 py-8">
        {items.map((it) => (
          <div key={it.title} className="flex items-center gap-3">
            <it.icon className="h-5 w-5 text-gold shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] font-semibold">{it.title}</p>
              <p className="text-xs text-charcoal/60 truncate">{it.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DepartmentShowcase({ slug, eyebrow, title, subtitle, bg, items }: { slug: string; eyebrow: string; title: string; subtitle: string; bg: string; items: any[] }) {
  if (!items.length) return null;
  return (
    <section className={`${bg} py-20 md:py-24`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-10">
          <div>
            <p className="eyebrow text-gold">{eyebrow}</p>
            <h2 className="font-serif text-3xl md:text-4xl mt-2">{title}</h2>
            <p className="text-charcoal/60 text-sm mt-2 max-w-md">{subtitle}</p>
          </div>
          <Link to="/category/$slug" params={{ slug }} className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-charcoal pb-1 hover:text-gold hover:border-gold transition-colors self-start md:self-end">
            Shop All {eyebrow} <ArrowRight className="inline h-3 w-3 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  );
}

function BeddingShowcase({ items }: { items: any[] }) {
  return (
    <section className="relative bg-charcoal text-white overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1920&q=80"
        alt="Mattress and bedding"
        className="absolute inset-0 h-full w-full object-cover opacity-30"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/85 to-charcoal/40" />
      <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="eyebrow text-gold">Mattress & Bedding</p>
          <h2 className="font-serif text-4xl md:text-5xl mt-3 leading-tight">Better Sleep, Built to Last</h2>
          <p className="text-white/70 text-sm md:text-base mt-5 max-w-md">
            Pocket-sprung and memory-foam mattresses, Egyptian cotton duvets, goose-down pillows. Free assembly and bedroom delivery in Nairobi.
          </p>
          <Link to="/category/$slug" params={{ slug: "home-living" }} className="inline-flex items-center gap-2 mt-8 bg-gold text-white px-8 py-4 text-[11px] uppercase tracking-[0.25em] font-semibold rounded-full hover:bg-white hover:text-charcoal transition-all">
            Shop The Bedroom <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {items.slice(0, 4).map((p) => (
              <div key={p.id} className="bg-white text-charcoal rounded-xl p-2">
                <ProductCard p={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function useCountdown(target: Date) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return { d, h, m, s };
}

function FlashSale({ items }: { items: any[] }) {
  const target = (() => {
    const t = new Date();
    const day = t.getDay();
    const daysToSun = day === 0 ? 7 : 7 - day;
    t.setDate(t.getDate() + daysToSun);
    t.setHours(23, 59, 59, 999);
    return t;
  })();
  const { d, h, m, s } = useCountdown(target);

  return (
    <section className="bg-gradient-to-r from-charcoal via-charcoal to-charcoal/95 text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="eyebrow text-gold flex items-center gap-2"><Sparkles className="h-3 w-3" /> Flash Sale</p>
            <h2 className="font-serif text-3xl md:text-4xl mt-3">This Week's Markdowns</h2>
            <p className="text-white/55 text-sm mt-2 max-w-md">A weekly edit at gentle reductions, across every department. Limited stock; restocks unlikely.</p>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-gold shrink-0" />
            <div className="flex gap-2 text-center">
              {[["d", d], ["h", h], ["m", m], ["s", s]].map(([k, v]) => (
                <div key={k as string} className="bg-white/5 border border-white/10 rounded px-3 py-2 min-w-[52px]">
                  <div className="font-serif text-xl tabular-nums">{String(v).padStart(2, "0")}</div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-white/45">{k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((p) => (
            <div key={p.id} className="bg-white text-charcoal rounded-xl p-2">
              <ProductCard p={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewArrivals({ items }: { items: any[] }) {
  return (
    <section className="bg-nude py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="eyebrow text-gold">Just In</p>
            <h2 className="text-3xl md:text-4xl font-serif mt-2">New Arrivals</h2>
          </div>
          <Link to="/category/$slug" params={{ slug: "new-arrivals" }} className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-charcoal pb-1 hover:text-gold hover:border-gold transition-colors">View All</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {items.slice(0, 8).map((p) => <ProductCard key={p.id} p={p as any} />)}
        </div>
      </div>
    </section>
  );
}

function BestSellers({ items }: { items: any[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
  const scrollPrev = useCallback(() => embla?.scrollPrev(), [embla]);
  const scrollNext = useCallback(() => embla?.scrollNext(), [embla]);

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="eyebrow text-gold">Loved Most</p>
            <h2 className="text-3xl md:text-4xl font-serif mt-2">Best Sellers</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={scrollPrev} aria-label="Previous" className="h-10 w-10 rounded-full border border-charcoal/20 grid place-items-center hover:bg-gold hover:text-white hover:border-gold transition">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button onClick={scrollNext} aria-label="Next" className="h-10 w-10 rounded-full border border-charcoal/20 grid place-items-center hover:bg-gold hover:text-white hover:border-gold transition">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div ref={emblaRef} className="overflow-hidden -mx-3">
          <div className="flex">
            {items.map((p) => (
              <div key={p.id} className="px-3 flex-[0_0_70%] sm:flex-[0_0_45%] md:flex-[0_0_33%] lg:flex-[0_0_25%]">
                <ProductCard p={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: "center" }, [Autoplay({ delay: 7000, stopOnInteraction: false })]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    onSelect();
    return () => { embla.off("select", onSelect); };
  }, [embla]);

  return (
    <section className="bg-soft py-24">
      <div className="max-w-3xl mx-auto px-6 text-center mb-10">
        <p className="eyebrow text-gold">Letters from Our Customers</p>
        <h2 className="font-serif text-3xl md:text-4xl mt-3">Words from The Circle</h2>
      </div>
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="flex-[0_0_100%] md:flex-[0_0_70%] lg:flex-[0_0_55%] px-6 md:px-12">
              <figure className="text-center max-w-2xl mx-auto">
                <div className="flex justify-center gap-1 mb-5">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-gold text-gold" />)}
                </div>
                <p className="font-serif italic text-xl md:text-2xl leading-relaxed text-charcoal">"{t.q}"</p>
                <figcaption className="eyebrow text-charcoal/50 mt-6">— {t.a} · {t.city}</figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-2 mt-10">
        {TESTIMONIALS.map((_, i) => (
          <button key={i} onClick={() => embla?.scrollTo(i)} aria-label={`Testimonial ${i + 1}`} className={`h-1.5 rounded-full transition-all ${selected === i ? "w-8 bg-gold" : "w-1.5 bg-charcoal/20"}`} />
        ))}
      </div>
    </section>
  );
}

function InstagramGallery() {
  const ids = [
    "photo-1490481651871-ab68de25d43d", "photo-1539008835657-9e8e9680c956", "photo-1485518882345-15568b007407",
    "photo-1583496661160-fb5886a13d44", "photo-1572804013309-59a88b7e92f1", "photo-1611652022419-a9419f74343d",
  ];
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6 text-center mb-10">
        <p className="eyebrow text-gold">Follow @royalboutiques</p>
        <h2 className="font-serif text-3xl mt-3">Styled by You</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
        {ids.map((id) => (
          <a key={id} href="#" className="block aspect-square bg-soft overflow-hidden group relative">
            <img src={`https://images.unsplash.com/${id}?w=600&q=80`} alt="Royal Boutiques community style" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/30 transition-colors" />
          </a>
        ))}
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  return (
    <section className="bg-nude py-20">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <Mail className="h-5 w-5 text-gold mx-auto mb-4" />
        <p className="eyebrow text-gold">The Circle</p>
        <h2 className="font-serif text-3xl md:text-4xl mt-3">Join the List</h2>
        <p className="text-charcoal/60 text-sm mt-3 max-w-lg mx-auto">
          Be the first to hear about new collections, weekly markdowns, and members-only events. No spam, just the good stuff.
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!email) return; toast.success("Welcome to The Circle. Check your inbox."); setEmail(""); }}
          className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 bg-white border border-charcoal/15 rounded-full px-5 py-3.5 text-sm focus:outline-none focus:border-gold"
          />
          <button type="submit" className="bg-charcoal text-white px-8 py-3.5 text-[11px] uppercase tracking-[0.25em] font-semibold rounded-full hover:bg-gold transition-colors">
            Subscribe
          </button>
        </form>
        <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal/40 mt-6">No spam · Unsubscribe anytime</p>
      </div>
    </section>
  );
}
