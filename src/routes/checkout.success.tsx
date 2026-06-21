import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { BoutiqueLayout } from "@/components/layout/BoutiqueLayout";
import { Check } from "lucide-react";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({ meta: [{ title: "Order Confirmed — Royal Boutiques" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  const { id } = Route.useSearch();
  return (
    <BoutiqueLayout>
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-gold/15 grid place-items-center mb-8">
          <Check className="h-10 w-10 text-gold" />
        </div>
        <p className="eyebrow text-gold">Order Confirmed</p>
        <h1 className="font-serif text-4xl mt-3">Thank You</h1>
        <p className="text-charcoal/60 mt-4">
          Your order has been received. We'll send a confirmation to your email shortly.
        </p>
        {id && <p className="text-xs text-charcoal/40 mt-2 font-mono">Order #{id.slice(0, 8).toUpperCase()}</p>}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/account/orders" className="bg-charcoal text-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-semibold">View Orders</Link>
          <Link to="/shop" className="border border-charcoal/20 px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-semibold">Continue Shopping</Link>
        </div>
      </div>
    </BoutiqueLayout>
  );
}
