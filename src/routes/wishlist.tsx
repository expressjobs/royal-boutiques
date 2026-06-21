import { createFileRoute, Link } from "@tanstack/react-router";
import { BoutiqueLayout } from "@/components/layout/BoutiqueLayout";
import { ProductCard } from "@/components/ProductCard";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — Royal Boutiques" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user } = useAuth();
  const { items, isLoading } = useWishlist();

  if (!user) {
    return (
      <BoutiqueLayout>
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <Heart className="h-10 w-10 mx-auto text-charcoal/40 mb-6" />
          <h1 className="font-serif text-3xl">Sign in to view your wishlist</h1>
          <Link to="/auth" className="mt-6 inline-block bg-charcoal text-white px-10 py-4 text-[11px] uppercase tracking-[0.25em] font-semibold">Sign In</Link>
        </div>
      </BoutiqueLayout>
    );
  }

  return (
    <BoutiqueLayout>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <p className="eyebrow text-gold">Saved for Later</p>
        <h1 className="font-serif text-4xl mt-3 mb-12">My Wishlist</h1>
        {isLoading ? <p>Loading...</p> : items.length === 0 ? (
          <div className="text-center py-24">
            <Heart className="h-10 w-10 mx-auto text-charcoal/40 mb-6" />
            <h2 className="font-serif text-2xl">No saved pieces yet</h2>
            <p className="text-charcoal/60 mt-2">Tap the heart on any product to save it here.</p>
            <Link to="/shop" className="mt-6 inline-block bg-charcoal text-white px-10 py-4 text-[11px] uppercase tracking-[0.25em] font-semibold">Browse Collection</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((i: any) => i.product && <ProductCard key={i.id} p={i.product} />)}
          </div>
        )}
      </div>
    </BoutiqueLayout>
  );
}
