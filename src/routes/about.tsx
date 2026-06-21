import { createFileRoute, Link } from "@tanstack/react-router";
import { BoutiqueLayout } from "@/components/layout/BoutiqueLayout";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Royal Boutiques" }, { name: "description", content: "Royal Boutiques is a modern luxury house dedicated to the effortless woman." }] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <BoutiqueLayout>
      <section className="bg-nude py-24 text-center">
        <p className="eyebrow text-gold">Our Story</p>
        <h1 className="font-serif text-5xl md:text-6xl mt-3">An Intentional Studio</h1>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-20 space-y-8 text-charcoal/80 leading-relaxed">
        <p className="font-serif italic text-2xl text-charcoal">Royal Boutiques was founded on a quiet idea — that beautiful clothing should feel as good as it looks.</p>
        <p>We design and curate pieces that move with you, finished by hand and built to last. Every silhouette is considered. Every fabric is chosen for the way it feels against the skin.</p>
        <p>From our atelier, we work with small ateliers in Paris, Milan, and Marrakech who share our standard. The result is a tightly edited wardrobe of pieces you'll return to, year after year.</p>
        <p>Thank you for being part of our circle.</p>
      </section>

      <section className="bg-charcoal text-white py-20 text-center">
        <h2 className="font-serif text-3xl mb-6">Visit the Boutique</h2>
        <Link to="/shop" className="inline-block border border-white/30 px-10 py-4 text-[11px] uppercase tracking-[0.25em] hover:bg-white hover:text-charcoal transition rounded-full">Shop Collection</Link>
      </section>
    </BoutiqueLayout>
  );
}
