import { Link } from "@tanstack/react-router";
import { Heart, Plus } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  sale_price: number | string | null;
  image_url: string | null;
  is_new?: boolean;
  is_bestseller?: boolean;
  category?: { name: string } | null;
  stock?: number;
};

export function ProductCard({ p }: { p: ProductCardData }) {
  const { ids, toggle } = useWishlist();
  const { add } = useCart();
  const isWish = ids.has(p.id);
  const onSale = p.sale_price != null && Number(p.sale_price) < Number(p.price);
  const outOfStock = typeof p.stock === "number" && p.stock <= 0;
  const lowStock = !outOfStock && typeof p.stock === "number" && p.stock <= 3;

  return (
    <div className="bg-white p-2 rounded-3xl shadow-sm border border-charcoal/5 group animate-fade-in">
      <div className="relative">
        <Link to="/product/$slug" params={{ slug: p.slug }} className="block">
          <div className="aspect-[3/4] bg-soft rounded-2xl overflow-hidden relative">
            {p.image_url ? (
              <img
                src={p.image_url}
                alt={p.name}
                loading="lazy"
                className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${outOfStock ? "opacity-60" : ""}`}
              />
            ) : (
              <div className="h-full w-full grid place-items-center text-charcoal/30 text-xs">No image</div>
            )}
            {outOfStock && (
              <div className="absolute inset-0 grid place-items-center">
                <span className="bg-charcoal text-white text-[10px] uppercase tracking-[0.25em] font-bold px-4 py-2 rounded-full">
                  Sold Out
                </span>
              </div>
            )}
          </div>
        </Link>

        <button
          onClick={(e) => { e.preventDefault(); toggle.mutate(p.id); }}
          aria-label="Save to wishlist"
          className="absolute top-3 right-3 size-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-charcoal hover:text-white transition-colors"
        >
          <Heart className={`h-4 w-4 ${isWish ? "fill-gold text-gold" : ""}`} />
        </button>

        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {p.is_new && !outOfStock && <span className="bg-gold text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded">New</span>}
          {onSale && !outOfStock && <span className="bg-charcoal text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded">Sale</span>}
          {p.is_bestseller && !p.is_new && !outOfStock && <span className="bg-soft text-charcoal text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded">Best Seller</span>}
          {lowStock && <span className="bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded">Only {p.stock} Left</span>}
        </div>

        {!outOfStock && (
          <div className="absolute bottom-3 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => add.mutate({ productId: p.id })}
              className="w-full bg-charcoal text-white text-[10px] uppercase tracking-[0.2em] py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-charcoal/90"
            >
              <Plus className="h-3 w-3" /> Quick Add
            </button>
          </div>
        )}
      </div>

      <Link to="/product/$slug" params={{ slug: p.slug }} className="block px-2 py-3">
        {p.category?.name && (
          <p className="text-[10px] text-charcoal/40 uppercase tracking-widest mb-1">{p.category.name}</p>
        )}
        <h4 className="text-sm font-medium leading-tight">{p.name}</h4>
        <div className="flex gap-2 items-baseline mt-1">
          {onSale ? (
            <>
              <p className="text-sm font-serif text-gold">{formatPrice(p.sale_price)}</p>
              <p className="text-xs font-serif line-through text-charcoal/30">{formatPrice(p.price)}</p>
            </>
          ) : (
            <p className="text-sm font-serif">{formatPrice(p.price)}</p>
          )}
        </div>
      </Link>
    </div>
  );
}
