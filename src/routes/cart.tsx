import { createFileRoute, Link } from "@tanstack/react-router";
import { BoutiqueLayout } from "@/components/layout/BoutiqueLayout";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/format";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Bag — Royal Boutiques" }] }),
  component: CartPage,
});

function CartPage() {
  const { user } = useAuth();
  const { items, subtotal, updateQty, remove, isLoading } = useCart();

  if (!user) {
    return (
      <BoutiqueLayout>
        <EmptyState
          title="Sign in to view your bag"
          message="Your bag is saved with your account."
          ctaTo="/auth"
          ctaLabel="Sign In"
        />
      </BoutiqueLayout>
    );
  }

  if (isLoading) {
    return <BoutiqueLayout><div className="max-w-4xl mx-auto px-6 py-24 text-center text-charcoal/50">Loading...</div></BoutiqueLayout>;
  }

  if (items.length === 0) {
    return (
      <BoutiqueLayout>
        <EmptyState
          title="Your bag is empty"
          message="Let's find you something beautiful."
          ctaTo="/shop"
          ctaLabel="Shop the Collection"
        />
      </BoutiqueLayout>
    );
  }

  return (
    <BoutiqueLayout>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="font-serif text-4xl mb-12">Your Bag</h1>
        <div className="grid lg:grid-cols-[1fr_400px] gap-12">
          <div className="space-y-6">
            {items.map((it) => {
              const price = Number(it.product.sale_price ?? it.product.price);
              return (
                <div key={it.id} className="flex gap-4 border-b border-charcoal/10 pb-6">
                  <Link to="/product/$slug" params={{ slug: it.product.slug }} className="w-28 aspect-[3/4] bg-soft rounded-xl overflow-hidden flex-shrink-0">
                    {it.product.image_url && <img src={it.product.image_url} alt={it.product.name} className="h-full w-full object-cover" />}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <Link to="/product/$slug" params={{ slug: it.product.slug }} className="font-medium text-sm hover:text-gold">{it.product.name}</Link>
                        <p className="text-xs text-charcoal/60 mt-1">
                          {it.size && <>Size: {it.size}</>}{it.size && it.color && " · "}{it.color && <>Color: {it.color}</>}
                        </p>
                      </div>
                      <button onClick={() => remove.mutate(it.id)} aria-label="Remove" className="text-charcoal/40 hover:text-charcoal flex-shrink-0">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-end mt-6">
                      <div className="flex items-center border border-charcoal/20">
                        <button onClick={() => updateQty.mutate({ id: it.id, quantity: it.quantity - 1 })} className="px-2 py-1.5"><Minus className="h-3 w-3" /></button>
                        <span className="px-3 text-sm">{it.quantity}</span>
                        <button onClick={() => updateQty.mutate({ id: it.id, quantity: it.quantity + 1 })} className="px-2 py-1.5"><Plus className="h-3 w-3" /></button>
                      </div>
                      <p className="font-serif text-lg">{formatPrice(price * it.quantity)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="bg-nude rounded-2xl p-8 h-fit lg:sticky lg:top-28">
            <h2 className="font-serif text-2xl mb-6">Order Summary</h2>
            <div className="space-y-3 text-sm border-b border-charcoal/10 pb-6">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="text-charcoal/60">Calculated at checkout</span></div>
            </div>
            <div className="flex justify-between text-lg font-serif py-6">
              <span>Total</span><span>{formatPrice(subtotal)}</span>
            </div>
            <Link to="/checkout" className="block text-center w-full bg-charcoal text-white py-4 text-[11px] uppercase tracking-[0.25em] font-semibold hover:bg-charcoal/90 transition">
              Proceed to Checkout
            </Link>
            <Link to="/shop" className="block text-center mt-3 text-xs uppercase tracking-widest text-charcoal/60 hover:text-charcoal">
              Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </BoutiqueLayout>
  );
}

function EmptyState({ title, message, ctaTo, ctaLabel }: { title: string; message: string; ctaTo: string; ctaLabel: string }) {
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <div className="mx-auto h-20 w-20 rounded-full bg-nude grid place-items-center mb-6">
        <ShoppingBag className="h-8 w-8 text-charcoal/50" />
      </div>
      <h1 className="font-serif text-3xl">{title}</h1>
      <p className="text-charcoal/60 mt-3">{message}</p>
      <Link to={ctaTo as string} className="mt-8 inline-block bg-charcoal text-white px-10 py-4 text-[11px] uppercase tracking-[0.25em] font-semibold">
        {ctaLabel}
      </Link>
    </div>
  );
}
