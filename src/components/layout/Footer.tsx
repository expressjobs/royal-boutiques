import { Link } from "@tanstack/react-router";
import { Instagram, Facebook } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LogoMark } from "@/components/LogoMark";

export function Footer() {
  const [email, setEmail] = useState("");
  return (
    <>
      {/* Newsletter */}
      <section className="py-24 border-t border-charcoal/5 bg-nude">
        <div className="max-w-2xl mx-auto text-center px-6">
          <p className="eyebrow text-gold">Join The Circle</p>
          <h2 className="font-serif text-3xl md:text-4xl mt-3 mb-4">Receive Editorial Updates</h2>
          <p className="text-charcoal/60 text-sm mb-8 leading-relaxed">
            Early access to new collections, exclusive invitations to trunk shows, and seasonal styling guides — delivered with care.
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); if (email) { toast.success("Welcome to The Circle"); setEmail(""); } }}
            className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="flex-1 bg-transparent border-b border-charcoal/20 py-4 text-sm outline-none focus:border-gold transition-colors"
            />
            <button type="submit" className="bg-charcoal text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-charcoal/90 transition">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <footer className="bg-charcoal text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-16">
            <div className="col-span-2">
              <LogoMark className="h-16 w-16 mb-4 -ml-1" invert />
              <div className="font-serif text-2xl tracking-[0.18em] mb-1">ROYAL</div>
              <div className="text-[10px] tracking-[0.4em] text-gold mb-5">BOUTIQUES</div>
              <p className="text-white/50 text-xs leading-relaxed max-w-xs">
                Kenya's premium online department store — fashion, home and lifestyle for the whole family. Curated quality, delivered to your door.
              </p>
            </div>
            <FooterCol title="Shop" links={[
              ["Women", "/category/women"],
              ["Men", "/category/men"],
              ["Kids", "/category/kids"],
              ["Shoes", "/category/shoes"],
              ["Jewelry", "/category/jewelry"],
              ["Home & Living", "/category/home-living"],
              ["Beauty", "/category/beauty"],
              ["Sale", "/category/sale"],
            ]} />
            <FooterCol title="Concierge" links={[
              ["My Account", "/account/profile"],
              ["Order History", "/account/orders"],
              ["Contact", "/contact"],
              ["About", "/about"],
            ]} />
            <FooterCol title="Help" links={[
              ["FAQ", "/faq"],
              ["Size Guide", "/size-guide"],
              ["Shipping Policy", "/shipping-policy"],
              ["Returns & Refunds", "/returns-policy"],
            ]} />
            <FooterCol title="Legal" links={[
              ["Privacy Policy", "/privacy-policy"],
              ["Terms & Conditions", "/terms"],
            ]}>
              <div className="mt-6">
                <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Social</h4>
                <div className="flex gap-4">
                  <a href="#" aria-label="Instagram" className="hover:text-gold transition"><Instagram className="h-5 w-5" /></a>
                  <a href="#" aria-label="Facebook" className="hover:text-gold transition"><Facebook className="h-5 w-5" /></a>
                </div>
              </div>
            </FooterCol>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-white/10 gap-4">
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">© 2026 Royal Boutiques. All rights reserved.</p>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Fashion · Home · Lifestyle</p>
          </div>
        </div>
      </footer>
    </>
  );
}

function FooterCol({ title, links, children }: { title: string; links: [string, string][]; children?: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-6">{title}</h4>
      <ul className="space-y-4 text-xs text-white/60">
        {links.map(([label, href]) => (
          <li key={href}><Link to={href as string} className="hover:text-gold transition-colors">{label}</Link></li>
        ))}
      </ul>
      {children}
    </div>
  );
}
